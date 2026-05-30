ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS kcal_target          numeric,
  ADD COLUMN IF NOT EXISTS kcal_range_min       numeric,
  ADD COLUMN IF NOT EXISTS kcal_range_max       numeric,
  ADD COLUMN IF NOT EXISTS protein_g_target     numeric,
  ADD COLUMN IF NOT EXISTS carb_g_target        numeric,
  ADD COLUMN IF NOT EXISTS fat_g_target         numeric,
  ADD COLUMN IF NOT EXISTS meals_per_day        smallint,
  ADD COLUMN IF NOT EXISTS constraints_tags     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goal_tag             text;

CREATE INDEX IF NOT EXISTS idx_templates_kcal_target ON public.templates (kcal_target);
CREATE INDEX IF NOT EXISTS idx_templates_goal_tag ON public.templates (goal_tag);
CREATE INDEX IF NOT EXISTS idx_templates_constraints_tags ON public.templates USING GIN (constraints_tags);