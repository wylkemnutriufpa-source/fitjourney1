// Phase 2 — Macro Engine
// Distribuição determinística por objetivo. Sem heurística.
//
// Cutting:     prot 2.2 g/kg, fat 0.8 g/kg, kcal = TDEE * 0.80, carb fecha
// Bulking:     prot 2.0 g/kg, fat 1.0 g/kg, kcal = TDEE * 1.12, carb fecha
// Maintenance: prot 2.0 g/kg, fat 0.9 g/kg, kcal = TDEE,        carb fecha

import type { Goal, MacroTarget } from "./types";

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

interface GoalRule {
  readonly proteinGPerKg: number;
  readonly fatGPerKg: number;
  readonly kcalMultiplier: number;
}

const GOAL_RULES: Readonly<Record<Goal, GoalRule>> = {
  cut: { proteinGPerKg: 2.2, fatGPerKg: 0.8, kcalMultiplier: 0.8 },
  bulk: { proteinGPerKg: 2.0, fatGPerKg: 1.0, kcalMultiplier: 1.12 },
  maintain: { proteinGPerKg: 2.0, fatGPerKg: 0.9, kcalMultiplier: 1.0 },
};

export interface MacroInput {
  readonly tdee: number;
  readonly weightKg: number;
  readonly goal: Goal;
}

export function calcMacroTarget(input: MacroInput): MacroTarget {
  const { tdee, weightKg, goal } = input;
  if (!Number.isFinite(tdee) || tdee <= 0) {
    throw new Error(`Invalid tdee: ${tdee}`);
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error(`Invalid weightKg: ${weightKg}`);
  }

  const rule = GOAL_RULES[goal];
  const kcal = Math.round(tdee * rule.kcalMultiplier);

  const proteinG = Math.round(rule.proteinGPerKg * weightKg);
  const fatG = Math.round(rule.fatGPerKg * weightKg);

  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const carbKcal = Math.max(0, kcal - proteinKcal - fatKcal);
  const carbG = Math.round(carbKcal / KCAL_PER_G_CARB);

  return { kcal, proteinG, fatG, carbG };
}
