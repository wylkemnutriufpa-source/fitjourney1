// Phase 2 — Nutrition engine types
// Puro. Sem IO. Sem React. Sem Supabase.

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "extreme";

export type Goal = "cut" | "bulk" | "maintain";

export interface AnamneseInput {
  readonly sex: Sex;
  readonly ageYears: number;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly activity: ActivityLevel;
  readonly goal: Goal;
}

export interface MacroTarget {
  readonly kcal: number;
  readonly proteinG: number;
  readonly fatG: number;
  readonly carbG: number;
}

export interface NutritionTargets {
  readonly tmb: number;
  readonly tdee: number;
  readonly target: MacroTarget;
}

export interface TemplateMeta {
  readonly id: string;
  readonly name: string;
  readonly kcalTarget: number | null;
  readonly kcalRangeMin: number | null;
  readonly kcalRangeMax: number | null;
  readonly proteinGTarget: number | null;
  readonly carbGTarget: number | null;
  readonly fatGTarget: number | null;
  readonly mealsPerDay: number | null;
  readonly constraintsTags: ReadonlyArray<string>;
  readonly goalTag: Goal | null;
}

export interface MatchResult {
  readonly templateId: string;
  readonly name: string;
  readonly score: number; // 0-100
  readonly autoSelectable: boolean; // score >= 80
  readonly breakdown: {
    readonly kcal: number; // 0-40
    readonly macros: number; // 0-40
    readonly constraints: number; // 0-20
  };
  readonly reasons: ReadonlyArray<string>;
}

export type GateSeverity = "warning" | "error";

export interface GateIssue {
  readonly code: string;
  readonly severity: GateSeverity;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface GateResult {
  readonly issues: ReadonlyArray<GateIssue>;
  readonly blocked: boolean;
}
