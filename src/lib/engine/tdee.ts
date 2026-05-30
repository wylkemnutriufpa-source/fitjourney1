// Phase 2 — TMB / TDEE Engine (Mifflin-St Jeor)
// Determinístico. Puro. Zero IO.

import type { ActivityLevel, AnamneseInput, Sex } from "./types";

const ACTIVITY_FACTORS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  extreme: 1.9,
};

export function activityFactor(level: ActivityLevel): number {
  return ACTIVITY_FACTORS[level];
}

export interface TmbInput {
  readonly sex: Sex;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly ageYears: number;
}

/**
 * Mifflin-St Jeor:
 *   Male:   (10*W) + (6.25*H) - (5*A) + 5
 *   Female: (10*W) + (6.25*H) - (5*A) - 161
 */
export function calcTMB(input: TmbInput): number {
  const { sex, weightKg, heightCm, ageYears } = input;
  assertPositive("weightKg", weightKg);
  assertPositive("heightCm", heightCm);
  assertPositive("ageYears", ageYears);

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const tmb = sex === "male" ? base + 5 : base - 161;
  return round(tmb);
}

export function calcTDEE(tmb: number, activity: ActivityLevel): number {
  assertPositive("tmb", tmb);
  return round(tmb * activityFactor(activity));
}

export function calcFromAnamnese(
  input: AnamneseInput,
): { tmb: number; tdee: number } {
  const tmb = calcTMB(input);
  const tdee = calcTDEE(tmb, input.activity);
  return { tmb, tdee };
}

function assertPositive(name: string, v: number): void {
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error(`Invalid ${name}: ${v}`);
  }
}

function round(n: number): number {
  return Math.round(n);
}
