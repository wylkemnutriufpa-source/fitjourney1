-- ============================================================
-- Módulo Financeiro: patient_subscriptions
-- Administrativo. Isolado do pipeline clínico (anamnese/plans/templates).
-- FK RESTRICT — histórico financeiro nunca apaga em cascata.
-- ============================================================

CREATE TYPE public.subscription_plan_kind AS ENUM (
  'monthly', 'quarterly', 'semiannual', 'annual', 'custom'
);

CREATE TYPE public.subscription_status AS ENUM (
  'active', 'paused', 'expired', 'cancelled'
);

CREATE TYPE public.subscription_payment_method AS ENUM (
  'pix', 'card', 'cash', 'transfer', 'boleto', 'other'
);

CREATE TABLE public.patient_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL,
  nutritionist_id uuid NOT NULL,
  plan_kind       public.subscription_plan_kind NOT NULL,
  price_cents     integer NOT NULL CHECK (price_cents >= 0),
  currency        text NOT NULL DEFAULT 'BRL' CHECK (char_length(currency) = 3),
  starts_at       date NOT NULL,
  ends_at         date,
  status          public.subscription_status NOT NULL DEFAULT 'active',
  payment_method  public.subscription_payment_method,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX idx_patient_subscriptions_patient      ON public.patient_subscriptions (patient_id, status);
CREATE INDEX idx_patient_subscriptions_nutritionist ON public.patient_subscriptions (nutritionist_id, status);
CREATE INDEX idx_patient_subscriptions_ends_at      ON public.patient_subscriptions (ends_at) WHERE status = 'active';

-- ---------- GRANTs ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_subscriptions TO authenticated;
GRANT ALL ON public.patient_subscriptions TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.patient_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri rw own patient subscriptions"
ON public.patient_subscriptions
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.nutritionists n
  WHERE n.id = patient_subscriptions.nutritionist_id
    AND n.auth_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.nutritionists n
  WHERE n.id = patient_subscriptions.nutritionist_id
    AND n.auth_user_id = auth.uid()
));

CREATE POLICY "patient reads own subscriptions"
ON public.patient_subscriptions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id = patient_subscriptions.patient_id
    AND p.auth_user_id = auth.uid()
));

-- ---------- updated_at ----------
CREATE TRIGGER trg_patient_subscriptions_touch_updated_at
BEFORE UPDATE ON public.patient_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- Auto ends_at por plan_kind ----------
CREATE OR REPLACE FUNCTION public.patient_subscriptions_auto_ends_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ends_at IS NULL AND NEW.plan_kind <> 'custom' THEN
    NEW.ends_at := CASE NEW.plan_kind
      WHEN 'monthly'    THEN NEW.starts_at + INTERVAL '1 month'
      WHEN 'quarterly'  THEN NEW.starts_at + INTERVAL '3 months'
      WHEN 'semiannual' THEN NEW.starts_at + INTERVAL '6 months'
      WHEN 'annual'     THEN NEW.starts_at + INTERVAL '12 months'
    END;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_patient_subscriptions_auto_ends_at
BEFORE INSERT OR UPDATE OF starts_at, plan_kind, ends_at ON public.patient_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.patient_subscriptions_auto_ends_at();

-- ---------- Sem overlap de assinaturas ativas no mesmo paciente ----------
CREATE OR REPLACE FUNCTION public.patient_subscriptions_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND EXISTS (
    SELECT 1 FROM public.patient_subscriptions s
    WHERE s.patient_id = NEW.patient_id
      AND s.id <> NEW.id
      AND s.status = 'active'
      AND daterange(s.starts_at, COALESCE(s.ends_at, 'infinity'::date), '[)')
        && daterange(NEW.starts_at, COALESCE(NEW.ends_at, 'infinity'::date), '[)')
  ) THEN
    RAISE EXCEPTION 'Já existe uma assinatura ativa sobreposta para este paciente';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_patient_subscriptions_no_overlap
BEFORE INSERT OR UPDATE ON public.patient_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.patient_subscriptions_no_overlap();
