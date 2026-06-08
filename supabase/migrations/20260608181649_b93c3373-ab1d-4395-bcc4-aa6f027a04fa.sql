
CREATE TABLE public.patient_active_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE RESTRICT,
  protocol_id text NOT NULL,
  protocol_name text NOT NULL,
  module_id text NOT NULL,
  module_name text NOT NULL,
  phase_id integer NOT NULL,
  phase_snapshot jsonb NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  last_banner_shown_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX patient_active_protocols_patient_idx ON public.patient_active_protocols(patient_id, status);
CREATE INDEX patient_active_protocols_nutritionist_idx ON public.patient_active_protocols(nutritionist_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_active_protocols TO authenticated;
GRANT ALL ON public.patient_active_protocols TO service_role;

ALTER TABLE public.patient_active_protocols ENABLE ROW LEVEL SECURITY;

-- Nutricionista: vê/gerencia somente protocolos dos seus pacientes
CREATE POLICY "nutri_select_own" ON public.patient_active_protocols
  FOR SELECT TO authenticated
  USING (nutritionist_id IN (SELECT id FROM public.nutritionists WHERE auth_user_id = auth.uid()));

CREATE POLICY "nutri_insert_own" ON public.patient_active_protocols
  FOR INSERT TO authenticated
  WITH CHECK (nutritionist_id IN (SELECT id FROM public.nutritionists WHERE auth_user_id = auth.uid()));

CREATE POLICY "nutri_update_own" ON public.patient_active_protocols
  FOR UPDATE TO authenticated
  USING (nutritionist_id IN (SELECT id FROM public.nutritionists WHERE auth_user_id = auth.uid()));

CREATE POLICY "nutri_delete_own" ON public.patient_active_protocols
  FOR DELETE TO authenticated
  USING (nutritionist_id IN (SELECT id FROM public.nutritionists WHERE auth_user_id = auth.uid()));

-- Paciente: vê apenas os próprios e pode dar UPDATE só em last_banner_shown_date (controlado pelo trigger)
CREATE POLICY "patient_select_own" ON public.patient_active_protocols
  FOR SELECT TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE auth_user_id = auth.uid()));

CREATE POLICY "patient_update_banner" ON public.patient_active_protocols
  FOR UPDATE TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE auth_user_id = auth.uid()));

-- Trigger: imutabilidade do snapshot + campos clínicos; só permite mudar last_banner_shown_date / status / updated_at
CREATE OR REPLACE FUNCTION public.patient_active_protocols_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.phase_snapshot IS DISTINCT FROM OLD.phase_snapshot THEN RAISE EXCEPTION 'phase_snapshot é imutável'; END IF;
  IF NEW.patient_id     IS DISTINCT FROM OLD.patient_id     THEN RAISE EXCEPTION 'patient_id imutável'; END IF;
  IF NEW.nutritionist_id IS DISTINCT FROM OLD.nutritionist_id THEN RAISE EXCEPTION 'nutritionist_id imutável'; END IF;
  IF NEW.protocol_id    IS DISTINCT FROM OLD.protocol_id    THEN RAISE EXCEPTION 'protocol_id imutável'; END IF;
  IF NEW.module_id      IS DISTINCT FROM OLD.module_id      THEN RAISE EXCEPTION 'module_id imutável'; END IF;
  IF NEW.phase_id       IS DISTINCT FROM OLD.phase_id       THEN RAISE EXCEPTION 'phase_id imutável'; END IF;
  IF NEW.started_at     IS DISTINCT FROM OLD.started_at     THEN RAISE EXCEPTION 'started_at imutável'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER patient_active_protocols_immutable_trg
BEFORE UPDATE ON public.patient_active_protocols
FOR EACH ROW EXECUTE FUNCTION public.patient_active_protocols_immutable();
