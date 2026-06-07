-- ============================================================================
-- FITJOURNEY — FASE 1 (SEED MÍNIMO PARA BATERIA DE EVIDÊNCIAS)
-- Objetivo: criar o conjunto mínimo de linhas exigido pelos testes
--           destrutivos 2.1 (template→plano), 2.2 (paciente→anamnese RESTRICT),
--           2.3 (UPDATE em snapshot publicado).
-- Sem auth.users reais. Usa UUIDs fixos para que os testes possam referenciar.
-- Rodar via supabase--insert APÓS o UP estar aplicado.
-- ============================================================================

BEGIN;

-- IDs fixos (determinísticos) para a bateria
-- nutri:    11111111-1111-1111-1111-111111111111
-- patient:  22222222-2222-2222-2222-222222222222
-- template: 33333333-3333-3333-3333-333333333333
-- anamnese: 44444444-4444-4444-4444-444444444444
-- plan:     55555555-5555-5555-5555-555555555555

-- auth_user_id é uuid lógico; não precisa existir em auth.users para os testes de FK/RLS
-- (a bateria 2.x roda como service_role, que bypassa RLS).

INSERT INTO public.nutritionists (id, auth_user_id, full_name, email)
VALUES ('11111111-1111-1111-1111-111111111111',
        '11111111-aaaa-aaaa-aaaa-111111111111',
        'Seed Nutri', 'seed.nutri@fitjourney.test');

INSERT INTO public.patients (id, auth_user_id, nutritionist_id, full_name, email)
VALUES ('22222222-2222-2222-2222-222222222222',
        '22222222-aaaa-aaaa-aaaa-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'Seed Patient', 'seed.patient@fitjourney.test');

INSERT INTO public.templates (id, nutritionist_id, name, schema_version, content)
VALUES ('33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'Seed Template', 3,
        '{"days":[],"_seed":true}'::jsonb);

INSERT INTO public.anamneses (id, patient_id, nutritionist_id, schema_version, data)
VALUES ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        1,
        '{"_seed":true}'::jsonb);

-- Plano JÁ PUBLICADO (trigger carimba published_at automaticamente)
INSERT INTO public.plans (id, patient_id, nutritionist_id, source_template_id,
                          schema_version, status, snapshot)
VALUES ('55555555-5555-5555-5555-555555555555',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        '33333333-3333-3333-3333-333333333333',
        3, 'published',
        '{"days":[],"_seed":true,"_frozen":true}'::jsonb);

COMMIT;

-- ----------------------------------------------------------------------------
-- LIMPEZA DO SEED (após a bateria de evidências)
-- ----------------------------------------------------------------------------
-- Rodar manualmente quando os testes terminarem:
--
-- BEGIN;
--   DELETE FROM public.plans          WHERE id = '55555555-5555-5555-5555-555555555555';
--   DELETE FROM public.anamneses      WHERE id = '44444444-4444-4444-4444-444444444444';
--   DELETE FROM public.templates      WHERE id = '33333333-3333-3333-3333-333333333333';
--   DELETE FROM public.patients       WHERE id = '22222222-2222-2222-2222-222222222222';
--   DELETE FROM public.nutritionists  WHERE id = '11111111-1111-1111-1111-111111111111';
-- COMMIT;
