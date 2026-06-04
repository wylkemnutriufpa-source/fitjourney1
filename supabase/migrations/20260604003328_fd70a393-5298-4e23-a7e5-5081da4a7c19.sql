-- Drop the blocking trigger
DROP TRIGGER IF EXISTS trg_patient_subscriptions_no_overlap ON public.patient_subscriptions;

-- Make the function a no-op to avoid breaking other migrations that might reference it
CREATE OR REPLACE FUNCTION public.patient_subscriptions_no_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NEW;
END;
$$;
