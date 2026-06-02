-- 1) Tabela landing_content (documento singleton)
CREATE TABLE public.landing_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton boolean NOT NULL DEFAULT true,
  schema_version integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT landing_content_singleton_unique UNIQUE (singleton)
);

GRANT SELECT ON public.landing_content TO anon;
GRANT SELECT ON public.landing_content TO authenticated;
GRANT ALL ON public.landing_content TO service_role;

ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads landing content"
  ON public.landing_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admins write landing content"
  ON public.landing_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_landing_content_touch
  BEFORE UPDATE ON public.landing_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed singleton vazio (será preenchido na primeira leitura via server fn)
INSERT INTO public.landing_content (singleton, content)
VALUES (true, '{}'::jsonb)
ON CONFLICT (singleton) DO NOTHING;

-- 2) Bucket de mídia público para a landing
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage no bucket landing-assets
CREATE POLICY "landing-assets public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'landing-assets');

CREATE POLICY "landing-assets admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'landing-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "landing-assets admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'landing-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "landing-assets admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'landing-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );