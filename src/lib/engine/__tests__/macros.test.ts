import { describe, expect, it } from "vitest";
import { calcMacroTarget } from "../macros";

describe("calcMacroTarget", () => {
  it("cutting: prot 2.2/kg, fat 0.8/kg, kcal = TDEE*0.8", () => {
    const r = calcMacroTarget({ tdee: 2800, weightKg: 80, goal: "cut" });
    expect(r.kcal).toBe(Math.round(2800 * 0.8)); // 2240
    expect(r.proteinG).toBe(Math.round(2.2 * 80)); // 176
    expect(r.fatG).toBe(Math.round(0.8 * 80)); // 64
    // carb fecha
    const carbKcal = r.kcal - r.proteinG * 4 - r.fatG * 9;
    expect(r.carbG).toBe(Math.round(carbKcal / 4));
  });

  it("bulking: prot 2.0, fat 1.0, kcal = TDEE*1.12", () => {
    const r = calcMacroTarget({ tdee: 2800, weightKg: 80, goal: "bulk" });
    expect(r.kcal).toBe(Math.round(2800 * 1.12));
    expect(r.proteinG).toBe(160);
    expect(r.fatG).toBe(80);
  });

  it("manutenção: prot 2.0, fat 0.9, kcal = TDEE", () => {
    const r = calcMacroTarget({ tdee: 2500, weightKg: 70, goal: "maintain" });
    expect(r.kcal).toBe(2500);
    expect(r.proteinG).toBe(140);
    expect(r.fatG).toBe(63);
  });

  it("carb nunca fica negativo", () => {
    // caso extremo: kcal muito baixo, proteína+gordura excedem
    const r = calcMacroTarget({ tdee: 1000, weightKg: 100, goal: "cut" });
    expect(r.carbG).toBeGreaterThanOrEqual(0);
  });

  it("rejeita entradas inválidas", () => {
    expect(() =>
      calcMacroTarget({ tdee: 0, weightKg: 80, goal: "cut" }),
    ).toThrow();
    expect(() =>
      calcMacroTarget({ tdee: 2000, weightKg: 0, goal: "cut" }),
    ).toThrow();
  });
});
