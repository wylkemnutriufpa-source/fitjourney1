-- Add plan tier (BASIC/PRO) to nutritionist subscriptions
CREATE TYPE public.nutritionist_plan_tier AS ENUM ('basic', 'pro');

ALTER TABLE public.nutritionist_subscriptions
  ADD COLUMN plan_tier public.nutritionist_plan_tier NOT NULL DEFAULT 'basic';