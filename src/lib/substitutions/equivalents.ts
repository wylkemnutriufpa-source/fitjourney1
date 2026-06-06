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

export type MatchCriterion = "protein" | "carb" | "fat" | "energy";

export type EquivalentCandidate = {
  /** Identidade estável do alimento no catálogo (foods.food_key ou foods.id). */
  foodKey: string;
  /** Nome exibido. */
  name: string;
  /** Grupo de escala — usado para filtrar candidatos compatíveis. */
  scaleGroup: string;
  /** Unidade padrão (geralmente "g" ou "ml"; pode ser "unid"). */
  unit: string;
  /** Quantidade padrão sugerida no catálogo (referência, não usada no cálculo). */
  defaultQty: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
};

export type EquivalentBase = EquivalentCandidate & {
  /** Quantidade efetiva no plano (na `unit` do alimento). */
  qty: number;
  /** Unidade efetiva no plano antes da normalização para cálculo. */
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
  const isMassOrVol = base.unit === "g" || base.unit === "ml";
  // Para unidades discretas ("unid"), arredondar para 1; para g/ml, para `step` (5g por padrão).
  const step = opts.step ?? (isMassOrVol ? 5 : 1);
  const minQty = opts.minQty ?? step;

  const baseNutrientPer100 = nutrientPer100g(base, criterion);
  const candNutrientPer100 = nutrientPer100g(candidate, criterion);

  if (!Number.isFinite(baseNutrientPer100) || baseNutrientPer100 <= 0) return null;
  if (!Number.isFinite(candNutrientPer100) || candNutrientPer100 <= 0) return null;

  // Quantidade absoluta do nutriente no base (em g do nutriente, ou em kcal).
  const baseAbsolute = (base.qty * baseNutrientPer100) / 100;
  // Quantidade do candidato (na unidade do candidato) que fornece o mesmo absoluto.
  const rawQty = (baseAbsolute * 100) / candNutrientPer100;
  const candStep = candidate.unit === "g" || candidate.unit === "ml" ? step : 1;
  const rounded = Math.max(minQty, Math.round(rawQty / candStep) * candStep);

  const factor = rounded / 100;
  return {
    foodKey: candidate.foodKey,
    name: candidate.name,
    scaleGroup: candidate.scaleGroup,
    qty: rounded,
    unit: candidate.unit,
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
): EquivalentOption[] {
  // Trava clínica: scaleGroup do base precisa ser conhecido E permitido.
  // Sem isso, qualquer fallback "mesmo grupo" produz substituições absurdas.
  if (!base.scaleGroup || !ALLOWED_SCALE_GROUPS.has(base.scaleGroup)) {
    return [];
  }
  const n = Math.max(1, Math.min(4, Math.floor(count)));
  const pool = candidates.filter(
    (c) => c.scaleGroup === base.scaleGroup && c.foodKey !== base.foodKey,
  );
  const computed = pool
    .map((c) => calculateEquivalentQty(base, c, criterion))
    .filter((x): x is EquivalentOption => x !== null);

  // Ordena por proximidade de massa relativa ao base — empurra opções "razoáveis"
  // para o topo (evita sugerir 400g de algo quando o base é 100g).
  computed.sort(
    (a, b) => Math.abs(a.qty - base.qty) - Math.abs(b.qty - base.qty),
  );
  return computed.slice(0, n);
}
