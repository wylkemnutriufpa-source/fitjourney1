// Regra Canônica #1: "O sistema sugere. O nutricionista decide."
// validatePlan NUNCA bloqueia — apenas emite warnings. blockers === [] e
// blocked === false em TODOS os casos. Estes testes guardam a não-regressão
// dessa invariante (já tivemos throws de CLINICAL_GATE_BLOCKED no passado).

import { describe, expect, it } from "vitest";
import { validatePlan, type DailyTotals } from "../clinical-gate";

const okDay = (label: string): DailyTotals => ({
  dayLabel: label,
  kcal: 2200,
  proteinG: 160,
  carbG: 250,
  fatG: 60,
});

const week: DailyTotals[] = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map(okDay);
const target = { kcal: 2200, proteinG: 160, carbG: 250, fatG: 60 };

describe("validatePlan (Rule #1: nunca bloqueia)", () => {
  it("plano saudável passa sem issues", () => {
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: week,
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(false);
    expect(r.issues.length).toBe(0);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.length).toBe(0);
  });

  it("proteína > 2.5 g/kg gera warning, NUNCA blocker", () => {
    const bad = [...week];
    bad[0] = { ...week[0], proteinG: 220 }; // 220/80 = 2.75
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(false);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.some((i) => i.code === "PROTEIN_OVER_LIMIT")).toBe(true);
  });

  it("déficit > 25% TDEE gera warning, NUNCA blocker", () => {
    const bad = week.map((d) => ({ ...d, kcal: 1800 }));
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(false);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.some((i) => i.code === "CALORIC_DEFICIT_HIGH")).toBe(true);
  });

  it("desvio de macros > 10% gera warning, NUNCA blocker", () => {
    const bad = week.map((d) => ({ ...d, carbG: 350 }));
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(false);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.some((i) => i.code === "MACRO_DEVIATION")).toBe(true);
  });

  it("monotonia > 4x/semana gera warning, NUNCA blocker", () => {
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: week,
      foodOccurrences: [
        { foodKey: "arroz_branco", displayName: "Arroz branco", weeklyCount: 6 },
      ],
    });
    expect(r.blocked).toBe(false);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.some((i) => i.code === "FOOD_MONOTONY")).toBe(true);
  });

  it("snapshot sem dias emite warning de NO_DAILY_TOTALS, NUNCA bloqueia", () => {
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: [],
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(false);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.some((w) => w.code === "NO_DAILY_TOTALS")).toBe(true);
  });

  it("INVARIANTE: combinação de múltiplas violações severas continua sem blocker", () => {
    const bad = week.map((d) => ({ ...d, kcal: 1500, proteinG: 240, carbG: 400 }));
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [
        { foodKey: "frango", displayName: "Frango", weeklyCount: 14 },
      ],
    });
    expect(r.blocked).toBe(false);
    expect(r.blockers.length).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
