import { describe, expect, it } from "vitest";
import { buildClinicalTimeline } from "../timeline";

const PID = "patient-1";

describe("buildClinicalTimeline", () => {
  it("retorna [] quando não há dados", () => {
    expect(
      buildClinicalTimeline({ anamneses: [], feedbacks: [], plans: [] }),
    ).toEqual([]);
  });

  it("emite submitted e approved a partir de uma anamnese aprovada", () => {
    const events = buildClinicalTimeline({
      anamneses: [
        {
          id: "a1",
          patient_id: PID,
          review_status: "approved",
          submitted_at: "2026-01-01T10:00:00Z",
          approved_at: "2026-01-02T10:00:00Z",
          version: 1,
        },
      ],
      feedbacks: [],
      plans: [],
    });
    expect(events.map((e) => e.type)).toEqual([
      "anamnesis_approved",
      "anamnesis_submitted",
    ]);
  });

  it("ignora anamnese sem submitted_at e sem approved_at", () => {
    const events = buildClinicalTimeline({
      anamneses: [
        {
          id: "a1",
          patient_id: PID,
          review_status: "draft",
          submitted_at: null,
          approved_at: null,
          version: 1,
        },
      ],
      feedbacks: [],
      plans: [],
    });
    expect(events).toEqual([]);
  });

  it("ignora plano não publicado", () => {
    const events = buildClinicalTimeline({
      anamneses: [],
      feedbacks: [],
      plans: [
        {
          id: "p1",
          patient_id: PID,
          published_at: null,
          status: "draft",
          schema_version: 3,
        },
      ],
    });
    expect(events).toEqual([]);
  });

  it("merge e ordena DESC por occurredAt", () => {
    const events = buildClinicalTimeline({
      anamneses: [
        {
          id: "a1",
          patient_id: PID,
          review_status: "approved",
          submitted_at: "2026-01-01T00:00:00Z",
          approved_at: "2026-01-02T00:00:00Z",
          version: 1,
        },
      ],
      feedbacks: [
        {
          id: "f1",
          patient_id: PID,
          created_at: "2026-03-01T00:00:00Z",
          weight_kg: 80,
          adherence_rating: "high",
          result_rating: "good",
        },
      ],
      plans: [
        {
          id: "p1",
          patient_id: PID,
          published_at: "2026-02-01T00:00:00Z",
          status: "published",
          schema_version: 3,
        },
      ],
    });
    expect(events.map((e) => e.occurredAt)).toEqual([
      "2026-03-01T00:00:00Z",
      "2026-02-01T00:00:00Z",
      "2026-01-02T00:00:00Z",
      "2026-01-01T00:00:00Z",
    ]);
  });

  it("ids são estáveis e únicos por (source, sourceId, type)", () => {
    const events = buildClinicalTimeline({
      anamneses: [
        {
          id: "a1",
          patient_id: PID,
          review_status: "approved",
          submitted_at: "2026-01-01T00:00:00Z",
          approved_at: "2026-01-02T00:00:00Z",
          version: 1,
        },
      ],
      feedbacks: [],
      plans: [],
    });
    const ids = events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("anamneses:a1:anamnesis_approved");
    expect(ids).toContain("anamneses:a1:anamnesis_submitted");
  });
});
