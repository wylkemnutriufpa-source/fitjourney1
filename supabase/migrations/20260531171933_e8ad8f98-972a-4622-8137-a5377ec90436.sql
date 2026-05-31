-- Ajuste 1: coluna dedicada para notas clínicas do nutricionista (fora do JSONB)
ALTER TABLE public.anamneses
  ADD COLUMN IF NOT EXISTS review_notes text;

-- Constraint de domínio para review_status (remove 'reviewed' redundante; mantém 'draft' para rascunho pré-submit)
ALTER TABLE public.anamneses
  DROP CONSTRAINT IF EXISTS anamneses_review_status_check;
ALTER TABLE public.anamneses
  ADD CONSTRAINT anamneses_review_status_check
  CHECK (review_status IN ('draft','submitted','needs_changes','approved'));

-- Ajuste 3: anamnese aprovada é imutável. Qualquer correção exige nova versão.
CREATE OR REPLACE FUNCTION public.anamneses_approved_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.review_status = 'approved' THEN
    -- Bloqueia QUALQUER UPDATE em row aprovada
    RAISE EXCEPTION 'anamnese aprovada (id=%) é imutável; crie uma nova versão (supersedes_id=%)', OLD.id, OLD.id;
  END IF;

  -- Quando transiciona para approved, carimba approved_at/approved_by se não vieram
  IF NEW.review_status = 'approved' AND OLD.review_status <> 'approved' THEN
    IF NEW.approved_at IS NULL THEN NEW.approved_at := now(); END IF;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS anamneses_approved_immutable_trg ON public.anamneses;
CREATE TRIGGER anamneses_approved_immutable_trg
BEFORE UPDATE ON public.anamneses
FOR EACH ROW
EXECUTE FUNCTION public.anamneses_approved_immutable();

-- Índice para a queue (filtrar por status + ordenar por submit/update)
CREATE INDEX IF NOT EXISTS idx_anamneses_nutri_status_updated
  ON public.anamneses (nutritionist_id, review_status, updated_at DESC);

-- Índice para buscar última versão aprovada por paciente (Clinical Alerts)
CREATE INDEX IF NOT EXISTS idx_anamneses_patient_approved
  ON public.anamneses (patient_id, approved_at DESC)
  WHERE review_status = 'approved';