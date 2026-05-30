-- ============================================================================
-- FITJOURNEY — FASE 1 (DOWN / ROLLBACK)
-- Estratégia: rollback MANUAL e explícito.
-- Uso: aplicar este arquivo via supabase--migration somente se a Fase 1
--      precisar ser desfeita ANTES de qualquer dado de produção entrar.
-- Após qualquer dado clínico real entrar nas tabelas, este down NÃO deve
-- mais ser executado — o rollback passa a ser feito por migration corretiva.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.cleanup_orphan_auth_user(uuid);
DROP VIEW     IF EXISTS public.orphan_auth_users;

DROP TRIGGER  IF EXISTS trg_plans_snapshot_immutable  ON public.plans;
DROP TRIGGER  IF EXISTS trg_plans_stamp_published_at  ON public.plans;
DROP TRIGGER  IF EXISTS trg_touch_plans               ON public.plans;
DROP TRIGGER  IF EXISTS trg_touch_anamneses           ON public.anamneses;
DROP TRIGGER  IF EXISTS trg_touch_templates           ON public.templates;
DROP TRIGGER  IF EXISTS trg_touch_patients            ON public.patients;
DROP TRIGGER  IF EXISTS trg_touch_nutritionists       ON public.nutritionists;

DROP FUNCTION IF EXISTS public.plans_snapshot_immutable();
DROP FUNCTION IF EXISTS public.plans_stamp_published_at();
DROP FUNCTION IF EXISTS public.touch_updated_at();

-- Ordem reversa por dependência. RESTRICT garante que se houver dado, o DROP falha.
DROP TABLE IF EXISTS public.plans           RESTRICT;
DROP TABLE IF EXISTS public.anamneses       RESTRICT;
DROP TABLE IF EXISTS public.templates       RESTRICT;
ALTER TABLE IF EXISTS public.referral_codes DROP CONSTRAINT IF EXISTS referral_codes_consumed_by_fkey;
DROP TABLE IF EXISTS public.patients        RESTRICT;
DROP TABLE IF EXISTS public.referral_codes  RESTRICT;
DROP TABLE IF EXISTS public.nutritionists   RESTRICT;

DROP TYPE IF EXISTS public.referral_code_status;
DROP TYPE IF EXISTS public.plan_status;

COMMIT;

-- Rollback automático em runtime (durante a própria migration):
--   O UP roda inteiro dentro de um único BEGIN/COMMIT. Qualquer erro
--   (FK inválida, RLS recusada pelo Postgres, sintaxe) aborta a transação
--   e ZERO objetos ficam criados. Não há estado intermediário possível.
