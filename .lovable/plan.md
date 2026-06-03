
## Status do que já foi feito

Honestidade primeiro: até agora **só rodei a auditoria de segurança** (0 findings) e investiguei o bug `15→7` do `feedback_frequency_days` (conclusão: cache do React Query, não bug de código). **Nenhum item de produto foi implementado.** Este plano executa de fato.

Aprovação registrada: `APPROVED FOR EXECUTION`, ordem Lote 1 → 2 → 3, **trigger `plans_snapshot_immutable` será afrouxado** para permitir colunas de entrega (item 4 do Lote 2).

---

## Decisões assumidas (confirmar se divergir)

- **"Plano pendente"** = anamnese aprovada **+ nenhum `plans` com `status='published'`** para o paciente. (Por enquanto. Quando entrega virar campo no Lote 2, o filtro passa a usar `delivered_at IS NULL`.)
- **Entrega (Lote 2)** vive em `plans` mesmo, com trigger afrouxado, conforme sua ordem ("AFROUXA O Trigger imutavel").
- **Countdown 15 dias** usa `nutritionists.feedback_frequency_days` como base (configurável), não hardcoded 15. Texto exibido: "Próximo feedback em X dias" / "Atrasado há X dias".

---

## LOTE 1 — Rápido, baixo risco

### 1.1 Sidebar mobile fecha após navegação
- Arquivo: `src/components/AppShell.tsx`.
- Hook `useEffect` em `pathname` (de `useRouterState`) chama `setOpenMobile(false)` quando `isMobile`.
- Sem alteração desktop.

### 1.2 Countdown de feedback no Patient App (URGENTE pelo usuário)
- Arquivo: `src/routes/_authenticated/my-plan.feedback.tsx` (topo da página) + reutiliza `getMyFeedbackStatus` que já retorna `lastFeedbackAt` e `frequencyDays`.
- Componente novo `<FeedbackCountdown>` em `src/components/feedback/FeedbackCountdown.tsx`:
  - Calcula `nextDue = lastFeedbackAt + frequencyDays` (se sem feedback: "Envie seu primeiro feedback").
  - Mostra contador grande "Faltam **X dias**" ou "Atrasado há **X dias**" (vermelho).
  - Barra de progresso visual (0 → frequencyDays).
- Sem DB. Sem server fn nova.

### 1.3 Anamnese no perfil do paciente com espaço de edição (URGENTE pelo usuário)
- Arquivo: `src/routes/_authenticated/patients/$id/index.tsx` — nova seção "Anamnese clínica" abaixo de "Dados básicos".
- Reusa `AnamnesisAnswersView` (já existe) para render read-only da última anamnese aprovada.
- Botão **"Editar anamnese"** abre `/anamneses/$id` (rota já existe).
- Respeita invariante: anamnese aprovada é imutável — edição cria **nova versão** (`supersedes_id`) via fluxo existente em `review.functions.ts`. Nenhuma mudança de schema.
- Se não houver anamnese aprovada: mostra status atual + CTA "Abrir anamnese pendente".

### 1.4 Bug `feedback_frequency_days` 15→7
- Investigação confirmou: DB tem 15, fn lê correto. Causa = cache stale.
- Fix: em `src/routes/_authenticated/my-plan.feedback.tsx` e `AppShell.tsx`, reduzir `staleTime` do query de feedback status para `0` + `refetchOnMount: 'always'` (igual já fazemos em patient-detail).
- Garantia: ao salvar `feedback_frequency_days` no settings do nutricionista, invalidar query `['my-feedback-status']` (se aplicável via cross-user, basta forçar refetch on mount).

### 1.5 Filtro "Planos pendentes" correto
- Arquivo: `src/lib/plans/plans.functions.ts` — `listMyPatientsForPlan`.
- Critério novo: `anamnesisStatus === 'approved' && !hasPublishedPlan`.
- Hoje usa "entregue" (campo que nem existe). Corrigir para `published`.

### 1.6 Normalização de telefone (additive)
- Util novo `src/lib/phone-mask.ts` ganha `normalizeBRPhone(raw): string` (E.164 sem `+`, ex: `5511999998888`).
- Aplicar em todos os `wa.me/{normalized}` (busca: `wa.me/`).
- **Sem migration neste lote** — usar normalização runtime na leitura. Backfill DB fica para Lote 2 se necessário.

