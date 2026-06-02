CREATE OR REPLACE FUNCTION public.patients_enforce_nutritionist_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _code_nutritionist_id uuid;
  _actor_nutritionist_id uuid;
BEGIN
  -- Convite/landing: o código é a fonte autoritativa para descobrir o profissional.
  -- Se vier nutritionist_id diferente do dono do código, corrigimos para o dono do código.
  IF NEW.source_referral_code IS NOT NULL AND btrim(NEW.source_referral_code) <> '' THEN
    SELECT rc.nutritionist_id
      INTO _code_nutritionist_id
    FROM public.referral_codes rc
    WHERE rc.code = upper(btrim(NEW.source_referral_code))
      AND rc.status IN ('active', 'consumed')
      AND (rc.expires_at IS NULL OR rc.expires_at >= now())
    ORDER BY rc.created_at DESC
    LIMIT 1;

    IF _code_nutritionist_id IS NOT NULL THEN
      NEW.source_referral_code := upper(btrim(NEW.source_referral_code));
      NEW.nutritionist_id := _code_nutritionist_id;
    END IF;
  END IF;

  -- Cadastro manual feito por profissional autenticado: se o app não enviou o id,
  -- o banco deriva pelo usuário logado antes de validar.
  IF NEW.nutritionist_id IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT n.id
      INTO _actor_nutritionist_id
    FROM public.nutritionists n
    WHERE n.auth_user_id = auth.uid()
    LIMIT 1;

    IF _actor_nutritionist_id IS NOT NULL THEN
      NEW.nutritionist_id := _actor_nutritionist_id;
    END IF;
  END IF;

  -- Sem código válido e sem profissional autenticado não há contexto confiável.
  IF NEW.nutritionist_id IS NULL THEN
    RAISE EXCEPTION 'Paciente precisa nascer vinculado ao profissional que originou o cadastro';
  END IF;

  -- Vínculo ativo não pode ser trocado depois do nascimento do paciente.
  IF TG_OP = 'UPDATE'
     AND OLD.nutritionist_id IS NOT NULL
     AND NEW.nutritionist_id IS DISTINCT FROM OLD.nutritionist_id THEN
    RAISE EXCEPTION 'Vínculo do paciente com o profissional é imutável';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_patients_enforce_nutritionist_link ON public.patients;
CREATE TRIGGER trg_patients_enforce_nutritionist_link
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.patients_enforce_nutritionist_link();