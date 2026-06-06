// Templates Inteligentes — Seeds Fase 1.
// 3 templates brasileiros prontos para importar no acervo "Meus Templates".
// Cada item base traz foodKey/ scaleGroup compatíveis com o catálogo TACO
// (src/lib/substitutions/taco-catalog.ts) — o motor de equivalência
// materializa as substituições item-a-item respeitando ALLOWED_SCALE_GROUPS
// (protein↔protein, carb↔carb, fat↔fat, fruit↔fruit). Sem mistura de grupos.
//
// Pure data + server-safe. Sem React. Sem I/O.

import type { PlannerFoodItem, PlannerMeal, PlannerTemplate, ScaleGroup } from "@/lib/meal-planner";

type SeedFoodItem = {
  foodKey: string;
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  scaleGroup: ScaleGroup;
};

type SeedMeal = {
  time: string;
  label: string;
  heroKey: string;
  items: SeedFoodItem[];
};

export type SmartTemplateSeed = {
  /** Slug interno (idempotência de import). */
  slug: string;
  name: string;
  finalidade: string;
  observacoes: string;
  category: string;
  meals: SeedMeal[];
};

export const SMART_TEMPLATE_SEEDS: readonly SmartTemplateSeed[] = [
  {
    slug: "brasileiro-emagrecimento-1600",
    name: "Brasileiro Emagrecimento — 1.600 kcal",
    category: "Emagrecimento",
    finalidade:
      "Emagrecimento moderado para adulto com rotina padrão. Distribuição clássica brasileira em 4 refeições.",
    observacoes:
      "Saladas e legumes verdes livres no almoço e jantar. Hidratação: 2L de água/dia. Substituições já materializadas por grupo (proteína↔proteína, carbo↔carbo).",
    meals: [
      {
        time: "07:00",
        label: "Café da manhã",
        heroKey: "tapioca",
        items: [
          { foodKey: "tapioca", name: "Tapioca", qty: 50, unit: "g", kcal: 121, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Ovo cozido", qty: 100, unit: "g", kcal: 143, scaleGroup: "protein" },
          { foodKey: "cafe-com-leite", name: "Café com leite desnatado", qty: 200, unit: "ml", kcal: 90, scaleGroup: "beverage" },
        ],
      },
      {
        time: "12:30",
        label: "Almoço",
        heroKey: "peito-frango",
        items: [
          { foodKey: "peito-frango", name: "Peito de frango grelhado", qty: 130, unit: "g", kcal: 215, scaleGroup: "protein" },
          { foodKey: "arroz-branco", name: "Arroz branco cozido", qty: 120, unit: "g", kcal: 154, scaleGroup: "carb" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 5, unit: "g", kcal: 45, scaleGroup: "fat" },
        ],
      },
      {
        time: "15:30",
        label: "Lanche da tarde",
        heroKey: "maca",
        items: [
          { foodKey: "maca", name: "Maçã", qty: 130, unit: "g", kcal: 73, scaleGroup: "fruit" },
          { foodKey: "pasta-amendoim", name: "Pasta de amendoim integral", qty: 15, unit: "g", kcal: 89, scaleGroup: "fat" },
        ],
      },
      {
        time: "19:30",
        label: "Jantar",
        heroKey: "tilapia-file",
        items: [
          { foodKey: "tilapia-file", name: "Filé de tilápia grelhado", qty: 120, unit: "g", kcal: 114, scaleGroup: "protein" },
          { foodKey: "batata-doce", name: "Batata doce cozida", qty: 150, unit: "g", kcal: 117, scaleGroup: "carb" },
        ],
      },
    ],
  },
  {
    slug: "hipertrofia-moderada-2400",
    name: "Hipertrofia Moderada — 2.400 kcal",
    category: "Hipertrofia",
    finalidade:
      "Ganho de massa muscular moderado para adulto ativo (treino 4–5x/sem). Alta densidade proteica distribuída em 5 refeições.",
    observacoes:
      "Pré-treino 60–90min antes do treino. Hidratação: 3L/dia. Substituições por grupo — kcal aproximada preservada por opção.",
    meals: [
      {
        time: "07:00",
        label: "Café da manhã",
        heroKey: "pao-frances",
        items: [
          { foodKey: "pao-frances", name: "Pão francês", qty: 100, unit: "g", kcal: 297, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Ovos mexidos", qty: 150, unit: "g", kcal: 215, scaleGroup: "protein" },
          { foodKey: "banana", name: "Banana", qty: 100, unit: "g", kcal: 98, scaleGroup: "fruit" },
        ],
      },
      {
        time: "10:00",
        label: "Lanche da manhã",
        heroKey: "tapioca",
        items: [
          { foodKey: "tapioca", name: "Tapioca", qty: 60, unit: "g", kcal: 146, scaleGroup: "carb" },
          { foodKey: "pasta-amendoim", name: "Pasta de amendoim", qty: 20, unit: "g", kcal: 118, scaleGroup: "fat" },
        ],
      },
      {
        time: "13:00",
        label: "Almoço",
        heroKey: "contrafile-bovino",
        items: [
          { foodKey: "contrafile-bovino", name: "Contrafilé bovino grelhado", qty: 180, unit: "g", kcal: 392, scaleGroup: "protein" },
          { foodKey: "arroz-branco", name: "Arroz branco cozido", qty: 180, unit: "g", kcal: 231, scaleGroup: "carb" },
          { foodKey: "abacate", name: "Abacate em fatias", qty: 50, unit: "g", kcal: 96, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:00",
        label: "Pré-treino",
        heroKey: "batata-doce",
        items: [
          { foodKey: "batata-doce", name: "Batata doce cozida", qty: 200, unit: "g", kcal: 156, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Claras + 1 ovo inteiro", qty: 100, unit: "g", kcal: 143, scaleGroup: "protein" },
        ],
      },
      {
        time: "20:00",
        label: "Jantar",
        heroKey: "peito-frango",
        items: [
          { foodKey: "peito-frango", name: "Peito de frango grelhado", qty: 180, unit: "g", kcal: 297, scaleGroup: "protein" },
          { foodKey: "macarrao-espaguete", name: "Macarrão integral cozido", qty: 150, unit: "g", kcal: 234, scaleGroup: "carb" },
        ],
      },
    ],
  },
  {
    slug: "low-carb-moderado-1500",
    name: "Low Carb Moderado — 1.500 kcal",
    category: "Low Carb",
    finalidade:
      "Redução estratégica de carboidratos para perda de gordura, mantendo proteína alta e gordura boa. 4 refeições.",
    observacoes:
      "Carboidratos restritos a fontes de absorção lenta (batata doce esporádica) ou frutas de baixo IG. Saladas e legumes verdes livres. Hidratação reforçada: 3L/dia.",
    meals: [
      {
        time: "07:30",
        label: "Café da manhã",
        heroKey: "ovo-galinha",
        items: [
          { foodKey: "ovo-galinha", name: "Ovos mexidos", qty: 150, unit: "g", kcal: 215, scaleGroup: "protein" },
          { foodKey: "abacate", name: "Abacate", qty: 80, unit: "g", kcal: 154, scaleGroup: "fat" },
          { foodKey: "cafe-com-leite", name: "Café puro", qty: 200, unit: "ml", kcal: 4, scaleGroup: "beverage" },
        ],
      },
      {
        time: "12:30",
        label: "Almoço",
        heroKey: "contrafile-bovino",
        items: [
          { foodKey: "contrafile-bovino", name: "Contrafilé bovino grelhado", qty: 150, unit: "g", kcal: 327, scaleGroup: "protein" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 10, unit: "g", kcal: 90, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:00",
        label: "Lanche da tarde",
        heroKey: "castanha-para",
        items: [
          { foodKey: "castanha-para", name: "Castanha-do-pará", qty: 20, unit: "g", kcal: 132, scaleGroup: "fat" },
          { foodKey: "maca", name: "Maçã", qty: 130, unit: "g", kcal: 73, scaleGroup: "fruit" },
        ],
      },
      {
        time: "20:00",
        label: "Jantar",
        heroKey: "tilapia-file",
        items: [
          { foodKey: "tilapia-file", name: "Filé de tilápia grelhado", qty: 150, unit: "g", kcal: 143, scaleGroup: "protein" },
          { foodKey: "abacate", name: "Abacate em cubos", qty: 60, unit: "g", kcal: 115, scaleGroup: "fat" },
        ],
      },
    ],
  },

  // ============== SACIEDADE ==============
  {
    slug: "saciedade-prolongada-1800",
    name: "Saciedade Prolongada — 1.800 kcal",
    category: "Saciedade",
    finalidade:
      "Foco em fibras, proteína magra e gorduras boas para prolongar a saciedade entre refeições. Indicado para perfis com fome frequente ou compulsão leve.",
    observacoes:
      "Mastigação lenta, 20+ min por refeição. Saladas livres. Hidratação 2,5L/dia. Frutas inteiras (nunca em suco) para preservar fibras.",
    meals: [
      {
        time: "07:00", label: "Café da manhã", heroKey: "usda-oats-rolled",
        items: [
          { foodKey: "usda-oats-rolled", name: "Aveia em flocos", qty: 40, unit: "g", kcal: 156, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Ovo mexido", qty: 100, unit: "g", kcal: 143, scaleGroup: "protein" },
          { foodKey: "usda-chia-seeds", name: "Chia hidratada", qty: 10, unit: "g", kcal: 49, scaleGroup: "fat" },
          { foodKey: "morango", name: "Morangos", qty: 100, unit: "g", kcal: 32, scaleGroup: "fruit" },
        ],
      },
      {
        time: "10:00", label: "Lanche da manhã", heroKey: "usda-greek-yogurt-nonfat",
        items: [
          { foodKey: "usda-greek-yogurt-nonfat", name: "Iogurte grego natural", qty: 150, unit: "g", kcal: 88, scaleGroup: "protein" },
          { foodKey: "usda-flax-seeds", name: "Linhaça moída", qty: 10, unit: "g", kcal: 53, scaleGroup: "fat" },
        ],
      },
      {
        time: "13:00", label: "Almoço", heroKey: "peito-frango",
        items: [
          { foodKey: "peito-frango", name: "Peito de frango grelhado", qty: 150, unit: "g", kcal: 248, scaleGroup: "protein" },
          { foodKey: "usda-quinoa-cooked", name: "Quinoa cozida", qty: 130, unit: "g", kcal: 159, scaleGroup: "carb" },
          { foodKey: "abacate", name: "Abacate em fatias", qty: 50, unit: "g", kcal: 96, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:30", label: "Lanche da tarde", heroKey: "maca",
        items: [
          { foodKey: "maca", name: "Maçã com casca", qty: 150, unit: "g", kcal: 84, scaleGroup: "fruit" },
          { foodKey: "pasta-amendoim", name: "Pasta de amendoim integral", qty: 15, unit: "g", kcal: 89, scaleGroup: "fat" },
        ],
      },
      {
        time: "20:00", label: "Jantar", heroKey: "tilapia-file",
        items: [
          { foodKey: "tilapia-file", name: "Filé de tilápia grelhado", qty: 140, unit: "g", kcal: 134, scaleGroup: "protein" },
          { foodKey: "usda-lentils-cooked", name: "Lentilhas cozidas", qty: 120, unit: "g", kcal: 139, scaleGroup: "carb" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 5, unit: "g", kcal: 45, scaleGroup: "fat" },
        ],
      },
    ],
  },

  // ============== ANSIEDADE & SONO ==============
  {
    slug: "ansiedade-sono-1700",
    name: "Ansiedade & Sono — 1.700 kcal",
    category: "Ansiedade",
    finalidade:
      "Suporte nutricional para regulação de humor e sono: triptofano (frango, ovo, banana, aveia), magnésio (folhas verdes, castanhas) e ômega-3 (peixes, chia, linhaça). Sem cafeína após 15h.",
    observacoes:
      "Evitar açúcares simples e ultraprocessados. Jantar leve até 2h antes de dormir. Banana + castanha 1h antes do sono ajuda relaxamento.",
    meals: [
      {
        time: "07:30", label: "Café da manhã", heroKey: "banana",
        items: [
          { foodKey: "usda-oats-rolled", name: "Aveia (mingau com canela)", qty: 50, unit: "g", kcal: 195, scaleGroup: "carb" },
          { foodKey: "banana", name: "Banana", qty: 120, unit: "g", kcal: 117, scaleGroup: "fruit" },
          { foodKey: "usda-walnuts", name: "Nozes", qty: 15, unit: "g", kcal: 98, scaleGroup: "fat" },
        ],
      },
      {
        time: "12:30", label: "Almoço", heroKey: "peito-frango",
        items: [
          { foodKey: "peito-frango", name: "Peito de frango (rico em triptofano)", qty: 140, unit: "g", kcal: 231, scaleGroup: "protein" },
          { foodKey: "arroz-branco", name: "Arroz integral cozido", qty: 120, unit: "g", kcal: 154, scaleGroup: "carb" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 5, unit: "g", kcal: 45, scaleGroup: "fat" },
        ],
      },
      {
        time: "15:30", label: "Lanche", heroKey: "usda-greek-yogurt-nonfat",
        items: [
          { foodKey: "usda-greek-yogurt-nonfat", name: "Iogurte grego natural", qty: 150, unit: "g", kcal: 88, scaleGroup: "protein" },
          { foodKey: "usda-blueberries", name: "Mirtilos", qty: 80, unit: "g", kcal: 46, scaleGroup: "fruit" },
        ],
      },
      {
        time: "19:30", label: "Jantar leve", heroKey: "merluza-file",
        items: [
          { foodKey: "merluza-file", name: "Merluza grelhada (ômega-3)", qty: 130, unit: "g", kcal: 122, scaleGroup: "protein" },
          { foodKey: "batata-doce", name: "Batata doce cozida", qty: 130, unit: "g", kcal: 101, scaleGroup: "carb" },
        ],
      },
      {
        time: "21:30", label: "Ceia relaxante", heroKey: "banana",
        items: [
          { foodKey: "banana", name: "Banana", qty: 100, unit: "g", kcal: 98, scaleGroup: "fruit" },
          { foodKey: "castanha-para", name: "Castanha-do-pará (1 unid.)", qty: 5, unit: "g", kcal: 33, scaleGroup: "fat" },
        ],
      },
    ],
  },

  // ============== ANTI-INFLAMATÓRIO ==============
  {
    slug: "anti-inflamatorio-1900",
    name: "Anti-inflamatório — 1.900 kcal",
    category: "Anti-inflamatório",
    finalidade:
      "Padrão mediterrâneo adaptado: alta densidade de ômega-3, polifenóis (frutas vermelhas, azeite, cacau), folhas verdes, sem açúcar refinado e sem ultraprocessados.",
    observacoes:
      "Inserir gengibre, cúrcuma e canela como temperos diários. Evitar frituras e óleos refinados. Azeite extravirgem como gordura principal.",
    meals: [
      {
        time: "07:30", label: "Café da manhã", heroKey: "usda-oats-rolled",
        items: [
          { foodKey: "usda-oats-rolled", name: "Aveia em flocos", qty: 40, unit: "g", kcal: 156, scaleGroup: "carb" },
          { foodKey: "usda-blueberries", name: "Mirtilos", qty: 100, unit: "g", kcal: 57, scaleGroup: "fruit" },
          { foodKey: "usda-chia-seeds", name: "Chia hidratada", qty: 15, unit: "g", kcal: 74, scaleGroup: "fat" },
        ],
      },
      {
        time: "12:30", label: "Almoço", heroKey: "usda-salmon-atlantic-raw",
        items: [
          { foodKey: "usda-salmon-atlantic-raw", name: "Filé de peixe rico em ômega-3", qty: 130, unit: "g", kcal: 268, scaleGroup: "protein" },
          { foodKey: "usda-quinoa-cooked", name: "Quinoa cozida", qty: 130, unit: "g", kcal: 159, scaleGroup: "carb" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 10, unit: "g", kcal: 90, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:00", label: "Lanche", heroKey: "morango",
        items: [
          { foodKey: "morango", name: "Morangos", qty: 150, unit: "g", kcal: 48, scaleGroup: "fruit" },
          { foodKey: "usda-walnuts", name: "Nozes", qty: 20, unit: "g", kcal: 131, scaleGroup: "fat" },
          { foodKey: "chocolate-100-cacau", name: "Chocolate 100% cacau (2 quad.)", qty: 10, unit: "g", kcal: 55, scaleGroup: "mixed" },
        ],
      },
      {
        time: "19:30", label: "Jantar", heroKey: "tilapia-file",
        items: [
          { foodKey: "tilapia-file", name: "Tilápia grelhada com cúrcuma", qty: 140, unit: "g", kcal: 134, scaleGroup: "protein" },
          { foodKey: "batata-doce", name: "Batata doce assada", qty: 150, unit: "g", kcal: 117, scaleGroup: "carb" },
          { foodKey: "abacate", name: "Abacate", qty: 60, unit: "g", kcal: 115, scaleGroup: "fat" },
        ],
      },
    ],
  },

  // ============== PROTOCOLO DE CALDOS ==============
  {
    slug: "protocolo-caldos-recuperacao-1200",
    name: "Protocolo de Caldos — Recuperação 1.200 kcal",
    category: "Caldos",
    finalidade:
      "Protocolo leve e quente para fases de recuperação (pós-virose, alta inflamação intestinal, gripe ou semanas estressantes). Caldos densos em micronutrientes, fáceis de digerir.",
    observacoes:
      "Cada caldo é prato único — receitas no banco de alimentos do app (categoria Receitas). Hidratação extra: 2,5–3L/dia incluindo chás (camomila, gengibre). Manter 5 dias e reavaliar.",
    meals: [
      {
        time: "08:00", label: "Café da manhã", heroKey: "usda-oats-rolled",
        items: [
          { foodKey: "usda-oats-rolled", name: "Mingau de aveia leve", qty: 30, unit: "g", kcal: 117, scaleGroup: "carb" },
          { foodKey: "banana", name: "Banana amassada", qty: 100, unit: "g", kcal: 98, scaleGroup: "fruit" },
        ],
      },
      {
        time: "12:30", label: "Almoço — Caldo 1", heroKey: "caldo-frango-legumes",
        items: [
          { foodKey: "caldo-frango-legumes", name: "Caldo de frango com legumes", qty: 400, unit: "ml", kcal: 180, scaleGroup: "mixed" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem (finalização)", qty: 5, unit: "g", kcal: 45, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:00", label: "Lanche", heroKey: "maca",
        items: [
          { foodKey: "maca", name: "Maçã cozida com canela", qty: 130, unit: "g", kcal: 73, scaleGroup: "fruit" },
        ],
      },
      {
        time: "19:30", label: "Jantar — Caldo 2", heroKey: "caldo-abobora-gengibre",
        items: [
          { foodKey: "caldo-abobora-gengibre", name: "Caldo de abóbora com gengibre", qty: 400, unit: "ml", kcal: 220, scaleGroup: "mixed" },
          { foodKey: "ovo-galinha", name: "Ovo pochê adicionado", qty: 50, unit: "g", kcal: 72, scaleGroup: "protein" },
        ],
      },
      {
        time: "21:30", label: "Ceia opcional", heroKey: "caldo-peixe-acafrao",
        items: [
          { foodKey: "caldo-peixe-acafrao", name: "Caldo de peixe com açafrão", qty: 300, unit: "ml", kcal: 150, scaleGroup: "mixed" },
        ],
      },
    ],
  },

  // ============== VEGETARIANO EQUILIBRADO ==============
  {
    slug: "vegetariano-equilibrado-1800",
    name: "Vegetariano Equilibrado — 1.800 kcal",
    category: "Vegetariano",
    finalidade:
      "Plano ovo-lacto-vegetariano com combinação de proteínas vegetais e ovos/laticínios para perfil completo de aminoácidos.",
    observacoes:
      "Combinar leguminosas com cereais (arroz+feijão, lentilha+quinoa) na mesma refeição. Avaliar suplementação de B12. Castanhas para ferro/zinco.",
    meals: [
      {
        time: "07:30", label: "Café da manhã", heroKey: "tapioca",
        items: [
          { foodKey: "tapioca", name: "Tapioca", qty: 60, unit: "g", kcal: 146, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Ovos mexidos", qty: 100, unit: "g", kcal: 143, scaleGroup: "protein" },
          { foodKey: "mamao", name: "Mamão papaia", qty: 150, unit: "g", kcal: 65, scaleGroup: "fruit" },
        ],
      },
      {
        time: "12:30", label: "Almoço", heroKey: "usda-lentils-cooked",
        items: [
          { foodKey: "usda-lentils-cooked", name: "Lentilhas cozidas", qty: 180, unit: "g", kcal: 208, scaleGroup: "carb" },
          { foodKey: "usda-tofu-firm", name: "Tofu firme grelhado", qty: 120, unit: "g", kcal: 173, scaleGroup: "protein" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 10, unit: "g", kcal: 90, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:00", label: "Lanche", heroKey: "usda-greek-yogurt-nonfat",
        items: [
          { foodKey: "usda-greek-yogurt-nonfat", name: "Iogurte grego natural", qty: 150, unit: "g", kcal: 88, scaleGroup: "protein" },
          { foodKey: "castanha-para", name: "Mix de castanhas", qty: 20, unit: "g", kcal: 132, scaleGroup: "fat" },
        ],
      },
      {
        time: "20:00", label: "Jantar", heroKey: "usda-chickpeas-cooked",
        items: [
          { foodKey: "usda-chickpeas-cooked", name: "Grão-de-bico cozido", qty: 150, unit: "g", kcal: 246, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Ovo cozido", qty: 100, unit: "g", kcal: 143, scaleGroup: "protein" },
          { foodKey: "abacate", name: "Abacate", qty: 50, unit: "g", kcal: 96, scaleGroup: "fat" },
        ],
      },
    ],
  },

  // ============== PÓS-TREINO EXPRESS ==============
  {
    slug: "pos-treino-express-2200",
    name: "Pós-treino Express — 2.200 kcal",
    category: "Performance",
    finalidade:
      "Reposição rápida de glicogênio + síntese proteica para quem treina à tarde/noite. Janela pós-treino com proteína de alta absorção e carbo de IG médio-alto.",
    observacoes:
      "Pós-treino dentro de 30–45 min após sessão. Whey opcional substituível por 4 claras + 1 ovo. Hidratação 3L/dia + eletrólitos no treino.",
    meals: [
      {
        time: "06:30", label: "Café da manhã", heroKey: "pao-frances",
        items: [
          { foodKey: "pao-frances", name: "Pão francês", qty: 100, unit: "g", kcal: 297, scaleGroup: "carb" },
          { foodKey: "ovo-galinha", name: "Ovos mexidos", qty: 100, unit: "g", kcal: 143, scaleGroup: "protein" },
          { foodKey: "manteiga", name: "Manteiga", qty: 10, unit: "g", kcal: 76, scaleGroup: "fat" },
        ],
      },
      {
        time: "12:30", label: "Almoço", heroKey: "patinho-bovino",
        items: [
          { foodKey: "patinho-bovino", name: "Patinho bovino grelhado", qty: 170, unit: "g", kcal: 231, scaleGroup: "protein" },
          { foodKey: "arroz-branco", name: "Arroz branco", qty: 180, unit: "g", kcal: 231, scaleGroup: "carb" },
          { foodKey: "azeite-oliva", name: "Azeite extravirgem", qty: 5, unit: "g", kcal: 45, scaleGroup: "fat" },
        ],
      },
      {
        time: "16:30", label: "Pré-treino", heroKey: "banana",
        items: [
          { foodKey: "banana", name: "Banana", qty: 120, unit: "g", kcal: 117, scaleGroup: "fruit" },
          { foodKey: "usda-oats-rolled", name: "Aveia (shake)", qty: 30, unit: "g", kcal: 117, scaleGroup: "carb" },
        ],
      },
      {
        time: "19:00", label: "Pós-treino", heroKey: "usda-whey-protein",
        items: [
          { foodKey: "usda-whey-protein", name: "Whey protein isolado", qty: 35, unit: "g", kcal: 130, scaleGroup: "protein" },
          { foodKey: "batata-doce", name: "Batata doce cozida", qty: 200, unit: "g", kcal: 156, scaleGroup: "carb" },
        ],
      },
      {
        time: "21:00", label: "Jantar", heroKey: "peito-frango",
        items: [
          { foodKey: "peito-frango", name: "Peito de frango grelhado", qty: 170, unit: "g", kcal: 281, scaleGroup: "protein" },
          { foodKey: "macarrao-espaguete", name: "Macarrão integral", qty: 150, unit: "g", kcal: 234, scaleGroup: "carb" },
          { foodKey: "abacate", name: "Abacate", qty: 50, unit: "g", kcal: 96, scaleGroup: "fat" },
        ],
      },
    ],
  },
];

let _seq = 0;
function seedId(prefix: string) {
  _seq += 1;
  return `seed-${prefix}-${_seq}`;
}

/** Converte um seed em `PlannerTemplate` puro (ainda sem materializedEquivalents). */
export function seedToPlannerTemplate(seed: SmartTemplateSeed): PlannerTemplate {
  const meals: PlannerMeal[] = seed.meals.map((m) => {
    const items: PlannerFoodItem[] = m.items.map((it) => ({
      id: seedId("food"),
      foodKey: it.foodKey,
      name: it.name,
      qty: it.qty,
      unit: it.unit,
      kcal: it.kcal,
      scaleGroup: it.scaleGroup,
    }));
    return {
      id: seedId("meal"),
      time: m.time,
      label: m.label,
      heroKey: m.heroKey,
      main: {
        id: seedId("option"),
        title: m.label,
        imageKey: m.heroKey,
        items,
      },
      equivalents: [],
    };
  });
  const totalKcal = meals.reduce(
    (sum, m) => sum + m.main.items.reduce((s, it) => s + (it.kcal ?? 0), 0),
    0,
  );
  return {
    id: `seed-${seed.slug}`,
    name: seed.name,
    category: seed.category as PlannerTemplate["category"],
    description: seed.finalidade,
    tags: [seed.category.toLowerCase(), "smart-seed"],
    kcal: Math.round(totalKcal),
    meals,
  };
}
