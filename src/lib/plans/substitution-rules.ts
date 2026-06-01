// Regras curadas de substituição por contexto de refeição.
// Listas fechadas (3-4 opções) para evitar trocas incoerentes
// (ex.: arroz por pão no almoço, carne por feijão, etc.).
//
// As quantidades sugeridas SÃO ESCALADAS proporcionalmente à energia
// (kcal) do alimento principal da refeição, para preservar o equilíbrio
// do plano. Cada opção declara uma porção de referência (qty + refKcal)
// e o renderizador calcula:
//   factor = targetKcal / refKcal
//   qtyFinal = round(qty * factor)  (com arredondamento por tipo de unidade)
//
// Read-only: usada apenas pelo Patient App para sugerir opções.
// Não altera o snapshot publicado.

export type MealKind = "breakfast" | "lunch" | "snack" | "dinner" | "other";

export type SubOption = {
  name: string;      // rótulo exibido
  qty: number;       // quantidade JÁ ESCALADA para o alimento principal
  unit: string;      // unidade (g, ml, unid, fatia, colher de sopa, ...)
  note?: string;     // observação curta
  kcal?: number;     // kcal estimadas da porção sugerida (após escala)
};

type RawOption = {
  name: string;
  qty: number;       // quantidade de referência
  unit: string;
  refKcal: number;   // kcal da porção de referência
  note?: string;
};

type RuleBucket = {
  match: RegExp;
  options: RawOption[];
};

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function detectMealKind(label: string | null | undefined, time?: string | null): MealKind {
  const n = norm(label ?? "");
  if (/cafe da manha|desjejum|breakfast/.test(n)) return "breakfast";
  if (/almoco|lunch/.test(n)) return "lunch";
  if (/jantar|ceia|dinner/.test(n)) return "dinner";
  if (/lanche|snack/.test(n)) return "snack";
  if (time) {
    const h = parseInt(time.slice(0, 2), 10);
    if (!Number.isNaN(h)) {
      if (h < 10) return "breakfast";
      if (h >= 11 && h <= 14) return "lunch";
      if (h >= 18) return "dinner";
      return "snack";
    }
  }
  return "other";
}

// Arredondamento por tipo de unidade. Mantém valores legíveis e
// proporcionais (sem casas decimais quebradas tipo "1.37 unid").
function roundQty(unit: string, qty: number): number {
  const u = unit.toLowerCase();
  if (qty <= 0) return 0;
  // gramas / ml: arredondar para múltiplo de 5 (mínimo 5)
  if (/^(g|ml)$/.test(u) || /grama|mililitro/.test(u)) {
    return Math.max(5, Math.round(qty / 5) * 5);
  }
  // colher / concha / scoop / xícara: meias unidades, mínimo 0.5
  if (/colher|concha|scoop|xicara|xícara/.test(u)) {
    return Math.max(0.5, Math.round(qty * 2) / 2);
  }
  // unidades inteiras (ovo, pão, banana, fatia, pote, lata, copo, pedaço, prato, porção)
  if (/unid|fatia|pote|lata|copo|pedaco|pedaço|prato|porcao|porção/.test(u)) {
    return Math.max(1, Math.round(qty));
  }
  // fallback: 1 casa decimal
  return Math.max(0.1, Math.round(qty * 10) / 10);
}

// Formata número para exibição (remove ".0" desnecessário).
function fmt(n: number): number {
  return Number.isInteger(n) ? n : Math.round(n * 10) / 10;
}

// ------- Regras por refeição -------

