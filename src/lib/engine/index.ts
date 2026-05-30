// Phase 2 — Engine public surface
// Re-exporta APIs puras. Server fns ficam em engine.functions.ts.

export * from "./types";
export { activityFactor, calcTMB, calcTDEE, calcFromAnamnese } from "./tdee";
export { calcMacroTarget } from "./macros";
export { matchTemplates } from "./matcher";
export { validatePlan } from "./clinical-gate";
export type { DailyTotals, FoodOccurrence, GateInput } from "./clinical-gate";
export type { MatchInput } from "./matcher";
export type { MacroInput } from "./macros";
export type { TmbInput } from "./tdee";
