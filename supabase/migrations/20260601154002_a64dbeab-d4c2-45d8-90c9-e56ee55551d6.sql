-- Restaura EXECUTE de has_role para authenticated.
-- Necessário porque diversas policies RLS (admins read all patients/nutritionists, user_roles, etc.)
-- chamam has_role() dentro da expressão e são avaliadas com a role do chamador.
-- Sem EXECUTE, qualquer SELECT que cruze essas policies falha com permission denied
-- e derruba a query inteira (sintoma: pacientes "sumiram" para o nutri).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;