// Piloto V2 — Template real de Hipertrofia (~3000 kcal × 7 dias).
// Composição soberana. Não importa de produção. Não é referenciado em produção.

import type {
  PlannerTemplateV2,
  PlannerDayV2,
  PlannerMealV2,
  PlannerFoodItemV2,
} from "./template.v2.types";
import { DAY_ORDER_V2, DAY_LABEL_V2 } from "./template.v2.types";

// ---------- Catálogo interno (foods homologados + macros) ----------

type Food = {
  foodKey: string;
  name: string;
  scaleGroup: PlannerFoodItemV2["scaleGroup"];
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
  defaultQty: number;
  defaultUnit: string;
};

const F = {
  // proteínas
  frango: { foodKey: "frango_grelhado", name: "Frango grelhado", scaleGroup: "protein", kcal100: 165, p100: 31, c100: 0, f100: 3.6, defaultQty: 180, defaultUnit: "g" },
  patinho: { foodKey: "patinho", name: "Patinho grelhado", scaleGroup: "protein", kcal100: 190, p100: 35, c100: 0, f100: 5, defaultQty: 150, defaultUnit: "g" },
  tilapia: { foodKey: "tilapia", name: "Filé de tilápia", scaleGroup: "protein", kcal100: 145, p100: 26, c100: 0, f100: 4, defaultQty: 200, defaultUnit: "g" },
  salmao: { foodKey: "salmao", name: "Salmão grelhado", scaleGroup: "protein", kcal100: 208, p100: 22, c100: 0, f100: 13, defaultQty: 150, defaultUnit: "g" },
  ovo: { foodKey: "ovo", name: "Ovo inteiro", scaleGroup: "protein", kcal100: 155, p100: 13, c100: 1, f100: 11, defaultQty: 100, defaultUnit: "g" },
  whey: { foodKey: "whey", name: "Whey protein", scaleGroup: "protein", kcal100: 400, p100: 80, c100: 8, f100: 5, defaultQty: 30, defaultUnit: "g" },
  // carbos
  arroz: { foodKey: "arroz_branco", name: "Arroz branco cozido", scaleGroup: "carb", kcal100: 130, p100: 2.7, c100: 28, f100: 0.3, defaultQty: 150, defaultUnit: "g" },
  arrozIntegral: { foodKey: "arroz_integral", name: "Arroz integral cozido", scaleGroup: "carb", kcal100: 124, p100: 2.6, c100: 26, f100: 1, defaultQty: 150, defaultUnit: "g" },
  feijao: { foodKey: "feijao_carioca", name: "Feijão carioca cozido", scaleGroup: "carb", kcal100: 76, p100: 5, c100: 14, f100: 0.5, defaultQty: 100, defaultUnit: "g" },
  batataDoce: { foodKey: "batata_doce", name: "Batata-doce cozida", scaleGroup: "carb", kcal100: 86, p100: 1.6, c100: 20, f100: 0.1, defaultQty: 200, defaultUnit: "g" },
  macarrao: { foodKey: "macarrao", name: "Macarrão cozido", scaleGroup: "carb", kcal100: 131, p100: 5, c100: 25, f100: 1, defaultQty: 150, defaultUnit: "g" },
  pao: { foodKey: "pao_frances", name: "Pão francês", scaleGroup: "carb", kcal100: 300, p100: 9, c100: 58, f100: 3, defaultQty: 50, defaultUnit: "g" },
  tapioca: { foodKey: "tapioca", name: "Tapioca", scaleGroup: "carb", kcal100: 360, p100: 0, c100: 89, f100: 0, defaultQty: 40, defaultUnit: "g" },
  aveia: { foodKey: "aveia", name: "Aveia em flocos", scaleGroup: "carb", kcal100: 389, p100: 17, c100: 66, f100: 7, defaultQty: 40, defaultUnit: "g" },
  banana: { foodKey: "banana", name: "Banana", scaleGroup: "carb", kcal100: 89, p100: 1.1, c100: 23, f100: 0.3, defaultQty: 120, defaultUnit: "g" },
  // gorduras
  azeite: { foodKey: "azeite", name: "Azeite de oliva", scaleGroup: "fat", kcal100: 884, p100: 0, c100: 0, f100: 100, defaultQty: 10, defaultUnit: "g" },
  castanhas: { foodKey: "castanhas", name: "Mix de castanhas", scaleGroup: "fat", kcal100: 600, p100: 18, c100: 18, f100: 50, defaultQty: 20, defaultUnit: "g" },
  pastaAmendoim: { foodKey: "pasta_amendoim", name: "Pasta de amendoim", scaleGroup: "fat", kcal100: 588, p100: 25, c100: 20, f100: 50, defaultQty: 20, defaultUnit: "g" },
  // mixed
  salada: { foodKey: "salada_verde", name: "Salada verde", scaleGroup: "mixed", kcal100: 20, p100: 1.5, c100: 3, f100: 0.2, defaultQty: 100, defaultUnit: "g" },
  legumes: { foodKey: "legumes", name: "Legumes cozidos", scaleGroup: "mixed", kcal100: 35, p100: 2, c100: 7, f100: 0.3, defaultQty: 120, defaultUnit: "g" },
  // composites (café/lanche) — apontam para foods reais do banco
  paoOvo: { foodKey: "pao_com_ovo", name: "Pão francês com ovo", scaleGroup: "mixed", kcal100: 260, p100: 11.5, c100: 35, f100: 8, defaultQty: 150, defaultUnit: "g" },
  paoQueijo: { foodKey: "pao_com_queijo", name: "Pão francês com queijo", scaleGroup: "mixed", kcal100: 280, p100: 13, c100: 34, f100: 9, defaultQty: 130, defaultUnit: "g" },
  tapiocaOvo: { foodKey: "tapioca_com_ovo", name: "Tapioca com ovo", scaleGroup: "mixed", kcal100: 270, p100: 9, c100: 45, f100: 6, defaultQty: 130, defaultUnit: "g" },
  tapiocaQueijo: { foodKey: "tapioca_com_queijo", name: "Tapioca com queijo", scaleGroup: "mixed", kcal100: 285, p100: 10, c100: 44, f100: 7, defaultQty: 130, defaultUnit: "g" },
  cuscuzOvo: { foodKey: "cuscuz_com_ovo", name: "Cuscuz com ovo", scaleGroup: "mixed", kcal100: 200, p100: 8, c100: 32, f100: 5, defaultQty: 180, defaultUnit: "g" },
  cuscuzQueijo: { foodKey: "cuscuz_com_queijo", name: "Cuscuz com queijo", scaleGroup: "mixed", kcal100: 215, p100: 9, c100: 31, f100: 6, defaultQty: 180, defaultUnit: "g" },
} satisfies Record<string, Food>;

