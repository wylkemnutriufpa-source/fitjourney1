// Converte uma Fase de protocolo em um PlannerTemplate editável,
// para que o profissional possa abrir no Editor (Templates) e usar todas
// as funcionalidades (substituições semi-automáticas, drag & drop, etc.).
//
// Determinístico. Sem IO.

import type {
  PlannerTemplate,
  PlannerMeal,
  PlannerFoodItem,
  ScaleGroup,
} from "@/lib/meal-planner";
import type {
  ProtocolDescriptor,
  ProtocolModule,
  ProtocolPhase,
  PhaseMealItem,
} from "./catalog";

// Mapeamento determinístico foodKey -> scaleGroup para os itens do IFJ e
// genéricos comuns. Fallback heurístico por nome para foodKeys novos.
const SCALE_BY_KEY: Record<string, ScaleGroup> = {
  // carbs
  aveia: "carb",
  "arroz-integral": "carb",
  "arroz-branco": "carb",
  pao: "carb",
  tapioca: "carb",
  cuscuz: "carb",
  // proteins
  whey: "protein",
  "frango-grelhado": "protein",
  "peixe-grelhado": "protein",
  "carne-moida": "protein",
  patinho: "protein",
  ovo: "protein",
  feijao: "protein",
  // dairy
  "iogurte-grego": "dairy",
  "queijo-minas": "dairy",
  // fruit
  maca: "fruit",
  banana: "fruit",
  // fat
  castanha: "fat",
  abacate: "fat",
  azeite: "fat",
  // vegetable
  "salada-verde": "vegetable",
  legumes: "vegetable",
  brocolis: "vegetable",
};

function inferScaleGroup(item: PhaseMealItem): ScaleGroup {
  const direct = SCALE_BY_KEY[item.foodKey];
  if (direct) return direct;
  const n = item.name.toLowerCase();
  if (/(frango|peixe|tilapia|salmão|salmao|carne|patinho|ovo|whey|atum)/.test(n)) return "protein";
  if (/(arroz|aveia|pão|pao|cuscuz|tapioca|batata|mandioca|inhame|quinoa|macarr)/.test(n)) return "carb";
  if (/(iogurte|queijo|leite|cottage)/.test(n)) return "dairy";
  if (/(maçã|maca|banana|kiwi|morango|laranja|mamão|mamao|fruta)/.test(n)) return "fruit";
  if (/(castanha|amêndoa|amendoa|abacate|azeite|amendoim|óleo|oleo)/.test(n)) return "fat";
  if (/(salada|legume|brócolis|brocolis|couve|abobrinha|berinjela|cenoura|tomate|pepino|alface|rúcula|rucula|espinafre)/.test(n)) return "vegetable";
  return "mixed";
}

let _uid = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${++_uid}`;

function toFoodItem(it: PhaseMealItem): PlannerFoodItem {
  return {
    id: nid("food"),
    foodKey: it.foodKey,
    name: it.name,
    qty: it.quantityG,
    unit: "g",
    kcal: it.kcal,
    scaleGroup: inferScaleGroup(it),
  };
}

export function protocolPhaseToPlannerTemplate(
  protocol: ProtocolDescriptor,
  mod: ProtocolModule,
  phase: ProtocolPhase,
): PlannerTemplate {
  const meals: PlannerMeal[] = (phase.meals ?? []).map((m) => {
    const items = m.items.map(toFoodItem);
    // hero = primeiro item proteína (almoço/jantar) ou primeiro carb (café/lanche)
    const heroCandidate =
      items.find((i) => i.scaleGroup === "protein") ??
      items.find((i) => i.scaleGroup === "carb") ??
      items[0];
    const heroKey = heroCandidate?.foodKey ?? "frango-grelhado";
    return {
      id: nid("meal"),
      time: m.time,
      label: m.name,
      heroKey,
      main: {
        id: nid("option"),
        title: m.name,
        imageKey: heroKey,
        items,
      },
      equivalents: [],
    };
  });

  return {
    id: `protocol-${protocol.id}-${mod.id}-${phase.id}`,
    name: `${protocol.name} · ${mod.name} · ${phase.name}`,
    category: "Esportivo",
    description: phase.description,
    tags: ["protocolo", protocol.id, mod.id],
    kcal: phase.dailyKcalTarget ?? 0,
    meals,
  };
}
