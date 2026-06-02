-- Conceder permissões faltantes para os roles do PostgREST.
-- Sem isso, qualquer UPDATE/INSERT/DELETE direto pelas server functions
-- falha com "permission denied for table X" mesmo quando a RLS permite.
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', r.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', r.tablename);
  END LOOP;
END $$;

-- Sequences (caso alguma tabela use serial/identity)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Funções públicas
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Defaults para futuras tabelas/sequences/funcs criadas pelo postgres
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;