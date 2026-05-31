import { describe, expect, it } from "vitest";
import {
  resolveCurrentWeight,
  type WeightReading,
} from "../resolve-weight";

const r = (
  source: WeightReading["source"],
  weightKg: number,
  measuredAt: string,
  sourceId = `${source}-${measuredAt}`,
): WeightReading => ({ source, weightKg, measuredAt, sourceId });

describe("resolveCurrentWeight", () => {
  it("retorna null quando não há leituras", () => {
    const res = resolveCurrentWeight([]);
    expect(res.current).toBeNull();
    expect(res.history).toEqual([]);
  });

  it("escolhe a leitura mais recente independente da fonte", () => {
    // Cenário crítico: AF antiga (90kg, 60 dias atrás) vs Feedback novo (84kg, 1 dia atrás).
    // Resultado esperado: 84kg.
    const af = r("physical_assessment", 90, "2026-04-01T10:00:00Z");
    const fb = r("feedback", 84, "2026-05-30T10:00:00Z");
    const an = r("anamnesis", 88, "2026-03-01T10:00:00Z");
    const res = resolveCurrentWeight([af, fb, an]);
    expect(res.current?.weightKg).toBe(84);
    expect(res.current?.source).toBe("feedback");
  });

  it("history vem ordenado desc por measuredAt", () => {
    const a = r("anamnesis", 80, "2026-01-01T00:00:00Z");
    const b = r("feedback", 81, "2026-02-01T00:00:00Z");
    const c = r("physical_assessment", 82, "2026-03-01T00:00:00Z");
    const res = resolveCurrentWeight([a, b, c]);
    expect(res.history.map((x) => x.weightKg)).toEqual([82, 81, 80]);
  });

  it("tiebreaker técnico: AF > feedback > anamnese no mesmo timestamp", () => {
    const t = "2026-05-31T12:00:00Z";
    const an = r("anamnesis", 70, t);
    const fb = r("feedback", 71, t);
    const af = r("physical_assessment", 72, t);
    const res = resolveCurrentWeight([an, fb, af]);
    expect(res.current?.source).toBe("physical_assessment");

    const res2 = resolveCurrentWeight([an, fb]);
    expect(res2.current?.source).toBe("feedback");
  });

  it("ignora leituras inválidas (peso <=0, NaN, sem timestamp)", () => {
    const good = r("feedback", 80, "2026-05-01T00:00:00Z");
    const bad1 = r("feedback", 0, "2026-05-10T00:00:00Z");
    const bad2 = r("anamnesis", Number.NaN, "2026-05-15T00:00:00Z");
    const bad3 = r("anamnesis", 75, "");
    const res = resolveCurrentWeight([good, bad1, bad2, bad3]);
    expect(res.current).toEqual(good);
    expect(res.history).toHaveLength(1);
  });
});
