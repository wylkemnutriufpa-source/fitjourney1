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
