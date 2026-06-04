import { describe, it, expect } from "vitest";
import {
  calculateEquivalents,
  calculateEquivalentQty,
  defaultCriterionFor,
  type EquivalentBase,
  type EquivalentCandidate,
} from "../equivalents";

const frango: EquivalentBase = {
  foodKey: "frango-grelhado",
  name: "Frango grelhado",
  scaleGroup: "protein",
  unit: "g",
  defaultQty: 100,
  qty: 100,
  kcalPer100g: 165,
  proteinPer100g: 31,
  carbPer100g: 0,
  fatPer100g: 3.6,
};

const patinho: EquivalentCandidate = {
  foodKey: "patinho",
  name: "Patinho bovino",
  scaleGroup: "protein",
  unit: "g",
  defaultQty: 100,
  kcalPer100g: 158,
  proteinPer100g: 28.5,
  carbPer100g: 0,
  fatPer100g: 4.6,
};

const tilapia: EquivalentCandidate = {
  foodKey: "tilapia",
  name: "Tilápia",
  scaleGroup: "protein",
  unit: "g",
  defaultQty: 150,
  kcalPer100g: 96,
  proteinPer100g: 20,
  carbPer100g: 0,
  fatPer100g: 1.7,
};

const arroz: EquivalentCandidate = {
  foodKey: "arroz",
  name: "Arroz",
  scaleGroup: "carb",
  unit: "g",
  defaultQty: 100,
  kcalPer100g: 128,
  proteinPer100g: 2.5,
  carbPer100g: 28,
  fatPer100g: 0.2,
};

describe("calculateEquivalents", () => {
  it("infere critério por scaleGroup", () => {
    expect(defaultCriterionFor("protein")).toBe("protein");
    expect(defaultCriterionFor("carb")).toBe("carb");
    expect(defaultCriterionFor("fruit")).toBe("energy");
  });

  it("calcula equivalência por proteína (frango → patinho)", () => {
    const r = calculateEquivalentQty(frango, patinho, "protein");
    expect(r).not.toBeNull();
    // 100g frango = 31g prot. patinho 28.5g/100g → ~108.7g → arredonda 5 → 110g
    expect(r!.qty).toBe(110);
    expect(r!.criterion).toBe("protein");
  });

  it("calcula equivalência por proteína (frango → tilápia)", () => {
    const r = calculateEquivalentQty(frango, tilapia, "protein");
    expect(r).not.toBeNull();
    // 31g / 0.20 = 155 → 155g
    expect(r!.qty).toBe(155);
  });

  it("filtra candidatos pelo mesmo scaleGroup", () => {
    const opts = calculateEquivalents(frango, [patinho, tilapia, arroz], 3);
    expect(opts.map((o) => o.foodKey)).toEqual(["patinho", "tilapia"]);
  });

  it("respeita o count (1-4)", () => {
    expect(calculateEquivalents(frango, [patinho, tilapia], 1)).toHaveLength(1);
    expect(calculateEquivalents(frango, [patinho, tilapia], 0)).toHaveLength(1);
    expect(calculateEquivalents(frango, [patinho, tilapia], 99)).toHaveLength(2);
  });

  it("ordena por proximidade de massa ao base", () => {
    const opts = calculateEquivalents(frango, [tilapia, patinho], 2);
    // patinho (110g) está mais perto de 100g que tilapia (155g)
    expect(opts[0].foodKey).toBe("patinho");
  });

  it("retorna null para candidato sem o nutriente alvo", () => {
    expect(calculateEquivalentQty(frango, arroz, "protein")).not.toBeNull(); // arroz tem 2.5g
    const semProt = { ...arroz, proteinPer100g: 0 };
    expect(calculateEquivalentQty(frango, semProt, "protein")).toBeNull();
  });
});
