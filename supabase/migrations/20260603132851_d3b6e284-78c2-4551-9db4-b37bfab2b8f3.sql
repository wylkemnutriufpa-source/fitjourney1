-- 1) Tighten anamneses INSERT for patients: nutritionist_id must equal the patient's own nutritionist_id
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
    WHERE p.id = anamneses.patient_id
      AND p.auth_user_id = auth.uid()
      AND p.nutritionist_id = anamneses.nutritionist_id
  )
);

-- 2) Allow public read for landing-assets bucket (public bucket needs anon SELECT)
CREATE POLICY "landing-assets public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'landing-assets');
