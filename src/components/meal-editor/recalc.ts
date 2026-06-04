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

import {
  TACO_CATALOG_VERSION,
  type BlockCriterion,
  type EquivalentsBlockSize,
  type MaterializedEquivalentOption,
  type MaterializedEquivalents,
} from "./types";

function resolveCriterion(
  block: BlockCriterion,
  scaleGroup: string,
): MatchCriterion {
  if (block === "auto") return defaultCriterionFor(scaleGroup);
  return block;
}

/**
 * Calcula opções equivalentes para um item base e devolve a struct materializada
 * pronta para persistir no template/snapshot. Retorna `null` se o base não tem
 * cobertura no catálogo (não cria bloco vazio).
 */
export function recalcMaterializedEquivalents(args: {
  base: PlannerFoodItem;
  criterion: BlockCriterion;
  size: EquivalentsBlockSize;
  candidates: readonly EquivalentCandidate[];
}): MaterializedEquivalents | null {
  const { base, criterion, size, candidates } = args;
  const cand = findCandidateIn(candidates, {
    foodKey: base.foodKey,
    name: base.name,
  });
  if (!cand) return null;

  const eqBase: EquivalentBase = {
    ...cand,
    qty: base.qty || cand.defaultQty,
  };
  const matchCriterion = resolveCriterion(criterion, base.scaleGroup);
  const options = calculateEquivalents(eqBase, candidates, size, matchCriterion);
  if (options.length === 0) return null;

  const mapped: MaterializedEquivalentOption[] = options.map((o) => ({
    foodKey: o.foodKey,
    name: o.name,
    qty: o.qty,
    unit: o.unit,
    kcal: o.kcal,
    imageSlug: o.foodKey,
  }));

  return {
    criterion,
    generatedAt: new Date().toISOString(),
    catalogVersion: TACO_CATALOG_VERSION,
    options: mapped,
  };
}
