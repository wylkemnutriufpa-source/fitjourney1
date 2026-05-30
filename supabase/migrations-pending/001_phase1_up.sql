-- ============================================================================
-- FITJOURNEY — FASE 1 (UP)
-- Migration aditiva. NÃO toca user_roles. NÃO toca auth.*.
-- Invariantes:
--   - Zero ON DELETE CASCADE
--   - Dados clínicos: RESTRICT
--   - Vínculos administrativos: SET NULL
--   - plans.snapshot imutável após published_at
--   - schema_version desde o nascimento em anamneses e plans
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.plan_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.referral_code_status AS ENUM ('active', 'consumed', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 1. NUTRITIONISTS
-- ---------------------------------------------------------------------------
CREATE TABLE public.nutritionists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid NOT NULL UNIQUE,            -- referência lógica a auth.users; sem FK física
  full_name     text NOT NULL,
  crn           text,
  email         text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutritionists TO authenticated;
GRANT ALL ON public.nutritionists TO service_role;

ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri reads own"   ON public.nutritionists FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);
CREATE POLICY "nutri inserts own" ON public.nutritionists FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "nutri updates own" ON public.nutritionists FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

-- ---------------------------------------------------------------------------
-- 2. REFERRAL CODES (vínculo histórico, não ativo)
-- ---------------------------------------------------------------------------
CREATE TABLE public.referral_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE RESTRICT,
  status          public.referral_code_status NOT NULL DEFAULT 'active',
  expires_at      timestamptz,
  consumed_at     timestamptz,
  consumed_by     uuid,                          -- patients.id; FK adicionada após patients existir
  created_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri reads own codes" ON public.referral_codes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = referral_codes.nutritionist_id AND n.auth_user_id = auth.uid()));
CREATE POLICY "nutri inserts own codes" ON public.referral_codes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = referral_codes.nutritionist_id AND n.auth_user_id = auth.uid()));
CREATE POLICY "nutri updates own codes" ON public.referral_codes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = referral_codes.nutritionist_id AND n.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. PATIENTS
-- ---------------------------------------------------------------------------
CREATE TABLE public.patients (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id          uuid NOT NULL UNIQUE,    -- referência lógica a auth.users
  nutritionist_id       uuid REFERENCES public.nutritionists(id) ON DELETE SET NULL,  -- vínculo administrativo
  source_referral_code  text,                    -- snapshot histórico (não FK; código pode ser revogado)
  full_name             text NOT NULL,
  email                 text NOT NULL,
  birth_date            date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient reads self" ON public.patients FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);
CREATE POLICY "nutri reads own patients" ON public.patients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = patients.nutritionist_id AND n.auth_user_id = auth.uid()));
CREATE POLICY "patient inserts self" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "patient updates self" ON public.patients FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

-- Agora que patients existe, fecha o FK do referral_codes.consumed_by
ALTER TABLE public.referral_codes
  ADD CONSTRAINT referral_codes_consumed_by_fkey
  FOREIGN KEY (consumed_by) REFERENCES public.patients(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. TEMPLATES (apenas rastreabilidade — nunca fonte do plano publicado)
-- ---------------------------------------------------------------------------
CREATE TABLE public.templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE RESTRICT,
  name            text NOT NULL,
  schema_version  int  NOT NULL DEFAULT 3,
  content         jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri rw own templates" ON public.templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = templates.nutritionist_id AND n.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = templates.nutritionist_id AND n.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. ANAMNESES (dado clínico — RESTRICT)
-- ---------------------------------------------------------------------------
CREATE TABLE public.anamneses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  nutritionist_id uuid REFERENCES public.nutritionists(id) ON DELETE SET NULL,
  schema_version  int  NOT NULL DEFAULT 1,
  data            jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;

ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient reads own anamnese" ON public.anamneses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.patients p WHERE p.id = anamneses.patient_id AND p.auth_user_id = auth.uid()));
CREATE POLICY "nutri reads patient anamnese" ON public.anamneses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = anamneses.nutritionist_id AND n.auth_user_id = auth.uid()));
CREATE POLICY "nutri writes patient anamnese" ON public.anamneses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = anamneses.nutritionist_id AND n.auth_user_id = auth.uid()));
CREATE POLICY "nutri updates patient anamnese" ON public.anamneses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = anamneses.nutritionist_id AND n.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. PLANS (dado clínico — RESTRICT, snapshot imutável após published_at)
-- ---------------------------------------------------------------------------
CREATE TABLE public.plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  nutritionist_id     uuid REFERENCES public.nutritionists(id) ON DELETE SET NULL,
  source_template_id  uuid REFERENCES public.templates(id)      ON DELETE SET NULL,  -- só rastreabilidade
  schema_version      int  NOT NULL DEFAULT 3,
  status              public.plan_status NOT NULL DEFAULT 'draft',
  snapshot            jsonb NOT NULL,
  published_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient reads own published plans" ON public.plans FOR SELECT TO authenticated
  USING (status = 'published' AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = plans.patient_id AND p.auth_user_id = auth.uid()));
