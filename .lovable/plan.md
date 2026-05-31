
# Onboarding Paciente + Anamnese Clínica Adaptativa V2 — REVISÃO

Incorpora os 10 acréscimos. Marquei o que entra **AGORA (Fase 1)**, o que entra **como schema preparado (sem UI)** e o que fica **explicitamente para depois**.

---

## Decisões sobre os 10 pontos

| # | Item | Decisão |
|---|------|---------|
| 1 | Versionamento de anamnese | **AGORA** — `version`, `supersedes_id`, `created_by` |
| 2 | Consent ligado à anamnese | **AGORA** — `patient_consents.anamnesis_id` (nullable, vinculado no submit) |
| 3 | Clinical flags derivadas | **AGORA** — derivadas no `to-canonical.ts`, persistidas em coluna gerada |
| 4 | Completion score | **AGORA** — calculado no adapter, persistido |
| 5 | Upload de exames | **Schema preparado** — `attachments: []` no canonical, sem UI |
| 6 | Validade temporal de condições | **AGORA no schema** — `observed_at` em `ConditionSchema` (UI opcional) |
| 7 | `onboarding_version` em vez de só `completed_at` | **AGORA** — ambas colunas |
| 8 | Catálogo desacoplado | **AGORA estrutural** — `QuestionCatalog` como entidade tipada + fonte em arquivo, com `catalog_version` salvo na anamnese. Tabela `question_catalogs` fica para Fase 2 (sem refactor). |
| 9 | Clinical Review Status | **AGORA** — máquina `draft → submitted → reviewed → approved` (renomeia `status` atual) |
| 10 | Campos para IA | **Schema preparado** — `clinical_tags`, `risk_flags`, `sport_profile`, `nutrition_profile` no canonical, vazios |
| Extra | WhatsApp no cadastro | **AGORA** — `patients.phone` (E.164) + campo no `/signup/patient` |

---

## 1. Migração consolidada (uma única migration)

```sql
-- WhatsApp no cadastro
ALTER TABLE public.patients ADD COLUMN phone text;
ALTER TABLE public.patients ADD COLUMN onboarding_version integer;
ALTER TABLE public.patients ADD COLUMN onboarding_completed_at timestamptz;

-- Anamnese versionada
ALTER TABLE public.anamneses ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE public.anamneses ADD COLUMN supersedes_id uuid REFERENCES public.anamneses(id) ON DELETE RESTRICT;
ALTER TABLE public.anamneses ADD COLUMN created_by uuid;                      -- auth.users.id (nutri ou paciente)
ALTER TABLE public.anamneses ADD COLUMN catalog_version text;                 -- ex "clinical-v2.2026-05-31"
ALTER TABLE public.anamneses ADD COLUMN completion_score smallint;            -- 0-100
ALTER TABLE public.anamneses ADD COLUMN clinical_flags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.anamneses ADD COLUMN review_status text NOT NULL DEFAULT 'draft'
  CHECK (review_status IN ('draft','submitted','reviewed','approved'));
ALTER TABLE public.anamneses ADD COLUMN submitted_at timestamptz;
ALTER TABLE public.anamneses ADD COLUMN reviewed_at timestamptz;
-- coluna 'status' antiga continua para compat; nova máquina vive em review_status.
CREATE INDEX IF NOT EXISTS anamneses_patient_version_idx
  ON public.anamneses (patient_id, version DESC);
CREATE INDEX IF NOT EXISTS anamneses_clinical_flags_gin
  ON public.anamneses USING gin (clinical_flags);

-- Consents
CREATE TABLE public.patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  anamnesis_id uuid REFERENCES public.anamneses(id) ON DELETE RESTRICT, -- vincula consent à versão da anamnese
  consent_version text NOT NULL,
  consent_type text NOT NULL,                  -- 'lgpd' | 'clinical_data'
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);
GRANT SELECT, INSERT ON public.patient_consents TO authenticated;
GRANT ALL ON public.patient_consents TO service_role;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
-- Policies: paciente insere/lê próprio; nutri lê de pacientes seus.
```

Sem CASCADE. `RESTRICT` em tudo clínico. Histórico nunca é deletado.

---

## 2. Schema canonical V3 (bump 2→3)

```ts
// canonical.schema.ts
schemaVersion: 3
catalogVersion: string                 // "clinical-v2.2026-05-31"
origin: "manual" | "online" | "migrated"
basics, digestive, metabolic, cardiovascular, medications, labs, sleep, physicalActivity
// novo:
attachments: Attachment[]              // vazio nesta fase
clinicalTags: string[]                 // ex: ["diabetes_type2","high_training_volume"]
riskFlags: string[]                    // ex: ["uncontrolled_hypertension"]
sportProfile: { primary?, weeklyHours?, ... } | null
nutritionProfile: { restrictions: string[], preferences: string[] } | null
completionScore: number                // 0-100
// ConditionSchema ganha:
observedAt?: string
updatedAt?: string
```

Parser V2 fica vivo (forward-compat reader). Tabela vazia hoje → zero risco de migração de dados.

---

## 3. Catálogo desacoplado (`QuestionCatalog` como entidade)

```
src/lib/anamnesis/v2/catalog/
├── types.ts            (Question, Branch, Trigger, ClinicalTag, CatalogManifest)
├── catalog.ts          (export const CATALOG: CatalogManifest — fonte hardcoded V1)
├── catalog.version.ts  (export const CATALOG_VERSION = "clinical-v2.2026-05-31")
└── loader.ts           (loadCatalog(version?) — hoje retorna CATALOG; futuro: lê de DB)
```

