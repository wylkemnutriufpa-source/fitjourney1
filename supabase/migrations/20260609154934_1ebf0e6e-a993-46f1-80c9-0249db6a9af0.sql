
-- =========================================================================
-- admin_delete_patient: admin ou nutri dono
-- =========================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_patient(_patient_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_user_id uuid;
  _caller uuid := auth.uid();
  _is_admin boolean;
  _is_owner boolean;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Forbidden: not authenticated';
  END IF;

  _is_admin := public.has_role(_caller, 'admin'::app_role);

  SELECT EXISTS (
    SELECT 1
    FROM public.patients p
    JOIN public.nutritionists n ON n.id = p.nutritionist_id
    WHERE p.id = _patient_id AND n.auth_user_id = _caller
  ) INTO _is_owner;

  IF NOT (_is_admin OR _is_owner) THEN
    RAISE EXCEPTION 'Forbidden: admin or owning nutritionist required';
  END IF;

  SELECT auth_user_id INTO _auth_user_id FROM public.patients WHERE id = _patient_id;

  -- Bypass triggers de imutabilidade clínica (DELETE-side) dentro da função/tx.
  PERFORM set_config('session_replication_role', 'replica', true);

  DELETE FROM public.patient_active_protocols WHERE patient_id = _patient_id;
  DELETE FROM public.patient_feedbacks       WHERE patient_id = _patient_id;
  DELETE FROM public.patient_consents        WHERE patient_id = _patient_id;
  DELETE FROM public.patient_subscriptions   WHERE patient_id = _patient_id;
  DELETE FROM public.physical_assessments    WHERE patient_id = _patient_id;
  DELETE FROM public.plans                   WHERE patient_id = _patient_id;
  DELETE FROM public.anamneses               WHERE patient_id = _patient_id;
  DELETE FROM public.patients                WHERE id         = _patient_id;

  PERFORM set_config('session_replication_role', 'origin', true);

  IF _auth_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _auth_user_id;
    DELETE FROM auth.users        WHERE id      = _auth_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_patient(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_patient(uuid) TO authenticated;

-- =========================================================================
-- admin_delete_nutritionist: somente admin; recusa se houver pacientes
-- =========================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_nutritionist(_nutritionist_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_user_id uuid;
  _caller uuid := auth.uid();
  _patient_count int;
BEGIN
  IF _caller IS NULL OR NOT public.has_role(_caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT count(*) INTO _patient_count
  FROM public.patients WHERE nutritionist_id = _nutritionist_id;

  IF _patient_count > 0 THEN
    RAISE EXCEPTION 'Profissional possui % paciente(s) vinculado(s). Exclua os pacientes antes.', _patient_count;
  END IF;

  SELECT auth_user_id INTO _auth_user_id FROM public.nutritionists WHERE id = _nutritionist_id;

  DELETE FROM public.templates                  WHERE nutritionist_id = _nutritionist_id;
  DELETE FROM public.referral_codes             WHERE nutritionist_id = _nutritionist_id;
  DELETE FROM public.nutritionist_subscriptions WHERE nutritionist_id = _nutritionist_id;
  DELETE FROM public.nutritionists              WHERE id              = _nutritionist_id;

  IF _auth_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _auth_user_id;
    DELETE FROM auth.users        WHERE id      = _auth_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_nutritionist(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_nutritionist(uuid) TO authenticated;
