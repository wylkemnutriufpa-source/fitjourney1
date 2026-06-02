ALTER TABLE public.nutritionists
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS public_bio text,
  ADD COLUMN IF NOT EXISTS public_headline text;

-- Unicidade do slug (case-insensitive via lower())
CREATE UNIQUE INDEX IF NOT EXISTS nutritionists_slug_unique_lower
  ON public.nutritionists (lower(slug))
  WHERE slug IS NOT NULL;

-- Formato: 3-40 chars, lowercase, dígitos e hífen
ALTER TABLE public.nutritionists
  DROP CONSTRAINT IF EXISTS nutritionists_slug_format;

ALTER TABLE public.nutritionists
  ADD CONSTRAINT nutritionists_slug_format
  CHECK (slug IS NULL OR slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$');

-- Limites de tamanho dos campos públicos
ALTER TABLE public.nutritionists
  DROP CONSTRAINT IF EXISTS nutritionists_public_bio_len;
ALTER TABLE public.nutritionists
  ADD CONSTRAINT nutritionists_public_bio_len
  CHECK (public_bio IS NULL OR char_length(public_bio) <= 2000);

ALTER TABLE public.nutritionists
  DROP CONSTRAINT IF EXISTS nutritionists_public_headline_len;
ALTER TABLE public.nutritionists
  ADD CONSTRAINT nutritionists_public_headline_len
  CHECK (public_headline IS NULL OR char_length(public_headline) <= 160);