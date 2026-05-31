## Objetivo

Implementar o invariante #6 (skill `fitjourney-clinical-invariants`): o paciente deixa de cair direto em "Meu Plano" e passa a entrar em um **Dashboard** que orquestra o fluxo:

```text
Dashboard → Plano → Feedback → Histórico
```

O plano alimentar vira ferramenta acessada a partir do dashboard, não a tela inicial.

## Escopo desta entrega

Esta entrega cobre **apenas a casca + leitura**: criar a rota, redirecionar o paciente para ela, mostrar estado clínico (`ClinicalContext`), e expor entradas para Plano / Feedback / Histórico. Conteúdo "premium" (gráficos ricos, gamificação, métricas avançadas) fica para entrega futura.

## Passos

### 1. Server fn de leitura para o paciente

Criar `getMyClinicalContext()` em `src/lib/clinical/context.functions.ts`:
- versão sem `patientId` no input
- resolve o `patient_id` a partir de `context.userId` (RLS já restringe)
- reutiliza `buildClinicalContext` (zero lógica nova)

A `getClinicalContext({ patientId })` continua existindo para uso do nutricionista.

### 2. Nova rota `/_authenticated/my-dashboard.tsx`

Componentes da página (todos lendo via TanStack Query, zero recálculo):
- **Saudação** (reusa `lib/patient/greetings.ts`)
- **Card "Estado clínico"** alimentado por `ClinicalContext`:
  - `ready=true` → mostra peso atual + meta + última anamnese aprovada
  - `ready=false` → mostra lista `missing` com tom informativo ("Faltam dados para personalizar: peso, objetivo…"), nunca como erro/bloqueio (invariante #9)
- **Tiles de navegação** (3 cards):
  - "Meu plano" → `/my-plan`
  - "Enviar feedback" → `/my-plan/feedback`
  - "Histórico" → placeholder (rota futura) — desabilitado com tag "em breve"
- **Plano ativo resumido**: nome + kcal/macros do snapshot (se houver), com CTA "Abrir plano".

Tudo read-only. Frontend não infere, não normaliza, não recalcula.

### 3. Atualizar guard `_authenticated.tsx`

Trocar:
- destino inicial do paciente: `/my-plan` → `/my-dashboard`
- `isPatientRoute`: aceitar `/my-dashboard` **e** `/my-plan` (e subrotas) como rotas válidas do paciente

Onboarding pós-conclusão → `/my-dashboard`.

### 4. Tipos & testes

- Sem migrações de banco.
- Adicionar teste leve para `getMyClinicalContext` apenas se a infra de teste já cobrir server fns autenticados; caso contrário, depender dos testes existentes de `buildClinicalContext`.

## Fora de escopo (entregas futuras)

- Timeline Clínica (rota `/my-dashboard/historico`)
- Avaliação Física
- Visual "premium" (gráficos de evolução, gamificação)
- Substituir mock-data do dashboard do **nutricionista** (rota `/dashboard`)

## Detalhes técnicos

- Nada novo no banco; `getMyClinicalContext` deriva o `patient_id` por:
  ```ts
  supabase.from("patients").select("id").eq("user_id", context.userId).maybeSingle()
  ```
- Plano ativo: reusa `getMyActivePlan` já existente; nenhum cálculo novo.
- Estado degradado: o card mostra `missing` como informativo. Não bloqueia navegação para `/my-plan` (que tem sua própria semântica de "sem plano publicado").
- Pipeline soberano permanece intacto: o dashboard só **lê** snapshot e ClinicalContext.

## Critério de aceitação

- Paciente autenticado com onboarding completo aterrissa em `/my-dashboard`.
- `/my-plan` continua acessível diretamente (link no dashboard).
- Card clínico mostra `ready=true` quando há anamnese aprovada + peso; mostra lista de pendências caso contrário, sem travar.
- Zero chamada direta de motor a partir do dashboard.