### 1.7 Dashboard paciente — plano contratado + countdown assinatura
- Arquivo: `src/routes/_authenticated/my-dashboard.tsx`.
- Card novo lendo `patient_subscriptions` ativo: mostra `plan_kind`, `ends_at`, dias restantes.
- Server fn: reusa `getMyActiveSubscription` se existir; senão criar simples em `src/lib/finance/subscriptions.functions.ts`.

### 1.8 Modal de atalhos no avatar (Lote 1 parcial — só estrutura)
- Arquivo: `src/components/AppShell.tsx` — header avatar vira Popover com: Configurações, Sair, (futuro: indicadores assinatura).
- Indicadores de assinatura ficam para Lote 2 (item 10) para não inflar este.

---

## LOTE 2 — Médio risco

### 2.1 Plano publicado editável (versionamento) — item P0.1
- Nova fn `reopenPublishedPlanAsDraft(planId)` em `plans.functions.ts`: clona snapshot do publicado em novo row `status='draft'`. **Não altera o publicado.**
- UI: botão "Editar plano" no perfil/diet do paciente → abre editor com draft clonado.
- Decisão de UX (você definiu): nutricionista enxerga "um único plano vivo" — UI esconde a distinção draft/publicado/republicado. Internamente seguimos versionando (auditoria + rollback).

### 2.2 Botão "Plano entregue" + trigger afrouxado — item P0.4
- **Migration**: adiciona `plans.delivered_at`, `plans.delivered_by`, `plans.delivery_channel`, `plans.delivery_message`.
- **Migration trigger**: reescreve `plans_snapshot_immutable` — bloqueia mudança em `snapshot/schema_version/patient_id/published_at`, **permite** UPDATE em `delivered_*`.
- Matriz de impacto:
  - Publicados continuam visíveis no Patient App ✓ (snapshot intocado)
  - PDF inalterado ✓
  - Histórico intacto ✓
  - **Risco residual**: qualquer fn que faça `UPDATE plans` precisa não tocar snapshot. Auditar `patient-plan.functions.ts`, `plans.functions.ts`, `draft-auto-plan.ts`.
- Fn nova `markPlanAsDelivered({ planId, channel, message })`.
- UI: botão no perfil do paciente quando há `published` sem `delivered_at`.
- Template de mensagem WhatsApp em constante + textarea editável.

### 2.3 Backfill telefone normalizado
- Migration additive: `patients.phone_normalized`, `nutritionists.phone_normalized` + backfill via SQL.

### 2.4 Card de acompanhamento (avatar + gráfico evolução) — item P1.8
- Novo componente reusa `FeedbackChart` existente.
- Render no perfil do paciente.

### 2.5 Indicadores de assinatura no avatar — item P2.10
- Popover do Lote 1.8 ganha badge: "Plano X · vence em Y dias". Escondido para admin.

---

## LOTE 3 — Discovery + alto risco

### 3.1 Avaliação Física unificada — item P1.5
- **Bloqueado por discovery**. Antes de tocar:
  - Mapear todas as fontes atuais de AF (anamnese vs. patient_profile vs. `physical_assessments` se existir).
  - Decidir tabela canônica.
  - Matriz de impacto completa (ClinicalContext, motores, timeline).
- Reportar findings antes de qualquer migration.

### 3.2 Auditoria UX contínua — item P2.11 (parte)
- Tarefa aberta, não-blocante. Lista de inconsistências reportadas semanalmente.

---

## Ordem de execução

1. **Lote 1.2** (countdown feedback) e **1.3** (anamnese no perfil) primeiro — marcados URGENTE.
2. Demais itens do Lote 1 em paralelo onde independentes.
3. Validação visual em cada item antes de declarar pronto (regra do user-memory).
4. Pausa para review antes de iniciar Lote 2 (envolve migration + trigger).
5. Lote 3 só após discovery aprovada.

## Invariantes preservadas
- AF não bloqueia nada (Lote 3 manterá).
- Motores só consomem ClinicalContext.
- Anamnese aprovada imutável (edição = nova versão).
- Snapshot de plano publicado imutável (trigger só libera campos de entrega).
- Vínculo paciente↔nutricionista intocado.
- Sem CASCADE em FK.

## Confirmações pendentes antes de codar
- Confirma que **"plano pendente" = sem `published`** (até Lote 2 trazer `delivered_at`)?
- Confirma que **countdown usa `feedback_frequency_days` do nutricionista** (não hardcoded 15)?
- Posso começar pelo Lote 1 imediatamente após o "Implement plan"?
