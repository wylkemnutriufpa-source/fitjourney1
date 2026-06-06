import type {
  DietTemplate as LegacyDietTemplate,
  FoodItem as LegacyFoodItem,
  MealSlot as LegacyMealSlot,
} from "./template-data";
import { recalcMaterializedEquivalents } from "@/components/meal-editor/recalc";
import { tacoCatalog } from "@/lib/substitutions/taco-catalog";

export type ScaleGroup =
  | "carb"
  | "protein"
  | "fruit"
  | "dairy"
  | "fat"
  | "vegetable"
  | "beverage"
  | "mixed";

export type PlannerFoodItem = {
  id: string;
  foodKey: string;
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  scaleGroup: ScaleGroup;
  /**
   * Templates Inteligentes — Fase 1.
   * Substituições materializadas (congeladas no momento do save).
   * `undefined` = item sem bloco de substituição (compat retroativa total).
   * Tudo dentro é editável pelo profissional.
   */
  materializedEquivalents?: MaterializedEquivalents;
};

/** Critério escolhido pelo profissional no bloco. "auto" = derivado do scaleGroup. */
export type BlockCriterion = "auto" | "protein" | "carb" | "fat" | "energy";

export type MaterializedEquivalentOption = {
  foodKey: string;
  name: string;
  /** Assinatura clínica opcional; snapshots antigos podem não conter. */
  scaleGroup?: ScaleGroup;
  qty: number;
  unit: string;
  kcal: number;
  proteinG?: number;
  carbG?: number;
  fatG?: number;
  /** Slug da imagem (default: foodKey). Editável pelo profissional. */
  imageSlug?: string;
};

export type MaterializedEquivalents = {
  /** Critério usado na última materialização. */
  criterion: BlockCriterion;
  /** ISO timestamp de quando as opções foram calculadas/editadas. */
  generatedAt: string;
  /** Versão do catálogo TACO usada (auditoria). */
  catalogVersion: string;
  /** 1–4 opções. Editáveis individualmente. */
  options: MaterializedEquivalentOption[];
};

export type PlannerMealOption = {
  id: string;
  title: string;
  imageKey: string;
  items: PlannerFoodItem[];
  recipe?: string;
};

export type PlannerMeal = {
  id: string;
  time: string;
  label: string;
  main: PlannerMealOption;
  equivalents: PlannerMealOption[];
  heroKey?: string;
  /** True quando o profissional escolheu a imagem manualmente — não deve ser sobrescrita por inferência automática. */
  heroLocked?: boolean;
};


export type PlannerTemplate = Omit<LegacyDietTemplate, "kcal" | "meals"> & {
  kcal: number;
  meals: PlannerMeal[];
};

type BlueprintItem = {
  foodKey?: string;
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  scaleGroup: ScaleGroup;
};

type Blueprint = {
  title?: string;
  baseQty: number;
  imageKey?: string;
  items: BlueprintItem[];
  recipe?: string;
};

