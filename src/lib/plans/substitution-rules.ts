// Regras curadas de substituição por contexto de refeição.
// Listas fechadas (3-4 opções) para evitar trocas incoerentes
// (ex.: arroz por pão no almoço, carne por feijão, etc.).
//
// Read-only: usada apenas pelo Patient App para sugerir opções.
// Não altera o snapshot publicado.

export type MealKind = "breakfast" | "lunch" | "snack" | "dinner" | "other";

export type SubOption = {
  name: string;        // rótulo exibido
  qty: number;         // quantidade sugerida (referência)
  unit: string;        // unidade (g, ml, unid, fatia, colher)
  note?: string;       // observação curta (ex.: "≈ 1 fatia")
};

type RuleBucket = {
  // Padrões (regex em nome normalizado) que identificam o alimento-alvo.
  match: RegExp;
  options: SubOption[];
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
  // fallback por horário, se vier
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

// ------- Regras por refeição -------

const BREAKFAST: RuleBucket[] = [
  // Carbo do café — pão/tapioca/cuscuz/rap10
  {
    match: /\b(pao|tapioca|goma|cuscuz|rap10|wrap|torrada)\b/,
    options: [
      { name: "Pão francês", qty: 1, unit: "unid", note: "≈ 50 g" },
      { name: "Pão de forma integral", qty: 2, unit: "fatias", note: "≈ 50 g" },
      { name: "Tapioca (goma)", qty: 3, unit: "colheres de sopa", note: "≈ 45 g" },
      { name: "Cuscuz de milho", qty: 4, unit: "colheres de sopa", note: "≈ 120 g cozido" },
    ],
  },
  // Proteína do café — ovo, queijo, frango desfiado, carne moída
  {
    match: /\bovo|omelete|mexido\b/,
    options: [
      { name: "Ovo cozido / mexido", qty: 2, unit: "unid" },
      { name: "Queijo branco", qty: 1, unit: "fatia", note: "≈ 30 g" },
      { name: "Frango desfiado", qty: 2, unit: "colheres de sopa", note: "≈ 60 g" },
      { name: "Carne moída magra", qty: 2, unit: "colheres de sopa", note: "≈ 60 g" },
    ],
  },
  // Lácteo
  {
    match: /\b(leite|iogurte|whey|requeijao|queijo)\b/,
    options: [
      { name: "Leite desnatado", qty: 200, unit: "ml", note: "1 copo" },
      { name: "Iogurte natural", qty: 170, unit: "g", note: "1 pote" },
      { name: "Queijo branco / minas", qty: 30, unit: "g", note: "1 fatia" },
      { name: "Requeijão light", qty: 1, unit: "colher de sopa", note: "≈ 20 g" },
    ],
  },
  // Café/chá
  {
    match: /\b(cafe|cha)\b/,
    options: [
      { name: "Café sem açúcar", qty: 200, unit: "ml" },
      { name: "Chá (camomila, hortelã, erva-doce)", qty: 200, unit: "ml" },
    ],
  },
];

const LUNCH: RuleBucket[] = [
  // Carbo do almoço — arroz e similares (NUNCA pão/tapioca)
  {
    match: /\barroz\b/,
    options: [
      { name: "Arroz branco cozido", qty: 4, unit: "colheres de sopa", note: "≈ 100 g" },
      { name: "Arroz integral cozido", qty: 4, unit: "colheres de sopa", note: "≈ 100 g" },
      { name: "Macarrão cozido", qty: 4, unit: "colheres de sopa", note: "≈ 120 g" },
      { name: "Purê de batata / inhame", qty: 3, unit: "colheres de sopa", note: "≈ 120 g" },
    ],
  },
  {
    match: /\b(batata|inhame|mandioca|macaxeira|aipim|pupunha|macarrao|purê|pure)\b/,
    options: [
      { name: "Batata inglesa cozida", qty: 1, unit: "unid média", note: "≈ 100 g" },
      { name: "Batata doce cozida", qty: 1, unit: "unid média", note: "≈ 100 g" },
      { name: "Inhame / mandioca cozidos", qty: 1, unit: "pedaço médio", note: "≈ 100 g" },
      { name: "Macarrão cozido", qty: 4, unit: "colheres de sopa", note: "≈ 120 g" },
    ],
  },
  // Leguminosa (feijão, lentilha, grão-de-bico) — não mistura com proteína animal
  {
    match: /\b(feijao|lentilha|grao de bico|ervilha)\b/,
    options: [
      { name: "Feijão carioca / preto", qty: 1, unit: "concha média", note: "≈ 80 g" },
      { name: "Lentilha cozida", qty: 1, unit: "concha média", note: "≈ 80 g" },
      { name: "Grão-de-bico cozido", qty: 1, unit: "concha média", note: "≈ 80 g" },
      { name: "Ervilha cozida", qty: 1, unit: "concha média", note: "≈ 80 g" },
    ],
  },
  // Proteína do almoço — apenas carnes/peixe/ovo (sem feijão)
  {
    match: /\b(frango|carne|peixe|tilapia|patinho|alcatra|coxao|bife|file|peito|lombo|picanha|atum|salmao|ovo|omelete)\b/,
    options: [
      { name: "Frango grelhado", qty: 120, unit: "g", note: "1 filé" },
      { name: "Carne magra (patinho/alcatra)", qty: 120, unit: "g", note: "1 bife" },
      { name: "Peixe grelhado (tilápia/merluza)", qty: 150, unit: "g", note: "1 filé" },
      { name: "Ovos cozidos / mexidos", qty: 3, unit: "unid" },
    ],
  },
  // Saladas (cruas / refogadas) — 3 montagens prontas
  {
    match: /\b(salada|folhas|alface|rucula|verduras|legume|legumes|brocolis|cenoura|abobrinha|couve|repolho|beterraba)\b/,
    options: [
      { name: "Salada de alface, tomate e pepino", qty: 1, unit: "prato de sobremesa" },
      { name: "Couve refogada com cenoura e beterraba", qty: 1, unit: "porção", note: "≈ 100 g" },
      { name: "Repolho refogado com couve", qty: 1, unit: "porção", note: "≈ 100 g" },
      { name: "Legumes cozidos (brócolis, abobrinha, cenoura)", qty: 1, unit: "porção", note: "≈ 100 g" },
    ],
  },
];

const SNACK_OR_FRUIT: RuleBucket[] = [
  {
    match: /\b(fruta|maca|banana|mamao|manga|pera|laranja|melao|melancia|abacaxi|morango|uva|goiaba|kiwi|tangerina|ameixa)\b/,
    options: [
      { name: "Maçã ou pera", qty: 1, unit: "unid média" },
      { name: "Banana", qty: 1, unit: "unid média" },
      { name: "Mamão papaia", qty: 1, unit: "fatia média", note: "≈ 150 g" },
      { name: "Frutas vermelhas (morango, amora)", qty: 1, unit: "xícara", note: "≈ 120 g" },
    ],
  },
  {
    match: /\b(iogurte|whey|leite|queijo)\b/,
    options: [
      { name: "Iogurte natural desnatado", qty: 170, unit: "g" },
      { name: "Whey protein", qty: 1, unit: "scoop", note: "≈ 30 g" },
      { name: "Queijo branco", qty: 30, unit: "g", note: "1 fatia" },
    ],
  },
  {
    match: /\b(castanha|amendoa|noz|amendoim|pasta)\b/,
    options: [
      { name: "Castanha-do-pará", qty: 2, unit: "unid" },
      { name: "Amêndoas", qty: 10, unit: "unid", note: "≈ 12 g" },
      { name: "Pasta de amendoim integral", qty: 1, unit: "colher de sopa", note: "≈ 15 g" },
    ],
  },
];

const DINNER: RuleBucket[] = [
  // No jantar, carbo leve PODE incluir pão/tapioca/sopa
  {
    match: /\b(arroz|pao|tapioca|cuscuz|sopa|sanduiche|wrap|macarrao|batata|inhame)\b/,
    options: [
      { name: "Sopa de legumes com proteína", qty: 1, unit: "prato fundo", note: "≈ 300 ml" },
      { name: "Sanduíche natural integral", qty: 1, unit: "unid" },
      { name: "Tapioca recheada", qty: 1, unit: "unid", note: "goma ≈ 3 col. sopa" },
      { name: "Arroz + proteína (porção reduzida)", qty: 3, unit: "colheres de sopa", note: "≈ 80 g" },
    ],
  },
  {
    match: /\b(frango|carne|peixe|tilapia|patinho|ovo|omelete|atum)\b/,
    options: [
      { name: "Frango desfiado / grelhado", qty: 100, unit: "g" },
      { name: "Peixe grelhado", qty: 120, unit: "g" },
      { name: "Ovos mexidos / omelete", qty: 2, unit: "unid" },
      { name: "Atum em conserva (água)", qty: 1, unit: "lata pequena", note: "≈ 120 g" },
    ],
  },
  {
    match: /\b(salada|folhas|legume|brocolis|cenoura|abobrinha|couve|repolho)\b/,
    options: [
      { name: "Salada de alface, tomate e pepino", qty: 1, unit: "prato de sobremesa" },
      { name: "Couve refogada com cenoura e beterraba", qty: 1, unit: "porção" },
      { name: "Legumes no vapor (brócolis, abobrinha)", qty: 1, unit: "porção" },
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

/**
 * Retorna 3-4 substituições coerentes para o alimento dentro do contexto
 * da refeição. Retorna [] se não houver regra aplicável (o renderizador
 * exibe uma mensagem indicando ausência de substituições).
 */
export function getSubstitutionsFor(
  itemName: string,
  mealKind: MealKind,
): SubOption[] {
  if (!itemName) return [];
  const n = norm(itemName);
  const bucket = BUCKETS[mealKind] ?? [];
  for (const rule of bucket) {
    if (rule.match.test(n)) {
      // Remove a opção que tem o mesmo nome do próprio alimento, e limita a 4.
      return rule.options
        .filter((o) => norm(o.name) !== n)
        .slice(0, 4);
    }
  }
  // Fallback: snack/fruta funciona em qualquer contexto leve
  if (mealKind !== "snack") {
    for (const rule of SNACK_OR_FRUIT) {
      if (rule.match.test(n)) {
        return rule.options.filter((o) => norm(o.name) !== n).slice(0, 4);
      }
    }
  }
  return [];
}
