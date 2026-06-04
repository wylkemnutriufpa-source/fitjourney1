// Ponte entre o motor puro de equivalentes TACO (src/lib/substitutions/equivalents.ts)
// e o modelo do planner usado pelo editor de templates (PlannerMealOption[]).
//
// Sprint 6 — Fatias A.2, A.4.3.

import {
  calculateEquivalents,
  defaultCriterionFor,
  type EquivalentBase,
  type EquivalentCandidate,
  type EquivalentOption,
  type MatchCriterion,
} from "./equivalents";
import { findCandidateIn, tacoCatalog } from "./taco-catalog";
import {
  createEmptyFoodItem,
  createEmptyMealOption,
  type PlannerFoodItem,
  type PlannerMealOption,
  type ScaleGroup,
} from "@/lib/meal-planner";

export type SubstitutionCount = 1 | 2 | 3 | 4;

/**
 * Constrói opções equivalentes para um item base do planner usando o catálogo TACO.
 * `candidates` permite injetar uma lista vinda do Cloud (A.4.3); por padrão
 * cai no seed embutido (`tacoCatalog`) para garantir funcionamento offline/SSR.
 * Retorna `null` quando o base não tem cobertura no catálogo escolhido.
 */
export function buildTacoEquivalents(
  baseFood: PlannerFoodItem,
  count: SubstitutionCount = 3,
  criterion?: MatchCriterion,
  candidates: readonly EquivalentCandidate[] = tacoCatalog,
): PlannerMealOption[] | null {
  let tacoBase = findCandidateIn(candidates, {
    foodKey: baseFood.foodKey,
    name: baseFood.name,
  });
  if (!tacoBase && baseFood.scaleGroup) {
    tacoBase = candidates.find((c) => c.scaleGroup === baseFood.scaleGroup) ?? null;
  }
  if (!tacoBase) return null;

  const base: EquivalentBase = {
    ...tacoBase,
    qty: equivalentQtyFromPlannerQty(baseFood, tacoBase),
    originalUnit: baseFood.unit,
  };
  const options = calculateEquivalents(
    base,
    candidates,
    count,
    criterion ?? defaultCriterionFor(tacoBase.scaleGroup),
  );
  return options.map((opt) => equivalentToPlannerOption(opt, candidates));
}

function equivalentQtyFromPlannerQty(baseFood: PlannerFoodItem, tacoBase: EquivalentCandidate): number {
  const qty = Number(baseFood.qty);
  if (!Number.isFinite(qty) || qty <= 0) return tacoBase.defaultQty;
  if (baseFood.unit === "g" || baseFood.unit === "ml") return qty;
  if (tacoBase.scaleGroup === "fruit" || tacoBase.foodKey === "ovo-galinha") {
    return qty * tacoBase.defaultQty;
  }
  return qty;
}

function equivalentToPlannerOption(
  opt: EquivalentOption,
  candidates: readonly EquivalentCandidate[],
): PlannerMealOption {
  return createEmptyMealOption({
    title: opt.name,
    imageKey: opt.foodKey,
    items: [
      createEmptyFoodItem({
        foodKey: opt.foodKey,
        name: opt.name,
        qty: opt.qty,
        unit: opt.unit,
        kcal: opt.kcal,
        scaleGroup: tacoScaleGroupToPlanner(opt, candidates),
      }),
    ],
  });
}

function tacoScaleGroupToPlanner(
  opt: EquivalentOption,
  candidates: readonly EquivalentCandidate[],
): ScaleGroup {
  const cand = findCandidateIn(candidates, { foodKey: opt.foodKey, name: opt.name });
  if (cand?.scaleGroup === "protein") return "protein";
  if (cand?.scaleGroup === "carb") return "carb";
  return (cand?.scaleGroup as ScaleGroup | undefined) ?? "mixed";
}
