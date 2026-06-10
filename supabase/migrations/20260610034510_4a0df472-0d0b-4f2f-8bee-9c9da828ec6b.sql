
-- FASE 1: Endurecimento de RLS (C-01, C-02, C-03, A-07)
-- Adiciona WITH CHECK em policies de UPDATE/ALL que estavam ausentes,
-- impedindo transferência/reatribuição de registros clínicos para outro dono.

-- ============================================================
-- C-01: anamneses UPDATE (nutri) — sem WITH CHECK permitia
-- mover anamnese para outro nutritionist_id
-- ============================================================
ALTER POLICY "nutri updates patient anamnese" ON public.anamneses
  USING (
    EXISTS (SELECT 1 FROM public.nutritionists n
            WHERE n.id = anamneses.nutritionist_id
              AND n.auth_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.nutritionists n
            WHERE n.id = anamneses.nutritionist_id
              AND n.auth_user_id = auth.uid())
  );

-- ============================================================
-- C-02: plans ALL — WITH CHECK só validava nutritionist_id;
-- permitia criar/atualizar plano apontando p/ paciente de outro nutri.
-- Agora exige que o patient_id pertença ao mesmo nutritionist_id.
-- ============================================================
ALTER POLICY "nutri rw own plans" ON public.plans
  USING (
    EXISTS (SELECT 1 FROM public.nutritionists n
            WHERE n.id = plans.nutritionist_id
              AND n.auth_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.nutritionists n
            WHERE n.id = plans.nutritionist_id
              AND n.auth_user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.patients p
                WHERE p.id = plans.patient_id
                  AND p.nutritionist_id = plans.nutritionist_id)
  );

-- ============================================================
-- C-03: patient_active_protocols UPDATE — duas policies sem WITH CHECK
-- ============================================================
ALTER POLICY "nutri_update_own" ON public.patient_active_protocols
  USING (
    nutritionist_id IN (SELECT n.id FROM public.nutritionists n
                        WHERE n.auth_user_id = auth.uid())
  )
  WITH CHECK (
    nutritionist_id IN (SELECT n.id FROM public.nutritionists n
                        WHERE n.auth_user_id = auth.uid())
  );

ALTER POLICY "patient_update_banner" ON public.patient_active_protocols
  USING (
    patient_id IN (SELECT p.id FROM public.patients p
                   WHERE p.auth_user_id = auth.uid())
  )
  WITH CHECK (
    patient_id IN (SELECT p.id FROM public.patients p
                   WHERE p.auth_user_id = auth.uid())
  );

-- ============================================================
-- A-07: physical_assessments UPDATE (nutri) — WITH CHECK não validava
-- vínculo patient↔nutritionist; agora exige paciente do próprio nutri.
-- ============================================================
ALTER POLICY "nutri updates recent physical assessments" ON public.physical_assessments
  USING (
    created_at > (now() - interval '24 hours')
    AND EXISTS (SELECT 1 FROM public.nutritionists n
                WHERE n.id = physical_assessments.nutritionist_id
                  AND n.auth_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.nutritionists n
            WHERE n.id = physical_assessments.nutritionist_id
              AND n.auth_user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.patients p
                WHERE p.id = physical_assessments.patient_id
                  AND p.nutritionist_id = physical_assessments.nutritionist_id)
  );
