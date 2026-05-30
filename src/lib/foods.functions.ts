// Server fn que expõe o catálogo de alimentos (tabela `foods`) ao frontend.
// Mantém o formato CatalogFood compatível com o picker existente, e anexa
// as medidas caseiras de cada alimento.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HouseholdMeasureDTO = {
  id: string;
  measureName: string;
  gramsEquivalent: number;
  isDefault: boolean;
  displayOrder: number;
};

export type FoodDTO = {
  id: string;
  foodKey: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  kcal: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  scaleGroup: string;
  protocols: {
    glutenFree: boolean;
    lactoseFree: boolean;
    fodmapSafe: boolean;
    gastriteSafe: boolean;
    vegetarian: boolean;
    vegan: boolean;
  };
  householdMeasures: HouseholdMeasureDTO[];
};

export const listFoods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FoodDTO[]> => {
    const { supabase } = context;

    const [{ data: foods, error: foodsErr }, { data: measures, error: mErr }] =
      await Promise.all([
        supabase
          .from("foods")
          .select(
            "id,name,category,food_key,default_qty,default_unit,kcal_per_100g,protein_g,carb_g,fat_g,fiber_g,scale_group,is_gluten_free,is_lactose_free,is_fodmap_safe,is_gastrite_safe,is_vegetarian,is_vegan",
          )
          .order("name", { ascending: true })
          .limit(1000),
        supabase
          .from("food_household_measures")
          .select("id,food_id,measure_name,grams_equivalent,is_default,display_order")
          .order("display_order", { ascending: true })
          .limit(2000),
      ]);

    if (foodsErr) throw new Error(foodsErr.message);
    if (mErr) throw new Error(mErr.message);

    const measuresByFood = new Map<string, HouseholdMeasureDTO[]>();
    for (const m of measures ?? []) {
      const list = measuresByFood.get(m.food_id) ?? [];
      list.push({
        id: m.id,
        measureName: m.measure_name,
        gramsEquivalent: Number(m.grams_equivalent),
        isDefault: m.is_default,
        displayOrder: m.display_order,
      });
      measuresByFood.set(m.food_id, list);
    }

    return (foods ?? []).map((f) => {
      const kcalPer100g = Number(f.kcal_per_100g);
      const defaultQty = Number(f.default_qty);
      // kcal exibido = proporcional à quantidade padrão, quando a unidade é "g" ou "ml"
      const kcal =
        f.default_unit === "g" || f.default_unit === "ml"
          ? Math.round((kcalPer100g * defaultQty) / 100)
          : Math.round(kcalPer100g);
      return {
        id: f.id,
        foodKey: f.food_key ?? "frango-grelhado",
        name: f.name,
        category: f.category,
        qty: defaultQty,
        unit: f.default_unit,
        kcal,
        kcalPer100g,
        proteinPer100g: Number(f.protein_g),
        carbPer100g: Number(f.carb_g),
        fatPer100g: Number(f.fat_g),
        fiberPer100g: Number(f.fiber_g),
        scaleGroup: f.scale_group,
        protocols: {
          glutenFree: f.is_gluten_free,
          lactoseFree: f.is_lactose_free,
          fodmapSafe: f.is_fodmap_safe,
          gastriteSafe: f.is_gastrite_safe,
          vegetarian: f.is_vegetarian,
          vegan: f.is_vegan,
        },
        householdMeasures: measuresByFood.get(f.id) ?? [],
      };
    });
  });
