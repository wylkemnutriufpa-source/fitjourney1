// Banco de templates clínicos / esportivos / regionais
// REGRA: todos os alimentos referenciam imagens existentes em src/assets/foods/
// Itens nunca acoplam — sempre granular (1 alimento + qty), com equivalentes que
// escalonam proporcionalmente quando a qty do item principal muda.

export type FoodItem = {
  id: string;
  foodKey: string;     // chave da imagem (sem .jpg)
  name: string;        // nome de exibição
  qty: number;         // quantidade base (numérica)
  unit: string;        // g | ml | unid | fatia | scoop | colher
};

export type MealSlot = {
  id: string;
  time: string;
  label: string;       // Café da manhã, Almoço...
  /** Item principal da refeição */
  main: FoodItem;
  /** Equivalentes calóricos — escalonam proporcionalmente ao main */
  equivalents: FoodItem[];
  /** Imagem ilustrativa do card (usa foodKey do main se vazio) */
  heroKey?: string;
};

export type DietTemplate = {
  id: string;
  name: string;
  category:
    | "Esportivo"
    | "Clínico"
    | "Regional"
    | "Gestante"
    | "Pré/Pós-operatório"
    | "Bariátrica";
  description: string;
  tags: string[];
  kcal: number;
  meals: MealSlot[];
};

// ---- Catálogo enxuto de alimentos (apenas o que existe no banco de imagens) ----
// Reaproveitamos para montar refeições. Cada chave corresponde a um arquivo .jpg
// em src/assets/foods/.

