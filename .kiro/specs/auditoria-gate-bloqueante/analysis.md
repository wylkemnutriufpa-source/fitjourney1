# AUDITORIA CRÍTICA: Clinical Gate Bloqueante

## Status
**ANÁLISE CRÍTICA CONCLUÍDA** — Identifica regressão arquitetural verso sistema 1.0

## Problema Relatado
Ao tentar publicar um pré-plano, o nutricionista recebeu:

> "O plano não passou nas regras clínicas obrigatórias. Revise as refeições e tente novamente."

Contexto:
- Nutricionista não solicitou validação clínica obrigatória
- Nem aprovação automática, auditoria bloqueante ou gatekeeper clínico
- Filosofia do produto: "O sistema sugere. O nutricionista decide."
- Mesmo com templates, o erro persistiu

---

## ACHADOS CRÍTICOS

### 1. VIOLAÇÃO DA FILOSOFIA DO PRODUTO

**Decisão Aprovada:**
```
"Para o nutricionista existe apenas uma entidade: Plano do paciente"
Fluxo desejado:
1. Abre o plano
2. Edita
3. Salva
4. Paciente vê

Sem bloqueios, sem estados intermediários, sem burocracia.
```

**Realidade Arquitetural Atual:**

No arquivo `src/lib/plans/plans.functions.ts` (linhas ~377-387):

```typescript
// ---- 5) Gate clínico — bloqueia APENAS em blockers (severity=error).
const gate = validatePlan({
  weightKg: ctx.currentWeight!.weightKg,
  tdee: engineOut.tdee,
  target: engineOut.target,
  dailyTotals,
  foodOccurrences,
});
if (gate.blockers.length > 0) {
  throw new Error(
    `CLINICAL_GATE_BLOCKED: ${gate.blockers.map((b) => b.code).join(",")}`,
  );
}
```

**O problema:** A publicação é BLOQUEADA se `gate.blockers.length > 0`.

Em `src/lib/engine/clinical-gate.ts`, existem **3 tipos de bloqueadores de erro (severity="error"):**

1. **Proteína > 2.5 g/kg** — linhas ~55-63
2. **Déficit calórico > 25% do TDEE** — linhas ~65-73
3. **Desvio de macros > 10% do alvo** — linhas ~75-89

### 2. CONTRAPOSIÇÃO COM A DECISÃO APROVADA

**Documento: "Contrato do Alimento Soberano"** (congelado, aprovado):

> "Princípio soberano: o profissional manda. Este schema NUNCA bloqueia publicação."

E ainda:

> "Regras ocultas. Fluxos obrigatórios. Chegou ao ponto de tarefas simples se tornarem difíceis."
> (comentário sobre o trauma do sistema 1.0)

**Hoje, a arquitetura de publicação faz exatamente isso:**
- Cria uma regra oculta (clinical-gate)
- Bloqueia fluxo obrigatório (não pode publicar se falhar)
- Torna tarefa simples (salvar plano) dependente de validação automática

### 3. REGRAS CLÍNICAS SÃO HARDCODED, NÃO CONFIGURÁVEIS

Em `src/lib/engine/clinical-gate.ts`, as constantes estão hardcoded:

```typescript
const PROTEIN_HARD_LIMIT_G_PER_KG = 2.5;        // linha 30
const CALORIC_DEFICIT_HARD_PCT = 0.25;          // linha 31
const MACRO_DEVIATION_HARD_PCT = 0.1;           // linha 32
const MONOTONY_HARD_COUNT = 4;                  // linha 33
```

**Problemas:**
- Nutricionista não escolheu essas regras
- Não podem ser ajustadas por clínica/contexto
- Não estão em documentação de produto acessível
- Parecem ser decisões de engenharia, não de clínica

### 4. PIPELINE DE PUBLICAÇÃO ATUAL

