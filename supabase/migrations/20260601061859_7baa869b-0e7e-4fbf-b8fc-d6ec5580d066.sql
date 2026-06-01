-- Nutritionist subscriptions (platform charges the nutritionist a monthly fee)
CREATE TABLE public.nutritionist_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE RESTRICT,
  monthly_price_cents integer NOT NULL CHECK (monthly_price_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  starts_at date NOT NULL DEFAULT CURRENT_DATE,
  ends_at date,
  status subscription_status NOT NULL DEFAULT 'active',
  payment_method subscription_payment_method,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutri_subs_nutri ON public.nutritionist_subscriptions(nutritionist_id);
CREATE INDEX idx_nutri_subs_status ON public.nutritionist_subscriptions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutritionist_subscriptions TO authenticated;
GRANT ALL ON public.nutritionist_subscriptions TO service_role;

ALTER TABLE public.nutritionist_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins full CRUD
CREATE POLICY "admins manage nutri subscriptions"
ON public.nutritionist_subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Nutritionist reads own subscription
CREATE POLICY "nutri reads own subscription"
ON public.nutritionist_subscriptions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.nutritionists n
  WHERE n.id = nutritionist_subscriptions.nutritionist_id
    AND n.auth_user_id = auth.uid()
));

CREATE TRIGGER trg_nutri_subs_touch
BEFORE UPDATE ON public.nutritionist_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Admin policy on patients table: admins can read ALL patients (read-only consolidated view)
CREATE POLICY "admins read all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policy on nutritionists table: admins can read all nutritionists
CREATE POLICY "admins read all nutritionists"
ON public.nutritionists
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));