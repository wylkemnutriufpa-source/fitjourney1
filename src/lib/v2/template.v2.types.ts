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
  // Campos soberanos — OPCIONAIS no piloto.
  measures?: ItemMeasureV2[];
  substitutions?: ItemSubstitutionV2[];
  notes?: string;
};

export type PlannerMealV2 = {
  id: string;
  time: string;
  label: string;
  /** Composição soberana: lista de itens reais (frango + arroz + feijão...). */
  items: PlannerFoodItemV2[];
  /** Observação de refeição (escopo meal, independente de item.notes). */
  notes?: string;
  heroKey?: string;
};

export type PlannerTemplateV2 = {
  id: string;
  name: string;
  category: "Esportivo" | "Clínico" | "Regional" | "Gestante" | "Pré/Pós-operatório" | "Bariátrica";
  description: string;
  tags: string[];
  kcal: number;
  meals: PlannerMealV2[];
  /** Marcador explícito de piloto. */
  v2: true;
};
