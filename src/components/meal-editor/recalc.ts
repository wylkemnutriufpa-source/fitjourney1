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

function equivalentQtyFromPlannerQty(base: PlannerFoodItem, anchor: EquivalentCandidate): number {
  const qty = Number(base.qty);
  if (!Number.isFinite(qty) || qty <= 0) return anchor.defaultQty;
  if ((base.unit === "g" || base.unit === "ml") && base.unit === anchor.unit) return qty;
  return qty * anchor.defaultQty;
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
  rotationOffset?: number;
}): MaterializedEquivalents | null {
  const { base, criterion, size, candidates, rotationOffset = 0 } = args;


  // 1) Resolve o item base no TACO (foodKey/nome + fuzzy interno em findCandidateIn).
  const anchor = findCandidateIn(candidates, {
    foodKey: base.foodKey,
    name: base.name,
    scaleGroup: base.scaleGroup,
  });
  // Sem cobertura no catálogo? Não criamos âncora promíscua "qualquer item do
  // mesmo scaleGroup" — isso gerava substituições absurdas. Retornamos null e
  // a UI mostra "sem opções" em vez de misturar grupos alimentares.
  if (!anchor) return null;
  if (anchor.scaleGroup !== base.scaleGroup) return null;

  const eqBase: EquivalentBase = {
    ...anchor,
    qty: equivalentQtyFromPlannerQty(base, anchor),
    originalUnit: base.unit,
  };
  const matchCriterion = resolveCriterion(criterion, anchor.scaleGroup);
  const options = calculateEquivalents(eqBase, candidates, size, matchCriterion, rotationOffset);
  if (options.length === 0) return null;

  const mapped: MaterializedEquivalentOption[] = options.map((o) => ({
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

  return {
    criterion,
    generatedAt: new Date().toISOString(),
    catalogVersion: TACO_CATALOG_VERSION,
    options: mapped,
  };
}
