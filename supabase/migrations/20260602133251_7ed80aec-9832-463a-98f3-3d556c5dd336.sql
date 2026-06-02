-- 1) patient_feedbacks: soft delete + auditoria de edição (preserva histórico clínico)
ALTER TABLE public.patient_feedbacks
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Permite nutri EDITAR/soft-deletar feedbacks dos pacientes dele
DROP POLICY IF EXISTS "nutri updates patient feedback" ON public.patient_feedbacks;
CREATE POLICY "nutri updates patient feedback"
ON public.patient_feedbacks
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.nutritionists n
  WHERE n.id = patient_feedbacks.nutritionist_id AND n.auth_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.nutritionists n
  WHERE n.id = patient_feedbacks.nutritionist_id AND n.auth_user_id = auth.uid()
));

-- 2) anamneses: paciente pode salvar/atualizar/deletar SEU próprio rascunho (review_status='draft')
DROP POLICY IF EXISTS "patient inserts own anamnesis draft" ON public.anamneses;
CREATE POLICY "patient inserts own anamnesis draft"
ON public.anamneses
FOR INSERT
TO authenticated
WITH CHECK (
  review_status = 'draft'
  AND status = 'draft'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = anamneses.patient_id AND p.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "patient updates own anamnesis draft" ON public.anamneses;
CREATE POLICY "patient updates own anamnesis draft"
ON public.anamneses
FOR UPDATE
TO authenticated
USING (
  review_status = 'draft'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = anamneses.patient_id AND p.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  review_status = 'draft'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = anamneses.patient_id AND p.auth_user_id = auth.uid()
  )
);

-- Paciente pode deletar SEU próprio rascunho (descartar)
DROP POLICY IF EXISTS "patient deletes own anamnesis draft" ON public.anamneses;
CREATE POLICY "patient deletes own anamnesis draft"
ON public.anamneses
FOR DELETE
TO authenticated
USING (
  review_status = 'draft'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = anamneses.patient_id AND p.auth_user_id = auth.uid()
  )
);

-- Nutri pode deletar rascunho do paciente dele (botão admin "limpar rascunho")
DROP POLICY IF EXISTS "nutri deletes patient anamnesis draft" ON public.anamneses;
CREATE POLICY "nutri deletes patient anamnesis draft"
ON public.anamneses
FOR DELETE
TO authenticated
USING (
  review_status = 'draft'
  AND EXISTS (
    SELECT 1 FROM public.nutritionists n
    WHERE n.id = anamneses.nutritionist_id AND n.auth_user_id = auth.uid()
  )
);

-- Index pra acelerar busca de rascunho ativo por paciente
CREATE INDEX IF NOT EXISTS idx_anamneses_patient_draft
  ON public.anamneses (patient_id)
  WHERE review_status = 'draft';

-- Index pra esconder soft-deleted feedbacks rapidamente
CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_active
  ON public.patient_feedbacks (patient_id, created_at DESC)
  WHERE deleted_at IS NULL;