// Templates Inteligentes — Fase 1.
// Materializa o bloco de equivalentes para um item base, consumindo o motor puro
// `calculateEquivalents` + o catálogo TACO (do Cloud, com fallback ao seed).
//
// Determinístico. Sem React. Sem I/O.

import {
  calculateEquivalents,
  defaultCriterionFor,
  type EquivalentBase,
  type EquivalentCandidate,
  type MatchCriterion,
} from "@/lib/substitutions/equivalents";
import { findCandidateIn } from "@/lib/substitutions/taco-catalog";
import type { PlannerFoodItem } from "@/lib/meal-planner";
import { inferGramsPerUnit, unitFromGrams } from "@/lib/foods/unit-bridge";

import {
  TACO_CATALOG_VERSION,
  type BlockCriterion,
  type EquivalentsBlockSize,
  type MaterializedEquivalentOption,
  type MaterializedEquivalents,
} from "./types";

export type MealKindForEquivalents =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "other";

function resolveCriterion(
  block: BlockCriterion,
  scaleGroup: string,
): MatchCriterion {
  if (block === "auto") return defaultCriterionFor(scaleGroup);
  return block;
}

function proteinContextOf(
  mealKind: MealKindForEquivalents | undefined,
): "meal" | "snack" | undefined {
  if (!mealKind) return undefined;
  if (mealKind === "lunch" || mealKind === "dinner") return "meal";
  if (mealKind === "breakfast" || mealKind === "snack") return "snack";
  return undefined;
}

function equivalentQtyFromPlannerQty(base: PlannerFoodItem, anchor: EquivalentCandidate): number {
  const qty = Number(base.qty);
  if (!Number.isFinite(qty) || qty <= 0) return anchor.defaultQty;
  if ((base.unit === "g" || base.unit === "ml") && base.unit === anchor.unit) return qty;
  // base em "unid" — converter para gramas usando gpu (do anchor ou inferido).
  if (base.unit === "unid") {
    const gpu = anchor.gramsPerUnit ?? inferGramsPerUnit({ foodKey: base.foodKey, name: base.name, scaleGroup: base.scaleGroup });
    if (gpu && gpu > 0) return qty * gpu;
  }
  return qty * anchor.defaultQty;
}

const EGG_FOOD_KEYS = new Set([
  "ovo-galinha",
  "omelete",
  "ovos-mexidos",
  "ovos-cozidos",
  "ovos-com-bacon",
]);

/**
 * Pós-processa uma opção para forçar unidades clínicas naturais:
 * - Ovo → unidade "unid" (1 ovo = 50g), nunca em gramas.
 */
function postProcessOption(o: MaterializedEquivalentOption): MaterializedEquivalentOption {
  if (EGG_FOOD_KEYS.has(o.foodKey) && o.unit !== "unid") {
    const grams = o.qty || 50;
    const units = Math.max(1, Math.round(grams / 50));
    const scale = (units * 50) / 100;
    return {
      ...o,
      qty: units,
      unit: "unid",
      kcal: Math.round(143 * scale),
      proteinG: Math.round(13 * scale * 10) / 10,
      carbG: Math.round(1.6 * scale * 10) / 10,
      fatG: Math.round(8.9 * scale * 10) / 10,
    };
  }
  return o;
}

/**
 * Calcula opções equivalentes para um item base e devolve a struct materializada
 * pronta para persistir no template/snapshot. Retorna `null` se o base não tem
 * cobertura no catálogo (não cria bloco vazio).
 *
 * Quando `keepLocked` é fornecido, as opções com `locked: true` são preservadas
 * e o motor gera apenas (size - locked.length) novas opções, excluindo da pool
 * os foodKeys já travados — garante variedade real ao clicar "Gerar outra opção".
 */
export function recalcMaterializedEquivalents(args: {
  base: PlannerFoodItem;
  criterion: BlockCriterion;
  size: EquivalentsBlockSize;
  candidates: readonly EquivalentCandidate[];
  rotationOffset?: number;
  mealKind?: MealKindForEquivalents;
  keepLocked?: readonly MaterializedEquivalentOption[];
}): MaterializedEquivalents | null {
  const { base, criterion, size, candidates, rotationOffset = 0, mealKind, keepLocked } = args;

  const anchor = findCandidateIn(candidates, {
    foodKey: base.foodKey,
    name: base.name,
    scaleGroup: base.scaleGroup,
  });
  if (!anchor) return null;
  if (anchor.scaleGroup !== base.scaleGroup) return null;

  const eqBase: EquivalentBase = {
    ...anchor,
    qty: equivalentQtyFromPlannerQty(base, anchor),
    originalUnit: base.unit,
  };
  const matchCriterion = resolveCriterion(criterion, anchor.scaleGroup);

  const locked = (keepLocked ?? []).filter((o) => o.locked);
  const excludeFoodKeys = new Set<string>(locked.map((o) => o.foodKey));
  const slotsToFill = Math.max(0, size - locked.length) as EquivalentsBlockSize;

  let generated: MaterializedEquivalentOption[] = [];
  if (slotsToFill > 0) {
    const options = calculateEquivalents(
      eqBase,
      candidates,
      slotsToFill,
      matchCriterion,
      rotationOffset,
      {
        proteinContext: proteinContextOf(mealKind),
        excludeFoodKeys,
      },
    );
    generated = options.map((o) => postProcessOption({
      foodKey: o.foodKey,
      name: o.name,
      scaleGroup: o.scaleGroup as MaterializedEquivalentOption["scaleGroup"],
      qty: o.qty,
      unit: o.unit,
      kcal: o.kcal,
      proteinG: o.proteinG,
      carbG: o.carbG,
      fatG: o.fatG,
      imageSlug: o.foodKey,
    }));
  }

  const merged: MaterializedEquivalentOption[] = [...locked, ...generated];
  if (merged.length === 0) return null;

  return {
    criterion,
    generatedAt: new Date().toISOString(),
    catalogVersion: TACO_CATALOG_VERSION,
    options: merged,
  };
}

// Reexport p/ uso externo
export { unitFromGrams };
