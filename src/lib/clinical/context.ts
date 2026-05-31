// Phase 3 — Clinical foundation
// ClinicalContext: fonte ÚNICA consumida pelos motores (tdee, macros,
// clinical-gate) e por dashboards/UI que precisam do estado clínico atual.
//
// INVARIANTES:
// 1. Composição PURA de:
//    - resolveCurrentWeight(readings) → peso atual (recência)
//    - resolveGoal(approvedAnamneses) → meta atual (anamnese aprovada mais recente)
//    - dados estáticos da anamnese aprovada mais recente (sex, age, height, activity)
// 2. Sem inferência. Sem fallback silencioso. Campos ausentes = null.
// 3. Estado degradado é EXPLÍCITO: `ready` indica se motores podem rodar.
// 4. Zero IO. Zero React. Zero Supabase. Server fn faz o fetch e chama esta função.

import type { Sex, ActivityLevel } from "@/lib/engine/types";
import {
  resolveCurrentWeight,
  type WeightReading,
  type ResolvedWeight,
} from "./resolve-weight";
import {
  resolveGoal,
  type ApprovedAnamnesisInput,
  type ResolvedGoal,
} from "./resolve-goal";

export interface ClinicalContext {
  readonly patientId: string;
  readonly weight: ResolvedWeight;
  readonly goal: ResolvedGoal;
  readonly demographics: {
    readonly sex: Sex | null;
    readonly ageYears: number | null;
    readonly heightCm: number | null;
    readonly activity: ActivityLevel | null;
    readonly sourceAnamnesisId: string | null;
  };
  /** true quando há peso atual + meta atual + demografia suficiente para motores. */
  readonly ready: boolean;
  readonly missing: ReadonlyArray<
    "weight" | "goal" | "sex" | "ageYears" | "heightCm" | "activity"
  >;
}

export interface BuildClinicalContextInput {
  readonly patientId: string;
  readonly weightReadings: ReadonlyArray<WeightReading>;
  readonly approvedAnamneses: ReadonlyArray<ApprovedAnamnesisInput>;
}

export function buildClinicalContext(
  input: BuildClinicalContextInput,
): ClinicalContext {
  const weight = resolveCurrentWeight(input.weightReadings);
  const goal = resolveGoal(input.approvedAnamneses);

  const latest =
    [...input.approvedAnamneses].sort(
      (a, b) => Date.parse(b.approvedAt) - Date.parse(a.approvedAt),
    )[0] ?? null;

  const basics = latest?.canonical.basics ?? null;
  const demographics = {
    sex: (basics?.sex as Sex | undefined) ?? null,
    ageYears: basics?.ageYears ?? null,
    heightCm: basics?.heightCm ?? null,
    activity: (basics?.activity as ActivityLevel | undefined) ?? null,
    sourceAnamnesisId: latest?.id ?? null,
  };

  const missing: Array<
    "weight" | "goal" | "sex" | "ageYears" | "heightCm" | "activity"
  > = [];
  if (!weight.current) missing.push("weight");
  if (!goal.current) missing.push("goal");
  if (!demographics.sex) missing.push("sex");
  if (demographics.ageYears == null) missing.push("ageYears");
  if (demographics.heightCm == null) missing.push("heightCm");
  if (!demographics.activity) missing.push("activity");

  return {
    patientId: input.patientId,
    weight,
    goal,
    demographics,
    ready: missing.length === 0,
    missing,
  };
}
