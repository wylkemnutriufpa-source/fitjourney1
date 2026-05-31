ALTER TABLE public.nutritionists 
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS phone text;