DROP POLICY IF EXISTS "patient archives self" ON public.patients;
CREATE POLICY "patient archives self"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

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
);

REVOKE EXECUTE ON FUNCTION public.patient_keeps_existing_nutritionist_link(uuid, uuid) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.patient_keeps_existing_nutritionist_link(uuid, uuid);

REVOKE UPDATE ON public.patients FROM authenticated;
GRANT UPDATE (full_name, phone, height_cm, avatar_url, deleted_at, updated_at) ON public.patients TO authenticated;