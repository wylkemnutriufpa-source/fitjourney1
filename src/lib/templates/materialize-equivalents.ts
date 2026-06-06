// Materializa substituições item-a-item em um PlannerTemplate usando o motor
// puro (recalcMaterializedEquivalents + tacoCatalog). Aplicado quando um
// template da Biblioteca do Sistema é aberto no editor, para que a rotação
// por subgrupo (carb-breakfast, protein-snack, etc.) e a coerência
// clínica passem a valer também nos 28 templates hardcoded.
//
// Determinístico, server-safe. Não muda estrutura — só popula
// `materializedEquivalents` em cada PlannerFoodItem coberto pelo catálogo.

import { recalcMaterializedEquivalents } from "@/components/meal-editor/recalc";
import { tacoCatalog } from "@/lib/substitutions/taco-catalog";
import type {
  PlannerFoodItem,
  PlannerMealOption,
  PlannerTemplate,
} from "@/lib/meal-planner";

function materializeItem(item: PlannerFoodItem): PlannerFoodItem {
  // Preserva o que já existe (smart-seeds vêm pré-materializados).
  if (item.materializedEquivalents) return item;
  const mat = recalcMaterializedEquivalents({
    base: item,
    criterion: "auto",
    size: 3,
    candidates: tacoCatalog,
  });
  return mat ? { ...item, materializedEquivalents: mat } : item;
}

function materializeOption(opt: PlannerMealOption): PlannerMealOption {
  return { ...opt, items: opt.items.map(materializeItem) };
}

export function materializeTemplateEquivalents(
  tpl: PlannerTemplate,
): PlannerTemplate {
  return {
    ...tpl,
    meals: tpl.meals.map((meal) => ({
      ...meal,
      main: materializeOption(meal.main),
      equivalents: meal.equivalents.map(materializeOption),
    })),
  };
}
