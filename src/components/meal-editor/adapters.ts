// Templates Inteligentes — Fase 1.
// Adaptador: normaliza um item arbitrário do snapshot (EditItem do editor de plano,
// ou item legacy sem garantia de tipos) para o contrato `PlannerFoodItem` exigido
// pelos componentes/motor de equivalentes.
//
// Risco clínico evitado: sem esse adaptador, um `as unknown as PlannerFoodItem`
// passaria adiante itens com `scaleGroup` faltando/ inválido, fazendo o motor cair
// no default errado e sugerir substituições inadequadas.
//
// Determinístico. Sem React. Sem I/O.

import type { PlannerFoodItem, ScaleGroup } from "@/lib/meal-planner";

const VALID_SCALE_GROUPS: ReadonlySet<ScaleGroup> = new Set<ScaleGroup>([
  "carb",
  "protein",
  "fruit",
  "dairy",
  "fat",
  "vegetable",
  "beverage",
  "mixed",
]);

function normalizeScaleGroup(value: unknown): ScaleGroup {
  if (typeof value === "string" && VALID_SCALE_GROUPS.has(value as ScaleGroup)) {
    return value as ScaleGroup;
  }
  return "mixed";
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Converte um item arbitrário (EditItem ou similar) em PlannerFoodItem válido.
 * Preserva `materializedEquivalents` se já existir.
 * NÃO inventa dados — só preenche defaults seguros quando o campo está ausente.
 */
export function toPlannerFoodItem(raw: unknown): PlannerFoodItem {
  const o = (raw ?? {}) as Record<string, unknown>;
  const item: PlannerFoodItem = {
    id: stringOr(o.id, ""),
    foodKey: stringOr(o.foodKey, ""),
    name: stringOr(o.name, ""),
    qty: numberOr(o.qty, 0),
    unit: stringOr(o.unit, "g"),
    kcal: numberOr(o.kcal, 0),
    scaleGroup: normalizeScaleGroup(o.scaleGroup),
  };
  if (o.materializedEquivalents) {
    item.materializedEquivalents = o.materializedEquivalents as PlannerFoodItem["materializedEquivalents"];
  }
  return item;
}

export function toPlannerFoodItems(raw: readonly unknown[]): PlannerFoodItem[] {
  return raw.map(toPlannerFoodItem);
}
