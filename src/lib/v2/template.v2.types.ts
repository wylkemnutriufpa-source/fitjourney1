// Piloto V2 — tipos do "item soberano". NÃO importar em produção.
// Coexiste com src/lib/template-data.ts sem afetá-lo.

export type ScaleGroupV2 = "protein" | "carb" | "fat" | "mixed";

export type ItemMeasureV2 = {
  /** Ex.: "1 filé médio", "2 colheres de sopa", "1 posta". */
  label: string;
  /** Equivalência aproximada em gramas. Opcional (livre). */
  gramsEquivalent?: number;
  /** true = sugerida pelo sistema; false/ausente = livre, digitada pelo nutri. */
  fromCatalog?: boolean;
};

export type ItemSubstitutionV2 = {
  foodKey: string;
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  scaleGroup: ScaleGroupV2;
  /** Observação curta opcional ("preferir grelhado"). */
  note?: string;
};

export type PlannerFoodItemV2 = {
  id: string;
  foodKey: string;
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  scaleGroup: ScaleGroupV2;
  measures?: ItemMeasureV2[];
  substitutions?: ItemSubstitutionV2[];
  notes?: string;
};

export type PlannerMealV2 = {
  id: string;
  time: string;
  label: string;
  items: PlannerFoodItemV2[];
  notes?: string;
  heroKey?: string;
};

export type DayIdV2 =
  | "seg"
  | "ter"
  | "qua"
  | "qui"
  | "sex"
  | "sab"
  | "dom";

export type PlannerDayV2 = {
  id: DayIdV2;
  label: string;
  meals: PlannerMealV2[];
};

export type PlannerTemplateV2 = {
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
  days: PlannerDayV2[];
  /** Marcador explícito de piloto. */
  v2: true;
};

export const DAY_ORDER_V2: DayIdV2[] = [
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sab",
  "dom",
];

export const DAY_LABEL_V2: Record<DayIdV2, string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};
