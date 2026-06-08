// Smoke tests do bridge unidade↔gramas no motor de equivalentes.
import { describe, expect, it } from "vitest";
import {
  calculateEquivalentQty,
  calculateEquivalents,
  type EquivalentBase,
  type EquivalentCandidate,
} from "../equivalents";

const OVO: EquivalentCandidate = {
  foodKey: "ovo-galinha",
  name: "Ovo de galinha cozido",
  scaleGroup: "protein",
  unit: "g",
  defaultQty: 50,
  gramsPerUnit: 50,
  kcalPer100g: 155,
  proteinPer100g: 13,
  carbPer100g: 1.1,
  fatPer100g: 11,
};

const CLARA: EquivalentCandidate = {
  foodKey: "clara-ovo",
  name: "Clara de ovo",
  scaleGroup: "protein",
  unit: "g",
  defaultQty: 33,
  gramsPerUnit: 33,
  kcalPer100g: 52,
  proteinPer100g: 11,
  carbPer100g: 0.7,
  fatPer100g: 0.2,
};

const BANANA: EquivalentCandidate = {
  foodKey: "banana",
  name: "Banana prata",
  scaleGroup: "fruit",
  unit: "g",
  defaultQty: 90,
  gramsPerUnit: 90,
  kcalPer100g: 98,
  proteinPer100g: 1.3,
  carbPer100g: 26,
  fatPer100g: 0.1,
};

const MACA: EquivalentCandidate = {
  foodKey: "maca",
  name: "Maçã",
  scaleGroup: "fruit",
  unit: "g",
  defaultQty: 130,
  gramsPerUnit: 130,
  kcalPer100g: 56,
  proteinPer100g: 0.3,
  carbPer100g: 15,
  fatPer100g: 0.2,
};

describe("equivalents — unidades", () => {
  it("ovo 2 unid → clara em unidades, com proteína equivalente", () => {
    const base: EquivalentBase = { ...OVO, qty: 100, originalUnit: "unid" }; // 2 unid * 50g
    const out = calculateEquivalentQty(base, CLARA, "protein");
    expect(out).not.toBeNull();
    expect(out!.unit).toBe("unid");
    expect(out!.qty).toBeGreaterThanOrEqual(3); // 13g prot / 11g por 100g ≈ 118g → ~3.6 unid → 4
    expect(out!.proteinG).toBeGreaterThan(10);
  });

  it("banana 1 unid → maçã em torno de 1 unid", () => {
    const base: EquivalentBase = { ...BANANA, qty: 90, originalUnit: "unid" };
    const opts = calculateEquivalents(base, [BANANA, MACA], 1, "energy");
    expect(opts).toHaveLength(1);
    expect(opts[0].foodKey).toBe("maca");
    expect(opts[0].unit).toBe("unid");
    expect(opts[0].qty).toBeGreaterThanOrEqual(1);
  });

  it("base em gramas continua saindo em gramas (sem regressão)", () => {
    const base: EquivalentBase = { ...OVO, qty: 100, originalUnit: "g" };
    const out = calculateEquivalentQty(base, CLARA, "protein");
    expect(out!.unit).toBe("g");
  });
});
