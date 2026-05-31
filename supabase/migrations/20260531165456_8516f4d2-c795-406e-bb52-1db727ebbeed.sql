
-- Patients: WhatsApp + onboarding versioning
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS onboarding_version integer;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Anamneses: versioning + review state machine + flags + score
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS supersedes_id uuid REFERENCES public.anamneses(id) ON DELETE RESTRICT;
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS catalog_version text;
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS completion_score smallint;
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS clinical_flags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.anamneses ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.anamneses
    ADD CONSTRAINT anamneses_review_status_chk
    CHECK (review_status IN ('draft','submitted','reviewed','approved'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS anamneses_patient_version_idx
  ON public.anamneses (patient_id, version DESC);
CREATE INDEX IF NOT EXISTS anamneses_clinical_flags_gin
  ON public.anamneses USING gin (clinical_flags);

-- Patient consents
CREATE TABLE IF NOT EXISTS public.patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  anamnesis_id uuid REFERENCES public.anamneses(id) ON DELETE RESTRICT,
  consent_version text NOT NULL,
  consent_type text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

GRANT SELECT, INSERT ON public.patient_consents TO authenticated;
GRANT ALL ON public.patient_consents TO service_role;

ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient inserts own consent" ON public.patient_consents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_consents.patient_id AND p.auth_user_id = auth.uid()
  ));

CREATE POLICY "patient reads own consent" ON public.patient_consents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_consents.patient_id AND p.auth_user_id = auth.uid()
  ));

CREATE POLICY "nutri reads patient consent" ON public.patient_consents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patients p
    JOIN public.nutritionists n ON n.id = p.nutritionist_id
    WHERE p.id = patient_consents.patient_id AND n.auth_user_id = auth.uid()
  ));
