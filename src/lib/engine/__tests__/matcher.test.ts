import { describe, expect, it } from "vitest";
import { matchTemplates } from "../matcher";
import type { TemplateMeta } from "../types";

const baseTpl: TemplateMeta = {
  id: "t1",
  name: "Template 1",
  kcalTarget: 2200,
  kcalRangeMin: 2100,
  kcalRangeMax: 2300,
  proteinGTarget: 170,
  carbGTarget: 250,
  fatGTarget: 60,
  mealsPerDay: 5,
  constraintsTags: [],
  goalTag: "cut",
};

describe("matchTemplates", () => {
  it("score perfeito quando tudo casa", () => {
    const r = matchTemplates({
      target: { kcal: 2200, proteinG: 170, carbG: 250, fatG: 60 },
      restrictions: [],
      mealsPerDay: 5,
      templates: [baseTpl],
    });
    expect(r[0].score).toBe(100);
    expect(r[0].autoSelectable).toBe(true);
  });

  it("penaliza desvio de kcal fora da tolerância", () => {
    const r = matchTemplates({
      target: { kcal: 3000, proteinG: 170, carbG: 250, fatG: 60 },
      restrictions: [],
      mealsPerDay: 5,
      templates: [baseTpl],
    });
    // alvo 3000 vs template 2200 → desvio significativo, score baixo
    expect(r[0].breakdown.kcal).toBeLessThan(40);
    expect(r[0].score).toBeLessThan(80);
    expect(r[0].autoSelectable).toBe(false);
  });

  it("penaliza restrição não atendida", () => {
    const r = matchTemplates({
      target: { kcal: 2200, proteinG: 170, carbG: 250, fatG: 60 },
      restrictions: ["vegetariano"],
      mealsPerDay: 5,
      templates: [baseTpl],
    });
    expect(r[0].breakdown.constraints).toBe(0);
  });

  it("aceita restrição quando tag presente (case insensitive)", () => {
    const tpl: TemplateMeta = {
      ...baseTpl,
      constraintsTags: ["Vegetariano"],
    };
    const r = matchTemplates({
      target: { kcal: 2200, proteinG: 170, carbG: 250, fatG: 60 },
      restrictions: ["vegetariano"],
      mealsPerDay: 5,
      templates: [tpl],
    });
    expect(r[0].breakdown.constraints).toBe(20);
  });

  it("ordena por score desc", () => {
    const t2: TemplateMeta = { ...baseTpl, id: "t2", kcalTarget: 3000, kcalRangeMin: 2900, kcalRangeMax: 3100 };
    const r = matchTemplates({
      target: { kcal: 2200, proteinG: 170, carbG: 250, fatG: 60 },
      restrictions: [],
      mealsPerDay: 5,
      templates: [t2, baseTpl],
    });
    expect(r[0].templateId).toBe("t1");
  });

  it("template sem metadados não é auto-selectable", () => {
    const empty: TemplateMeta = {
      id: "empty",
      name: "Vazio",
      kcalTarget: null,
      kcalRangeMin: null,
      kcalRangeMax: null,
      proteinGTarget: null,
      carbGTarget: null,
      fatGTarget: null,
      mealsPerDay: null,
      constraintsTags: [],
      goalTag: null,
    };
    const r = matchTemplates({
      target: { kcal: 2200, proteinG: 170, carbG: 250, fatG: 60 },
      restrictions: [],
      mealsPerDay: 5,
      templates: [empty],
    });
    expect(r[0].autoSelectable).toBe(false);
  });
});
