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

describe("validatePlan", () => {
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

  it("bloqueia proteína > 2.5 g/kg", () => {
    const bad = [...week];
    bad[0] = { ...week[0], proteinG: 220 }; // 220/80 = 2.75
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(true);
    expect(r.issues.some((i) => i.code === "PROTEIN_OVER_LIMIT")).toBe(true);
  });

  it("bloqueia déficit > 25% TDEE", () => {
    const bad = week.map((d) => ({ ...d, kcal: 1800 }));
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [],
    });
    expect(r.issues.some((i) => i.code === "CALORIC_DEFICIT_HIGH")).toBe(true);
  });

  it("bloqueia desvio de macros > 10% no alvo semanal", () => {
    const bad = week.map((d) => ({ ...d, carbG: 350 }));
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: bad,
      foodOccurrences: [],
    });
    expect(r.issues.some((i) => i.code === "MACRO_DEVIATION")).toBe(true);
    expect(r.blocked).toBe(true);
  });

  it("warning (não bloqueia) para monotonia > 4x/semana", () => {
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: week,
      foodOccurrences: [
        { foodKey: "arroz_branco", displayName: "Arroz branco", weeklyCount: 6 },
      ],
    });
    expect(r.warnings.some((i) => i.code === "FOOD_MONOTONY")).toBe(true);
    expect(r.blockers.length).toBe(0);
    expect(r.blocked).toBe(false);
  });

  it("bloqueia snapshot sem dias", () => {
    const r = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target,
      dailyTotals: [],
      foodOccurrences: [],
    });
    expect(r.blocked).toBe(true);
    expect(r.blockers.length).toBe(1);
    expect(r.blockers[0].code).toBe("NO_DAILY_TOTALS");
  });
});
