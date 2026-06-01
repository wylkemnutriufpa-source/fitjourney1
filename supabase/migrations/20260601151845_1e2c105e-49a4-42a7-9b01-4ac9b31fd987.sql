CREATE POLICY "patient updates own feedback photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'feedback-photos'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.auth_user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'feedback-photos'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.auth_user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "patient deletes own feedback photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-photos'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.auth_user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "nutri updates patient feedback photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'feedback-photos'
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    JOIN public.nutritionists n ON n.id = p.nutritionist_id
    WHERE n.auth_user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'feedback-photos'
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    JOIN public.nutritionists n ON n.id = p.nutritionist_id
    WHERE n.auth_user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "nutri deletes patient feedback photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-photos'
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    JOIN public.nutritionists n ON n.id = p.nutritionist_id
    WHERE n.auth_user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "nutri reads patient consent" ON public.patient_consents;
REVOKE ALL ON public.patient_consents FROM anon;
REVOKE UPDATE, DELETE ON public.patient_consents FROM authenticated;
GRANT SELECT, INSERT ON public.patient_consents TO authenticated;
GRANT ALL ON public.patient_consents TO service_role;