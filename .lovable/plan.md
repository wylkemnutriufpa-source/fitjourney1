
# Relatório de Impacto — Anamnese Clínica Adaptativa V2

Escopo solicitado: introduzir uma 2ª via de captura de anamnese (paciente online via convite + nutricionista manual), convergindo num modelo canônico único (`CanonicalAnamnesis`) consumido pelos motores. NÃO substitui a anamnese manual existente.

Status: **NENHUMA LINHA DE CÓDIGO SERÁ ESCRITA** até aprovação explícita (`APPROVED FOR EXECUTION`).

---

## 1. Mapeamento da estrutura atual

### 1.1. Tabela `public.anamneses` (já existe)
- Colunas: `id, patient_id, nutritionist_id, schema_version (int, default 1), data (jsonb), created_at, updated_at`.
- RLS: nutri lê/escreve/atualiza anamneses dos seus pacientes; paciente lê a própria. Sem DELETE.
- **Hoje o campo `data` é jsonb livre** — não há schema canônico documentado. A rota `/patients/new` (mock) nem persiste anamnese real; só calcula TMB/GET em memória.

### 1.2. Consumidores clínicos atuais (motores)
Mapeados via `rg`:
- `src/lib/engine/tdee.ts` → `calcFromAnamnese({sex, ageYears, weightKg, heightCm, activity, goal})` — função pura.
- `src/lib/engine/engine.functions.ts` → `computeNutritionTargets` server fn. **Recebe inputs explícitos via Zod**, NÃO lê `anamneses.data`. Comentário diz "Versão 2 (futura): aceitar patientId".
- `src/lib/engine/macros.ts` → `calcMacroTarget({tdee, weightKg, goal})`.
- `src/lib/engine/matcher.ts` → consome `kcal/macros` já calculados, não anamnese crua.
- `src/components/NutritionTargetCard.tsx` e `TemplateMatcherPanel.tsx` → consomem props já tipadas (`sex/ageYears/...`), não payload bruto.

**Conclusão crítica:** hoje **nenhum motor lê `anamneses.data` diretamente**. Toda a cadeia já espera o shape canônico mínimo `{sex, ageYears, weightKg, heightCm, activity, goal}`. Isso facilita: introduzir `CanonicalAnamnesis` é formalizar um contrato que já existe de fato.

### 1.3. UI atual de captura
- `/patients/new` — formulário mock (não grava em `anamneses`), usa `calcTMB/calcGET` de `mock-data`.
- `/patients/$id` — exibe `p.tmb/get/tdee` de `mock-data`, botão "Editar Anamnese" sem destino real.
- Não existe formulário real persistindo em `public.anamneses` ainda.

### 1.4. Convite/onboarding paciente
- `referral_codes` tabela já existe + `getOrCreateMyReferralCode` em `nutritionist-profile.functions.ts`.
- Link público gerado em `/settings`, **mas `/signup/patient?code=…` ainda NÃO existe.**
- `/patients` (lista) ainda não tem botão "ONLINE" para abrir modal de convite por paciente.
- `_authenticated.tsx` já tem patient gate redirecionando S3+role=patient para `/my-plan`. **Falta gate para anamnese ausente → forçar `/onboarding/patient`.**

---

## 2. Arquivos afetados

