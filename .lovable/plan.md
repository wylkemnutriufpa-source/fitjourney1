## Objetivo

Quando o nutricionista **aprova** uma anamnese, o sistema gera automaticamente um **Diagnóstico + Dicas personalizadas** a partir dos gatilhos clínicos já cadastrados (`diagnostic_triggers`). O resultado é salvo como snapshot imutável vinculado àquela anamnese e exibido no **Dashboard do paciente** em um card colapsável.

## Matriz de Impacto

- **Módulo alterado**: Anamneses (hook de aprovação) + Dashboard do paciente + nova tabela `patient_diagnoses`
- **Dependências afetadas**: nenhuma direta — não toca em planos, templates, motores clínicos, RLS de paciente/nutri
- **Risco de cascata**: baixo. Geração é best-effort (try/catch); falha não bloqueia aprovação
- **Rollback**: `DROP TABLE patient_diagnoses` + reverter call do gerador no fluxo de aprovação
- **Invariantes preservados**: anamnese aprovada continua sendo a única fonte; snapshot imutável; renderer (dashboard) é burro — não recalcula

## Mudanças

### 1. Banco — `patient_diagnoses` (snapshot imutável)

```text
patient_diagnoses
├── id uuid pk
├── patient_id uuid (fk → patients, RESTRICT)
├── nutritionist_id uuid (fk → nutritionists, RESTRICT)
├── anamnesis_id uuid (fk → anamneses, RESTRICT, UNIQUE)
├── diagnosis jsonb  -- saudacao, analisePeso, imc, pesoIdeal, dicasDetalhadas[], triggersAcionados[]
├── triggers_version text  -- auditoria (snapshot dos slugs ativos no momento)
├── generated_at timestamptz
└── created_at timestamptz
```

- RLS:
  - paciente lê o próprio (`patient_id` via `auth_user_id`)
  - nutricionista dono lê os do paciente
  - admin lê tudo
- Sem UPDATE/DELETE permitido por policy (trigger `BEFORE UPDATE/DELETE → RAISE`)
- GRANT SELECT/INSERT para `authenticated`, ALL para `service_role`
- `UNIQUE(anamnesis_id)` — uma anamnese ⇒ um diagnóstico

### 2. Adapter `CanonicalAnamnesis → QuizAnswers`

Novo arquivo `src/lib/diagnostic/from-anamnesis.ts` (puro, sem IO). Mapeia:

- peso/altura/idade/sexo → diretos
- objetivo (emagrecer/ganhar_massa/energia) → derivado do campo `goal`
- condições (`diabetes`, `hipertensao`, `sop`, `tireoide`, `gastrite_refluxo`, `intestino`, `compulsao`) → varrem `health_conditions`
- queixas (`cansaco`, `inchaco`, `compulsao`) → varrem `chief_complaints`
- água/refeições/atividade/sono → mapeados dos campos de hábitos
- Quando campo ausente → default neutro (não dispara gatilho)

### 3. Server function `generatePatientDiagnosis`

`src/lib/diagnostic/patient-diagnosis.functions.ts`:

- `generatePatientDiagnosis({ anamnesisId })` (auth requerido, nutri dono ou admin)
  - lê anamnese aprovada
  - carrega triggers ativos
  - roda `gerarDiagnostico(adapter(anamnesis), triggers)`
  - faz `upsert` em `patient_diagnoses` (idempotente por `anamnesis_id`)
- `getPatientDiagnosisForPatient()` (paciente lê o próprio — última anamnese aprovada)

### 4. Hook de aprovação

Em `src/lib/anamnesis/review.functions.ts`, após `review_status = 'approved'` ser commitado, chamar `generatePatientDiagnosis({ anamnesisId })` dentro de try/catch (best-effort — invariante: degradação elegante).

### 5. Card no Dashboard

Novo componente `src/components/patient/DiagnosticInsightsCard.tsx`:

- carrega via server fn no Dashboard do paciente (já existente)
- estado `ready/empty`: se não houver diagnóstico, esconde o card silenciosamente
- visual: card dourado com título "💡 Seu Diagnóstico Personalizado", análise de peso no topo, lista colapsável de pontos de atenção (cada um com botão "Ver dica" expansível) — mesmo padrão visual do funil

## Detalhes técnicos

- Adapter é puro: testável sem mock de banco
- Geração é **determinística por anamnese** (mesma anamnese → mesmas frases/dicas). Usar RNG seeded com `anamnesis_id` para que regenerações reproduzam o mesmo conteúdo
- Migration carrega trigger de imutabilidade idêntico ao padrão `plans_snapshot_immutable`
- Backfill opcional (não automático): admin pode rodar via botão futuro se quiser gerar para anamneses já aprovadas

## Fora de escopo (próximas iterações)

- Botão manual "Atualizar diagnóstico" — não pediu poderiamos fazer melhor... quando paciente relatar algum problema na anaminese, esse problema automaticamente entra no seu feedback como pergunta, paciente relatou gastrite, no proximo feedback botao checkbox la no feedback: sobre o quadro da gastrite? houve melhora? nenhuma mudança? houve piora? se na anaminse ele disse que nao havia iniciado o traamento.. npo feedback ja pergunta.. iniciou seu tratamennto? SIM? NAO? isso faria nosso anaminese ser realmente inteligente, pq ela se expandiria em arvore sacou? acha que da para fazer?
- Regeneração por feedback — descartado
- Edição de dicas pelo nutri — admin já edita os gatilhos globais
- Card na sidebar — só no Dashboard

## Validação

Após implementar, validar manualmente no fluxo: aprovar uma anamnese de teste → abrir Dashboard do paciente → confirmar card visível com dicas corretas.