const BREAKFAST: RuleBucket[] = [
  // Carbo do café
  {
    match: /\b(pao|tapioca|goma|cuscuz|rap10|wrap|torrada)\b/,
    options: [
      { name: "Pão francês",              qty: 1, unit: "unid",             refKcal: 140, note: "≈ 50 g" },
      { name: "Pão de forma integral",    qty: 2, unit: "fatias",           refKcal: 130, note: "≈ 50 g" },
      { name: "Tapioca (goma)",           qty: 3, unit: "colheres de sopa", refKcal: 110, note: "≈ 45 g" },
      { name: "Cuscuz de milho",          qty: 4, unit: "colheres de sopa", refKcal: 130, note: "≈ 120 g cozido" },
    ],
  },
  // Proteína do café
  {
    match: /\b(ovo|omelete|mexido|queijo|frango desfiado|carne moida)\b/,
    options: [
      { name: "Ovo cozido / mexido",      qty: 2, unit: "unid",             refKcal: 140 },
      { name: "Queijo branco",            qty: 1, unit: "fatia",            refKcal: 70,  note: "≈ 30 g" },
      { name: "Frango desfiado",          qty: 2, unit: "colheres de sopa", refKcal: 95,  note: "≈ 60 g" },
      { name: "Carne moída magra",        qty: 2, unit: "colheres de sopa", refKcal: 100, note: "≈ 60 g" },
    ],
  },
  // Lácteo
  {
    match: /\b(leite|iogurte|whey|requeijao)\b/,
    options: [
      { name: "Leite desnatado",          qty: 200, unit: "ml",             refKcal: 70,  note: "1 copo" },
      { name: "Iogurte natural",          qty: 170, unit: "g",              refKcal: 100, note: "1 pote" },
      { name: "Queijo branco / minas",    qty: 30,  unit: "g",              refKcal: 70,  note: "1 fatia" },
      { name: "Requeijão light",          qty: 1,   unit: "colher de sopa", refKcal: 40,  note: "≈ 20 g" },
    ],
  },
  // Café/chá (não escala — bebida sem energia)
  {
    match: /\b(cafe|cha)\b/,
    options: [
      { name: "Café sem açúcar",                          qty: 200, unit: "ml", refKcal: 0 },
      { name: "Chá (camomila, hortelã, erva-doce)",       qty: 200, unit: "ml", refKcal: 0 },
    ],
  },
];

const LUNCH: RuleBucket[] = [
  // Arroz e similares (NUNCA pão/tapioca)
  {
    match: /\barroz\b/,
    options: [
      { name: "Arroz branco cozido",      qty: 4, unit: "colheres de sopa", refKcal: 130, note: "≈ 100 g" },
      { name: "Arroz integral cozido",    qty: 4, unit: "colheres de sopa", refKcal: 120, note: "≈ 100 g" },
      { name: "Macarrão cozido",          qty: 4, unit: "colheres de sopa", refKcal: 160, note: "≈ 120 g" },
      { name: "Purê de batata / inhame",  qty: 3, unit: "colheres de sopa", refKcal: 110, note: "≈ 120 g" },
    ],
  },
  {
    match: /\b(batata|inhame|mandioca|macaxeira|aipim|pupunha|macarrao|purê|pure)\b/,
    options: [
      { name: "Batata inglesa cozida",    qty: 1, unit: "unid média",      refKcal: 85,  note: "≈ 100 g" },
      { name: "Batata doce cozida",       qty: 1, unit: "unid média",      refKcal: 85,  note: "≈ 100 g" },
      { name: "Inhame / mandioca cozidos",qty: 1, unit: "pedaço médio",    refKcal: 110, note: "≈ 100 g" },
      { name: "Macarrão cozido",          qty: 4, unit: "colheres de sopa", refKcal: 160, note: "≈ 120 g" },
    ],
  },
  // Leguminosa (não mistura com proteína animal)
  {
    match: /\b(feijao|lentilha|grao de bico|ervilha)\b/,
    options: [
      { name: "Feijão carioca / preto",   qty: 1, unit: "concha média", refKcal: 60,  note: "≈ 80 g" },
      { name: "Lentilha cozida",          qty: 1, unit: "concha média", refKcal: 95,  note: "≈ 80 g" },
      { name: "Grão-de-bico cozido",      qty: 1, unit: "concha média", refKcal: 130, note: "≈ 80 g" },
      { name: "Ervilha cozida",           qty: 1, unit: "concha média", refKcal: 65,  note: "≈ 80 g" },
    ],
  },
  // Proteína animal (sem feijão)
  {
    match: /\b(frango|carne|peixe|tilapia|patinho|alcatra|coxao|bife|file|peito|lombo|picanha|atum|salmao|ovo|omelete)\b/,
    options: [
      { name: "Frango grelhado",                  qty: 120, unit: "g", refKcal: 200, note: "1 filé" },
      { name: "Carne magra (patinho/alcatra)",    qty: 120, unit: "g", refKcal: 220, note: "1 bife" },
      { name: "Peixe grelhado (tilápia/merluza)", qty: 150, unit: "g", refKcal: 200, note: "1 filé" },
      { name: "Ovos cozidos / mexidos",           qty: 3,   unit: "unid", refKcal: 210 },
    ],
  },
  // Saladas (baixa densidade)
  {
    match: /\b(salada|folhas|alface|rucula|verduras|legume|legumes|brocolis|cenoura|abobrinha|couve|repolho|beterraba)\b/,
    options: [
      { name: "Salada de alface, tomate e pepino",       qty: 1, unit: "prato de sobremesa", refKcal: 30 },
      { name: "Couve refogada com cenoura e beterraba",  qty: 1, unit: "porção",             refKcal: 80,  note: "≈ 100 g" },
      { name: "Repolho refogado com couve",              qty: 1, unit: "porção",             refKcal: 60,  note: "≈ 100 g" },
      { name: "Legumes cozidos (brócolis, abobrinha)",   qty: 1, unit: "porção",             refKcal: 60,  note: "≈ 100 g" },
    ],
  },
];

