import { describe, it, expect } from "vitest";
import { buildTacoEquivalents } from "../planner-bridge";
import { createEmptyFoodItem } from "@/lib/meal-planner";

describe("buildTacoEquivalents", () => {
  it("retorna null quando o base não está coberto pela TACO seed", () => {
    const food = createEmptyFoodItem({
      foodKey: "iogurte-natural",
      name: "Iogurte natural",
      qty: 200,
      unit: "g",
      kcal: 120,
      scaleGroup: "dairy",
    });
    expect(buildTacoEquivalents(food, 3)).toBeNull();
  });

  it("100g peito de frango gera substitutos protéicos equivalentes (TACO)", () => {
    const food = createEmptyFoodItem({
      foodKey: "peito-frango",
      name: "Peito de frango sem pele cru",
      qty: 100,
      unit: "g",
      kcal: 119,
      scaleGroup: "protein",
    });
    const opts = buildTacoEquivalents(food, 3);
    expect(opts).not.toBeNull();
    expect(opts!.length).toBe(3);
    // Patinho (21.9 prot) deve ficar próximo de 100g — match quase 1:1.
    const patinho = opts!.find((o) => /patinho/i.test(o.title));
    expect(patinho).toBeDefined();
    expect(patinho!.items[0].qty).toBeGreaterThanOrEqual(95);
    expect(patinho!.items[0].qty).toBeLessThanOrEqual(105);
  });

  it("100g arroz branco gera substitutos de carbo (match por carb)", () => {
    const food = createEmptyFoodItem({
      foodKey: "arroz-branco",
      name: "Arroz branco cozido",
      qty: 100,
      unit: "g",
      kcal: 130,
      scaleGroup: "carb",
    });
    const opts = buildTacoEquivalents(food, 4);
    expect(opts).not.toBeNull();
    // Catálogo TACO contém >= 4 carbos → ao pedir 4, esperamos 4.
    expect(opts!.length).toBe(4);
    for (const o of opts!) {
      expect(o.items[0].scaleGroup).toBe("carb");
    }
  });

  it("respeita o count (1..4)", () => {
    const food = createEmptyFoodItem({
      foodKey: "peito-frango",
      name: "Peito de frango sem pele cru",
      qty: 150,
      unit: "g",
      kcal: 180,
      scaleGroup: "protein",
    });
    expect(buildTacoEquivalents(food, 1)!.length).toBe(1);
    expect(buildTacoEquivalents(food, 2)!.length).toBe(2);
    expect(buildTacoEquivalents(food, 4)!.length).toBe(4);
  });

  it("kcal do substituto bate com a equivalência por gramatura", () => {
    const food = createEmptyFoodItem({
      foodKey: "peito-frango",
      name: "Peito de frango sem pele cru",
      qty: 100,
      unit: "g",
      kcal: 119,
      scaleGroup: "protein",
    });
    const opts = buildTacoEquivalents(food, 3)!;
    const merluza = opts.find((o) => /merluza/i.test(o.title));
    if (merluza) {
      // 100g frango (21.5 prot) → ~125g merluza (17 prot) → ~125 * 82 / 100 ≈ 103 kcal
      expect(merluza.items[0].qty).toBeGreaterThanOrEqual(120);
      expect(merluza.items[0].qty).toBeLessThanOrEqual(135);
      expect(merluza.items[0].kcal).toBeGreaterThan(90);
      expect(merluza.items[0].kcal).toBeLessThan(115);
    }
  });
});
