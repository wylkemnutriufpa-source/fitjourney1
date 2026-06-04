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
  if (base.unit === "g" || base.unit === "ml") return qty;
  if (anchor.scaleGroup === "fruit" || anchor.foodKey === "ovo-galinha") {
    return qty * anchor.defaultQty;
  }
  return qty;
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

  // 1) Tenta resolver o item base diretamente no TACO (por foodKey ou nome).
  let anchor = findCandidateIn(candidates, {
    foodKey: base.foodKey,
    name: base.name,
  });

  // 2) DÍVIDA TÉCNICA (Sprint 6 — fallback): catálogo `public.foods` (usado pelo
  // FoodPicker) e `taco_foods` não compartilham foodKeys/nomes. Quando não há
  // match direto, usamos um "representante" do mesmo scaleGroup como âncora
  // nutricional. Substituir por matching real (alias table ou unificação dos
  // catálogos) em frente futura.
  if (!anchor && base.scaleGroup) {
    anchor = candidates.find((c) => c.scaleGroup === base.scaleGroup) ?? null;
  }

  if (!anchor) return null;

  const eqBase: EquivalentBase = {
    ...anchor,
    qty: equivalentQtyFromPlannerQty(base, anchor),
    originalUnit: base.unit,
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