const SNACK_OR_FRUIT: RuleBucket[] = [
  {
    match: /\b(fruta|maca|banana|mamao|manga|pera|laranja|melao|melancia|abacaxi|morango|uva|goiaba|kiwi|tangerina|ameixa)\b/,
    options: [
      { name: "Maçã ou pera",                     qty: 1, unit: "unid média", refKcal: 70 },
      { name: "Banana",                           qty: 1, unit: "unid média", refKcal: 90 },
      { name: "Mamão papaia",                     qty: 1, unit: "fatia média", refKcal: 60, note: "≈ 150 g" },
      { name: "Frutas vermelhas (morango, amora)",qty: 1, unit: "xícara",      refKcal: 50, note: "≈ 120 g" },
    ],
  },
  {
    match: /\b(iogurte|whey|leite|queijo)\b/,
    options: [
      { name: "Iogurte natural desnatado",  qty: 170, unit: "g",     refKcal: 100 },
      { name: "Whey protein",               qty: 1,   unit: "scoop", refKcal: 120, note: "≈ 30 g" },
      { name: "Queijo branco",              qty: 30,  unit: "g",     refKcal: 70,  note: "1 fatia" },
    ],
  },
  {
    match: /\b(castanha|amendoa|noz|amendoim|pasta)\b/,
    options: [
      { name: "Castanha-do-pará",                  qty: 2,  unit: "unid",            refKcal: 60 },
      { name: "Amêndoas",                          qty: 10, unit: "unid",            refKcal: 70, note: "≈ 12 g" },
      { name: "Pasta de amendoim integral",        qty: 1,  unit: "colher de sopa",  refKcal: 90, note: "≈ 15 g" },
    ],
  },
];

const DINNER: RuleBucket[] = [
  {
    match: /\b(arroz|pao|tapioca|cuscuz|sopa|sanduiche|wrap|macarrao|batata|inhame)\b/,
    options: [
      { name: "Sopa de legumes com proteína",     qty: 1, unit: "prato fundo",      refKcal: 200, note: "≈ 300 ml" },
      { name: "Sanduíche natural integral",       qty: 1, unit: "unid",             refKcal: 250 },
      { name: "Tapioca recheada",                 qty: 1, unit: "unid",             refKcal: 200, note: "goma ≈ 3 col. sopa" },
      { name: "Arroz + proteína (porção reduzida)",qty: 3, unit: "colheres de sopa", refKcal: 200, note: "≈ 80 g" },
    ],
  },
  {
    match: /\b(frango|carne|peixe|tilapia|patinho|alcatra|coxao|bife|file|peito|lombo|atum|salmao|ovo|omelete)\b/,
    options: [
      { name: "Frango grelhado / desfiado",       qty: 120, unit: "g",       refKcal: 200, note: "1 filé" },
      { name: "Peixe grelhado (tilápia/merluza)", qty: 130, unit: "g",       refKcal: 175, note: "1 filé" },
      { name: "Carne magra (patinho/alcatra)",    qty: 110, unit: "g",       refKcal: 200, note: "1 bife" },
      { name: "Ovos mexidos / omelete",           qty: 2,   unit: "unid",    refKcal: 140 },
      { name: "Atum em conserva (água)",          qty: 1,   unit: "lata pequena", refKcal: 150, note: "≈ 120 g" },
    ],
  },
  {
    match: /\b(salada|folhas|legume|brocolis|cenoura|abobrinha|couve|repolho)\b/,
    options: [
      { name: "Salada de alface, tomate e pepino",      qty: 1, unit: "prato de sobremesa", refKcal: 30 },
      { name: "Couve refogada com cenoura e beterraba", qty: 1, unit: "porção",             refKcal: 80 },
      { name: "Legumes no vapor (brócolis, abobrinha)", qty: 1, unit: "porção",             refKcal: 60 },
    ],
  },
];