### Criação
- `src/lib/anamnesis/canonical.schema.ts` — Zod schema do `CanonicalAnamnesis` v1 (cobre os 8 domínios clínicos pedidos).
- `src/lib/anamnesis/adapters/orbital-to-canonical.ts` — adapter determinístico (paciente online).
- `src/lib/anamnesis/adapters/manual-to-canonical.ts` — adapter do form manual.
- `src/lib/anamnesis/anamnesis.functions.ts` — server fns: `submitOnlineAnamnesis`, `submitManualAnamnesis`, `getCanonicalAnamnesis`, `approveAnamnesis`.
- `src/lib/anamnesis/question-catalog.ts` — catálogo clínico novo (Question com `id/type/title/required/trigger/children[]/clinical_tags[]`), NÃO copia perguntas orbitais cegamente.
- `src/components/anamnesis/AdaptiveAnamnesisRunner.tsx` — runner que usa a UI orbital (já no zip) como camada de apresentação, mas alimentada pelo novo catálogo.
- `src/components/patients/OnlineInviteDialog.tsx` — modal "ONLINE" (link, WhatsApp, email, copiar, mensagem editável).
- `src/lib/signup/patient-signup.functions.ts` — `validateReferralCode`, `consumeReferralCodeAndCreatePatient`.
- `src/routes/signup/patient.tsx` — rota pública com `?code=…`.
- `src/routes/_authenticated/onboarding/patient.tsx` — anamnese inicial do paciente recém-cadastrado.
- `src/routes/_authenticated/patients/$id/anamnesis.tsx` — visualização/edição/aprovação pelo nutri.

### Edição
- `src/routes/_authenticated/patients/index.tsx` — adicionar botão "ONLINE" abrindo o dialog.
- `src/routes/_authenticated.tsx` — adicionar gate: paciente sem anamnese aprovada → `/onboarding/patient`.
- `src/lib/engine/engine.functions.ts` — adicionar overload que aceita `patientId` e resolve `CanonicalAnamnesis` (mantém overload manual atual, retrocompatível).
- `src/components/NutritionTargetCard.tsx` / `TemplateMatcherPanel.tsx` — sem mudança de contrato (já consomem o shape canônico).
- `src/routeTree.gen.ts` — auto-gerado.

### NÃO tocar
- `src/lib/engine/tdee.ts`, `macros.ts`, `matcher.ts`, `clinical-gate.ts` — motores puros permanecem intocados (consomem exatamente o que `CanonicalAnamnesis` exporta).
- `src/lib/plans/*` — snapshot/publish intactos.
- `src/lib/profile/nutritionist-profile.functions.ts` — referral code já existe.
- RLS de `anamneses`, `plans`, `templates`, `patients` — sem mudança.

---

## 3. Migrações necessárias

**Migration única, sem destruir nada:**

```sql
-- 1. Versão do schema canônico
ALTER TABLE public.anamneses
  ADD COLUMN IF NOT EXISTS origin text
    CHECK (origin IN ('manual','online','migrated')) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS status text
    CHECK (status IN ('draft','submitted','approved')) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- 2. Bump schema_version default para 2 (canônico) — linhas antigas ficam em 1
ALTER TABLE public.anamneses ALTER COLUMN schema_version SET DEFAULT 2;

-- 3. Index para lookup por paciente + status
CREATE INDEX IF NOT EXISTS idx_anamneses_patient_status
  ON public.anamneses (patient_id, status);
```

**Sem `ON DELETE CASCADE`. Sem alteração de RLS.** Linhas antigas (`schema_version=1`) permanecem legíveis — parser legado preservado.

`referral_codes` já existe e cobre o fluxo de convite. Sem nova tabela.

---

## 4. Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Motor passar a ler `anamneses.data` e quebrar com row antiga `schema_version=1` | **Alto** | Server fn `getCanonicalAnamnesis` faz roteamento por `schema_version`: v1 → parser legado / null; v2 → canônico. Motor nunca acessa jsonb cru. |
| Adapter orbital→canônico perder dado clínico | **Médio** | Salvar payload orbital cru em `data.raw_orbital` ao lado do canônico em `data.canonical`. Auditável e reversível. |
| Convite consumir código duas vezes (race) | **Médio** | `consumeReferralCodeAndCreatePatient` em transação via `supabaseAdmin`, com `UPDATE referral_codes SET status='consumed' WHERE status='active'` e checagem de affected rows. |
| Gate de anamnese bloquear paciente legítimo já cadastrado antes da V2 | **Alto** | Gate só dispara se NÃO existir nenhuma anamnese (`status IN ('submitted','approved')`) para `patient_id`. Pacientes antigos com anamnese manual em v1 contam como "submitted" (backfill via migration opcional). |
| Duplicação de regras canônicas (frontend e backend) | **Médio** | Zod schema único em `src/lib/anamnesis/canonical.schema.ts` importado por ambos. |
| UI orbital alimentar diretamente motor (violação arquitetural) | **Crítico** | Runner só chama `submitOnlineAnamnesis`. Motor só consome via `getCanonicalAnamnesis`. PR-check manual antes do merge. |

