REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars authenticated read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "nutri inserts own" ON public.nutritionists;