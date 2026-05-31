ALTER TABLE public.patient_feedbacks
  ADD COLUMN IF NOT EXISTS waist_cm numeric,
  ADD COLUMN IF NOT EXISTS abdomen_cm numeric,
  ADD COLUMN IF NOT EXISTS hip_cm numeric;