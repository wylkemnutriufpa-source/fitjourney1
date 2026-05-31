import { describe, expect, it } from "vitest";
import { resolveGoal, type ApprovedAnamnesisInput } from "../resolve-goal";
import type { GoalKind } from "../resolve-goal";

const mk = (
  id: string,
  approvedAt: string,
  goal: GoalKind,
): ApprovedAnamnesisInput => ({
  id,
  approvedAt,
  canonical: {
    basics: {
      sex: "male",
      ageYears: 30,
      weightKg: 80,
      heightCm: 175,
      goal,
      activity: "moderate",
    },
  },
});

describe("resolveGoal", () => {
  it("retorna null quando não há anamneses aprovadas", () => {
    const r = resolveGoal([]);
    expect(r.current).toBeNull();
    expect(r.history).toEqual([]);
  });

  it("usa a anamnese aprovada mais recente como meta atual", () => {
    const older = mk("a1", "2026-01-01T00:00:00Z", "maintain");
    const newer = mk("a2", "2026-05-01T00:00:00Z", "cut");
    const r = resolveGoal([older, newer]);
    expect(r.current?.kind).toBe("cut");
    expect(r.current?.sourceAnamnesisId).toBe("a2");
  });

  it("history vem desc por decidedAt", () => {
    const a1 = mk("a1", "2026-01-01T00:00:00Z", "maintain");
    const a2 = mk("a2", "2026-03-01T00:00:00Z", "bulk");
    const a3 = mk("a3", "2026-05-01T00:00:00Z", "cut");
    const r = resolveGoal([a1, a3, a2]);
    expect(r.history.map((g) => g.kind)).toEqual(["cut", "bulk", "maintain"]);
  });

  it("ignora entradas sem approvedAt", () => {
    const bad = mk("bad", "", "cut");
    const good = mk("g", "2026-05-01T00:00:00Z", "bulk");
    const r = resolveGoal([bad, good]);
    expect(r.history).toHaveLength(1);
    expect(r.current?.sourceAnamnesisId).toBe("g");
  });
});
