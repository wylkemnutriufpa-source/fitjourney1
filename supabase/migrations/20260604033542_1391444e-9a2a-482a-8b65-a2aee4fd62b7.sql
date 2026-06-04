ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.patients.is_active IS
  'Status operacional do paciente na agenda do nutricionista. Não altera vínculo paciente-nutricionista, histórico clínico, anamnese ou planos publicados.';