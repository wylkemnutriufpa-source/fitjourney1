// Phase 2 — Clinical Gate (validação pré-publicação)
// Roda no editor do nutricionista, NUNCA no paciente.
// Recebe um snapshot já calculado (totais por dia/semana) — não recalcula nada.

import type { GateIssue, GateResult, MacroTarget } from "./types";

export interface DailyTotals {
  readonly dayLabel: string; // "Segunda", "Terça", ...
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbG: number;
  readonly fatG: number;
}

export interface FoodOccurrence {
  readonly foodKey: string; // chave normalizada do alimento
  readonly displayName: string;
  readonly weeklyCount: number;
}

export interface GateInput {
  readonly weightKg: number;
  readonly tdee: number;
  readonly target: MacroTarget;
  readonly dailyTotals: ReadonlyArray<DailyTotals>;
  readonly foodOccurrences: ReadonlyArray<FoodOccurrence>;
}

const PROTEIN_HARD_LIMIT_G_PER_KG = 2.5;
const CALORIC_DEFICIT_HARD_PCT = 0.25;
const MACRO_DEVIATION_HARD_PCT = 0.1;
const MONOTONY_HARD_COUNT = 4;

export function validatePlan(input: GateInput): GateResult {
  const issues: GateIssue[] = [];
  const { weightKg, tdee, target, dailyTotals, foodOccurrences } = input;

  if (dailyTotals.length === 0) {
    issues.push({
      code: "NO_DAILY_TOTALS",
      severity: "warning",
      message: "Plano sem totais diários. Confirme se as refeições e alimentos foram preenchidos corretamente.",
    });
    return { issues, blockers: [], warnings: issues, blocked: false };
  }

  // --- 1. Proteína > 2.5 g/kg ---
  const proteinPerKgByDay = dailyTotals.map((d) => ({
    day: d.dayLabel,
    perKg: d.proteinG / Math.max(1, weightKg),
    proteinG: d.proteinG,
  }));
  const offenders = proteinPerKgByDay.filter(
    (x) => x.perKg > PROTEIN_HARD_LIMIT_G_PER_KG,
  );
  if (offenders.length > 0) {
    issues.push({
      code: "PROTEIN_OVER_LIMIT",
      severity: "warning",
      message: `Proteína acima de ${PROTEIN_HARD_LIMIT_G_PER_KG} g/kg em ${offenders.length} dia(s). Confirme se apropriado para objetivo de hipertrofia agressiva.`,
      details: { offenders },
      suggestedAction: "Revisar com paciente se objetivo clínico justifica proteína elevada.",
    });
  }

  // --- 2. Déficit calórico > 25% TDEE ---
  for (const d of dailyTotals) {
    const deficitPct = (tdee - d.kcal) / tdee;
    if (deficitPct > CALORIC_DEFICIT_HARD_PCT) {
      issues.push({
        code: "CALORIC_DEFICIT_HIGH",
        severity: "warning",
        message: `Déficit calórico de ${Math.round(deficitPct * 100)}% em ${d.dayLabel} (TDEE ${tdee} vs plano ${d.kcal}). Confirme se é perda de peso agressiva planejada.`,
        details: { day: d.dayLabel, deficitPct, tdee, kcal: d.kcal },
        suggestedAction: "Se objetivo é perda acelerada, pode ser apropriado. Revisar com paciente.",
      });
    }
  }

  // --- 3. Desvio de macros > 10% do alvo (média semanal) ---
  const avg = averageMacros(dailyTotals);
  const deviations: Array<{ macro: string; deviationPct: number }> = [];
  for (const [label, avgVal, tgtVal] of [
    ["proteína", avg.proteinG, target.proteinG],
    ["carboidrato", avg.carbG, target.carbG],
    ["gordura", avg.fatG, target.fatG],
    ["kcal", avg.kcal, target.kcal],
  ] as const) {
    if (tgtVal <= 0) continue;
    const dev = Math.abs(avgVal - tgtVal) / tgtVal;
    if (dev > MACRO_DEVIATION_HARD_PCT) {
      deviations.push({ macro: label, deviationPct: dev });
    }
  }
  if (deviations.length > 0) {
    issues.push({
      code: "MACRO_DEVIATION",
      severity: "warning",
      message: `Desvio acima de ${Math.round(MACRO_DEVIATION_HARD_PCT * 100)}% no alvo semanal: ${deviations.map((d) => `${d.macro} ${Math.round(d.deviationPct * 100)}%`).join(", ")}. Ajuste quantidades ou confirme clinicamente.`,
      details: { deviations },
      suggestedAction: "Revisar porções de itens principais ou confirmar se objetivo justifica desvio.",
    });
  }

  // --- 4. Monotonia alimentar > 4 repetições/semana ---
  const monotonous = foodOccurrences.filter(
    (f) => f.weeklyCount > MONOTONY_HARD_COUNT,
  );
  if (monotonous.length > 0) {
    issues.push({
      code: "FOOD_MONOTONY",
      severity: "warning",
      message: `Alimento(s) repetido(s) mais de ${MONOTONY_HARD_COUNT}x/semana: ${monotonous.map((m) => `${m.displayName} (${m.weeklyCount}x)`).join(", ")}.`,
      details: { foods: monotonous },
    });
  }

  const blockers: GateIssue[] = []; // Clinical gate never blocks per canonical rule #1
  const warnings = issues.filter((i) => i.severity === "warning");
  return { issues, blockers, warnings, blocked: false };
}

function averageMacros(
  totals: ReadonlyArray<DailyTotals>,
): { kcal: number; proteinG: number; carbG: number; fatG: number } {
  const n = totals.length;
  const sum = totals.reduce(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      proteinG: acc.proteinG + d.proteinG,
      carbG: acc.carbG + d.carbG,
      fatG: acc.fatG + d.fatG,
    }),
    { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
  );
  return {
    kcal: sum.kcal / n,
    proteinG: sum.proteinG / n,
    carbG: sum.carbG / n,
    fatG: sum.fatG / n,
  };
}
