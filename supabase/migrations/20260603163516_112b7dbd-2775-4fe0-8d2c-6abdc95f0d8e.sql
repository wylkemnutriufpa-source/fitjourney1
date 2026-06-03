
CREATE TABLE public.physical_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  nutritionist_id uuid NOT NULL,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  weight_kg numeric(5,2),
  height_cm numeric(5,1),
  body_fat_pct numeric(4,1),
  lean_mass_kg numeric(5,2),
  fat_mass_kg numeric(5,2),
  visceral_fat numeric(4,1),
  neck_cm numeric(5,1),
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  abdomen_cm numeric(5,1),
  hip_cm numeric(5,1),
  arm_relaxed_cm numeric(5,1),
  arm_contracted_cm numeric(5,1),
  forearm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  calf_cm numeric(5,1),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pa_weight_range CHECK (weight_kg IS NULL OR (weight_kg > 20 AND weight_kg < 400)),
  CONSTRAINT pa_height_range CHECK (height_cm IS NULL OR (height_cm > 80 AND height_cm < 260)),
  CONSTRAINT pa_bf_range     CHECK (body_fat_pct IS NULL OR (body_fat_pct >= 1 AND body_fat_pct <= 70))
);

CREATE INDEX physical_assessments_patient_assessed_idx
  ON public.physical_assessments (patient_id, assessed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_assessments TO authenticated;
GRANT ALL ON public.physical_assessments TO service_role;

ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;

-- Nutricionista dono lê
CREATE POLICY "nutri reads patient physical assessments"
  ON public.physical_assessments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nutritionists n
    WHERE n.id = physical_assessments.nutritionist_id
      AND n.auth_user_id = auth.uid()
  ));

-- Nutricionista dono cria (só para pacientes dele)
CREATE POLICY "nutri creates patient physical assessments"
  ON public.physical_assessments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = physical_assessments.nutritionist_id
        AND n.auth_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = physical_assessments.patient_id
        AND p.nutritionist_id = physical_assessments.nutritionist_id
    )
  );

-- Nutricionista dono pode corrigir nas primeiras 24h
CREATE POLICY "nutri updates recent physical assessments"
  ON public.physical_assessments FOR UPDATE TO authenticated
  USING (
    created_at > now() - interval '24 hours'
    AND EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = physical_assessments.nutritionist_id
        AND n.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = physical_assessments.nutritionist_id
        AND n.auth_user_id = auth.uid()
    )
  );

-- Nutricionista dono pode apagar avaliações recentes (erro de digitação)
CREATE POLICY "nutri deletes recent physical assessments"
  ON public.physical_assessments FOR DELETE TO authenticated
  USING (
    created_at > now() - interval '24 hours'
    AND EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = physical_assessments.nutritionist_id
        AND n.auth_user_id = auth.uid()
    )
  );

-- Paciente lê as próprias (read-only sempre)
CREATE POLICY "patient reads own physical assessments"
  ON public.physical_assessments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = physical_assessments.patient_id
      AND p.auth_user_id = auth.uid()
  ));

-- Trigger imutabilidade clínica após 24h
CREATE OR REPLACE FUNCTION public.physical_assessments_immutable_after_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.created_at <= now() - interval '24 hours' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Avaliação física é imutável após 24h. Crie uma nova avaliação para registrar mudanças.';
    END IF;
    IF NEW.patient_id     IS DISTINCT FROM OLD.patient_id     THEN RAISE EXCEPTION 'patient_id imutável'; END IF;
    IF NEW.nutritionist_id IS DISTINCT FROM OLD.nutritionist_id THEN RAISE EXCEPTION 'nutritionist_id imutável'; END IF;
    IF NEW.assessed_at    IS DISTINCT FROM OLD.assessed_at    THEN RAISE EXCEPTION 'assessed_at imutável após 24h'; END IF;
    IF NEW.weight_kg      IS DISTINCT FROM OLD.weight_kg      THEN RAISE EXCEPTION 'weight_kg imutável após 24h'; END IF;
    IF NEW.height_cm      IS DISTINCT FROM OLD.height_cm      THEN RAISE EXCEPTION 'height_cm imutável após 24h'; END IF;
    IF NEW.body_fat_pct   IS DISTINCT FROM OLD.body_fat_pct   THEN RAISE EXCEPTION 'body_fat_pct imutável após 24h'; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER physical_assessments_immutable
  BEFORE UPDATE OR DELETE ON public.physical_assessments
  FOR EACH ROW EXECUTE FUNCTION public.physical_assessments_immutable_after_window();
