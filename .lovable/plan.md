## Objetivo

Padronizar a abertura de TODOS os protocolos no mesmo modelo premium do IFJ (módulos → fases → aplicar a paciente) e fechar o loop no app do paciente: sidebar com "Protocolos Ativos" + banner diário no primeiro acesso do dia avisando em que semana ele está e o que fazer.

## Arquitetura (sem criar motor novo)

Mantém os motores atuais. Adicionamos apenas:

- **1 tabela nova**: `patient_active_protocols` — vínculo paciente↔fase ativa (snapshot imutável da fase aplicada).
- **1 catálogo unificado**: cada protocolo do `PROTOCOL_CATALOG` ganha `modules[]` opcional (mesma forma do IFJ). Protocolos simples = 1 módulo, 1+ fases.
- **2 server fns puras** (read/write fina, sem cálculo clínico): aplicar fase + listar ativos do paciente.
- **0 alterações nos motores** TDEE/macros/matcher/gate/router. `suggest.ts` continua puro reader.

Não fere os invariantes (`fitjourney-clinical-invariants`): suggest segue determinístico, snapshot da fase é imutável depois de aplicado, Patient App permanece read-only (apenas lê `patient_active_protocols`).

## Mudanças

### 1. Banco (1 migration)

```
patient_active_protocols (
  id uuid pk,
  patient_id uuid → patients,
  nutritionist_id uuid → nutritionists,
  protocol_id text,         -- ex: 'ifj', 'anemia'
  module_id text,           -- ex: 'fit-glp' (ou 'default')
  phase_id int,
  phase_snapshot jsonb,     -- congelado no momento da aplicação
  started_at timestamptz default now(),
  ends_at timestamptz,      -- now() + durationWeeks
  status text check in ('active','completed','cancelled') default 'active',
  last_banner_shown_date date,  -- controle do 1x/dia
  created_at, updated_at
)
```

- RLS: nutricionista vê/escreve só dos seus pacientes; paciente vê só os próprios; `service_role` all.
- GRANT padrão authenticated/service_role.
- Trigger: bloqueia UPDATE em `phase_snapshot` (imutável).

### 2. Catálogo unificado (`src/lib/protocols/catalog.ts`)

Adicionar campo opcional `modules?: ReadonlyArray<IFJModule>` a cada `ProtocolDescriptor`. Migrar IFJ existente para esse campo. Protocolos simples (Anemia, SOP, etc.) ganham 1 módulo padrão "Protocolo" com fases base (durationWeeks + recommendations placeholder editável depois).

### 3. Rota genérica `/protocolos/$protocolId`

Substitui a rota fixa `protocolos.ifj.tsx` por `protocolos.$protocolId.tsx` reutilizando exatamente o mesmo layout premium (header gold, módulos grid, phases grid, ApplyPhaseDialog). IFJ vira só `/protocolos/ifj` — mesmo código.

Página `/protocolos` (lista) passa todos os cards para `Link to="/protocolos/$protocolId"`.

### 4. Server fns (`src/lib/protocols/active.functions.ts`)

- `applyProtocolPhase({ patientId, protocolId, moduleId, phaseId })` — congela snapshot da fase e insere/upsert.
- `listActiveProtocolsForPatient({ patientId })` — leitura.
- `markBannerShownToday({ activeProtocolId })` — só atualiza `last_banner_shown_date`.

ApplyPhaseDialog passa a chamar `applyProtocolPhase` (hoje só faz `toast`).

### 5. Sidebar do paciente — "Protocolos Ativos"

Em `src/components/AppShell.tsx` (sidebar paciente), adicionar item "Protocolos Ativos" → rota nova `src/routes/_authenticated/my-plan.protocolos.tsx` que lista os protocolos ativos do paciente (cards com nome, fase atual, semana, recomendações da fase).

### 6. Banner diário no primeiro acesso

Componente `<DailyProtocolBanner />` montado em `my-plan.tsx` (entrada do paciente):

- Busca protocolos ativos.
- Compara `last_banner_shown_date` com hoje.
- Se diferente: mostra dialog/banner com "Você está no Protocolo X — Semana N: faça isso, isso e isso" (lê `phase_snapshot.recommendations` + calcula semana via `started_at`).
- Ao fechar, chama `markBannerShownToday`.

## Detalhes técnicos

- Cálculo de semana atual: `Math.floor((now - started_at)/7d) + 1`, capado em `durationWeeks`.
- Snapshot da fase é cópia profunda de `IFJPhase` (já readonly) — qualquer edição futura no catálogo NÃO afeta protocolos já aplicados (segue regra de imutabilidade pós-publicação).
- `phase_snapshot` inclui `protocolName`, `moduleName`, `phase` completa.
- IFJ continua gated por premium; demais protocolos abertos a todos os nutricionistas autenticados.
- Nada de IA. Tudo determinístico.

## Arquivos

- **migration**: criar `patient_active_protocols` + RLS + grants + trigger.
- **edit** `src/lib/protocols/catalog.ts`: campo `modules?` + fases default para cada protocolo simples.
- **edit** `src/lib/protocols/ifj-catalog.ts`: re-exporta para compat ou some (mover dados para o catalog principal).
- **rename/create** `src/routes/_authenticated/protocolos.$protocolId.tsx` (substitui `protocolos.ifj.tsx`).
- **edit** `src/routes/_authenticated/protocolos.tsx`: cards viram Link para `/protocolos/$protocolId`.
- **create** `src/lib/protocols/active.functions.ts`.
- **edit** `src/components/AppShell.tsx`: nav item paciente "Protocolos Ativos".
- **create** `src/routes/_authenticated/my-plan.protocolos.tsx`.
- **create** `src/components/patient/DailyProtocolBanner.tsx`.
- **edit** `src/routes/_authenticated/my-plan.tsx`: monta banner.

## Não escopo (deixa para depois)

- Editar conteúdo de cada fase pelo profissional (vamos detalhar cardápios na próxima rodada — você mesmo disse).
- Histórico de protocolos concluídos (entra junto com a tela de detalhe).
- Notificação push real (banner in-app já cobre o "1x ao dia").

Posso prosseguir? os modulos = fases.. exemplo cada protocolo tem seus modulos/fases veja qual cai melhor,, modulo 1 modulo 2 ou modulo 3? ou fica melhor fase 1, fase 2 ou fase 3? fases neh? creio que fica melhor