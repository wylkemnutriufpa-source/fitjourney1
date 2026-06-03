CREATE OR REPLACE FUNCTION public.patient_keeps_existing_nutritionist_link(_patient_id uuid, _nutritionist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = _patient_id
      AND p.nutritionist_id = _nutritionist_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.patient_keeps_existing_nutritionist_link(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_keeps_existing_nutritionist_link(uuid, uuid) TO service_role;

DROP POLICY IF EXISTS "patient archives self" ON public.patients;
CREATE POLICY "patient archives self"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (
  auth.uid() = auth_user_id
  AND public.patient_keeps_existing_nutritionist_link(id, nutritionist_id)
);

DROP POLICY IF EXISTS "patient updates self" ON public.patients;
CREATE POLICY "patient updates self"
ON public.patients
FOR UPDATE
TO authenticated
USING ((auth.uid() = auth_user_id) AND (deleted_at IS NULL))
WITH CHECK (
  (auth.uid() = auth_user_id)
  AND (deleted_at IS NULL)
  AND (nutritionist_id IS NOT NULL)
  AND public.patient_keeps_existing_nutritionist_link(id, nutritionist_id)
);

DROP POLICY IF EXISTS "avatars authenticated read" ON storage.objects;
CREATE POLICY "avatars linked users read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.nutritionists n ON n.id = p.nutritionist_id
      WHERE p.auth_user_id::text = (storage.foldername(objects.name))[1]
        AND n.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.nutritionists n
      JOIN public.patients p ON p.nutritionist_id = n.id
      WHERE n.auth_user_id::text = (storage.foldername(objects.name))[1]
        AND p.auth_user_id = auth.uid()
    )
  )
);