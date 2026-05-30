-- Revoga execute da função cleanup_orphan_auth_user para client roles.
-- Permanece chamável apenas via service_role (server function / job).
REVOKE EXECUTE ON FUNCTION public.cleanup_orphan_auth_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_auth_user(uuid) TO service_role;