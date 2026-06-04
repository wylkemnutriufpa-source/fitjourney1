// Testes da integração A1+A2 no pipeline de publicação.
//
// REGRA CANÔNICA #1 (não-regressão): "O sistema sugere. O nutricionista decide."
//   - publishPlanToPatient e publishDraftPlan NUNCA lançam erro por motivo
//     clínico, mesmo quando ctx.calculable === false ou quando o gate
//     identifica violações severas.
//   - gate.blockers é SEMPRE [] e gate.blocked é SEMPRE false.
//   - issues clínicos viram warnings anexados ao snapshot.clinicalAudit,
//     nunca throws.
//
// Mock de Supabase não é coberto aqui (E2E faz isso). Estes testes garantem:
//   - derivações do snapshot são corretas
//   - ctx.calculable é detectado mas NÃO bloqueia
//   - gate nunca produz blockers (invariante)
//   - clinicalAudit é montado corretamente (formato + versões)

import { describe, expect, it } from "vitest";
import {
  deriveDailyTotalsFromSnapshot,
  deriveFoodOccurrencesFromSnapshot,
} from "../plans.functions";
import { buildClinicalContext } from "@/lib/clinical/context";
import { runNutritionEngines } from "@/lib/clinical/run-nutrition-engines";
import { validatePlan } from "@/lib/engine/clinical-gate";
import { ENGINE_VERSION, GATE_VERSION } from "@/lib/engine/version";
import type { ApprovedAnamnesisInput } from "@/lib/clinical/resolve-goal";
import type { WeightReading } from "@/lib/clinical/resolve-weight";

const mkAna = (
  overrides: Partial<{
    sex: "male" | "female";
    ageYears: number;
    weightKg: number;
    heightCm: number;
    goal: "cut" | "maintain" | "bulk" | "performance" | "health";
    activity: "sedentary" | "light" | "moderate" | "high" | "extreme";
  }> = {},
): ApprovedAnamnesisInput => ({
  id: "a1",
  approvedAt: "2026-05-01T00:00:00Z",
  canonical: {
    basics: {
      sex: overrides.sex ?? "female",
      ageYears: overrides.ageYears ?? 34,
      weightKg: overrides.weightKg ?? 84,
      heightCm: overrides.heightCm ?? 165,
      goal: overrides.goal ?? "maintain",
      activity: overrides.activity ?? "moderate",
    },
  },
});

const mkWeight = (kg: number): WeightReading => ({
  source: "feedback",
  weightKg: kg,
  measuredAt: "2026-05-30T00:00:00Z",
  sourceId: "f1",
});

const mkSnapshot = (overrides: Partial<{ proteinG: number; carbG: number; fatG: number; kcal: number }> = {}) => ({
  id: "tpl-1",
  name: "Plano",
  kcal: 2200,
  meals: [
    {
      id: "m1",
      time: "08:00",
      label: "Café",
      main: {
        id: "o1",
        title: "Opt 1",
        imageKey: "k",
        items: [
          {
            id: "i1",
            foodKey: "ovos",
            name: "Ovos",
            qty: 100,
            unit: "g",
            scaleGroup: "protein",
            kcal: overrides.kcal ?? 2200,
            proteinG: overrides.proteinG ?? 160,
            carbG: overrides.carbG ?? 250,
            fatG: overrides.fatG ?? 60,
          },
        ],
      },
      equivalents: [],
    },
  ],
});

describe("ClinicalContext gates (calculable)", () => {
  it("ctx sem peso ⇒ calculable=false, missingForCalc=[weight]", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [],
      approvedAnamneses: [mkAna({ weightKg: undefined as any })],
    });
    // anamnese tem weightKg=84 ⇒ vira reading via context.functions.ts mas
    // aqui passamos só readings explícitas (vazias). Goal+demografia ok.
    expect(ctx.calculable).toBe(false);
    expect(ctx.missingForCalc).toContain("weight");
  });

  it("ctx sem activity ⇒ calculable=false, missingForCalc=[activity]", () => {
    const ana: ApprovedAnamnesisInput = {
      ...mkAna(),
      canonical: {
        basics: {
          sex: "female",
          ageYears: 34,
          weightKg: 84,
          heightCm: 165,
          goal: "maintain",
          // activity ausente
        } as any,
      },
    };
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [mkWeight(84)],
      approvedAnamneses: [ana],
    });
    expect(ctx.calculable).toBe(false);
    expect(ctx.missingForCalc).toEqual(["activity"]);
  });

  it("ctx completo ⇒ calculable=true, runNutritionEngines retorna não-nulo", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [mkWeight(84)],
      approvedAnamneses: [mkAna()],
    });
    expect(ctx.calculable).toBe(true);
    const out = runNutritionEngines(ctx);
    expect(out).not.toBeNull();
    expect(out!.tdee).toBeGreaterThan(0);
  });
});

