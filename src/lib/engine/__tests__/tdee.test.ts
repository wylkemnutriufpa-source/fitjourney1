import { describe, expect, it } from "vitest";
import { activityFactor, calcTDEE, calcTMB, calcFromAnamnese } from "../tdee";

describe("calcTMB (Mifflin-St Jeor)", () => {
  it("calcula TMB masculino", () => {
    // (10*80) + (6.25*180) - (5*30) + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(
      calcTMB({ sex: "male", weightKg: 80, heightCm: 180, ageYears: 30 }),
    ).toBe(1780);
  });

  it("calcula TMB feminino", () => {
    // (10*60) + (6.25*165) - (5*28) - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 → 1330
    expect(
      calcTMB({ sex: "female", weightKg: 60, heightCm: 165, ageYears: 28 }),
    ).toBe(1330);
  });

  it("rejeita entradas inválidas", () => {
    expect(() =>
      calcTMB({ sex: "male", weightKg: 0, heightCm: 180, ageYears: 30 }),
    ).toThrow();
    expect(() =>
      calcTMB({ sex: "male", weightKg: -1, heightCm: 180, ageYears: 30 }),
    ).toThrow();
  });
});

describe("activityFactor", () => {
  it("retorna fatores corretos", () => {
    expect(activityFactor("sedentary")).toBe(1.2);
    expect(activityFactor("light")).toBe(1.375);
    expect(activityFactor("moderate")).toBe(1.55);
    expect(activityFactor("high")).toBe(1.725);
    expect(activityFactor("extreme")).toBe(1.9);
  });
});

describe("calcTDEE", () => {
  it("multiplica TMB por fator de atividade", () => {
    expect(calcTDEE(1780, "moderate")).toBe(Math.round(1780 * 1.55));
  });
});

describe("calcFromAnamnese", () => {
  it("retorna tmb + tdee coerentes", () => {
    const r = calcFromAnamnese({
      sex: "male",
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      activity: "moderate",
      goal: "bulk",
    });
    expect(r.tmb).toBe(1780);
    expect(r.tdee).toBe(Math.round(1780 * 1.55));
  });
});
