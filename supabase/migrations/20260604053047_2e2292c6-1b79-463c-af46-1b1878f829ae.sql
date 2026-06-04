
CREATE TABLE public.taco_foods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_key text NOT NULL UNIQUE,
  name text NOT NULL,
  scale_group text NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  default_qty numeric NOT NULL DEFAULT 100,
  kcal_per_100g numeric NOT NULL,
  protein_per_100g numeric NOT NULL DEFAULT 0,
  carb_per_100g numeric NOT NULL DEFAULT 0,
  fat_per_100g numeric NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.taco_foods TO authenticated;
GRANT ALL ON public.taco_foods TO service_role;

ALTER TABLE public.taco_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated reads active taco foods"
  ON public.taco_foods FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "admins manage taco foods"
  ON public.taco_foods FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER taco_foods_touch_updated_at
  BEFORE UPDATE ON public.taco_foods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.taco_foods (food_key, name, scale_group, unit, default_qty, kcal_per_100g, protein_per_100g, carb_per_100g, fat_per_100g, display_order) VALUES
  ('peito-frango', 'Peito de frango sem pele cru', 'protein', 'g', 100, 119, 21.5, 0, 3, 10),
  ('patinho-bovino', 'Patinho bovino sem gordura cru', 'protein', 'g', 100, 136, 21.9, 0, 4.9, 20),
  ('contrafile-bovino', 'Contrafilé bovino sem gordura cru', 'protein', 'g', 100, 150, 22, 0, 6, 30),
  ('lombo-suino', 'Lombo suíno cru', 'protein', 'g', 100, 145, 21.3, 0, 5.7, 40),
  ('merluza-file', 'Filé de merluza cru', 'protein', 'g', 100, 82, 17, 0, 0.7, 50),
  ('tilapia-file', 'Tilápia filé cru', 'protein', 'g', 100, 96, 20.1, 0, 1.7, 60),
  ('atum-fresco', 'Atum fresco cru', 'protein', 'g', 100, 128, 23, 0, 2.1, 70),
  ('ovo-galinha', 'Ovo de galinha inteiro cru', 'protein', 'g', 50, 143, 13, 1.6, 8.9, 80),
  ('arroz-branco', 'Arroz branco cozido', 'carb', 'g', 100, 130, 2.7, 28.1, 0.3, 110),
  ('macarrao-espaguete', 'Macarrão (espaguete) cozido', 'carb', 'g', 100, 158, 5, 30.5, 0.9, 120),
  ('pure-batata', 'Purê de batata cozido', 'carb', 'g', 100, 90, 2, 18, 1.5, 130),
  ('macaxeira', 'Macaxeira (mandioca) cozida', 'carb', 'g', 100, 160, 1.5, 38, 0.3, 140),
  ('batata-doce', 'Batata doce cozida', 'carb', 'g', 100, 77, 0.6, 18.4, 0.1, 150),
  ('inhame', 'Inhame cozido', 'carb', 'g', 100, 97, 2.1, 23.2, 0.2, 160),
  ('pao-frances', 'Pão francês', 'carb', 'g', 50, 300, 8, 58.6, 3.1, 170),
  ('tapioca', 'Tapioca (goma hidratada)', 'carb', 'g', 50, 240, 0.2, 59, 0, 180)
ON CONFLICT (food_key) DO NOTHING;
