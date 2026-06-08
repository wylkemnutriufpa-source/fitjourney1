// Substituições inteligentes — fundação (Sprint 6, Fatia A.1).
//
// Pura. Sem I/O. Sem React. Recebe candidatos do catálogo TACO já carregados.
//
// Fórmula oficial (definida no spec do Sprint 6):
//
//   qty_eq = ROUND(
//     (qty_base * nutriente_base_por_100g / 100)
//     / (nutriente_subs_por_100g / 100)
//     / step
//   ) * step
//
// Onde:
//   - "nutriente" depende do critério: protein | carb | energy
//   - step é o múltiplo de arredondamento (5g por padrão; 1 para unidades não-g)
//
// Critério-padrão é inferido a partir do `scaleGroup` do alimento base:
//   protein → PROTEIN
//   carb    → CARB
//   demais  → ENERGY (kcal)
//
// O profissional pode sobrepor o critério por bloco (parâmetro `criterion`).

import { cleanFoodDisplayName } from "@/lib/foods/display-name";
import { inferGramsPerUnit, unitFromGrams } from "@/lib/foods/unit-bridge";

export type MatchCriterion = "protein" | "carb" | "fat" | "energy";

export type EquivalentCandidate = {
  foodKey: string;
  name: string;
  scaleGroup: string;
  subGroup?: string;
  unit: string;
  defaultQty: number;
  /**
   * Gramas por 1 unidade (ex.: ovo=50, banana=90, maçã=130). Quando presente,
   * o engine pode prescrever este candidato em "unid" — fundamental p/ ovos e
   * frutas inteiras que são contadas em unidades.
   */
  gramsPerUnit?: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
};

export type EquivalentBase = EquivalentCandidate & {
  qty: number;
  originalUnit?: string;
};

export type EquivalentOption = {
  foodKey: string;
  name: string;
  scaleGroup: string;
  qty: number;
  unit: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  /** Critério que produziu este cálculo (para auditoria/UI). */
  criterion: MatchCriterion;
};

/** Critério-padrão derivado do scaleGroup do alimento base. */
export function defaultCriterionFor(scaleGroup: string): MatchCriterion {
  if (scaleGroup === "protein") return "protein";
  if (scaleGroup === "carb") return "carb";
  if (scaleGroup === "fat") return "fat";
  if (scaleGroup === "fruit") return "energy";
  return "energy";
}

function nutrientPer100g(c: EquivalentCandidate, criterion: MatchCriterion): number {
  if (criterion === "protein") return c.proteinPer100g;
  if (criterion === "carb") return c.carbPer100g;
  if (criterion === "fat") return c.fatPer100g;
  return c.kcalPer100g;
}

/**
 * Calcula a quantidade equivalente de UM candidato dado o alimento base.
 * Retorna `null` se o candidato não tem o nutriente alvo (divisão por ~0)
 * ou se a unidade base não é massa/volume (não há como reescalar com fórmula linear).
 */
