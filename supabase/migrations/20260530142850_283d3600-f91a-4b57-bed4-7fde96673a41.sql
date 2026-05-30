
-- ============================================================
-- Fase 1: Catálogo de alimentos real (TACO/IBGE) + medidas caseiras
-- ============================================================

-- Enum de fonte do dado nutricional
DO $$ BEGIN
  CREATE TYPE public.food_source AS ENUM ('taco', 'ibge', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum de scale_group (mantém compatibilidade com meal-planner)
DO $$ BEGIN
  CREATE TYPE public.food_scale_group AS ENUM (
    'protein', 'carb', 'fat', 'fruit', 'vegetable', 'dairy', 'beverage', 'mixed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela principal de alimentos
CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  source public.food_source NOT NULL DEFAULT 'taco',
  source_ref text, -- ex: "TACO 4ª ed. 2011, código 0123"

  -- Valores nutricionais por 100g (padrão TACO)
  kcal_per_100g numeric(8,2) NOT NULL CHECK (kcal_per_100g >= 0),
  protein_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carb_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (carb_g >= 0),
  fat_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  fiber_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (fiber_g >= 0),

  scale_group public.food_scale_group NOT NULL,

  -- Quantidade padrão exibida no picker
  default_qty numeric(8,2) NOT NULL DEFAULT 100,
  default_unit text NOT NULL DEFAULT 'g',

  -- Tags de protocolo / restrição
  is_gluten_free boolean NOT NULL DEFAULT true,
  is_lactose_free boolean NOT NULL DEFAULT true,
  is_fodmap_safe boolean NOT NULL DEFAULT true,
  is_gastrite_safe boolean NOT NULL DEFAULT true,
  is_vegetarian boolean NOT NULL DEFAULT true,
  is_vegan boolean NOT NULL DEFAULT true,

  -- Tags livres (alergias específicas, etc.)
  tags text[] NOT NULL DEFAULT '{}',

  -- Imagem opcional (foodKey usado no app hoje)
  food_key text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT foods_name_unique UNIQUE (name)
);

CREATE INDEX foods_category_idx ON public.foods (category);
CREATE INDEX foods_scale_group_idx ON public.foods (scale_group);
CREATE INDEX foods_tags_idx ON public.foods USING gin (tags);
CREATE INDEX foods_protocol_idx ON public.foods (is_gluten_free, is_lactose_free, is_fodmap_safe, is_gastrite_safe);

-- Tabela de medidas caseiras
CREATE TABLE public.food_household_measures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  measure_name text NOT NULL, -- "colher de sopa cheia", "filé médio", "fatia", "unidade", "xícara"
  grams_equivalent numeric(8,2) NOT NULL CHECK (grams_equivalent > 0),
  is_default boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT food_household_measures_unique UNIQUE (food_id, measure_name)
);

CREATE INDEX food_household_measures_food_idx ON public.food_household_measures (food_id);
CREATE UNIQUE INDEX food_household_measures_one_default
  ON public.food_household_measures (food_id) WHERE is_default = true;

-- GRANTs (catálogo é leitura compartilhada para todo nutri autenticado)
GRANT SELECT ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;
GRANT SELECT ON public.food_household_measures TO authenticated;
GRANT ALL ON public.food_household_measures TO service_role;

-- RLS
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_household_measures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated reads all foods"
  ON public.foods FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated reads all household measures"
  ON public.food_household_measures FOR SELECT TO authenticated USING (true);

-- (Sem políticas de INSERT/UPDATE/DELETE para authenticated — somente service_role escreve via supabaseAdmin)

-- Trigger updated_at
CREATE TRIGGER foods_touch_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
