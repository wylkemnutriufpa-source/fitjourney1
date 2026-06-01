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
// 5. ClinicalContext NÃO carrega histórico. Apenas o estado atual. Timeline é
//    projeção separada (read-only), nunca é fonte de cálculo (invariante #5).

import type { Sex, ActivityLevel } from "@/lib/engine/types";
import {
  resolveCurrentWeight,
  type WeightReading,
} from "./resolve-weight";
import {
  resolveGoal,
  type ApprovedAnamnesisInput,
  type ClinicalGoal,
} from "./resolve-goal";

export type CurrentWeight = WeightReading;
export type CurrentGoal = ClinicalGoal;

export type MissingField =
  | "weight"
  | "goal"
  | "sex"
  | "ageYears"
  | "heightCm"
  | "activity";

/**
 * Campos exigidos para `calculable=true`. Subset MÍNIMO necessário para
 * rodar TMB+TDEE+Macros. Campos adicionais que vierem ao ClinicalContext
 * no futuro (waistCm, bodyFatPercent, leanMassKg, ...) NÃO entram aqui —
 * eles afetam apenas `ready`. Isso garante que adicionar telemetria ao
 * contexto nunca passe a bloquear publicação por engano (invariante #9).
 */
export type CalcField = MissingField;

export interface ClinicalContext {
  readonly patientId: string;
  readonly currentWeight: CurrentWeight | null;
  readonly currentGoal: CurrentGoal | null;
  readonly demographics: {
    readonly sex: Sex | null;
    readonly ageYears: number | null;
    readonly heightCm: number | null;
    readonly activity: ActivityLevel | null;
    readonly sourceAnamnesisId: string | null;
  };
  /**
   * Contexto 100% completo. Hoje coincide com `calculable`; vai divergir
   * quando novos campos (waistCm, bodyFatPercent, ...) forem adicionados
   * ao contexto. Use APENAS para UI/auditoria — nunca como critério de
   * bloqueio de publicação.
   */
  readonly ready: boolean;
  /**
   * Motores podem rodar (TMB+TDEE+Macros). É o ÚNICO critério válido
   * para bloquear publicação clínica.
   */
  readonly calculable: boolean;
  readonly missing: ReadonlyArray<MissingField>;
  /** Subset de `missing` restrito a campos exigidos para `calculable`. */
  readonly missingForCalc: ReadonlyArray<CalcField>;
}

export interface BuildClinicalContextInput {
  readonly patientId: string;
  readonly weightReadings: ReadonlyArray<WeightReading>;
  readonly approvedAnamneses: ReadonlyArray<ApprovedAnamnesisInput>;
}

export function buildClinicalContext(
  input: BuildClinicalContextInput,
): ClinicalContext {
  const currentWeight = resolveCurrentWeight(input.weightReadings).current;
  const currentGoal = resolveGoal(input.approvedAnamneses).current;

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

  const missing: MissingField[] = [];
  if (!currentWeight) missing.push("weight");
  if (!currentGoal) missing.push("goal");
  if (!demographics.sex) missing.push("sex");
  if (demographics.ageYears == null) missing.push("ageYears");
  if (demographics.heightCm == null) missing.push("heightCm");
  if (!demographics.activity) missing.push("activity");

  // Hoje calculable == ready. Conforme novos campos forem ao contexto,
  // eles entram em missing (afetando ready) mas NÃO em missingForCalc.
  const CALC_FIELDS = new Set<CalcField>([
    "weight",
    "goal",
    "sex",
    "ageYears",
    "heightCm",
    "activity",
  ]);
  const missingForCalc = missing.filter((m): m is CalcField => CALC_FIELDS.has(m as CalcField));

  return {
    patientId: input.patientId,
    currentWeight,
    currentGoal,
    demographics,
    ready: missing.length === 0,
    calculable: missingForCalc.length === 0,
    missing,
    missingForCalc,
  };
}

// Re-export BuildClinicalContextInput shape consumers may rely on.
export type { BuildClinicalContextInput as _BuildClinicalContextInput };