CREATE POLICY "nutri rw own plans" ON public.plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = plans.nutritionist_id AND n.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nutritionists n WHERE n.id = plans.nutritionist_id AND n.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 7. TRIGGERS — invariantes do snapshot
-- ---------------------------------------------------------------------------

-- 7.1 Imutabilidade de snapshot após publicação
CREATE OR REPLACE FUNCTION public.plans_snapshot_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    IF NEW.snapshot      IS DISTINCT FROM OLD.snapshot      THEN RAISE EXCEPTION 'plans.snapshot is immutable after published_at'; END IF;
    IF NEW.schema_version IS DISTINCT FROM OLD.schema_version THEN RAISE EXCEPTION 'plans.schema_version is immutable after published_at'; END IF;
    IF NEW.published_at  IS DISTINCT FROM OLD.published_at  THEN RAISE EXCEPTION 'plans.published_at is immutable once set'; END IF;
    IF NEW.patient_id    IS DISTINCT FROM OLD.patient_id    THEN RAISE EXCEPTION 'plans.patient_id is immutable after published_at'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_plans_snapshot_immutable
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.plans_snapshot_immutable();

-- 7.2 Carimba published_at quando status vira 'published'
CREATE OR REPLACE FUNCTION public.plans_stamp_published_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_plans_stamp_published_at
  BEFORE INSERT OR UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.plans_stamp_published_at();

-- 7.3 updated_at genérico
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_touch_nutritionists BEFORE UPDATE ON public.nutritionists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_patients      BEFORE UPDATE ON public.patients      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_templates     BEFORE UPDATE ON public.templates     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_anamneses     BEFORE UPDATE ON public.anamneses     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_plans         BEFORE UPDATE ON public.plans         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 8. VIEW DE ÓRFÃOS + FUNÇÃO DE LIMPEZA
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.orphan_auth_users
WITH (security_invoker = true) AS
SELECT u.id AS auth_user_id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.patients      p ON p.auth_user_id = u.id
LEFT JOIN public.nutritionists n ON n.auth_user_id = u.id
WHERE p.id IS NULL AND n.id IS NULL;

REVOKE ALL ON public.orphan_auth_users FROM PUBLIC, anon, authenticated;
GRANT  SELECT ON public.orphan_auth_users TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_orphan_auth_user(_auth_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE has_profile boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.patients      WHERE auth_user_id = _auth_user_id
    UNION ALL
    SELECT 1 FROM public.nutritionists WHERE auth_user_id = _auth_user_id
  ) INTO has_profile;

  IF has_profile THEN
    RAISE EXCEPTION 'auth user % has an associated profile; refusing to delete', _auth_user_id;
  END IF;

  DELETE FROM auth.users WHERE id = _auth_user_id;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.cleanup_orphan_auth_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_orphan_auth_user(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 9. ÍNDICES
-- ---------------------------------------------------------------------------
CREATE INDEX idx_patients_nutritionist        ON public.patients(nutritionist_id);
CREATE INDEX idx_anamneses_patient            ON public.anamneses(patient_id);
CREATE INDEX idx_plans_patient_status         ON public.plans(patient_id, status);
CREATE INDEX idx_plans_nutritionist           ON public.plans(nutritionist_id);
CREATE INDEX idx_templates_nutritionist       ON public.templates(nutritionist_id);
CREATE INDEX idx_referral_codes_nutritionist  ON public.referral_codes(nutritionist_id);

COMMIT;
