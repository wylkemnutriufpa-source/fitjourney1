// Testes do Runner — visibilidade por trigger, validação, contagem.
// Determinístico, sem IO.

import { describe, it, expect } from "vitest";
import type { CatalogManifest } from "../catalog/types";
import {
  isQuestionActive,
  getVisibleQuestions,
  isAnswered,
  validateAnswers,
} from "../runner";

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
        {
          id: "basics.age",
          type: "number",
          title: "Idade",
          required: true,
          min: 10,
          max: 120,
          domain: "basics",
        },
      ],
    },
    {
      id: "meds",
      domain: "medications",
      title: "Medicações",
      questions: [
        {
          id: "meds.continuous",
          type: "boolean",
          title: "Usa contínuo?",
          domain: "medications",
        },
        {
          id: "meds.list",
          type: "text",
          title: "Quais?",
          required: true,
          domain: "medications",
          trigger: { all: [{ questionId: "meds.continuous", equals: true }] },
        },
      ],
    },
    {
      id: "digestive",
      domain: "digestive",
      title: "Digestivo",
      questions: [
        {
          id: "digestive.symptoms",
          type: "multi_choice",
          title: "Sintomas",
          domain: "digestive",
          options: [
            { value: "pain", label: "Dor" },
            { value: "bloat", label: "Inchaço" },
          ],
        },
        {
          id: "digestive.painDetail",
          type: "text",
          title: "Detalhe da dor",
          domain: "digestive",
          trigger: { all: [{ questionId: "digestive.symptoms", includes: "pain" }] },
        },
      ],
    },
  ],
};

describe("runner.isQuestionActive", () => {
  it("renders questions without trigger", () => {
    expect(isQuestionActive(catalog.blocks[0].questions[0], {})).toBe(true);
  });

  it("hides question when trigger condition (equals) is unmet", () => {
    const medsList = catalog.blocks[1].questions[1];
    expect(isQuestionActive(medsList, { "meds.continuous": false })).toBe(false);
    expect(isQuestionActive(medsList, { "meds.continuous": true })).toBe(true);
  });

  it("evaluates 'includes' trigger against multi_choice arrays", () => {
    const detail = catalog.blocks[2].questions[1];
    expect(isQuestionActive(detail, { "digestive.symptoms": ["bloat"] })).toBe(false);
    expect(isQuestionActive(detail, { "digestive.symptoms": ["pain", "bloat"] })).toBe(true);
  });
});

describe("runner.getVisibleQuestions", () => {
  it("filters out inactive questions across blocks", () => {
    const visible = getVisibleQuestions(catalog, {});
    const ids = visible.map((v) => v.question.id);
    expect(ids).toContain("basics.sex");
    expect(ids).toContain("meds.continuous");
    expect(ids).not.toContain("meds.list");
    expect(ids).not.toContain("digestive.painDetail");
  });

  it("reveals conditional questions when answers change", () => {
    const visible = getVisibleQuestions(catalog, {
      "meds.continuous": true,
      "digestive.symptoms": ["pain"],
    });
    const ids = visible.map((v) => v.question.id);
    expect(ids).toContain("meds.list");
    expect(ids).toContain("digestive.painDetail");
  });
});

describe("runner.isAnswered", () => {
  it("treats empty values as unanswered", () => {
    const q = catalog.blocks[0].questions[0];
    expect(isAnswered(q, {})).toBe(false);
    expect(isAnswered(q, { [q.id]: "" })).toBe(false);
    expect(isAnswered(q, { [q.id]: null })).toBe(false);
    expect(isAnswered(q, { [q.id]: [] })).toBe(false);
    expect(isAnswered(q, { [q.id]: "male" })).toBe(true);
  });
});

describe("runner.validateAnswers", () => {
  it("reports missing required answers only for visible questions", () => {
    const issues = validateAnswers(catalog, {});
    const ids = issues.map((i) => i.questionId);
    expect(ids).toContain("basics.sex");
    expect(ids).toContain("basics.age");
    // meds.list é required mas trigger não bateu — não deve aparecer
    expect(ids).not.toContain("meds.list");
  });

  it("enforces required when trigger activates the question", () => {
    const issues = validateAnswers(catalog, {
      "basics.sex": "male",
      "basics.age": 30,
      "meds.continuous": true,
    });
    expect(issues.map((i) => i.questionId)).toContain("meds.list");
  });

  it("enforces min/max on numbers", () => {
    const tooYoung = validateAnswers(catalog, { "basics.sex": "male", "basics.age": 5 });
    expect(tooYoung.find((i) => i.questionId === "basics.age")?.message).toMatch(/Mínimo/);

    const tooOld = validateAnswers(catalog, { "basics.sex": "male", "basics.age": 999 });
    expect(tooOld.find((i) => i.questionId === "basics.age")?.message).toMatch(/Máximo/);
  });

  it("returns no issues when all required visible answers are present", () => {
    const issues = validateAnswers(catalog, {
      "basics.sex": "female",
      "basics.age": 30,
    });
    expect(issues).toHaveLength(0);
  });
});
