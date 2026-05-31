import { describe, expect, it } from "vitest";
import { buildClinicalContext } from "../context";
import {
  mapGoalKindToEngineGoal,
  runNutritionEngines,
} from "../run-nutrition-engines";
import type { ApprovedAnamnesisInput } from "../resolve-goal";
import type { WeightReading } from "../resolve-weight";
import { calcTMB, calcTDEE } from "@/lib/engine/tdee";
import { calcMacroTarget } from "@/lib/engine/macros";

const mkAna = (
  id: string,
  approvedAt: string,
  overrides: Partial<{
    sex: "male" | "female";
    ageYears: number;
    heightCm: number;
    weightKg: number;
    activity: "sedentary" | "light" | "moderate" | "high" | "extreme";
    goal: "cut" | "maintain" | "bulk" | "performance" | "health";
  }> = {},
): ApprovedAnamnesisInput => ({
  id,
  approvedAt,
  canonical: {
    basics: {
      sex: overrides.sex ?? "male",
      ageYears: overrides.ageYears ?? 30,
      weightKg: overrides.weightKg ?? 80,
      heightCm: overrides.heightCm ?? 175,
      goal: overrides.goal ?? "cut",
      activity: overrides.activity ?? "moderate",
    },
  },
});

const mkWeight = (weightKg: number, measuredAt: string): WeightReading => ({
  source: "feedback",
  weightKg,
  measuredAt,
  sourceId: "f1",
});

describe("mapGoalKindToEngineGoal", () => {
  it("mapeia explicitamente cada goal clínico", () => {
    expect(mapGoalKindToEngineGoal("cut")).toBe("cut");
    expect(mapGoalKindToEngineGoal("bulk")).toBe("bulk");
    expect(mapGoalKindToEngineGoal("maintain")).toBe("maintain");
    expect(mapGoalKindToEngineGoal("performance")).toBe("bulk");
    expect(mapGoalKindToEngineGoal("health")).toBe("maintain");
  });
});

describe("runNutritionEngines", () => {
  it("retorna null quando ctx não está pronto", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [],
      approvedAnamneses: [],
    });
    expect(runNutritionEngines(ctx)).toBeNull();
  });

  it("compõe tdee+macros a partir do ClinicalContext (peso por recência)", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [mkWeight(82, "2026-05-30T00:00:00Z")],
      approvedAnamneses: [mkAna("a1", "2026-05-01T00:00:00Z")],
    });
    const out = runNutritionEngines(ctx);
    expect(out).not.toBeNull();

    const tmb = calcTMB({
      sex: "male",
      weightKg: 82,
      heightCm: 175,
      ageYears: 30,
    });
    const tdee = calcTDEE(tmb, "moderate");
    const target = calcMacroTarget({ tdee, weightKg: 82, goal: "cut" });

    expect(out!.tmb).toBe(tmb);
    expect(out!.tdee).toBe(tdee);
    expect(out!.target).toEqual(target);
    expect(out!.clinicalGoalKind).toBe("cut");
    expect(out!.engineGoal).toBe("cut");
  });

  it("preserva goal clínico original e expõe goal mapeado (performance → bulk)", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [mkWeight(80, "2026-05-30T00:00:00Z")],
      approvedAnamneses: [
        mkAna("a1", "2026-05-01T00:00:00Z", { goal: "performance" }),
      ],
    });
    const out = runNutritionEngines(ctx)!;
    expect(out.clinicalGoalKind).toBe("performance");
    expect(out.engineGoal).toBe("bulk");
  });

  it("health → maintain", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [mkWeight(80, "2026-05-30T00:00:00Z")],
      approvedAnamneses: [
        mkAna("a1", "2026-05-01T00:00:00Z", { goal: "health" }),
      ],
    });
    const out = runNutritionEngines(ctx)!;
    expect(out.clinicalGoalKind).toBe("health");
    expect(out.engineGoal).toBe("maintain");
  });
});
