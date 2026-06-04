CREATE POLICY "patient updates own recent feedback"
ON public.patient_feedbacks
FOR UPDATE
TO authenticated
USING (
  (created_at > now() - interval '24 hours')
  AND edited_by IS NULL
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_feedbacks.patient_id AND p.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  (created_at > now() - interval '24 hours')
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_feedbacks.patient_id AND p.auth_user_id = auth.uid()
  )
);