let idCounter = 0;

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function round(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function scaleItem(item: BlueprintItem, factor: number, fallbackKey: string): PlannerFoodItem {
  return {
    id: nextId("food"),
    foodKey: item.foodKey ?? fallbackKey,
    name: item.name,
    qty: round(item.qty * factor),
    unit: item.unit,
    kcal: round(item.kcal * factor),
    scaleGroup: item.scaleGroup,
  };
}

const recipeBook: Record<string, Blueprint> = {
  "pao-com-ovo": {
    baseQty: 1,
    items: [
      { name: "Pão francês", qty: 1, unit: "unid", kcal: 140, scaleGroup: "carb" },
      { name: "Ovo", qty: 1, unit: "unid", kcal: 78, scaleGroup: "protein" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
    recipe:
      "1. Prepare o ovo cozido, mexido ou na frigideira antiaderente.\n2. Sirva com 1 pão francês.\n3. Finalize com café sem açúcar ou com adoçante, se necessário.",
  },
  "pao-com-queijo": {
    baseQty: 1,
    items: [
      { name: "Pão francês", qty: 1, unit: "unid", kcal: 140, scaleGroup: "carb" },
      { name: "Queijo branco", qty: 30, unit: "g", kcal: 75, scaleGroup: "dairy" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "tapioca-com-ovo": {
    baseQty: 1,
    items: [
      { name: "Goma de tapioca", qty: 50, unit: "g", kcal: 115, scaleGroup: "carb" },
      { name: "Ovo", qty: 1, unit: "unid", kcal: 78, scaleGroup: "protein" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
    recipe:
      "1. Aqueça a frigideira e espalhe a goma de tapioca.\n2. Recheie com o ovo já preparado.\n3. Dobre e sirva imediatamente.",
  },
  "tapioca-com-queijo": {
    baseQty: 1,
    items: [
      { name: "Goma de tapioca", qty: 50, unit: "g", kcal: 115, scaleGroup: "carb" },
      { name: "Queijo branco", qty: 30, unit: "g", kcal: 75, scaleGroup: "dairy" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "cuscuz-com-ovo": {
    baseQty: 1,
    items: [
      { name: "Cuscuz de milho cozido", qty: 120, unit: "g", kcal: 135, scaleGroup: "carb" },
      { name: "Ovo", qty: 1, unit: "unid", kcal: 78, scaleGroup: "protein" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
    recipe:
      "1. Hidrate o flocão e cozinhe no cuscuzeiro.\n2. Prepare o ovo separadamente.\n3. Sirva o cuscuz com o ovo e café.",
  },
  crepioca: {
    baseQty: 1,
    items: [
      { name: "Goma de tapioca", qty: 30, unit: "g", kcal: 70, scaleGroup: "carb" },
      { name: "Ovo", qty: 1, unit: "unid", kcal: 78, scaleGroup: "protein" },
      { name: "Queijo branco", qty: 20, unit: "g", kcal: 50, scaleGroup: "dairy" },
    ],
    recipe:
      "1. Misture a goma com o ovo até ficar homogêneo.\n2. Despeje na frigideira antiaderente.\n3. Adicione o queijo, dobre e cozinhe dos dois lados.",
  },
  omelete: {
    baseQty: 1,
    items: [
      { name: "Ovo", qty: 2, unit: "unid", kcal: 156, scaleGroup: "protein" },
      { name: "Tomate picado", qty: 40, unit: "g", kcal: 8, scaleGroup: "vegetable" },
      { name: "Cheiro-verde", qty: 5, unit: "g", kcal: 1, scaleGroup: "vegetable" },
    ],
    recipe:
      "1. Bata os ovos.\n2. Misture tomate e cheiro-verde.\n3. Cozinhe em frigideira antiaderente até firmar.",
  },
  "ovos-com-bacon": {
    baseQty: 1,
    items: [
      { name: "Ovo", qty: 2, unit: "unid", kcal: 156, scaleGroup: "protein" },
      { name: "Bacon", qty: 20, unit: "g", kcal: 110, scaleGroup: "fat" },
    ],
  },
  "mingau-de-aveia": {
    baseQty: 200,
    items: [
      { name: "Aveia em flocos", qty: 30, unit: "g", kcal: 116, scaleGroup: "carb" },
      { name: "Leite", qty: 170, unit: "ml", kcal: 95, scaleGroup: "dairy" },
      { name: "Canela", qty: 1, unit: "g", kcal: 3, scaleGroup: "mixed" },
    ],
    recipe:
      "1. Misture aveia e leite.\n2. Leve ao fogo baixo mexendo até engrossar.\n3. Finalize com canela.",
  },
  "banana-com-aveia": {
    baseQty: 1,
    items: [
      { name: "Banana", qty: 1, unit: "unid", kcal: 90, scaleGroup: "fruit" },
      { name: "Aveia em flocos", qty: 20, unit: "g", kcal: 78, scaleGroup: "carb" },
    ],
  },
  "mamao-com-aveia": {
    baseQty: 1,
    items: [
      { name: "Mamão", qty: 150, unit: "g", kcal: 60, scaleGroup: "fruit" },
      { name: "Aveia em flocos", qty: 20, unit: "g", kcal: 78, scaleGroup: "carb" },
    ],
  },
  "iogurte-com-fruta": {
    baseQty: 1,
    items: [
      { name: "Iogurte natural", qty: 170, unit: "g", kcal: 105, scaleGroup: "dairy" },
      { name: "Fruta picada", qty: 100, unit: "g", kcal: 55, scaleGroup: "fruit" },
    ],
  },
  "iogurte-com-ganola": {
    baseQty: 1,
    items: [
      { name: "Iogurte natural", qty: 170, unit: "g", kcal: 105, scaleGroup: "dairy" },
      { name: "Granola", qty: 30, unit: "g", kcal: 130, scaleGroup: "carb" },
    ],
  },
  "panqueca-proteica": {
    baseQty: 1,
    items: [
      { name: "Ovo", qty: 1, unit: "unid", kcal: 78, scaleGroup: "protein" },
      { name: "Aveia em flocos", qty: 25, unit: "g", kcal: 97, scaleGroup: "carb" },
      { name: "Whey protein", qty: 20, unit: "g", kcal: 80, scaleGroup: "protein" },
    ],
    recipe:
      "1. Bata todos os ingredientes.\n2. Cozinhe em frigideira antiaderente.\n3. Sirva pura ou com fruta.",
  },
  "cha-com-torrada": {
    baseQty: 1,
    items: [
      { name: "Chá", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
      { name: "Torrada integral", qty: 2, unit: "unid", kcal: 70, scaleGroup: "carb" },
    ],
  },
  "cha-com-torrada-e-queijo": {
    baseQty: 1,
    items: [
      { name: "Chá", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
      { name: "Torrada integral", qty: 2, unit: "unid", kcal: 70, scaleGroup: "carb" },
      { name: "Queijo branco", qty: 25, unit: "g", kcal: 63, scaleGroup: "dairy" },
    ],
  },
  "vitamina-de-fruta": {
    baseQty: 300,
    items: [
      { name: "Leite", qty: 200, unit: "ml", kcal: 112, scaleGroup: "dairy" },
      { name: "Banana", qty: 1, unit: "unid", kcal: 90, scaleGroup: "fruit" },
      { name: "Aveia em flocos", qty: 15, unit: "g", kcal: 58, scaleGroup: "carb" },
    ],
    recipe:
      "1. Bata leite, fruta e aveia no liquidificador.\n2. Sirva gelado.",
  },
  "smoff-de-frutas": {
    baseQty: 300,
    items: [
      { name: "Frutas vermelhas", qty: 120, unit: "g", kcal: 58, scaleGroup: "fruit" },
      { name: "Iogurte natural", qty: 150, unit: "g", kcal: 93, scaleGroup: "dairy" },
      { name: "Banana", qty: 1, unit: "unid", kcal: 90, scaleGroup: "fruit" },
    ],
  },
  "sanduiche-natural": {
    baseQty: 1,
    items: [
      { name: "Pão integral", qty: 2, unit: "fatia", kcal: 130, scaleGroup: "carb" },
      { name: "Queijo branco", qty: 30, unit: "g", kcal: 75, scaleGroup: "dairy" },
      { name: "Tomate", qty: 30, unit: "g", kcal: 6, scaleGroup: "vegetable" },
      { name: "Alface", qty: 20, unit: "g", kcal: 3, scaleGroup: "vegetable" },
    ],
  },
  "sanduiche-natural-de-frango": {
    baseQty: 1,
    items: [
      { name: "Pão integral", qty: 2, unit: "fatia", kcal: 130, scaleGroup: "carb" },
      { name: "Frango desfiado", qty: 70, unit: "g", kcal: 116, scaleGroup: "protein" },
      { name: "Tomate", qty: 30, unit: "g", kcal: 6, scaleGroup: "vegetable" },
      { name: "Alface", qty: 20, unit: "g", kcal: 3, scaleGroup: "vegetable" },
    ],
  },
  "pao-com-frango-desfiado": {
    baseQty: 1,
    items: [
      { name: "Pão integral", qty: 2, unit: "fatia", kcal: 130, scaleGroup: "carb" },
      { name: "Frango desfiado", qty: 80, unit: "g", kcal: 132, scaleGroup: "protein" },
    ],
  },
  "acai-com-tapioca": {
    baseQty: 1,
    items: [
      { name: "Açaí puro", qty: 250, unit: "ml", kcal: 170, scaleGroup: "fruit" },
      { name: "Tapioca", qty: 40, unit: "g", kcal: 92, scaleGroup: "carb" },
    ],
  },
  "acai-com-aveia": {
    baseQty: 1,
    items: [
      { name: "Açaí puro", qty: 250, unit: "ml", kcal: 170, scaleGroup: "fruit" },
      { name: "Aveia em flocos", qty: 20, unit: "g", kcal: 78, scaleGroup: "carb" },
    ],
  },
  "acai-com-frango": {
    baseQty: 1,
    items: [
      { name: "Açaí puro", qty: 250, unit: "ml", kcal: 170, scaleGroup: "fruit" },
      { name: "Frango grelhado", qty: 120, unit: "g", kcal: 198, scaleGroup: "protein" },
    ],
  },
  "acai-com-peixe-frito": {
    baseQty: 1,
    items: [
      { name: "Açaí puro", qty: 250, unit: "ml", kcal: 170, scaleGroup: "fruit" },
      { name: "Peixe", qty: 120, unit: "g", kcal: 210, scaleGroup: "protein" },
    ],
  },
  "pupunha-com-cafe": {
    baseQty: 1,
    items: [
      { name: "Pupunha cozida", qty: 120, unit: "g", kcal: 145, scaleGroup: "carb" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "macaxeira-com-cafe": {
    baseQty: 1,
    items: [
      { name: "Macaxeira cozida", qty: 120, unit: "g", kcal: 150, scaleGroup: "carb" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "bolo-de-macaxeira-com-cafe": {
    baseQty: 1,
    items: [
      { name: "Bolo de macaxeira", qty: 80, unit: "g", kcal: 220, scaleGroup: "carb" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "bolo-de-milho-com-cafe": {
    baseQty: 1,
    items: [
      { name: "Bolo de milho", qty: 80, unit: "g", kcal: 210, scaleGroup: "carb" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "farofa-de-ovo-com-cafe": {
    baseQty: 1,
    items: [
      { name: "Farofa de ovo", qty: 80, unit: "g", kcal: 250, scaleGroup: "carb" },
      { name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    ],
  },
  "peixe-com-legumes": {
    baseQty: 200,
    items: [
      { name: "Peixe", qty: 130, unit: "g", kcal: 156, scaleGroup: "protein" },
      { name: "Legumes cozidos", qty: 70, unit: "g", kcal: 28, scaleGroup: "vegetable" },
    ],
  },
  "frango-com-batata-doce": {
    baseQty: 200,
    items: [
      { name: "Frango grelhado", qty: 120, unit: "g", kcal: 198, scaleGroup: "protein" },
      { name: "Batata doce cozida", qty: 80, unit: "g", kcal: 69, scaleGroup: "carb" },
    ],
  },
  "carne-com-batata": {
    baseQty: 200,
    items: [
      { name: "Carne cozida", qty: 120, unit: "g", kcal: 240, scaleGroup: "protein" },
      { name: "Batata cozida", qty: 80, unit: "g", kcal: 62, scaleGroup: "carb" },
    ],
  },
  "canja-de-galinha-com-legumes": {
    baseQty: 400,
    items: [
      { name: "Caldo/canja", qty: 250, unit: "ml", kcal: 70, scaleGroup: "beverage" },
      { name: "Frango desfiado", qty: 70, unit: "g", kcal: 116, scaleGroup: "protein" },
      { name: "Arroz", qty: 50, unit: "g", kcal: 65, scaleGroup: "carb" },
      { name: "Legumes", qty: 30, unit: "g", kcal: 12, scaleGroup: "vegetable" },
    ],
  },
  "sopa-de-legumes": {
    baseQty: 400,
    items: [
      { name: "Caldo da sopa", qty: 250, unit: "ml", kcal: 45, scaleGroup: "beverage" },
      { name: "Legumes cozidos", qty: 150, unit: "g", kcal: 60, scaleGroup: "vegetable" },
    ],
    recipe:
      "1. Cozinhe os legumes até ficarem macios.\n2. Bata parte deles para engrossar o caldo.\n3. Ajuste sal e ervas conforme a estratégia clínica.",
  },
  "salada-completa": {
    baseQty: 250,
    items: [
      { name: "Folhas", qty: 80, unit: "g", kcal: 15, scaleGroup: "vegetable" },
      { name: "Legumes crus/cozidos", qty: 120, unit: "g", kcal: 48, scaleGroup: "vegetable" },
      { name: "Proteína magra", qty: 50, unit: "g", kcal: 83, scaleGroup: "protein" },
      { name: "Azeite", qty: 5, unit: "ml", kcal: 45, scaleGroup: "fat" },
    ],
  },
  "macarrao-com-carne-moida": {
    baseQty: 250,
    items: [
      { name: "Macarrão cozido", qty: 150, unit: "g", kcal: 235, scaleGroup: "carb" },
      { name: "Carne moída", qty: 100, unit: "g", kcal: 215, scaleGroup: "protein" },
    ],
  },
  "macarronada-de-camarao": {
    baseQty: 250,
    items: [
      { name: "Macarrão cozido", qty: 150, unit: "g", kcal: 235, scaleGroup: "carb" },
      { name: "Camarão", qty: 100, unit: "g", kcal: 99, scaleGroup: "protein" },
    ],
  },
  "strogonoff-de-carne": {
    baseQty: 200,
    items: [
      { name: "Carne", qty: 120, unit: "g", kcal: 240, scaleGroup: "protein" },
      { name: "Molho cremoso", qty: 80, unit: "g", kcal: 110, scaleGroup: "fat" },
    ],
  },
  "strogonoff-de-frango-light": {
    baseQty: 200,
    items: [
      { name: "Frango", qty: 120, unit: "g", kcal: 198, scaleGroup: "protein" },
      { name: "Molho leve", qty: 80, unit: "g", kcal: 85, scaleGroup: "fat" },
    ],
  },
  "strogonoff-de-camarao": {
    baseQty: 200,
    items: [
      { name: "Camarão", qty: 120, unit: "g", kcal: 118, scaleGroup: "protein" },
      { name: "Molho cremoso", qty: 80, unit: "g", kcal: 110, scaleGroup: "fat" },
    ],
  },
};

function inferGroup(foodKey: string, name: string): ScaleGroup {
  const hay = `${foodKey} ${name}`.toLowerCase();
  if (/frango|carne|tilapia|peixe|porco|acem|maminha|picanha|lombo|costela|camarao|ovo/.test(hay)) return "protein";
  if (/pao|tapioca|cuscuz|crepioca|macarra|arroz|aveia|granola|bolo|macaxeira|batata|milho|farofa|pupunha/.test(hay)) return "carb";
  if (/iogurte|leite|queijo/.test(hay)) return "dairy";
  if (/banana|maca|pera|mamao|manga|melancia|melao|abacaxi|goiaba|laranja|uva|morango|frutas|acai/.test(hay)) return "fruit";
  if (/azeite|bacon/.test(hay)) return "fat";
  if (/cha|cafe|caldo|sopa|vitamina|smoothie/.test(hay)) return "beverage";
  if (/salada|legumes|folhas|brocolis|espinafre|tomate|alface/.test(hay)) return "vegetable";
  return "mixed";
}

function estimateKcal(food: LegacyFoodItem) {
  const group = inferGroup(food.foodKey, food.name);
  if (food.unit === "g") {
    const density: Record<ScaleGroup, number> = {
      protein: 1.65,
      carb: 1.25,
      fruit: 0.65,
      dairy: 0.62,
      fat: 8.8,
      vegetable: 0.35,
      beverage: 0.15,
      mixed: 1.1,
    };
    return round(food.qty * density[group]);
  }
  if (food.unit === "ml") {
    const density: Record<ScaleGroup, number> = {
      protein: 0.8,
      carb: 0.7,
      fruit: 0.65,
      dairy: 0.55,
      fat: 8.8,
      vegetable: 0.2,
      beverage: 0.12,
      mixed: 0.4,
    };
    return round(food.qty * density[group]);
  }

  const defaults: Partial<Record<string, number>> = {
    "ovos-cozidos": 78,
    "ovos-mexidos": 78,
    maca: 72,
    pera: 80,
    goiaba: 68,
    laranja: 62,
    "pao-de-queijo": 90,
    "torrada-integral": 35,
  };

  return round(food.qty * (defaults[food.foodKey] ?? 100));
}

function fallbackOption(food: LegacyFoodItem): PlannerMealOption {
  const group = inferGroup(food.foodKey, food.name);
  return {
    id: nextId("option"),
    title: food.name,
    imageKey: food.foodKey,
    items: [
      {
        id: nextId("food"),
        foodKey: food.foodKey,
        name: food.name,
        qty: food.qty,
        unit: food.unit,
        kcal: estimateKcal(food),
        scaleGroup: group,
      },
    ],
  };
}

function legacyFoodToOption(food: LegacyFoodItem): PlannerMealOption {
  const blueprint = recipeBook[food.foodKey];
  if (!blueprint) return fallbackOption(food);

  const factor = food.qty > 0 ? food.qty / blueprint.baseQty : 1;
  return {
    id: nextId("option"),
    title: blueprint.title ?? food.name,
    imageKey: blueprint.imageKey ?? food.foodKey,
    recipe: blueprint.recipe,
    items: blueprint.items.map((item) => scaleItem(item, factor, food.foodKey)),
  };
}

export function mealKcalFromOption(option: PlannerMealOption) {
  return round(option.items.reduce((sum, item) => sum + item.kcal, 0));
}

export function mealKcal(meal: PlannerMeal) {
  return mealKcalFromOption(meal.main);
}

export function templateKcal(meals: PlannerMeal[]) {
  return round(meals.reduce((sum, meal) => sum + mealKcal(meal), 0));
}

export function optionPreview(option: PlannerMealOption) {
  return option.items.map((item) => `${item.qty} ${item.unit} ${item.name}`).join(" · ");
}

export function clonePlannerTemplate(template: PlannerTemplate) {
  return clone(template);
}

function isPlannerMealOption(value: unknown): value is PlannerMealOption {
  return Boolean(
    value &&
      typeof value === "object" &&
      "items" in value &&
      Array.isArray((value as PlannerMealOption).items),
  );
}

function normalizePlannerFoodItem(item: PlannerFoodItem): PlannerFoodItem {
  return {
    ...item,
    id: item.id || nextId("food"),
    kcal: round(item.kcal),
    qty: round(item.qty),
    scaleGroup: item.scaleGroup || inferGroup(item.foodKey, item.name),
  };
}

function normalizePlannerMealOption(option: PlannerMealOption): PlannerMealOption {
  return {
    ...option,
    id: option.id || nextId("option"),
    imageKey: option.imageKey || option.items[0]?.foodKey || "iogurte-natural",
    items: option.items.map(normalizePlannerFoodItem),
  };
}

export function toPlannerTemplate(template: LegacyDietTemplate | PlannerTemplate): PlannerTemplate {
  const maybePlanner = template as PlannerTemplate;
  if (maybePlanner.meals?.every((meal) => isPlannerMealOption((meal as PlannerMeal).main))) {
    const normalizedMeals = maybePlanner.meals.map((meal) => ({
      ...meal,
      main: normalizePlannerMealOption(meal.main),
      equivalents: meal.equivalents.map(normalizePlannerMealOption),
      heroKey: meal.heroKey || meal.main.imageKey,
    }));

    return {
      ...maybePlanner,
      meals: normalizedMeals,
      kcal: templateKcal(normalizedMeals),
    };
  }

  const legacy = template as LegacyDietTemplate;
  const meals = legacy.meals.map((meal: LegacyMealSlot) => {
    const isMainMeal = /almo[çc]o|jantar/i.test(meal.label);
    const main = legacyFoodToOption(meal.main);
    const equivalents = meal.equivalents.map(legacyFoodToOption);
    return {
      id: meal.id,
      time: meal.time,
      label: meal.label,
      heroKey: meal.heroKey ?? meal.main.foodKey,
      main: isMainMeal ? withLunchSides(main) : main,
      equivalents: isMainMeal ? equivalents.map(withLunchSides) : equivalents,
    };
  });

  return {
    ...legacy,
    meals,
    kcal: templateKcal(meals),
  };
}

/**
 * Garante que pratos de almoço/jantar tenham acompanhamento padrão:
 * arroz + feijão + salada livre + fruta de sobremesa.
 * Só anexa o que ainda não estiver presente (detecção por nome).
 */
function withLunchSides(option: PlannerMealOption): PlannerMealOption {
  const has = (re: RegExp) => option.items.some((i) => re.test(i.name.toLowerCase()));
  const additions: BlueprintItem[] = [];
  if (!has(/arroz|macarra|cuscuz|batata|macaxeira|pupunha|p[ãa]o|tapioca|quinoa|farofa/)) {
    additions.push({ name: "Arroz cozido", qty: 100, unit: "g", kcal: 128, scaleGroup: "carb" });
  }
  if (!has(/feij[ãa]o|lentilha|gr[ãa]o-de-bico|ervilha/)) {
    additions.push({ name: "Feijão cozido", qty: 80, unit: "g", kcal: 60, scaleGroup: "protein" });
  }
  if (!has(/salada|folhas|alface|r[úu]cula/)) {
    additions.push({ name: "Salada verde (livre)", qty: 1, unit: "à vontade", kcal: 30, scaleGroup: "vegetable" });
  }
  if (!has(/fruta|ma[çc][ãa]|banana|mam[ãa]o|melancia|mel[ãa]o|abacaxi|manga|laranja|pera|uva|morango|goiaba|sobremesa/)) {
    additions.push({ name: "Fruta de sobremesa", qty: 1, unit: "unid", kcal: 70, scaleGroup: "fruit" });
  }
  if (additions.length === 0) return option;
  return {
    ...option,
    items: [...option.items, ...additions.map((b) => scaleItem(b, 1, option.imageKey))],
  };
}

export function getTemplateHero(template: LegacyDietTemplate | PlannerTemplate) {
  const planner = toPlannerTemplate(template);
  return planner.meals[0]?.heroKey ?? planner.meals[0]?.main.imageKey;
}

function groupTotals(items: PlannerFoodItem[]) {
  return items.reduce<Record<ScaleGroup, number>>((acc, item) => {
    acc[item.scaleGroup] = round((acc[item.scaleGroup] ?? 0) + item.qty);
    return acc;
  }, {
    carb: 0,
    protein: 0,
    fruit: 0,
    dairy: 0,
    fat: 0,
    vegetable: 0,
    beverage: 0,
    mixed: 0,
  });
}

export function updateMainItemWithScaling(
  meal: PlannerMeal,
  itemId: string,
  updater: (item: PlannerFoodItem) => PlannerFoodItem,
) {
  const previousItems = meal.main.items;
  const nextItems = previousItems.map((item) =>
    item.id === itemId ? normalizePlannerFoodItem(updater(item)) : item,
  );

  const before = groupTotals(previousItems);
  const after = groupTotals(nextItems);

  const ratios = Object.fromEntries(
    (Object.keys(before) as ScaleGroup[]).map((group) => [
      group,
      before[group] > 0 ? after[group] / before[group] : 1,
    ]),
  ) as Record<ScaleGroup, number>;

  return {
    ...meal,
    main: {
      ...meal.main,
      items: nextItems,
    },
    equivalents: meal.equivalents.map((option) => ({
      ...option,
      items: option.items.map((item) => {
        const ratio = ratios[item.scaleGroup] ?? 1;
        if (!Number.isFinite(ratio) || ratio === 1) return item;
        return {
          ...item,
          qty: round(item.qty * ratio),
          kcal: round(item.kcal * ratio),
        };
      }),
    })),
  };
}

export function createEmptyFoodItem(overrides?: Partial<PlannerFoodItem>): PlannerFoodItem {
  return {
    id: nextId("food"),
    foodKey: overrides?.foodKey ?? "iogurte-natural",
    name: overrides?.name ?? "Novo item",
    qty: overrides?.qty ?? 1,
    unit: overrides?.unit ?? "unid",
    kcal: overrides?.kcal ?? 50,
    scaleGroup: overrides?.scaleGroup ?? "mixed",
  };
}

export function createEmptyMealOption(overrides?: Partial<PlannerMealOption>): PlannerMealOption {
  return {
    id: nextId("option"),
    title: overrides?.title ?? "Nova opção",
    imageKey: overrides?.imageKey ?? "iogurte-natural",
    recipe: overrides?.recipe,
    items: overrides?.items ?? [createEmptyFoodItem()],
  };
}

export function createEmptyMeal(): PlannerMeal {
  return {
    id: nextId("meal"),
    time: "12:00",
    label: "Nova refeição",
    heroKey: "frango-grelhado",
    main: createEmptyMealOption({
      title: "Principal",
      imageKey: "frango-grelhado",
      items: [
        createEmptyFoodItem({
          foodKey: "frango-grelhado",
          name: "Frango grelhado",
          qty: 150,
          unit: "g",
          kcal: 248,
          scaleGroup: "protein",
        }),
      ],
    }),
    equivalents: [],
  };
}

/**
 * Esqueleto vazio para o profissional montar um plano do zero.
 * 4 refeições típicas (café, almoço, lanche, jantar) sem alimentos.
 * Profissional adiciona itens — substituições equivalentes são injetadas
 * automaticamente pelo editor via regras curadas.
 */
export function createEmptyTemplate(): PlannerTemplate {
  function blank(time: string, label: string, hero: string): PlannerMeal {
    return {
      id: nextId("meal"),
      time,
      label,
      heroKey: hero,
      main: {
        id: nextId("option"),
        title: label,
        imageKey: hero,
        items: [],
      },
      equivalents: [],
    };
  }
  const meals: PlannerMeal[] = [
    blank("07:00", "Café da manhã", "iogurte-natural"),
    blank("12:30", "Almoço", "frango-grelhado"),
    blank("16:00", "Lanche da tarde", "iogurte-natural"),
    blank("20:00", "Jantar", "frango-grelhado"),
  ];
  return {
    id: `blank-${nextId("tpl")}`,
    name: "Plano do zero",
    category: "Esportivo",
    description: "Plano elaborado do zero pelo profissional.",
    tags: ["custom"],
    kcal: 0,
    meals,
  };
}

export function normalizeStoredPlannerTemplate(template: unknown): PlannerTemplate | null {
  if (!template || typeof template !== "object") return null;
  try {
    return toPlannerTemplate(template as LegacyDietTemplate | PlannerTemplate);
  } catch {
    return null;
  }
}