const F = {
  // Cafés / lanches
  pao_ovo: { foodKey: "pao-com-ovo", name: "Pão francês + ovo", unit: "porção" },
  pao_queijo: { foodKey: "pao-com-queijo", name: "Pão francês + queijo", unit: "porção" },
  tapioca_ovo: { foodKey: "tapioca-com-ovo", name: "Tapioca recheada com ovo", unit: "unid" },
  tapioca_queijo: { foodKey: "tapioca-com-queijo", name: "Tapioca recheada com queijo", unit: "unid" },
  cuscuz_ovo: { foodKey: "cuscuz-com-ovo", name: "Cuscuz + ovo", unit: "porção" },
  crepioca: { foodKey: "crepioca", name: "Crepioca", unit: "unid" },
  omelete: { foodKey: "omelete", name: "Omelete", unit: "unid" },
  ovos_cozidos: { foodKey: "ovos-cozidos", name: "Ovos cozidos", unit: "unid" },
  ovos_mexidos: { foodKey: "ovos-mexidos", name: "Ovos mexidos", unit: "unid" },
  ovos_bacon: { foodKey: "ovos-com-bacon", name: "Ovos com bacon", unit: "porção" },
  mingau_aveia: { foodKey: "mingau-de-aveia", name: "Mingau de aveia", unit: "g" },
  banana_aveia: { foodKey: "banana-com-aveia", name: "Banana com aveia", unit: "porção" },
  mamao_aveia: { foodKey: "mamao-com-aveia", name: "Mamão com aveia", unit: "porção" },
  iogurte_natural: { foodKey: "iogurte-natural", name: "Iogurte natural", unit: "g" },
  iogurte_fruta: { foodKey: "iogurte-com-fruta", name: "Iogurte com fruta", unit: "porção" },
  iogurte_granola: { foodKey: "iogurte-com-ganola", name: "Iogurte com granola", unit: "porção" },
  panqueca_proteica: { foodKey: "panqueca-proteica", name: "Panqueca proteica", unit: "unid" },
  cha_torrada: { foodKey: "cha-com-torrada", name: "Chá + torrada integral", unit: "porção" },
  cha_torrada_queijo: { foodKey: "cha-com-torrada-e-queijo", name: "Chá + torrada com queijo", unit: "porção" },
  copo_leite: { foodKey: "copo-de-leite-morno", name: "Copo de leite morno", unit: "ml" },
  torrada_integral: { foodKey: "torrada-integral", name: "Torrada integral", unit: "unid" },
  pao_de_queijo: { foodKey: "pao-de-queijo", name: "Pão de queijo", unit: "unid" },

  // Frutas
  abacaxi: { foodKey: "abacaxi", name: "Abacaxi", unit: "g" },
  goiaba: { foodKey: "goiaba", name: "Goiaba", unit: "unid" },
  laranja: { foodKey: "laranja", name: "Laranja", unit: "unid" },
  maca: { foodKey: "maca", name: "Maçã", unit: "unid" },
  mamao: { foodKey: "mamao", name: "Mamão", unit: "g" },
  manga: { foodKey: "manga", name: "Manga", unit: "g" },
  melancia: { foodKey: "melancia", name: "Melancia", unit: "g" },
  melao: { foodKey: "melao", name: "Melão", unit: "g" },
  morango: { foodKey: "morango", name: "Morango", unit: "g" },
  pera: { foodKey: "pera", name: "Pera", unit: "unid" },
  uva: { foodKey: "uva", name: "Uva", unit: "g" },
  frutas_vermelhas: { foodKey: "frutas-vermelhas", name: "Frutas vermelhas", unit: "g" },
  salada_frutas: { foodKey: "salada-de-frutas", name: "Salada de frutas", unit: "g" },
  vitamina_fruta: { foodKey: "vitamina-de-fruta", name: "Vitamina de fruta", unit: "ml" },
  smoothie: { foodKey: "smoff-de-frutas", name: "Smoothie de frutas", unit: "ml" },

  // Almoço/jantar — carnes
  frango_grelhado: { foodKey: "frango-grelhado", name: "Frango grelhado", unit: "g" },
  bife_acebolado: { foodKey: "bife-acebolado", name: "Bife acebolado", unit: "g" },
  carne_grelhada: { foodKey: "carne-grelhada", name: "Carne grelhada", unit: "g" },
  carne_batata: { foodKey: "carne-com-batata", name: "Carne + batata", unit: "g" },
  carne_assada: { foodKey: "carne-assada-de-panela", name: "Carne assada de panela", unit: "g" },
  acem: { foodKey: "acem", name: "Acém cozido", unit: "g" },
  maminha: { foodKey: "maminha", name: "Maminha", unit: "g" },
  picanha: { foodKey: "picanha", name: "Picanha grelhada", unit: "g" },
  picanha_suina: { foodKey: "picanha-suina", name: "Picanha suína", unit: "g" },
  lombo_suino: { foodKey: "lombo-suino", name: "Lombo suíno", unit: "g" },
  file_porco: { foodKey: "file-de-porco", name: "Filé de porco", unit: "g" },
  costela_suina: { foodKey: "costela-suina", name: "Costela suína", unit: "g" },
  costela_bovina: { foodKey: "costela-bovina-com-batata", name: "Costela bovina + batata", unit: "g" },
  coxa_sobrecoxa: { foodKey: "coxa-e-sobrecoxa", name: "Coxa e sobrecoxa", unit: "g" },
  frango_batata_doce: { foodKey: "frango-com-batata-doce", name: "Frango + batata doce", unit: "g" },
  file_tilapia: { foodKey: "file-de-tilapia", name: "Filé de tilápia", unit: "g" },
  peixe_legumes: { foodKey: "peixe-com-legumes", name: "Peixe com legumes", unit: "g" },
  macarrao_carne: { foodKey: "macarrao-com-carne-moida", name: "Macarrão + carne moída", unit: "g" },
  macarronada_camarao: { foodKey: "macarronada-de-camarao", name: "Macarronada de camarão", unit: "g" },
  strog_carne: { foodKey: "strogonoff-de-carne", name: "Strogonoff de carne", unit: "g" },
  strog_frango: { foodKey: "strogonoff-de-frango-light", name: "Strogonoff de frango light", unit: "g" },
  strog_camarao: { foodKey: "strogonoff-de-camarao", name: "Strogonoff de camarão", unit: "g" },

  // Sopas / leves / clínicas
  canja: { foodKey: "canja-de-galinha-com-legumes", name: "Canja de galinha + legumes", unit: "ml" },
  sopa_legumes: { foodKey: "sopa-de-legumes", name: "Sopa de legumes", unit: "ml" },
  salada_completa: { foodKey: "salada-completa", name: "Salada completa", unit: "g" },
  sanduiche_natural: { foodKey: "sanduiche-natural", name: "Sanduíche natural", unit: "unid" },
  sanduiche_frango: { foodKey: "sanduiche-natural-de-frango", name: "Sanduíche natural de frango", unit: "unid" },
  pao_frango: { foodKey: "pao-com-frango-desfiado", name: "Pão + frango desfiado", unit: "porção" },

  // Regionais / paraenses
  acai: { foodKey: "acai", name: "Açaí", unit: "ml" },
  acai_tapioca: { foodKey: "acai-com-tapioca", name: "Açaí com tapioca", unit: "porção" },
  acai_aveia: { foodKey: "acai-com-aveia", name: "Açaí com aveia", unit: "porção" },
  acai_frango: { foodKey: "acai-com-frango", name: "Açaí com frango", unit: "porção" },
  acai_peixe: { foodKey: "acai-com-peixe-frito", name: "Açaí com peixe frito", unit: "porção" },
  pupunha_cafe: { foodKey: "pupunha-com-cafe", name: "Pupunha + café", unit: "porção" },
  macaxeira_cafe: { foodKey: "macaxeira-com-cafe", name: "Macaxeira + café", unit: "porção" },
  bolo_macaxeira: { foodKey: "bolo-de-macaxeira-com-cafe", name: "Bolo de macaxeira + café", unit: "porção" },
  bolo_milho: { foodKey: "bolo-de-milho-com-cafe", name: "Bolo de milho + café", unit: "porção" },
  farofa_ovo: { foodKey: "farofa-ovo", name: "Farofa de ovo", unit: "g" },
  farofa_ovo_cafe: { foodKey: "farofa-de-ovo-com-cafe", name: "Farofa de ovo + café", unit: "porção" },
  milho_cozido: { foodKey: "milho-cozido", name: "Milho cozido", unit: "g" },
} as const;

