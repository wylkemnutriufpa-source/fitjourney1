import { describe, it, expect } from "vitest";
import { SnapshotV2Schema } from "../snapshot.v2.schema";
import { espHipertrofiaV2Piloto } from "../template-data.v2";

// Snapshot V1 sintético no formato atual (main + equivalents).
const snapshotV1Like = {
  id: "plan-v1",
  name: "Plano V1",
  kcal: 2000,
  meals: [
    {
      id: "m1",
      time: "07:00",
      label: "Café",
      main: {
        id: "opt-1",
        title: "Pão com ovo",
        imageKey: "pao_ovo",
        items: [
          {
            id: "it-1",
            foodKey: "pao_ovo",
            name: "Pão com ovo",
            qty: 1,
            unit: "unid",
            kcal: 300,
            scaleGroup: "mixed",
          },
        ],
      },
      equivalents: [],
    },
  ],
};

describe("SnapshotV2Schema", () => {
  it("aceita snapshot V1 (main + equivalents) sem alteração", () => {
    const r = SnapshotV2Schema.safeParse(snapshotV1Like);
    expect(r.success).toBe(true);
  });

  it("aceita template V2 piloto (items + measures + substitutions + notes)", () => {
    const r = SnapshotV2Schema.safeParse(espHipertrofiaV2Piloto);
    expect(r.success).toBe(true);
  });

  it("aceita campos extras desconhecidos (passthrough)", () => {
    const withExtras = {
      ...snapshotV1Like,
      customExtra: { anything: true },
      meals: snapshotV1Like.meals.map((m) => ({ ...m, futureField: 1 })),
    };
    expect(SnapshotV2Schema.safeParse(withExtras).success).toBe(true);
  });

  it("rejeita snapshot sem refeições", () => {
    const empty = { id: "p", name: "x", kcal: 0, meals: [] };
    expect(SnapshotV2Schema.safeParse(empty).success).toBe(false);
  });
});
