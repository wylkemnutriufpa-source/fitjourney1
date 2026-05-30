-- Phase 2 — Domain Write Lockdown
-- Bloqueio físico: tabelas de identidade (nutritionists, patients, referral_codes)
-- não podem mais ser escritas diretamente por clientes (anon/authenticated).
-- Toda mutação obrigatoriamente passa por server function (service_role).
-- RLS de SELECT permanece intacta para leituras client-side.

-- nutritionists
REVOKE INSERT, UPDATE, DELETE ON public.nutritionists FROM anon, authenticated;
GRANT SELECT ON public.nutritionists TO authenticated;
GRANT ALL ON public.nutritionists TO service_role;

-- patients
REVOKE INSERT, UPDATE, DELETE ON public.patients FROM anon, authenticated;
GRANT SELECT ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

-- referral_codes
REVOKE INSERT, UPDATE, DELETE ON public.referral_codes FROM anon, authenticated;
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;