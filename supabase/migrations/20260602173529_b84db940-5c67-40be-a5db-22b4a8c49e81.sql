-- Defesa final: nutritionist_id em patients NUNCA pode ser NULL.
-- Trigger já garante isso na entrada; este NOT NULL é o backstop a nível
-- de schema caso alguém tente desabilitar/dropar a trigger no futuro.

-- 1) Validar que não há órfãos (deve retornar 0 — validado em 2026-06-02: 284/284 vinculados)
DO $$
DECLARE
  _orfaos integer;
BEGIN
  SELECT COUNT(*) INTO _orfaos FROM public.patients WHERE nutritionist_id IS NULL;
  IF _orfaos > 0 THEN
    RAISE EXCEPTION 'Não posso aplicar NOT NULL: existem % pacientes órfãos. Corrija antes.', _orfaos;
  END IF;
END $$;

-- 2) Aplicar NOT NULL na coluna
ALTER TABLE public.patients
  ALTER COLUMN nutritionist_id SET NOT NULL;

-- 3) Comentário para sinalizar invariante a quem ler o schema
COMMENT ON COLUMN public.patients.nutritionist_id IS
  'Vínculo obrigatório e imutável com o nutricionista que originou o cadastro. Garantido por NOT NULL + trigger patients_enforce_nutritionist_link + RLS. NÃO ALTERAR sem Matriz de Impacto.';