import { describe, it, expect } from "vitest";
import { routeTemplate } from "../router";
import type { TemplateMeta } from "../types";

const tpl = (
  id: string,
  name: string,
  goalTag: TemplateMeta["goalTag"],
  kcal: number | null,
): TemplateMeta => ({
  id,
  name,
  kcalTarget: kcal,
  kcalRangeMin: null,
  kcalRangeMax: null,
  proteinGTarget: null,
  carbGTarget: null,
  fatGTarget: null,
  mealsPerDay: null,
  constraintsTags: [],
  goalTag,
});

const CATALOG: TemplateMeta[] = [
  tpl("esp-hipertrofia", "Hipertrofia", "bulk", 3000),
  tpl("esp-cutting", "Cutting", "cut", 1900),
  tpl("esp-endurance", "Endurance", "bulk" as any, 3200),
  tpl("cli-diabetes", "Diabetes", "maintain", 2000),
  tpl("cli-gastrite", "Gastrite", "maintain", 2000),
  tpl("cli-hipertensao", "Hipertensão", "maintain", 2100),
  tpl("cli-fodmap", "FODMAP", "maintain", 2000),
  tpl("cli-sem-gluten", "Sem glúten", "maintain", 2200),
  tpl("cli-sem-lactose", "Sem lactose", "maintain", 2200),
  tpl("ges-gestante", "Gestante", "maintain", 2400),
  tpl("bar-pos-bariatrica", "Pós-bariátrica", "maintain", 1200),
];

describe("routeTemplate", () => {
  it("restrição sempre vence sobre objetivo+kcal", () => {
    const r = routeTemplate({
      tdeeKcal: 3000,
      engineGoal: "bulk",
      restrictions: ["diabetes"],
      templates: CATALOG,
    });
    expect(r?.templateKey).toBe("cli-diabetes");
    expect(r?.priority).toBe("restriction");
  });

  it("pós-bariátrica vence diabetes (prioridade fixa)", () => {
    const r = routeTemplate({
      tdeeKcal: 1800,
      engineGoal: "cut",
      restrictions: ["diabetes", "pos_bariatrica"],
      templates: CATALOG,
    });
    expect(r?.templateKey).toBe("bar-pos-bariatrica");
  });

  it("gestante vence diabetes", () => {
    const r = routeTemplate({
      tdeeKcal: 2200,
      engineGoal: "maintain",
      restrictions: ["diabetes", "gestante"],
      templates: CATALOG,
    });
    expect(r?.templateKey).toBe("ges-gestante");
  });

  it("normaliza variações: 'Diabetes', 'sem-lactose', 'pós_bariátrica'", () => {
    expect(
      routeTemplate({
        tdeeKcal: 2000,
        engineGoal: "maintain",
        restrictions: ["Diabetes"],
        templates: CATALOG,
      })?.templateKey,
    ).toBe("cli-diabetes");

    expect(
      routeTemplate({
        tdeeKcal: 2000,
        engineGoal: "maintain",
        restrictions: ["sem-lactose"],
        templates: CATALOG,
      })?.templateKey,
    ).toBe("cli-sem-lactose");

    expect(
      routeTemplate({
        tdeeKcal: 1200,
        engineGoal: "maintain",
        restrictions: ["pós bariátrica"],
        templates: CATALOG,
      })?.templateKey,
    ).toBe("bar-pos-bariatrica");
  });

  it("sem restrição, hipertrofia 2500 kcal → escolhe template bulk mais próximo", () => {
    const r = routeTemplate({
      tdeeKcal: 2500,
      engineGoal: "bulk",
      restrictions: [],
      templates: CATALOG,
    });
    // Hipertrofia 3000 está mais perto de 2500 que Endurance 3200
    expect(r?.templateKey).toBe("esp-hipertrofia");
    expect(r?.priority).toBe("goal+kcal");
  });

  it("emagrecimento sem restrição → cutting", () => {
    const r = routeTemplate({
      tdeeKcal: 1800,
      engineGoal: "cut",
      restrictions: [],
      templates: CATALOG,
    });
    expect(r?.templateKey).toBe("esp-cutting");
  });

  it("família vazia → null", () => {
    const r = routeTemplate({
      tdeeKcal: 2000,
      engineGoal: "cut",
      restrictions: [],
      templates: [tpl("only-bulk", "Bulk", "bulk", 3000)],
    });
    expect(r).toBeNull();
  });

  it("restrição sem template correspondente → cai pro fluxo objetivo+kcal", () => {
    const r = routeTemplate({
      tdeeKcal: 2200,
      engineGoal: "maintain",
      restrictions: ["doenca_inexistente"],
      templates: CATALOG,
    });
    expect(r?.priority).toBe("goal+kcal");
  });
});
