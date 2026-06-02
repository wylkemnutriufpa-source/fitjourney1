REVOKE EXECUTE ON FUNCTION public.cleanup_orphan_auth_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_orphan_auth_user(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_auth_user(uuid) TO service_role;