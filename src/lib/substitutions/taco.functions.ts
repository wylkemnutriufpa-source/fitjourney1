// Server fn que lê o catálogo TACO do Cloud.
// Sprint 6 A.4.3. Fallback no cliente: caso falhe, o editor usa o seed
// embutido em `src/lib/substitutions/taco-catalog.ts`.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanFoodDisplayName } from "@/lib/foods/display-name";
import type { EquivalentCandidate } from "./equivalents";

export const listTacoFoods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EquivalentCandidate[]> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("taco_foods")
      .select(
        "food_key, name, scale_group, unit, default_qty, kcal_per_100g, protein_per_100g, carb_per_100g, fat_per_100g",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`taco_foods read failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      foodKey: row.food_key,
      name: cleanFoodDisplayName(row.name),
      scaleGroup: row.scale_group,
      unit: row.unit,
      defaultQty: Number(row.default_qty),
      kcalPer100g: Number(row.kcal_per_100g),
      proteinPer100g: Number(row.protein_per_100g),
      carbPer100g: Number(row.carb_per_100g),
      fatPer100g: Number(row.fat_per_100g),
    }));
  });
