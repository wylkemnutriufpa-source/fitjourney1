import { describe, expect, it } from "vitest";
import { buildClinicalContext } from "../context";
import type { ApprovedAnamnesisInput } from "../resolve-goal";
import type { WeightReading } from "../resolve-weight";

const mkAnamnese = (
  id: string,
  approvedAt: string,
  weightKg = 80,
): ApprovedAnamnesisInput => ({
  id,
  approvedAt,
  canonical: {
    basics: {
      sex: "male",
      ageYears: 30,
      weightKg,
      heightCm: 175,
      goal: "cut",
      activity: "moderate",
    },
  },
});

describe("buildClinicalContext", () => {
  it("ready=false e missing completo quando vazio", () => {
    const ctx = buildClinicalContext({
      patientId: "p1",
      weightReadings: [],
      approvedAnamneses: [],
    });
    expect(ctx.ready).toBe(false);
    expect(ctx.missing).toEqual([
      "weight",
      "goal",
      "sex",
      "ageYears",
      "heightCm",
      "activity",
    ]);
    expect(ctx.weight.current).toBeNull();
    expect(ctx.goal.current).toBeNull();
  });

  it("ready=true quando há anamnese aprovada + peso", () => {
    const ana = mkAnamnese("a1", "2026-05-01T00:00:00Z");
    const w: WeightReading = {
      source: "feedback",
      weightKg: 82,
      measuredAt: "2026-05-30T00:00:00Z",
      sourceId: "f1",
    };
    const ctx = buildClinicalContext({
      patientId: "p1",
      weightReadings: [w],
      approvedAnamneses: [ana],
    });
    expect(ctx.ready).toBe(true);
    expect(ctx.missing).toEqual([]);
    expect(ctx.weight.current?.weightKg).toBe(82);
    expect(ctx.goal.current?.kind).toBe("cut");
    expect(ctx.demographics.sourceAnamnesisId).toBe("a1");
  });

  it("demografia vem da anamnese aprovada MAIS RECENTE", () => {
    const old = mkAnamnese("a1", "2026-01-01T00:00:00Z");
    const recent: ApprovedAnamnesisInput = {
      id: "a2",
      approvedAt: "2026-05-01T00:00:00Z",
      canonical: {
        basics: {
          sex: "female",
          ageYears: 28,
          weightKg: 60,
          heightCm: 165,
          goal: "maintain",
          activity: "high",
        },
      },
    };
    const ctx = buildClinicalContext({
      patientId: "p1",
      weightReadings: [],
      approvedAnamneses: [old, recent],
    });
    expect(ctx.demographics.sex).toBe("female");
    expect(ctx.demographics.activity).toBe("high");
    expect(ctx.demographics.sourceAnamnesisId).toBe("a2");
    expect(ctx.goal.current?.kind).toBe("maintain");
  });

  it("peso da anamnese NÃO é usado como leitura — só vem se passado em weightReadings", () => {
    // Garantia: motor não pode pegar peso silenciosamente do basics.
    const ana = mkAnamnese("a1", "2026-05-01T00:00:00Z", 99);
    const ctx = buildClinicalContext({
      patientId: "p1",
      weightReadings: [],
      approvedAnamneses: [ana],
    });
    expect(ctx.weight.current).toBeNull();
    expect(ctx.missing).toContain("weight");
  });
});
