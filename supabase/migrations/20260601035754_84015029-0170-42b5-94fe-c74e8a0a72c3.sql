-- C1: Fechar gaps de integridade referencial em FKs ausentes
-- Pré-check documentado:
--   anamneses.created_by  órfãos esperados: 1
--   anamneses.approved_by órfãos esperados: 1
--   demais colunas:        0

BEGIN;

-- Assert pré-limpeza: órfãos esperados em anamneses
DO $$
DECLARE
  orphan_created_by  int;
  orphan_approved_by int;
BEGIN
  SELECT count(*) INTO orphan_created_by
    FROM anamneses a
    WHERE a.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM nutritionists n WHERE n.id = a.created_by);

  SELECT count(*) INTO orphan_approved_by
    FROM anamneses a
    WHERE a.approved_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM nutritionists n WHERE n.id = a.approved_by);

  RAISE NOTICE 'Pré-limpeza órfãos: created_by=%, approved_by=%', orphan_created_by, orphan_approved_by;

  IF orphan_created_by  > 1 THEN RAISE EXCEPTION 'Órfãos created_by acima do esperado: %',  orphan_created_by;  END IF;
  IF orphan_approved_by > 1 THEN RAISE EXCEPTION 'Órfãos approved_by acima do esperado: %', orphan_approved_by; END IF;
END $$;

-- Desabilitar APENAS o trigger de imutabilidade (cirúrgico, não DISABLE TRIGGER USER)
ALTER TABLE anamneses DISABLE TRIGGER anamneses_approved_immutable_trg;

-- NULL nos campos de auditoria órfãos (não afeta verdade clínica)
UPDATE anamneses SET created_by  = NULL
  WHERE created_by  IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM nutritionists n WHERE n.id = anamneses.created_by);

UPDATE anamneses SET approved_by = NULL
  WHERE approved_by IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM nutritionists n WHERE n.id = anamneses.approved_by);

-- Religar imutabilidade
ALTER TABLE anamneses ENABLE TRIGGER anamneses_approved_immutable_trg;

-- Assert pós-limpeza: deve ser 0
DO $$
DECLARE
  remaining_created_by  int;
  remaining_approved_by int;
BEGIN
  SELECT count(*) INTO remaining_created_by
    FROM anamneses a
    WHERE a.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM nutritionists n WHERE n.id = a.created_by);

  SELECT count(*) INTO remaining_approved_by
    FROM anamneses a
    WHERE a.approved_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM nutritionists n WHERE n.id = a.approved_by);

  IF remaining_created_by  <> 0 THEN RAISE EXCEPTION 'Pós-limpeza created_by ainda órfão: %',  remaining_created_by;  END IF;
  IF remaining_approved_by <> 0 THEN RAISE EXCEPTION 'Pós-limpeza approved_by ainda órfão: %', remaining_approved_by; END IF;
END $$;

-- FKs de auditoria em anamneses (admin → SET NULL)
ALTER TABLE anamneses
  ADD CONSTRAINT anamneses_created_by_fkey
    FOREIGN KEY (created_by)  REFERENCES nutritionists(id) ON DELETE SET NULL,
  ADD CONSTRAINT anamneses_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES nutritionists(id) ON DELETE SET NULL;

-- FKs em patient_feedbacks (clínico=RESTRICT, admin=SET NULL)
ALTER TABLE patient_feedbacks
  ADD CONSTRAINT patient_feedbacks_patient_id_fkey
    FOREIGN KEY (patient_id)      REFERENCES patients(id)      ON DELETE RESTRICT,
  ADD CONSTRAINT patient_feedbacks_nutritionist_id_fkey
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionists(id) ON DELETE SET NULL;

-- FKs em patient_subscriptions (histórico financeiro → RESTRICT em ambos)
ALTER TABLE patient_subscriptions
  ADD CONSTRAINT patient_subscriptions_patient_id_fkey
    FOREIGN KEY (patient_id)      REFERENCES patients(id)      ON DELETE RESTRICT,
  ADD CONSTRAINT patient_subscriptions_nutritionist_id_fkey
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionists(id) ON DELETE RESTRICT;

COMMIT;