```
Nutricionista edita plano
        ↓
Clica "Publicar"
        ↓
Sistema carrega ClinicalContext
        ↓
Bloqueia se calculable=false (CLÍNICO_CONTEXT_INCOMPLETE) ← ✓ Esperado
        ↓
Roda motores (TMB+TDEE+Macros) ← ✓ Esperado (cálculo)
        ↓
Roda clinical-gate ← ✗ INESPERADO (validação bloqueante)
        ↓
if (gate.blockers.length > 0) → ERRO E PUBLICAÇÃO BLOQUEADA ← ✗ CONTRA FILOSOFIA
        ↓
Senão: Anexa audit, publica, snapshot fica imutável
```

**Fluxo Aprovado Deveria Ser:**

```
Nutricionista edita plano
        ↓
Clica "Publicar"
        ↓
Sistema carrega ClinicalContext
        ↓
Bloqueia se calculable=false (mas com override=true permitido) ← ✓
        ↓
Roda motores (TMB+TDEE+Macros) ← ✓
        ↓
Roda validações de ALERTA (warnings)
        ↓
Exibe warnings ao nutricionista (pode ignorar) ← ✓ Sugestão
        ↓
Nutricionista clica "Publicar mesmo assim"
        ↓
Sistema publica com audit trail mostrando warnings ignorados
```

### 5. RISCO DE REGRESSÃO DO SISTEMA 1.0

**Traumas do Sistema 1.0:**
- Policies
- Triggers
- Edge Functions
- **Estados intermediários**
- **Regras ocultas** ← PRESENTE AQUI
- **Fluxos obrigatórios** ← PRESENTE AQUI

**Situação Atual:**
- ✅ Sem policies explícitas (RLS está OK)
- ✅ Triggers existem mas para auditoria (aceitável)
- ✅ Sem edge functions próprias
- ❌ Não há estados intermediários (bom)
- ❌ **Regra oculta de validação clínica** (clinical-gate é executada sem UI transparente)
- ❌ **Fluxo obrigatório: nutricionista não pode escolher ignorar warnings**

O padrão está **começando a repetir** o erro do 1.0: **o sistema servindo à arquitetura, não ao profissional.**

---

## QUESTÕES DE AUDITORIA RESPONDIDAS

### Q1. A arquitetura está repetindo erros do sistema 1.0?

**Resposta: SIM, parcialmente.**

Especificamente:
- Regra oculta (clinical-gate hardcoded)
- Fluxo obrigatório (não pode publicar se gate.blockers > 0)
- Sem transparência sobre critérios de validação

### Q2. Regras clínicas obrigatórias bloqueantes fazem sentido?

**Resposta: NÃO, não neste produto.**

Justificativa:
- Produto é para nutricionistas (profissionais licenciados)
- Eles entendem clínica melhor que o sistema
- Sistema foi explicitamente pedido para sugerir, não controlar
- Nutricionista responsável, não o software

### Q3. Essas regras deveriam gerar alerta/aviso ou realmente impedir?

**Resposta: ALERTA/AVISO, nunca impedir.**

Razão:
- Nutricionista pode ter contexto que sistema não tem
- Pode estar testando, refinando, iterando
- Pode ser caso clínico especial que exige desvio
- Sistema não deve "tutelar" profissional licenciado

### Q4. Fluxo aprovado está sendo respeitado?

**Resposta: NÃO.**

Fluxo aprovado:
```
Anamnese → Sugestão → Ajuste → Salvar → Paciente vê
```

Fluxo atual:
```
Anamnese → Sugestão → Ajuste → Validação Bloqueante → 
Se passar: Salvar + Paciente vê
Se falhar: ERRO, nutricionista fica preso
```

### Q5. Arquitetura de versionamento invisível está correta?

**Resposta: SIM, esta parte está bem desenhada.**

- `schema_version` persiste mas é invisível na UX
- `clinicalAudit` anexado ao snapshot para auditoria
- Snapshot imutável após `published_at` (trigger)
- Versionamento atende à decisão de "invisibilidade"

### Q6. Risco de criar drafts/republicações/estados intermediários/burocracia?

**Resposta: SIM, risco ALTO.**