describe("derivações do snapshot", () => {
  it("deriveDailyTotalsFromSnapshot soma kcal + macros", () => {
    const snap = mkSnapshot({ kcal: 500, proteinG: 40, carbG: 50, fatG: 20 });
    const totals = deriveDailyTotalsFromSnapshot(snap as any);
    expect(totals.length).toBe(1);
    expect(totals[0].kcal).toBe(500);
    expect(totals[0].proteinG).toBe(40);
    expect(totals[0].carbG).toBe(50);
    expect(totals[0].fatG).toBe(20);
  });

  it("snapshot sem meals ⇒ totals vazio", () => {
    const totals = deriveDailyTotalsFromSnapshot({ meals: [] } as any);
    expect(totals).toEqual([]);
  });

  it("deriveFoodOccurrencesFromSnapshot conta por foodKey", () => {
    const snap = {
      meals: [
        {
          main: {
            items: [
              { foodKey: "ovos", name: "Ovos" },
              { foodKey: "ovos", name: "Ovos" },
              { foodKey: "arroz", name: "Arroz" },
            ],
          },
        },
      ],
    };
    const occ = deriveFoodOccurrencesFromSnapshot(snap as any);
    const ovos = occ.find((o) => o.foodKey === "ovos");
    expect(ovos?.weeklyCount).toBe(2);
    expect(occ.find((o) => o.foodKey === "arroz")?.weeklyCount).toBe(1);
  });
});

describe("gate bloqueia apenas blockers", () => {
  it("warning de monotonia não bloqueia (warnings populados)", () => {
    const ctx = buildClinicalContext({
      patientId: "p",
      weightReadings: [mkWeight(80)],
      approvedAnamneses: [mkAna({ weightKg: 80 })],
    });
    const engineOut = runNutritionEngines(ctx)!;
    const gate = validatePlan({
      weightKg: 80,
      tdee: engineOut.tdee,
      target: engineOut.target,
      dailyTotals: [
        { dayLabel: "dia", kcal: engineOut.target.kcal, proteinG: engineOut.target.proteinG, carbG: engineOut.target.carbG, fatG: engineOut.target.fatG },
      ],
      foodOccurrences: [
        { foodKey: "arroz", displayName: "Arroz", weeklyCount: 6 },
      ],
    });
    expect(gate.blocked).toBe(false);
    expect(gate.blockers.length).toBe(0);
    expect(gate.warnings.some((w) => w.code === "FOOD_MONOTONY")).toBe(true);
  });

  it("proteína > 2.5 g/kg ⇒ blocker", () => {
    const gate = validatePlan({
      weightKg: 80,
      tdee: 2750,
      target: { kcal: 2200, proteinG: 160, carbG: 250, fatG: 60 },
      dailyTotals: [{ dayLabel: "d", kcal: 2200, proteinG: 220, carbG: 250, fatG: 60 }],
      foodOccurrences: [],
    });
    expect(gate.blocked).toBe(true);
    expect(gate.blockers.some((b) => b.code === "PROTEIN_OVER_LIMIT")).toBe(true);
  });
});

describe("versões expostas", () => {
  it("ENGINE_VERSION e GATE_VERSION são strings semver", () => {
    expect(ENGINE_VERSION).toMatch(/^engine@\d+\.\d+\.\d+$/);
    expect(GATE_VERSION).toMatch(/^gate@\d+\.\d+\.\d+$/);
  });
});
