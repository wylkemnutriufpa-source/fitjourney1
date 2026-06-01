-- Idempotência e rastreabilidade da migração FJ1.0 -> FJ2.0
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS source_legacy_id text;

-- UNIQUE parcial: só vale pra rows com legacy id (nativos do FJ2.0 ficam NULL e múltiplos NULLs são permitidos)
CREATE UNIQUE INDEX IF NOT EXISTS patients_source_legacy_id_key
  ON public.patients (source_legacy_id)
  WHERE source_legacy_id IS NOT NULL;

COMMENT ON COLUMN public.patients.source_legacy_id IS
  'ID original do paciente no FitJourney 1.0 (projeto vkrcobprntictsxqmjjl). NULL para pacientes nativos do FJ2.0. UNIQUE quando presente — usado para idempotência do script de migração.';