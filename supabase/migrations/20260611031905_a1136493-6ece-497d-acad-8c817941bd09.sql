
-- 1. Tabela
CREATE TABLE public.patient_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE RESTRICT,
  anamnesis_id uuid NOT NULL REFERENCES public.anamneses(id) ON DELETE RESTRICT UNIQUE,
  diagnosis jsonb NOT NULL,
  triggers_version text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX patient_diagnoses_patient_idx ON public.patient_diagnoses(patient_id, generated_at DESC);
CREATE INDEX patient_diagnoses_nutritionist_idx ON public.patient_diagnoses(nutritionist_id, generated_at DESC);

-- 2. Grants
GRANT SELECT, INSERT ON public.patient_diagnoses TO authenticated;
GRANT ALL ON public.patient_diagnoses TO service_role;

-- 3. RLS
ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;

-- Paciente lê o próprio diagnóstico.
CREATE POLICY "patient reads own diagnosis"
ON public.patient_diagnoses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_diagnoses.patient_id
      AND p.auth_user_id = auth.uid()
  )
);

-- Nutricionista dono lê os diagnósticos dos seus pacientes.
CREATE POLICY "nutritionist reads own patients diagnoses"
ON public.patient_diagnoses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nutritionists n
    WHERE n.id = patient_diagnoses.nutritionist_id
      AND n.auth_user_id = auth.uid()
  )
);

-- Admin lê tudo.
CREATE POLICY "admin reads all diagnoses"
ON public.patient_diagnoses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert: nutricionista dono ou admin.
CREATE POLICY "nutritionist inserts diagnosis for own patient"
ON public.patient_diagnoses FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nutritionists n
    WHERE n.id = patient_diagnoses.nutritionist_id
      AND n.auth_user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Imutabilidade — bloqueia UPDATE e DELETE (snapshot soberano).
CREATE OR REPLACE FUNCTION public.patient_diagnoses_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'patient_diagnoses é imutável (snapshot soberano)';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'patient_diagnoses é imutável (snapshot soberano)';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER patient_diagnoses_block_update_delete
BEFORE UPDATE OR DELETE ON public.patient_diagnoses
FOR EACH ROW EXECUTE FUNCTION public.patient_diagnoses_immutable();