type FoodKey = keyof typeof F;

let _seq = 0;
function nextId(prefix: string) {
  _seq += 1;
  return `${prefix}-${_seq}`;
}

function makeItem(
  idPrefix: string,
  key: FoodKey,
  qty?: number,
  opts?: Partial<Pick<PlannerFoodItemV2, "measures" | "substitutions" | "notes">>,
): PlannerFoodItemV2 {
  const f = F[key];
  const q = qty ?? f.defaultQty;
  const ratio = q / 100;
  return {
    id: nextId(idPrefix),
    foodKey: f.foodKey,
    name: f.name,
    qty: q,
    unit: f.defaultUnit,
    kcal: Math.round(f.kcal100 * ratio),
    proteinG: Math.round(f.p100 * ratio * 10) / 10,
    carbG: Math.round(f.c100 * ratio * 10) / 10,
    fatG: Math.round(f.f100 * ratio * 10) / 10,
    scaleGroup: f.scaleGroup as PlannerFoodItemV2["scaleGroup"],
    measures: opts?.measures,
    substitutions: opts?.substitutions,
    notes: opts?.notes,
  };
}

function sub(key: FoodKey, qty?: number, note?: string) {
  const f = F[key];
  const q = qty ?? f.defaultQty;
  const ratio = q / 100;
  return {
    foodKey: f.foodKey,
    name: f.name,
    qty: q,
    unit: f.defaultUnit,
    kcal: Math.round(f.kcal100 * ratio),
    proteinG: Math.round(f.p100 * ratio * 10) / 10,
    carbG: Math.round(f.c100 * ratio * 10) / 10,
    fatG: Math.round(f.f100 * ratio * 10) / 10,
    scaleGroup: f.scaleGroup as PlannerFoodItemV2["scaleGroup"],
    note,
  };
}

// ---------- Refeições por dia (5 refeições/dia, ~3000 kcal) ----------

