// Testes do adapter to-canonical — derivações de tags, flags e score.

import { describe, it, expect } from "vitest";
import type { CatalogManifest } from "../catalog/types";
import { toCanonical, __internal } from "../to-canonical";

const catalog: CatalogManifest = {
  version: "test-v1",
  blocks: [
    {
      id: "basics",
      domain: "basics",
      title: "Básicos",
      questions: [
        {
          id: "basics.sex",
          type: "single_choice",
          title: "Sexo",
          required: true,
          domain: "basics",
          options: [
            { value: "male", label: "M" },
            { value: "female", label: "F" },
          ],
        },
        { id: "basics.ageYears", type: "number", title: "Idade", required: true, min: 10, max: 120, domain: "basics" },
        { id: "basics.weightKg", type: "number", title: "Peso", required: true, domain: "basics" },
        { id: "basics.heightCm", type: "number", title: "Altura", required: true, domain: "basics" },
      ],
    },
    {
      id: "cardio",
      domain: "cardiovascular",
      title: "Cardio",
      questions: [
        {
          id: "cardio.hypertension",
          type: "boolean",
          title: "Hipertensão",
          domain: "cardiovascular",
          clinicalTags: ["hypertension"],
        },
      ],
    },
    {
      id: "meds",
      domain: "medications",
      title: "Medicações",
      questions: [
        { id: "meds.continuous", type: "boolean", title: "Usa?", domain: "medications" },
        {
          id: "meds.list",
          type: "text",
          title: "Quais",
          domain: "medications",
          trigger: { all: [{ questionId: "meds.continuous", equals: true }] },
        },
      ],
    },
    {
      id: "metabolic",
      domain: "metabolic",
      title: "Metabólico",
      questions: [
        {
          id: "metabolic.diabetes",
          type: "single_choice",
          title: "Diabetes",
          domain: "metabolic",
          options: [
            { value: "none", label: "Não" },
            { value: "pre", label: "Pré" },
            { value: "type1", label: "T1" },
            { value: "type2", label: "T2" },
          ],
        },
      ],
    },
    {
      id: "activity",
      domain: "physical_activity",
      title: "Atividade",
      questions: [
        { id: "activity.practices", type: "boolean", title: "Pratica?", domain: "physical_activity" },
        { id: "activity.modality", type: "text", title: "Modalidade", domain: "physical_activity" },
        { id: "activity.frequencyPerWeek", type: "number", title: "Freq", domain: "physical_activity" },
        { id: "activity.weeklyVolumeMinutes", type: "number", title: "Min/sem", domain: "physical_activity" },
      ],
    },
  ],
};

const baseBasics = {
  "basics.sex": "female",
  "basics.ageYears": 32,
  "basics.weightKg": 65,
  "basics.heightCm": 168,
};

describe("toCanonical.basics", () => {
  it("maps basics correctly and uses fallback enums", () => {
    const c = toCanonical({ catalog, answers: baseBasics, origin: "online" });
    expect(c.basics.sex).toBe("female");
    expect(c.basics.ageYears).toBe(32);
    expect(c.basics.goal).toBe("health"); // fallback
    expect(c.basics.activity).toBe("moderate"); // fallback
    expect(c.schemaVersion).toBeGreaterThan(0);
    expect(c.catalogVersion).toBe("test-v1");
    expect(c.origin).toBe("online");
  });
});

