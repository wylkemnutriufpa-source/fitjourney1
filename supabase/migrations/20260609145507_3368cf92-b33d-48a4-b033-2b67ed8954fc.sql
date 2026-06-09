
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS checkout_plans jsonb NOT NULL DEFAULT '[]'::jsonb;