Runner e adapter consomem **só** `loader.loadCatalog()`. Quando criarmos `question_catalogs` table, troca-se apenas o loader. **Anamnese sempre persiste `catalogVersion`** → toda resposta é reproduzível.

---

## 4. Máquina de estado de revisão

```
draft       → paciente preenchendo / nutri rascunhando
submitted   → paciente finalizou online (gera nova versão e supersedes anterior)
reviewed    → nutri abriu e revisou
approved    → vira "verdade clínica" → motores podem consumir
```

Regra dura: **motores leem apenas anamneses `approved`**, e sempre a `version` mais alta. Pré-aprovação = motor ignora.

Nova anamnese (edição pós-aprovação) cria **nova row** com `version+1` e `supersedes_id = anterior.id`. Nada de UPDATE em row aprovada.

---

## 5. Clinical flags derivadas (no adapter, não no motor)

`to-canonical.ts` roda regras puras determinísticas:

```
if digestive.conditions has "gastritis" → flags += "gastritis"
if metabolic.conditions has "diabetes_type2" → flags += "diabetes", "diabetes_type2"
if cardiovascular.conditions has "hypertension" && medications none → flags += "uncontrolled_hypertension"
if physicalActivity.weeklyVolumeMinutes >= 600 → flags += "high_training_volume"
if basics.sex == female && answers.pregnancy == true → flags += "pregnancy"
```

Persistido em `anamneses.clinical_flags` (GIN-indexed) → dashboards e filtros instantâneos sem ler JSONB.

---

## 6. Completion score

Calculado no adapter:

```
score = 100 * (required_answered / required_total)
      - 10 if no medications block answered when conditions exist
      - 5  if no labs and clinical_flags suggests metabolic
clamp 0..100
```

Persistido em `anamneses.completion_score`. UI do nutri mostra: "Anamnese 87% completa".

---

## 7. WhatsApp no cadastro

- `/signup/patient` ganha campo **WhatsApp (obrigatório)** com máscara E.164 BR (`+55 11 9XXXX-XXXX`).
- `consumeReferralCodeAndCreatePatient` recebe `phone`, valida regex E.164, persiste em `patients.phone`.
- Settings do paciente permite editar.

---

## 8. Arquivos (novo + alterado)

**Novos:**
```
src/lib/anamnesis/v2/
├── catalog/{types,catalog,catalog.version,loader}.ts
├── runner.ts + runner.test.ts
├── to-canonical.ts            (gera flags + score + tags)
├── to-canonical.test.ts
└── components/{AnamnesisRunner,QuestionField,ProgressBar}.tsx

src/lib/onboarding/
├── consent.functions.ts
└── onboarding.functions.ts    (cria anamnese v1 + consent vinculado + onboarding_version=1)

src/lib/anamnesis/
└── revisions.functions.ts     (createNewVersion: clona última, supersedes, version+1)

src/routes/_authenticated/onboarding/patient.tsx
```

**Alterados:**
- `canonical.schema.ts` → V3
- `signup/patient.tsx` → +WhatsApp; redireciona pra `/onboarding/patient`
- `signup/patient-signup.functions.ts` → aceita `phone`
- `_authenticated.tsx` → guard: `role=patient && onboarding_version IS NULL → /onboarding/patient`
- `phase2/identity.functions.ts` → DTO ganha `onboardingVersion`, `phone`

**Não tocados:** `engine.functions.ts`, `tdee.ts`, `macros.ts`, `matcher.ts`, `clinical-gate.ts`, `patients/new.tsx`, planos, templates, PDFs, dashboard.

---

## 9. Matriz de impacto (delta sobre v1)

- **Anamneses**: schema enriquecido, versionamento append-only, parser V2 segue vivo. Tabela vazia → zero migração de dados.
- **Patients**: +3 colunas nullable. Nenhum código existente quebra.
- **Auth/Referral**: intocados.
- **Motores**: continuam recebendo inputs explícitos. Quando passarem a ler `anamneses`, filtro será `review_status='approved' ORDER BY version DESC LIMIT 1` — contrato já preparado.
- **PDF/Dashboard/Plans/Templates**: intocados.

Invariantes mantidos: zero CASCADE, RESTRICT em vínculos clínicos, snapshot de planos imutável, sem caminho paralelo de persistência.

---

## 10. O que NÃO entra na Fase 1 (explícito)

- Tabela `question_catalogs` (admin edita perguntas via UI) — Fase 2. Hoje: catálogo em arquivo + `catalogVersion` versionada.
- Upload de exames — schema preparado, sem UI.
- Tela de revisão lado-a-lado online vs manual — Fase 2.
- Migração de `patients/new.tsx` para o `AnamnesisRunner` único — Fase 2.
- IA classificadora — campos prontos, modelo não.

---

## 11. Rollback

```sql
DROP TABLE public.patient_consents;
ALTER TABLE public.anamneses DROP COLUMN version, supersedes_id, created_by,
  catalog_version, completion_score, clinical_flags, review_status,
  submitted_at, reviewed_at;
ALTER TABLE public.patients DROP COLUMN phone, onboarding_version, onboarding_completed_at;
```
+ `rm -rf src/lib/anamnesis/v2 src/lib/onboarding src/routes/_authenticated/onboarding/patient.tsx`

---

**Aguardando `APPROVED FOR EXECUTION` para começar pela migration.**
