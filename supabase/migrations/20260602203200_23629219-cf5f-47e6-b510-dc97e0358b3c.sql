CREATE TABLE public.landing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  source text NOT NULL DEFAULT 'landing_intro',
  notes text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landing_leads_created_at_idx ON public.landing_leads (created_at DESC);
CREATE INDEX landing_leads_email_idx ON public.landing_leads (lower(email));

GRANT INSERT ON public.landing_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.landing_leads TO authenticated;
GRANT ALL ON public.landing_leads TO service_role;

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert leads"
  ON public.landing_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(full_name)) BETWEEN 1 AND 200
    AND char_length(btrim(email)) BETWEEN 3 AND 255
    AND char_length(btrim(whatsapp)) BETWEEN 5 AND 40
  );

CREATE POLICY "admins read leads"
  ON public.landing_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update leads"
  ON public.landing_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete leads"
  ON public.landing_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));