**Evidência:**
- Existe conceito de `status='draft'` na tabela `plans`
- Função `ensureDraftPlanForPatient` auto-cria draft
- Função `publishDraftPlan` promove draft → published
- UI que necessita disso criaria fluxo: draft → editar → publicar

**Problema:** Isso pode se expandir. Uma vez que o sistema começar a exigir "validação antes de publicar", é natural evoluir para:
- "Deixe em draft para revisar depois"
- "Crie múltiplas versões antes de escolher"
- "Repita publicação após corrigir erros"

### Q7. Mensagem é compatível com filosofia do produto?

**Resposta: NÃO.**

Filosofia: "O sistema sugere. O nutricionista decide."

Mensagem: "O plano não passou nas regras clínicas obrigatórias. Revise as refeições e tente novamente."

**Problema:**
- "Não passou nas regras" = julgamento automático
- "Revise as refeições" = sistema mandando o que fazer
- "tente novamente" = implica que falhou e deve corrigir

**Mensagem esperada:**
- "⚠️ Atenção: Proteína acima de 2.5 g/kg. Você quer publicar mesmo assim?"
- "✓ Publicar" / "✏️ Voltar e editar"

---

## RECOMENDAÇÕES PARA REDESENHO

### Recomendação 1: Clinical Gate como ALERTA, não bloqueador

**Mudança:**
- Mover `gate.blockers` para `gate.warnings`
- Nunca bloquear publicação por validação clínica
- Sempre permitir publicação com warnings anexados

**Pseudocódigo:**
```typescript
// Antes:
if (gate.blockers.length > 0) {
  throw new Error(`CLINICAL_GATE_BLOCKED: ...`);
}

// Depois:
// (sem throw — apenas adiciona warnings ao snapshot.clinicalAudit)
const snapshotWithAudit = {
  ...snapshot,
  clinical_review: review,
  clinicalAudit: {
    ...clinicalAudit,
    gateWarnings: [...gate.warnings, ...gate.blockers], // Todos são warnings
  },
};
```

**Benefício:** Nutricionista publica, sistema registra tudo na auditoria.

### Recomendação 2: Tornear regras clínicas configuráveis (futuro)

**Mudança:**
- Mover constantes hardcoded para tabela `nutritionist_clinical_preferences`
- Cada nutricionista define suas próprias tolerâncias
- Ou: deixar em padrões sensatos mas permitir override por clínica

**Modelo:**
```sql
CREATE TABLE nutritionist_clinical_preferences (
  id uuid PRIMARY KEY,
  nutritionist_id uuid REFERENCES nutritionists(id),
  protein_hard_limit_g_per_kg numeric DEFAULT 2.5,
  caloric_deficit_hard_pct numeric DEFAULT 0.25,
  macro_deviation_hard_pct numeric DEFAULT 0.1,
  created_at, updated_at
);
```

**Benefício:** Sistema não impõe critérios, nutricionista define sua prática.

### Recomendação 3: Melhorar transparência da UX

**Mudança:**
- Clinical gate warnings aparecem **antes** do botão "Publicar"
- Mostrar cada warning com contexto (ex: "Proteína: 140g para 60kg = 2.33g/kg, acima de 2.5g/kg")
- Dar opção explícita "Publicar mesmo assim" ou "Voltar e editar"

**Exemplo de UX:**
```
┌─────────────────────────────────────────────┐
│ Avisos de Validação Clínica                 │
├─────────────────────────────────────────────┤
│ ⚠️ Proteína acima de 2.5 g/kg               │
│    Seu plano: 140g para 60kg = 2.33 g/kg   │
│                                             │
│ ⚠️ Déficit calórico de 28%                  │
│    TDEE: 2500 kcal | Plano: 1800 kcal      │
│                                             │
│ 💡 Dica: Verifique se isso é intencional    │
│          ou ajuste as refeições             │
├─────────────────────────────────────────────┤
│ [← Voltar]  [✓ Publicar mesmo assim]        │
└─────────────────────────────────────────────┘
```

**Benefício:** Nutricionista toma decisão informada e consciente.

### Recomendação 4: Auditoria deve registrar override

