// Conversão unidade ↔ gramas para o motor nutricional.
// Puro. Sem React. Sem I/O.
//
// Por quê:
// - O catálogo TACO/USDA está armazenado por 100 g.
// - Itens como ovo, banana, maçã, tangerina, mamão são prescritos em
//   "unid" no consultório. Sem fator de conversão, o motor de macros e
//   de equivalências ignorava esses itens (qty em "unid" não casava com
//   per-100g) — kcal travava em zero e o bloco de substituições não gerava.
//
// Este helper centraliza o `gramsPerUnit` (gpu) e a conversão bidirecional.
// Quando o `food_household_measures` do DB trouxer `grams_equivalent` para
// a medida default, esse valor tem prioridade. Para o catálogo TACO/USDA
// (sem JOIN cross-tabela hoje), há uma LUT canônica abaixo.

export type UnitFoodHint = {
  readonly foodKey?: string;
  readonly name?: string;
  readonly scaleGroup?: string;
};

const GPU_BY_KEY: Readonly<Record<string, number>> = {
  // Ovos
  "ovo-galinha": 50,
  "ovos-cozidos": 50,
  "omelete": 50,
  "ovo-cozido": 50,
  "ovo-mexido": 50,
  "ovo-frito": 50,
  "usda-egg-white": 33, // 1 clara ≈ 33 g
  "usda-egg-white-raw": 33,
  "clara-ovo": 33,
  // Frutas inteiras
  "banana": 90,
  "banana-prata": 90,
  "banana-com-aveia": 90,
  "maca": 130,
  "maca-fuji": 130,
  "pera": 130,
  "laranja": 180,
  "laranja-pera": 180,
  "tangerina": 80,
  "mexerica": 80,
  "mamao": 150,
  "mamao-papaia": 150,
  "kiwi": 75,
  "ameixa": 60,
  "pessego": 100,
  // Pães e similares
  "pao-frances": 50,
  "pao-integral": 25, // 1 fatia
  "torrada-integral": 12,
};

const NAME_PATTERNS: ReadonlyArray<{ re: RegExp; gpu: number }> = [
  { re: /clara\s+de\s+ovo/i, gpu: 33 },
  { re: /\bovo\b/i, gpu: 50 },
  { re: /banana/i, gpu: 90 },
  { re: /ma[cç][aã]/i, gpu: 130 },
  { re: /\bpera\b/i, gpu: 130 },
  { re: /tangerina|mexerica|bergamota/i, gpu: 80 },
  { re: /laranja/i, gpu: 180 },
  { re: /mam[aã]o/i, gpu: 150 },
  { re: /\bkiwi\b/i, gpu: 75 },
  { re: /ameixa/i, gpu: 60 },
  { re: /p[eê]ssego/i, gpu: 100 },
  { re: /p[aã]o\s+franc[eê]s/i, gpu: 50 },
  { re: /p[aã]o\s+integral|fatia/i, gpu: 25 },
  { re: /torrada/i, gpu: 12 },
];

export function inferGramsPerUnit(hint: UnitFoodHint): number | null {
  const key = hint.foodKey?.toLowerCase();
  if (key && GPU_BY_KEY[key]) return GPU_BY_KEY[key];
  const name = hint.name ?? "";
  for (const p of NAME_PATTERNS) {
    if (p.re.test(name)) return p.gpu;
  }
  return null;
}

/** Resolve gramsPerUnit dando prioridade ao valor explícito (do DB). */
export function resolveGramsPerUnit(
  explicit: number | null | undefined,
  hint: UnitFoodHint,
): number | null {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  return inferGramsPerUnit(hint);
}

/** Converte qty na unidade declarada para gramas (ou ml). g/ml passam direto. */
export function gramsFromQty(
  qty: number,
  unit: string,
  gpu: number | null | undefined,
): number | null {
  if (!Number.isFinite(qty) || qty <= 0) return null;
  if (unit === "g" || unit === "ml") return qty;
  if (unit === "unid" || unit === "fatia" || unit === "unidade") {
    if (gpu && gpu > 0) return qty * gpu;
    return null;
  }
  return null;
}

/**
 * Converte gramas para unidades, com arredondamento clínico:
 * - proteína (ovo): step 0,5 → não subdosar fonte proteica (ceil em meia unidade).
 * - fruta inteira: step 1 → fica mais natural ("1 banana", não "0,7 banana"). Floor.
 * - demais: nearest 0,5.
 */
export function unitFromGrams(
  grams: number,
  gpu: number,
  scaleGroup?: string,
): number {
  if (!Number.isFinite(grams) || grams <= 0 || !Number.isFinite(gpu) || gpu <= 0) {
    return 0;
  }
  const raw = grams / gpu;
  if (scaleGroup === "protein") {
    return Math.max(0.5, Math.ceil(raw * 2) / 2);
  }
  if (scaleGroup === "fruit") {
    return Math.max(1, Math.floor(raw));
  }
  return Math.max(0.5, Math.round(raw * 2) / 2);
}
