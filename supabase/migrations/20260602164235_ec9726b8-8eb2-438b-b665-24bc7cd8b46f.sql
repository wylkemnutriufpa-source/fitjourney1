-- Evita listagem pública ampla dos arquivos da landing sem tornar URLs públicas existentes privadas.
DROP POLICY IF EXISTS "landing-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "landing-assets admin read" ON storage.objects;

CREATE POLICY "landing-assets admin read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'landing-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Garante que paciente nunca nasça sem vínculo e que o vínculo não seja removido/trocado por update comum.
CREATE OR REPLACE FUNCTION public.patients_enforce_nutritionist_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.nutritionist_id IS NULL THEN
    RAISE EXCEPTION 'Paciente precisa estar vinculado a um profissional';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.nutritionist_id IS DISTINCT FROM OLD.nutritionist_id THEN
    RAISE EXCEPTION 'Vínculo do paciente com o profissional é imutável';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_patients_enforce_nutritionist_link ON public.patients;
CREATE TRIGGER trg_patients_enforce_nutritionist_link
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.patients_enforce_nutritionist_link();

DROP POLICY IF EXISTS "patient inserts self" ON public.patients;
CREATE POLICY "patient inserts self"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = auth_user_id
    AND nutritionist_id IS NOT NULL
    AND source_referral_code IS NOT NULL
  );

DROP POLICY IF EXISTS "patient updates self" ON public.patients;
CREATE POLICY "patient updates self"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (
    auth.uid() = auth_user_id
    AND nutritionist_id IS NOT NULL
  );