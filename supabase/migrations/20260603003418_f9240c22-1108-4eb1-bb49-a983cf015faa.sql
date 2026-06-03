-- Soft delete para pacientes (LGPD: paciente pode arquivar a própria conta).
-- Dados clínicos são preservados sob responsabilidade do nutricionista.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_patients_active
  ON public.patients (nutritionist_id)
  WHERE deleted_at IS NULL;

-- Reescreve policies para esconder pacientes arquivados das leituras.
-- Admin continua vendo tudo. Paciente só vê a si próprio enquanto ativo.
-- Nutricionista só vê seus pacientes ativos.

DROP POLICY IF EXISTS "patient reads self" ON public.patients;
CREATE POLICY "patient reads self"
ON public.patients
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "patient updates self" ON public.patients;
CREATE POLICY "patient updates self"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = auth_user_id AND nutritionist_id IS NOT NULL);

DROP POLICY IF EXISTS "nutri reads own patients" ON public.patients;
CREATE POLICY "nutri reads own patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.nutritionists n
    WHERE n.id = patients.nutritionist_id
      AND n.auth_user_id = auth.uid()
  )
);

-- Nova policy: paciente pode arquivar a própria conta (UPDATE setando deleted_at).
-- Como a policy "patient updates self" exige deleted_at IS NULL no USING,
-- esta policy permissiva separada cobre a transição ativo -> arquivado.
DROP POLICY IF EXISTS "patient archives self" ON public.patients;
CREATE POLICY "patient archives self"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);
