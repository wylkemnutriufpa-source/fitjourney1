import { describe, it, expect } from "vitest";
import { buildSnapshotV2 } from "../snapshot/build";
import { SnapshotV2Schema } from "../snapshot.v2.schema";
import { espHipertrofiaV2Piloto } from "../template-data.v2";

describe("buildSnapshotV2", () => {
  it("produz objeto válido pelo SnapshotV2Schema", () => {
    const snap = buildSnapshotV2(espHipertrofiaV2Piloto);
    expect(() => SnapshotV2Schema.parse(snap)).not.toThrow();
    expect(snap.schemaVersion).toBe("v2.pilot.1");
    expect(snap.days).toHaveLength(7);
  });

  it("é serializável (round-trip JSON)", () => {
    const snap = buildSnapshotV2(espHipertrofiaV2Piloto);
    const round = JSON.parse(JSON.stringify(snap));
    expect(SnapshotV2Schema.safeParse(round).success).toBe(true);
  });

  it("é congelado: mutar o snapshot não tem efeito", () => {
    const snap = buildSnapshotV2(espHipertrofiaV2Piloto);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.days[0])).toBe(true);
    expect(Object.isFrozen(snap.days[0].meals[0])).toBe(true);
  });

  it("mudanças posteriores no rascunho não afetam snapshot já gerado", () => {
    const draft = JSON.parse(JSON.stringify(espHipertrofiaV2Piloto));
    const snap = buildSnapshotV2(draft);
    const originalName = snap.days[0].meals[0].items[0].name;
    draft.days[0].meals[0].items[0].name = "MUTADO";
    expect(snap.days[0].meals[0].items[0].name).toBe(originalName);
  });
});