describe("toCanonical.clinicalTags", () => {
  it("emits tags from clinicalTags metadata on positive answers", () => {
    const c = toCanonical({
      catalog,
      answers: { ...baseBasics, "cardio.hypertension": true },
      origin: "online",
    });
    expect(c.clinicalTags).toContain("hypertension");
  });

  it("emits diabetes composite tags", () => {
    const c2 = toCanonical({
      catalog,
      answers: { ...baseBasics, "metabolic.diabetes": "type2" },
      origin: "online",
    });
    expect(c2.clinicalTags).toContain("diabetes_type2");
    expect(c2.clinicalTags).toContain("diabetes");

    const c1 = toCanonical({
      catalog,
      answers: { ...baseBasics, "metabolic.diabetes": "type1" },
      origin: "online",
    });
    expect(c1.clinicalTags).toContain("diabetes_type1");
    expect(c1.clinicalTags).toContain("diabetes");

    const cp = toCanonical({
      catalog,
      answers: { ...baseBasics, "metabolic.diabetes": "pre" },
      origin: "online",
    });
    expect(cp.clinicalTags).toContain("pre_diabetes");
    expect(cp.clinicalTags).not.toContain("diabetes");
  });

  it("emits high_training_volume when weekly volume >= 600min", () => {
    const c = toCanonical({
      catalog,
      answers: {
        ...baseBasics,
        "activity.practices": true,
        "activity.weeklyVolumeMinutes": 650,
      },
      origin: "online",
    });
    expect(c.clinicalTags).toContain("high_training_volume");
  });
});

describe("toCanonical.riskFlags", () => {
  it("flags uncontrolled_hypertension when hypertension and no meds", () => {
    const c = toCanonical({
      catalog,
      answers: { ...baseBasics, "cardio.hypertension": true },
      origin: "online",
    });
    expect(c.riskFlags).toContain("uncontrolled_hypertension");
  });

  it("does NOT flag uncontrolled_hypertension when meds are present", () => {
    const c = toCanonical({
      catalog,
      answers: {
        ...baseBasics,
        "cardio.hypertension": true,
        "meds.continuous": true,
        "meds.list": "Losartana 50mg",
      },
      origin: "online",
    });
    expect(c.riskFlags).not.toContain("uncontrolled_hypertension");
    expect(c.medications.length).toBeGreaterThan(0);
  });

  it("flags uncontrolled_diabetes when diabetes without meds", () => {
    const c = toCanonical({
      catalog,
      answers: { ...baseBasics, "metabolic.diabetes": "type2" },
      origin: "online",
    });
    expect(c.riskFlags).toContain("uncontrolled_diabetes");
  });
});

describe("toCanonical.completionScore", () => {
  it("is 0..100 and grows as required answers are filled", () => {
    const empty = __internal.computeCompletionScore(catalog, {});
    const partial = __internal.computeCompletionScore(catalog, { "basics.sex": "male" });
    const full = __internal.computeCompletionScore(catalog, {
      ...baseBasics,
      "cardio.hypertension": true,
      "metabolic.diabetes": "none",
    });
    expect(empty).toBeGreaterThanOrEqual(0);
    expect(empty).toBeLessThanOrEqual(100);
    expect(full).toBeGreaterThan(partial);
    expect(full).toBeLessThanOrEqual(100);
  });
});

describe("toCanonical.medications", () => {
  it("parses semicolon/newline separated list and caps at 50", () => {
    const txt = Array.from({ length: 60 }, (_, i) => `Med${i}`).join(";");
    const c = toCanonical({
      catalog,
      answers: { ...baseBasics, "meds.continuous": true, "meds.list": txt },
      origin: "online",
    });
    expect(c.medications.length).toBe(50);
    expect(c.medications[0].name).toBe("Med0");
    expect(c.medications.every((m) => m.continuous === true)).toBe(true);
  });

  it("is empty when meds.continuous is false", () => {
    const c = toCanonical({
      catalog,
      answers: { ...baseBasics, "meds.continuous": false },
      origin: "online",
    });
    expect(c.medications).toEqual([]);
  });
});

describe("toCanonical.sportProfile", () => {
  it("is null when activity.practices is not true", () => {
    const c = toCanonical({ catalog, answers: baseBasics, origin: "online" });
    expect(c.sportProfile).toBeNull();
  });

  it("derives weeklyHours from minutes", () => {
    const c = toCanonical({
      catalog,
      answers: {
        ...baseBasics,
        "activity.practices": true,
        "activity.modality": "corrida",
        "activity.weeklyVolumeMinutes": 300,
      },
      origin: "online",
    });
    expect(c.sportProfile?.primaryModality).toBe("corrida");
    expect(c.sportProfile?.weeklyHours).toBe(5);
  });
});