type FKey = keyof typeof F;
let _i = 0;
const item = (key: FKey, qty: number): FoodItem => {
  _i++;
  const f = F[key];
  return { id: `it-${_i}-${key}`, foodKey: f.foodKey, name: f.name, qty, unit: f.unit };
};

let _m = 0;
const meal = (
  time: string,
  label: string,
  main: FoodItem,
  equivalents: FoodItem[],
): MealSlot => {
  _m++;
  return { id: `m-${_m}`, time, label, main, equivalents };
};

// ====================== TEMPLATES ======================

export const templates: DietTemplate[] = [
  // ---------- ESPORTIVOS ----------
  {
    id: "esp-hipertrofia",
    name: "Hipertrofia — Superávit Moderado",
    category: "Esportivo",
    description:
      "Plano hiperproteico (≈2g/kg) com carbo moderado-alto. Foco em treino de força.",
    tags: ["Musculação", "Crossfit", "Hipertrofia"],
    kcal: 3000,
    meals: [
      meal("07:00", "Café da manhã",
        item("pao_ovo", 1),
        [item("tapioca_ovo", 1), item("cuscuz_ovo", 1), item("crepioca", 2), item("omelete", 1)]),
      meal("10:00", "Lanche da manhã",
        item("iogurte_granola", 1),
        [item("banana_aveia", 1), item("mamao_aveia", 1), item("vitamina_fruta", 300)]),
      meal("13:00", "Almoço",
        item("frango_grelhado", 180),
        [item("bife_acebolado", 180), item("picanha", 180), item("acem", 180), item("file_tilapia", 200)]),
      meal("16:30", "Lanche da tarde",
        item("panqueca_proteica", 2),
        [item("sanduiche_frango", 1), item("pao_frango", 1)]),
      meal("19:30", "Jantar",
        item("peixe_legumes", 200),
        [item("frango_batata_doce", 200), item("carne_grelhada", 180), item("strog_frango", 200)]),
      meal("22:00", "Ceia",
        item("iogurte_natural", 200),
        [item("ovos_cozidos", 3), item("copo_leite", 250)]),
    ],
  },
  {
    id: "esp-endurance",
    name: "Endurance — Alto Carbo",
    category: "Esportivo",
    description: "Treinos longos (corrida/ciclismo/triathlon). Janelas de carbo pré e pós.",
    tags: ["Corrida", "Ciclismo", "Triathlon"],
    kcal: 3200,
    meals: [
      meal("05:30", "Pré-treino",
        item("banana_aveia", 1),
        [item("mingau_aveia", 200), item("tapioca_queijo", 1), item("crepioca", 2)]),
      meal("09:00", "Pós-treino",
        item("vitamina_fruta", 400),
        [item("smoothie", 400), item("iogurte_granola", 1), item("acai_aveia", 1)]),
      meal("12:30", "Almoço",
        item("macarrao_carne", 250),
        [item("macarronada_camarao", 250), item("strog_carne", 200), item("carne_batata", 220)]),
      meal("16:00", "Lanche",
        item("sanduiche_natural", 1),
        [item("pao_queijo", 1), item("pao_de_queijo", 3), item("pupunha_cafe", 1)]),
      meal("19:30", "Jantar",
        item("frango_batata_doce", 200),
        [item("peixe_legumes", 200), item("canja", 400)]),
    ],
  },
  {
    id: "esp-cutting",
    name: "Cutting — Definição",
    category: "Esportivo",
    description: "Déficit calórico moderado preservando massa magra. Alta proteína.",
    tags: ["Emagrecimento", "Estética"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("ovos_mexidos", 3),
        [item("omelete", 1), item("crepioca", 2), item("tapioca_queijo", 1)]),
      meal("10:30", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("goiaba", 1), item("laranja", 1)]),
      meal("13:00", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180), item("acem", 150)]),
      meal("16:30", "Lanche",
        item("iogurte_natural", 170),
        [item("frutas_vermelhas", 150), item("iogurte_fruta", 1)]),
      meal("19:30", "Jantar",
        item("salada_completa", 250),
        [item("sopa_legumes", 350), item("ovos_cozidos", 3)]),
    ],
  },

  // ---------- CLÍNICOS ----------
  {
    id: "cli-lowcarb",
    name: "Low-Carb Clínico",
    category: "Clínico",
    description: "Baixo carbo (≈60-80g/dia). Indicado p/ resistência insulínica e perda de peso.",
    tags: ["Low-Carb", "Resistência insulínica"],
    kcal: 1800,
    meals: [
      meal("07:00", "Café da manhã",
        item("omelete", 1),
        [item("ovos_mexidos", 3), item("ovos_bacon", 1), item("crepioca", 2)]),
      meal("10:30", "Lanche",
        item("ovos_cozidos", 2),
        [item("morango", 100), item("iogurte_natural", 150)]),
      meal("12:30", "Almoço",
        item("bife_acebolado", 180),
        [item("frango_grelhado", 180), item("file_tilapia", 200), item("carne_grelhada", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 150),
        [item("frutas_vermelhas", 80), item("ovos_cozidos", 2)]),
      meal("19:30", "Jantar",
        item("peixe_legumes", 200),
        [item("salada_completa", 250), item("strog_frango", 180)]),
    ],
  },
  {
    id: "cli-diabetes",
    name: "Diabetes Tipo 2",
    category: "Clínico",
    description:
      "Carbos complexos fracionados, baixo IG, fibras altas. Evita açúcares simples.",
    tags: ["Diabetes", "Baixo IG"],
    kcal: 2000,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_ovo", 1),
        [item("cuscuz_ovo", 1), item("pao_ovo", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("goiaba", 1), item("morango", 120)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180), item("acem", 150)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("torrada_integral", 2), item("pao_queijo", 1)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400), item("salada_completa", 250)]),
      meal("21:30", "Ceia",
        item("iogurte_natural", 120),
        [item("copo_leite", 200)]),
    ],
  },
  {
    id: "cli-colesterol",
    name: "Colesterol Alto (Dislipidemia)",
    category: "Clínico",
    description:
      "Reduz gordura saturada, prioriza peixes, fibras solúveis, frutas e legumes.",
    tags: ["Colesterol", "Dislipidemia", "Cardio"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("mingau_aveia", 200),
        [item("banana_aveia", 1), item("mamao_aveia", 1)]),
      meal("10:00", "Lanche",
        item("mamao", 150),
        [item("maca", 1), item("pera", 1), item("salada_frutas", 150)]),
      meal("12:30", "Almoço",
        item("file_tilapia", 200),
        [item("peixe_legumes", 200), item("frango_grelhado", 150)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("salada_completa", 250), item("canja", 400)]),
    ],
  },
  {
    id: "cli-figado",
    name: "Esteatose Hepática (Gordura no Fígado)",
    category: "Clínico",
    description:
      "Sem álcool, sem frituras. Carbo complexo, proteína magra, vegetais.",
    tags: ["Fígado", "Esteatose"],
    kcal: 1850,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_queijo", 1),
        [item("cha_torrada", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("mamao", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 150),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400)]),
    ],
  },
  {
    id: "cli-hipertensao",
    name: "Hipertensão (DASH)",
    category: "Clínico",
    description:
      "Baixo sódio, rico em K/Mg/Ca. Vegetais, frutas, laticínios magros, peixes.",
    tags: ["Hipertensão", "DASH"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("banana_aveia", 1),
        [item("mingau_aveia", 200), item("mamao_aveia", 1)]),
      meal("10:00", "Lanche",
        item("laranja", 1),
        [item("mamao", 150), item("melao", 150), item("maca", 1)]),
      meal("12:30", "Almoço",
        item("file_tilapia", 200),
        [item("frango_grelhado", 150), item("peixe_legumes", 200)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("salada_completa", 250),
        [item("sopa_legumes", 400)]),
    ],
  },
  {
    id: "cli-renais",
    name: "Cálculos Renais",
    category: "Clínico",
    description:
      "Hidratação alta, baixo sódio, oxalato moderado, cálcio adequado da dieta.",
    tags: ["Cálculo renal", "Hidratação"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("pao_queijo", 1),
        [item("cha_torrada_queijo", 1), item("tapioca_queijo", 1)]),
      meal("10:00", "Lanche",
        item("melancia", 200),
        [item("melao", 150), item("abacaxi", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("acem", 150)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("pera", 1), item("maca", 1)]),
      meal("19:30", "Jantar",
        item("canja", 400),
        [item("sopa_legumes", 400), item("salada_completa", 250)]),
    ],
  },
  {
    id: "cli-vesicula",
    name: "Pedra na Vesícula",
    category: "Clínico",
    description:
      "Baixa gordura, sem frituras, refeições leves fracionadas. Evita embutidos.",
    tags: ["Vesícula", "Baixa gordura"],
    kcal: 1700,
    meals: [
      meal("07:00", "Café da manhã",
        item("cha_torrada", 1),
        [item("mingau_aveia", 200), item("tapioca_queijo", 1)]),
      meal("10:00", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("mamao", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 150),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400)]),
    ],
  },

  // ---------- PRÉ/PÓS-OPERATÓRIO ----------
  {
    id: "po-pre-op",
    name: "Pré-operatório",
    category: "Pré/Pós-operatório",
    description:
      "Refeições leves, hiperproteicas moderadas, fibras controladas nas 48h finais.",
    tags: ["Pré-operatório", "Hospitalar"],
    kcal: 2000,
    meals: [
      meal("07:00", "Café da manhã",
        item("pao_queijo", 1),
        [item("tapioca_queijo", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("vitamina_fruta", 300),
        [item("iogurte_fruta", 1), item("salada_frutas", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 180),
        [item("file_tilapia", 180), item("acem", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("pera", 1), item("maca", 1)]),
      meal("19:30", "Jantar",
        item("canja", 400),
        [item("sopa_legumes", 400)]),
    ],
  },
  {
    id: "po-pos-op",
    name: "Pós-operatório (evolução)",
    category: "Pré/Pós-operatório",
    description:
      "Progressão de líquida → pastosa → branda. Hiperproteico, hipogorduroso.",
    tags: ["Pós-operatório", "Hospitalar"],
    kcal: 1600,
    meals: [
      meal("07:00", "Café",
        item("mingau_aveia", 200),
        [item("vitamina_fruta", 300), item("iogurte_natural", 170)]),
      meal("10:00", "Lanche",
        item("iogurte_natural", 150),
        [item("salada_frutas", 150), item("vitamina_fruta", 250)]),
      meal("12:30", "Almoço",
        item("canja", 400),
        [item("sopa_legumes", 400)]),
      meal("16:00", "Lanche",
        item("vitamina_fruta", 300),
        [item("iogurte_fruta", 1)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400)]),
    ],
  },

  // ---------- GESTANTE ----------
  {
    id: "ges-gestante",
    name: "Gestante (2º/3º trimestre)",
    category: "Gestante",
    description:
      "+300 kcal, ferro, cálcio, folato e proteína. Fracionado em 6 refeições.",
    tags: ["Gestante", "Materno"],
    kcal: 2300,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_ovo", 1),
        [item("cuscuz_ovo", 1), item("pao_ovo", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("mamao_aveia", 1),
        [item("banana_aveia", 1), item("iogurte_granola", 1)]),
      meal("12:30", "Almoço",
        item("carne_grelhada", 180),
        [item("frango_grelhado", 180), item("file_tilapia", 200), item("acem", 180)]),
      meal("15:30", "Lanche",
        item("vitamina_fruta", 300),
        [item("iogurte_fruta", 1), item("salada_frutas", 200)]),
      meal("19:30", "Jantar",
        item("frango_batata_doce", 200),
        [item("peixe_legumes", 200), item("canja", 400)]),
      meal("22:00", "Ceia",
        item("copo_leite", 250),
        [item("iogurte_natural", 170), item("pao_de_queijo", 2)]),
    ],
  },

  // ---------- BARIÁTRICA ----------
  {
    id: "bar-pos-bariatrica",
    name: "Pós-bariátrica (Fase Branda)",
    category: "Bariátrica",
    description:
      "Pequenos volumes, hiperproteica, mastigação lenta. Sem líquido junto da refeição.",
    tags: ["Bariátrica", "Hiperproteica"],
    kcal: 1100,
    meals: [
      meal("07:00", "Café",
        item("ovos_mexidos", 2),
        [item("omelete", 1), item("crepioca", 1)]),
      meal("09:30", "Lanche",
        item("iogurte_natural", 120),
        [item("frutas_vermelhas", 80)]),
      meal("12:00", "Almoço",
        item("frango_grelhado", 90),
        [item("file_tilapia", 100), item("acem", 90)]),
      meal("15:00", "Lanche",
        item("iogurte_natural", 120),
        [item("pera", 1)]),
      meal("18:30", "Jantar",
        item("sopa_legumes", 250),
        [item("canja", 250)]),
      meal("21:00", "Ceia",
        item("copo_leite", 150),
        [item("iogurte_natural", 100)]),
    ],
  },

  // ---------- REGIONAIS / PARAENSE ----------
  {
    id: "reg-paraense",
    name: "Paraense — Cotidiano Regional",
    category: "Regional",
    description:
      "Alimentação típica paraense balanceada: açaí, tapioca, pupunha, peixes.",
    tags: ["Paraense", "Regional", "Norte"],
    kcal: 2400,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_queijo", 1),
        [item("pupunha_cafe", 1), item("macaxeira_cafe", 1), item("bolo_macaxeira", 1)]),
      meal("10:00", "Lanche",
        item("acai_tapioca", 1),
        [item("acai_aveia", 1), item("acai", 300)]),
      meal("12:30", "Almoço",
        item("acai_peixe", 1),
        [item("acai_frango", 1), item("file_tilapia", 200), item("peixe_legumes", 200)]),
      meal("16:00", "Lanche",
        item("bolo_milho", 1),
        [item("pao_de_queijo", 3), item("cha_torrada_queijo", 1)]),
      meal("19:30", "Jantar",
        item("canja", 400),
        [item("sopa_legumes", 400), item("frango_grelhado", 180)]),
    ],
  },
];

export const categories: DietTemplate["category"][] = [
  "Esportivo",
  "Clínico",
  "Regional",
  "Gestante",
  "Pré/Pós-operatório",
  "Bariátrica",
];