export function calculateEquivalentQty(
  base: EquivalentBase,
  candidate: EquivalentCandidate,
  criterion: MatchCriterion = defaultCriterionFor(base.scaleGroup),
  opts: { step?: number; minQty?: number } = {},
): EquivalentOption | null {
  const step = opts.step ?? 5;
  const minQty = opts.minQty ?? step;

  const baseNutrientPer100 = nutrientPer100g(base, criterion);
  const candNutrientPer100 = nutrientPer100g(candidate, criterion);

  if (!Number.isFinite(baseNutrientPer100) || baseNutrientPer100 <= 0) return null;
  if (!Number.isFinite(candNutrientPer100) || candNutrientPer100 <= 0) return null;

  // Normaliza base para gramas/ml — itens prescritos em "unid" usam gramsPerUnit
  // (do DB ou inferido) para entrar na fórmula linear.
  const baseGpu = base.gramsPerUnit ?? inferGramsPerUnit(base);
  const baseGrams =
    base.unit === "g" || base.unit === "ml"
      ? base.qty
      : baseGpu && baseGpu > 0
        ? base.qty * baseGpu
        : null;
  if (!baseGrams || baseGrams <= 0) return null;

  // Quantidade absoluta do nutriente alvo no base (em g do nutriente ou kcal).
  const baseAbsolute = (baseGrams * baseNutrientPer100) / 100;
  // Gramas do candidato que fornecem o mesmo absoluto.
  const candGrams = (baseAbsolute * 100) / candNutrientPer100;

  // Decide se o output sai em "unid" (somente quando o nutri prescreveu o base
  // em unidade E o candidato tem gpu conhecido — mantém naturalidade clínica).
  const candGpu = candidate.gramsPerUnit ?? inferGramsPerUnit(candidate);
  const outputInUnits =
    (base.originalUnit === "unid" || base.unit === "unid") &&
    candGpu !== null &&
    candGpu > 0;

  let outQty: number;
  let outUnit: string;
  let outGrams: number;
  if (outputInUnits && candGpu) {
    outQty = unitFromGrams(candGrams, candGpu, candidate.scaleGroup);
    outUnit = "unid";
    outGrams = outQty * candGpu;
  } else {
    // Output em massa/volume com arredondamento clínico por grupo.
    const roundFn =
      candidate.scaleGroup === "protein"
        ? Math.ceil
        : candidate.scaleGroup === "carb" || candidate.scaleGroup === "fruit"
          ? Math.floor
          : Math.round;
    outQty = Math.max(minQty, roundFn(candGrams / step) * step);
    outUnit = candidate.unit === "ml" ? "ml" : "g";
    outGrams = outQty;
  }

  const factor = outGrams / 100;
  return {
    foodKey: candidate.foodKey,
    name: cleanFoodDisplayName(candidate.name),
    scaleGroup: candidate.scaleGroup,
    qty: outQty,
    unit: outUnit,
    kcal: Math.round(candidate.kcalPer100g * factor),
    proteinG: Math.round(candidate.proteinPer100g * factor * 10) / 10,
    carbG: Math.round(candidate.carbPer100g * factor * 10) / 10,
    fatG: Math.round(candidate.fatPer100g * factor * 10) / 10,
    criterion,
  };
}

/**
 * Seleciona N candidatos do mesmo `scaleGroup` do base (exceto o próprio) e
 * calcula as quantidades equivalentes. Ordena por proximidade de massa final
 * (mais perto da quantidade do base = mais "natural" como substituição).
 */
/**
 * Grupos clinicamente válidos para substituição. `mixed`, `dairy`, `vegetable`,
 * `beverage` e demais ficam de fora — preferimos NÃO sugerir nada a misturar
 * grupos alimentares (ex.: trocar carboidrato por proteína).
 */
const ALLOWED_SCALE_GROUPS = new Set(["protein", "carb", "fat", "fruit"]);

export function calculateEquivalents(
  base: EquivalentBase,
  candidates: readonly EquivalentCandidate[],
  count: number,
  criterion: MatchCriterion = defaultCriterionFor(base.scaleGroup),
  rotationOffset = 0,
): EquivalentOption[] {
  // Trava clínica: scaleGroup do base precisa ser conhecido E permitido.
  if (!base.scaleGroup || !ALLOWED_SCALE_GROUPS.has(base.scaleGroup)) {
    return [];
  }
  const n = Math.max(1, Math.min(4, Math.floor(count)));
  const pool = candidates.filter((c) => {
    if (c.foodKey === base.foodKey) return false;
    if (c.scaleGroup !== base.scaleGroup) return false;
    if (base.subGroup) return c.subGroup === base.subGroup;
    return true;
  });
  const computed = pool
    .map((c) => calculateEquivalentQty(base, c, criterion))
    .filter((x): x is EquivalentOption => x !== null);

  // Ordena por proximidade de massa relativa ao base.
  computed.sort(
    (a, b) => Math.abs(a.qty - base.qty) - Math.abs(b.qty - base.qty),
  );

  // Rotação: ao clicar "Gerar outra opção", o cursor avança e devolvemos uma
  // janela diferente da pool ordenada. Mantém variedade sem perder a "naturalidade"
  // (todas as opções continuam ordenadas por proximidade dentro da janela).
  if (computed.length === 0) return [];
  const offset = ((rotationOffset % computed.length) + computed.length) % computed.length;
  const rotated = offset === 0 ? computed : [...computed.slice(offset), ...computed.slice(0, offset)];
  return rotated.slice(0, n);
}