function buildDay(dayIdx: number): PlannerMealV2[] {
  // Variação simples por dia: rotaciona proteína e carbo do almoço/jantar.
  const proteins: FoodKey[] = ["frango", "patinho", "tilapia", "frango", "salmao", "patinho", "tilapia"];
  const carbs: FoodKey[] = ["arroz", "arrozIntegral", "batataDoce", "arroz", "macarrao", "arrozIntegral", "batataDoce"];
  const dinnerProtein: FoodKey[] = ["tilapia", "frango", "patinho", "salmao", "frango", "tilapia", "patinho"];

  const lunchProtein = proteins[dayIdx];
  const lunchCarb = carbs[dayIdx];
  const dinnerP = dinnerProtein[dayIdx];

  const meals: PlannerMealV2[] = [
    {
      id: nextId("m"),
      time: "07:00",
      label: "Café da manhã",
      heroKey: "banana-com-aveia",
      notes: "Consumir até 30 min após o preparo.",
      items: [
        makeItem("it", "pao", 100, {
          measures: [
            { label: "2 unidades", gramsEquivalent: 100, fromCatalog: true },
            { label: "1 fatia grande", gramsEquivalent: 40, fromCatalog: false },
          ],
          substitutions: [
            sub("paoOvo"),
            sub("paoQueijo"),
            sub("tapiocaOvo"),
            sub("tapiocaQueijo"),
            sub("cuscuzOvo"),
            sub("cuscuzQueijo"),
            sub("aveia", 50, "com leite"),
          ],
        }),
        makeItem("it", "ovo", 150, {
          notes: "Preferir mexido ou cozido — evitar frituras.",
          measures: [{ label: "3 ovos médios", gramsEquivalent: 150, fromCatalog: true }],
          substitutions: [sub("whey", 30, "Diluir em 200 ml de água."), sub("frango", 100)],
        }),
        makeItem("it", "banana", 120, {
          measures: [{ label: "1 unidade média", gramsEquivalent: 120, fromCatalog: true }],
        }),
      ],
    },
    {
      id: nextId("m"),
      time: "10:00",
      label: "Lanche da manhã",
      heroKey: "acai",
      items: [
        makeItem("it", "whey", 30, {
          substitutions: [sub("ovo", 150), sub("frango", 100)],
        }),
        makeItem("it", "aveia", 40, {
          measures: [{ label: "4 colheres de sopa", gramsEquivalent: 40, fromCatalog: true }],
          substitutions: [sub("banana", 120), sub("tapioca", 40)],
        }),
        makeItem("it", "pastaAmendoim", 20, {
          measures: [{ label: "1 colher de sopa", gramsEquivalent: 20, fromCatalog: true }],
        }),
      ],
    },
    {
      id: nextId("m"),
      time: "13:00",
      label: "Almoço",
      heroKey: "carne-grelhada",
      items: [
        makeItem("it", lunchProtein, undefined, {
          measures: [
            { label: "1 filé grande", gramsEquivalent: 180, fromCatalog: true },
            { label: "2 filés médios", gramsEquivalent: 200, fromCatalog: false },
          ],
          substitutions: [sub("patinho"), sub("tilapia", 200), sub("ovo", 200)],
        }),
        makeItem("it", lunchCarb, undefined, {
          substitutions: [sub("arroz"), sub("batataDoce"), sub("macarrao")],
        }),
        makeItem("it", "feijao", 100, {
          measures: [{ label: "1 concha cheia", gramsEquivalent: 100, fromCatalog: true }],
        }),
        makeItem("it", "salada", 120, {
          notes: "Temperar com azeite e limão.",
        }),
        makeItem("it", "azeite", 10),
      ],
    },
    {
      id: nextId("m"),
      time: "16:30",
      label: "Lanche da tarde",
      heroKey: "banana-com-aveia",
      items: [
        makeItem("it", "banana", 120, {
          substitutions: [sub("aveia", 40), sub("tapioca", 40)],
        }),
        makeItem("it", "castanhas", 25, {
          measures: [{ label: "1 punhado pequeno", gramsEquivalent: 25, fromCatalog: true }],
        }),
        makeItem("it", "whey", 30, {
          substitutions: [sub("ovo", 100), sub("frango", 80)],
        }),
      ],
    },
    {
      id: nextId("m"),
      time: "20:00",
      label: "Jantar",
      heroKey: "bife-acebolado",
      items: [
        makeItem("it", dinnerP, undefined, {
          substitutions: [sub("frango"), sub("patinho"), sub("tilapia", 200)],
        }),
        makeItem("it", "batataDoce", 200, {
          measures: [{ label: "1 unidade média", gramsEquivalent: 200, fromCatalog: true }],
          substitutions: [sub("arroz"), sub("arrozIntegral"), sub("macarrao")],
        }),
        makeItem("it", "legumes", 150, {
          notes: "Brócolis, cenoura ou abobrinha no vapor.",
        }),
        makeItem("it", "azeite", 10),
      ],
    },
  ];

  return meals;
}

const days: PlannerDayV2[] = DAY_ORDER_V2.map((id, idx) => ({
  id,
  label: DAY_LABEL_V2[id],
  meals: buildDay(idx),
}));

export const espHipertrofiaV2Piloto: PlannerTemplateV2 = {
  id: "esp-hipertrofia-v2-piloto",
  name: "Hipertrofia — Piloto V2 (não publicar)",
  category: "Esportivo",
  description:
    "PILOTO V2. Plano hipertrofia ~3000 kcal × 7 dias com itens soberanos (medidas, substituições matriciais e observações por alimento).",
  tags: ["PILOTO_V2", "Hipertrofia"],
  kcal: 3000,
  v2: true,
  days,
};