const BUCKETS: Record<MealKind, RuleBucket[]> = {
  breakfast: BREAKFAST,
  lunch: LUNCH,
  snack: SNACK_OR_FRUIT,
  dinner: DINNER,
  other: [],
};

function scaleOption(raw: RawOption, targetKcal: number): SubOption {
  // Sem alvo de kcal ou referência inválida → retorna porção de referência.
  if (!targetKcal || targetKcal <= 0 || !raw.refKcal || raw.refKcal <= 0) {
    return {
      name: raw.name,
      qty: fmt(raw.qty),
      unit: raw.unit,
      note: raw.note,
      kcal: raw.refKcal || undefined,
    };
  }
  // Clamp do fator para evitar valores absurdos (0.3x–3x).
  const rawFactor = targetKcal / raw.refKcal;
  const factor = Math.min(3, Math.max(0.3, rawFactor));
  const scaledQty = roundQty(raw.unit, raw.qty * factor);
  const scaledKcal = Math.round(raw.refKcal * (scaledQty / raw.qty));
  return {
    name: raw.name,
    qty: fmt(scaledQty),
    unit: raw.unit,
    note: raw.note,
    kcal: scaledKcal,
  };
}

/**
 * Retorna 3-4 substituições coerentes para o alimento dentro do contexto
 * da refeição, com quantidades escaladas para bater (~) com `targetKcal`
 * (kcal do alimento principal). Se targetKcal = 0, devolve a porção de
 * referência da regra.
 */
// Ordem de fallback por refeição (quando o alimento não casa com nenhuma
// regra do bucket principal, varremos outros buckets equivalentes).
const FALLBACK_ORDER: Record<MealKind, MealKind[]> = {
  breakfast: ["breakfast", "snack", "dinner", "lunch"],
  lunch: ["lunch", "dinner", "snack", "breakfast"],
  dinner: ["dinner", "lunch", "snack", "breakfast"],
  snack: ["snack", "breakfast", "dinner", "lunch"],
  other: ["lunch", "dinner", "breakfast", "snack"],
};

function tryBucket(
  rules: RuleBucket[],
  itemNorm: string,
  targetKcal: number,
): SubOption[] | null {
  for (const rule of rules) {
    if (rule.match.test(itemNorm)) {
      return rule.options
        .filter((o) => norm(o.name) !== itemNorm)
        .slice(0, 4)
        .map((o) => scaleOption(o, targetKcal));
    }
  }
  return null;
}

/**
 * Retorna 3-4 substituições coerentes para o alimento. Sempre tenta o bucket
 * da refeição primeiro; se nenhum padrão casar, faz fallback varrendo os
 * demais buckets em ordem semântica (definida em FALLBACK_ORDER), para
 * garantir que toda refeição receba sugestões equivalentes.
 */
export function getSubstitutionsFor(
  itemName: string,
  mealKind: MealKind,
  targetKcal: number = 0,
): SubOption[] {
  if (!itemName) return [];
  const n = norm(itemName);
  for (const kind of FALLBACK_ORDER[mealKind] ?? FALLBACK_ORDER.other) {
    const hit = tryBucket(BUCKETS[kind] ?? [], n, targetKcal);
    if (hit && hit.length > 0) return hit;
  }
  // Último recurso: devolve as 3 primeiras opções do bucket da refeição
  // (escaladas), para nunca deixar a refeição sem substituições.
  const primary = BUCKETS[mealKind]?.[0]?.options ?? SNACK_OR_FRUIT[0].options;
  return primary.slice(0, 3).map((o) => scaleOption(o, targetKcal));
}
