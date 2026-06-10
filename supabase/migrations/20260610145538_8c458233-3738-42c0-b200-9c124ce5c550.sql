
-- Tabela de overrides globais para protocolos.
-- Edições do admin (dicas, chás, estratégias, pilares, regras) são aplicadas
-- por cima do catálogo hardcoded em TODOS os pacientes, inclusive ativos —
-- sem violar imutabilidade do snapshot clínico (refeições continuam vindas
-- do snapshot). Override = camada informativa.
CREATE TABLE public.protocol_overrides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id  text NOT NULL,
  module_id    text,                            -- NULL = override no protocolo todo (ex: golden tips)
  phase_id     int,                             -- NULL = override no módulo todo
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX protocol_overrides_scope_uniq
  ON public.protocol_overrides (
    protocol_id,
    COALESCE(module_id, ''),
    COALESCE(phase_id, -1)
  );

CREATE INDEX protocol_overrides_protocol_idx
  ON public.protocol_overrides (protocol_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocol_overrides TO authenticated;
GRANT ALL ON public.protocol_overrides TO service_role;

ALTER TABLE public.protocol_overrides ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado (pacientes precisam ver as mudanças do admin).
CREATE POLICY "protocol_overrides_read_all_authenticated"
  ON public.protocol_overrides
  FOR SELECT
  TO authenticated
  USING (true);

-- Escrita: apenas admin.
CREATE POLICY "protocol_overrides_admin_insert"
  ON public.protocol_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "protocol_overrides_admin_update"
  ON public.protocol_overrides
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "protocol_overrides_admin_delete"
  ON public.protocol_overrides
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER protocol_overrides_touch
  BEFORE UPDATE ON public.protocol_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