---

## 5. Plano de rollback

1. **Migration**: `ALTER TABLE public.anamneses DROP COLUMN origin, DROP COLUMN status, DROP COLUMN approved_at, DROP COLUMN approved_by; ALTER TABLE ... ALTER COLUMN schema_version SET DEFAULT 1; DROP INDEX idx_anamneses_patient_status;` — não-destrutivo (data preservado).
2. **Código**: remover diretório `src/lib/anamnesis/`, `src/components/anamnesis/`, rotas `signup/patient.tsx`, `onboarding/patient.tsx`, `patients/$id/anamnesis.tsx`. Reverter overload em `engine.functions.ts`. Reverter botão "ONLINE" e gate em `_authenticated.tsx`.
3. **Dados**: zero perda — `anamneses.data` continua jsonb livre; rows v2 permanecem legíveis mesmo sem o novo código (apenas não são interpretadas).
4. **Convites já consumidos**: `referral_codes.status='consumed'` permanece; pacientes criados permanecem (FK `SET NULL`-compatível, não-CASCADE).

---

## 6. Checklist de não-regressão (matriz de impacto)

### Planos
- [x] Snapshot publicado segue imutável (trigger `plans_snapshot_immutable` intocado).
- [x] PDF/Patient App não dependem de `anamneses` — renderizam só `plans.snapshot`. Sem regressão.

### Templates
- [x] Não tocados. `templates.content` intocado.

### Referral/Convites
- [x] `referral_codes` ganha apenas novo consumidor; estrutura intocada.
- [x] Pacientes existentes (vinculados via `nutritionist_id`) preservados.

### Onboarding/Anamneses
- [x] Anamneses v1 legíveis via `schema_version=1` (parser legado retorna `null` canônico, força nutri a re-coletar; opção: backfill manual via UI de edição).
- [x] Anamneses manuais futuras passam pelo mesmo adapter → canônico v2.

### Auth
- [x] FK `auth.users` em `patients.auth_user_id` permanece. `cleanup_orphan_auth_user` continua funcional.
- [x] Novo paciente criado via `signup/patient` segue mesmo padrão de `phase2/signup.functions.ts`.

### Dashboard / PDFs / Pagamentos
- [x] Não tocados.

### Invariantes
- [x] Sem `ON DELETE CASCADE`.
- [x] `plans.snapshot` imutável preservado.
- [x] Templates não viram fonte de plano.
- [x] Referral continua histórico.
- [x] `schema_version` presente em `anamneses` desde sempre, agora explicitamente versionado.
- [x] PDF é saída.
- [x] Dashboard read-only.
- [x] Renderers não recalculam — runner orbital só captura, adapter normaliza no SUBMIT (server-side), motor consome canônico.
- [x] DAG: UI orbital → adapter → CanonicalAnamnesis → motor → snapshot. Sem ciclo.

---

## 7. Plano de execução faseado (após aprovação)

Vou pedir aprovação **uma fase por vez** para minimizar superfície de risco.

- **Fase 1 (P0):** Migration + `canonical.schema.ts` + `signup/patient` (rota pública + consumo de convite) + botão "ONLINE" + dialog.
- **Fase 2 (P1):** Catálogo clínico + adapter manual + runner reaproveitando UI orbital + `/onboarding/patient` + gate em `_authenticated.tsx`.
- **Fase 3 (P2):** Tela de revisão/aprovação pelo nutri (`/patients/$id/anamnesis`) + overload `computeNutritionTargets(patientId)` lendo `CanonicalAnamnesis`.

---

## Aguardando

Responda **`APPROVED FOR EXECUTION FASE 1`** (ou outra) para eu começar a codar. Qualquer ajuste no escopo acima também é bem-vindo antes da aprovação.