**Mudança:**
- Se nutricionista publica com warnings, marcar em `snapshot.clinicalAudit`:
  ```typescript
  publishedWithGateWarningsAcknowledged: true,
  acknowledgedWarnings: [...],
  acknowledgedAt: iso,
  acknowledgedBy: nutritionist_id,
  ```

**Benefício:** Rastreabilidade completa. Se houver problema clínico depois, sistema prova que nutricionista foi alertado e escolheu continuar.

### Recomendação 5: Documentar transparentemente as regras

**Mudança:**
- Adicionar à documentação de produto (docs/arquitetura/)
- Seção "Regras de Validação Clínica" listando cada regra, threshold e razão
- Acessível para nutricionistas entenderem

**Exemplo:**
```markdown
## Regras de Validação Clínica

### 1. Proteína (2.5 g/kg)
- **Threshold:** Máximo 2.5g por kg de peso corporal
- **Razão:** Consumo excessivo pode sobrecarregar rins
- **Ação:** Gera aviso, não bloqueia publicação

### 2. Déficit Calórico (25% do TDEE)
- **Threshold:** Máximo 25% abaixo da ingestão diária esperada
- **Razão:** Déficit muito alto pode causar perda de massa magra
- **Ação:** Gera aviso, não bloqueia publicação
```

---

## IMPLEMENTAÇÃO PROPOSTA

**Escopo:** Redesenhar o clinical-gate de bloqueador para sugestivo

**Mudanças principais:**

1. **Arquivo: `src/lib/engine/clinical-gate.ts`**
   - Remover conceito de `severity: "error"` para bloqueadores
   - Todos os warnings são `severity: "warning"`
   - Renomear `blockers` para `acknowledgableWarnings` (ou similar)

2. **Arquivo: `src/lib/plans/plans.functions.ts`**
   - Remover a lógica:
     ```typescript
     if (gate.blockers.length > 0) {
       throw new Error(`CLINICAL_GATE_BLOCKED: ...`);
     }
     ```
   - Sempre prosseguir com publicação, registrando warnings

3. **Arquivo: `src/lib/plans/snapshot.schema.ts`**
   - Adicionar campo:
     ```typescript
     acknowledgedWarnings?: Array<{
       code: string;
       message: string;
       acknowledgedAt: string;
       acknowledgedBy: string;
     }>;
     ```

4. **UI (componente de publicação a ser criado)**
   - Exibir warnings antes de botão "Publicar"
   - Checkbox: "Entendi os avisos e desejo publicar"
   - Registrar acknowledgment no snapshot

---

## RISCO SE NÃO CORRIGIDO

### Curto Prazo (1-2 sprints)
- Nutricionista fica preso ao tentar publicar planos válidos
- Frustração com sistema que não deixa trabalhar
- Pressão para encontrar "workaround" ou bypass

### Médio Prazo (3-6 meses)
- Surgem requests: "adicione mais exceções", "deixe configurar"
- Sistema começa a ter mais e mais lógica condicional
- `overrideMissingClinical` vira modelo: overrides para tudo

### Longo Prazo (6+ meses)
- **Regressão completa para sistema 1.0:** regras ocultas, fluxos obrigatórios, burocracia
- Nutricionista passa mais tempo contornando sistema que usando
- Confiança no produto destroída

**Esse é o padrão histórico que destruiu o sistema 1.0.**

---

## CONCLUSÃO

A arquitetura atual está **começando a cometer o mesmo erro do sistema 1.0**: criar uma **camada de controle invisível** que bloqueia o trabalho do profissional.

A decisão foi explícita: "O sistema sugere. O nutricionista decide."

A implementação atual: "O sistema valida e bloqueia."

**Essa é uma regressão arquitetural crítica que deve ser corrigida antes de escalar para mais nutricionistas.**

---

## PRÓXIMOS PASSOS

1. ✅ Análise concluída (este documento)
2. ⏳ **Aguardando aprovação para Redesenho (Design Spec)**
3. ⏳ Implementação de mudanças
4. ⏳ Testes com nutricionistas
5. ⏳ Deploy

