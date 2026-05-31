// Phase 3 — Adapter: ClinicalContext → motores nutricionais determinísticos.
//
// CAMADA DE COMPOSIÇÃO ÚNICA.
//
// Motores continuam puros e independentes. ClinicalContext é adaptado para
// EngineInput em uma única camada de composição: este arquivo. Nenhum outro
// caller em código de aplicação deve invocar calcTMB / calcTDEE /
// calcMacroTarget diretamente — passa por aqui.
//
// Invariantes (ver skill fitjourney-clinical-invariants):
// - Motor só consome ClinicalContext (via este adapter).
// - Zero inferência. Zero default silencioso. ctx.ready=false ⇒ retorna null.
// - Mapeamento GoalKind clínico → Goal do motor é EXPLÍCITO e auditável:
//     cut         → cut
//     bulk        → bulk
//     maintain    → maintain
//     performance → bulk      (superávit calórico, alta proteína)
//     health      → maintain  (manutenção sem agressão)
//   O ctx.currentGoal.kind original permanece preservado em ClinicalContext
//   para UI/auditoria. Aqui apenas projetamos para o vocabulário do motor.

import { calcTMB, calcTDEE } from "@/lib/engine/tdee";
import { calcMacroTarget } from "@/lib/engine/macros";
import type {
  ActivityLevel,
  Goal,
  NutritionTargets,
  Sex,
} from "@/lib/engine/types";
import type { GoalKind } from "./resolve-goal";
import type { ClinicalContext } from "./context";

export function mapGoalKindToEngineGoal(kind: GoalKind): Goal {
  switch (kind) {
    case "cut":
      return "cut";
    case "bulk":
      return "bulk";
    case "maintain":
      return "maintain";
    case "performance":
      return "bulk";
    case "health":
      return "maintain";
  }
}

export interface NutritionEnginesOutput extends NutritionTargets {
  /** Goal clínico original do ClinicalContext (preservado para auditoria/UI). */
  readonly clinicalGoalKind: GoalKind;
  /** Goal efetivamente passado ao motor após mapeamento. */
  readonly engineGoal: Goal;
}

/**
 * Roda os motores nutricionais a partir de um ClinicalContext.
 * Retorna `null` quando o contexto não está pronto (`ready=false`).
 */
export function runNutritionEngines(
  ctx: ClinicalContext,
): NutritionEnginesOutput | null {
  if (!ctx.ready) return null;

  // ready=true ⇒ todos os campos abaixo são não-nulos.
  const weightKg = ctx.currentWeight!.weightKg;
  const sex = ctx.demographics.sex!;
  const ageYears = ctx.demographics.ageYears!;
  const heightCm = ctx.demographics.heightCm!;
  const activity = ctx.demographics.activity!;
  const clinicalGoalKind = ctx.currentGoal!.kind;
  const engineGoal = mapGoalKindToEngineGoal(clinicalGoalKind);

  const tmb = calcTMB({ sex, weightKg, heightCm, ageYears });
  const tdee = calcTDEE(tmb, activity);
  const target = calcMacroTarget({ tdee, weightKg, goal: engineGoal });

  return { tmb, tdee, target, clinicalGoalKind, engineGoal };
}
