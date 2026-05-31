ALTER TABLE public.anamneses
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

ALTER TABLE public.anamneses
  DROP CONSTRAINT IF EXISTS anamneses_origin_check,
  ADD CONSTRAINT anamneses_origin_check CHECK (origin IN ('manual','online','migrated'));

ALTER TABLE public.anamneses
  DROP CONSTRAINT IF EXISTS anamneses_status_check,
  ADD CONSTRAINT anamneses_status_check CHECK (status IN ('draft','submitted','approved'));

ALTER TABLE public.anamneses ALTER COLUMN schema_version SET DEFAULT 2;

CREATE INDEX IF NOT EXISTS idx_anamneses_patient_status
  ON public.anamneses (patient_id, status);