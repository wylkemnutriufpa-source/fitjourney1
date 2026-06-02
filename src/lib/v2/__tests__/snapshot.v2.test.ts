import { describe, it, expect } from "vitest";
import { SnapshotV2Schema } from "../snapshot.v2.schema";
import { buildSnapshotV2 } from "../snapshot/build";
import { espHipertrofiaV2Piloto } from "../template-data.v2";

describe("SnapshotV2Schema", () => {
  it("aceita snapshot gerado a partir do template piloto", () => {
    const snap = buildSnapshotV2(espHipertrofiaV2Piloto);
    expect(SnapshotV2Schema.safeParse(snap).success).toBe(true);
  });

  it("rejeita snapshot sem schemaVersion", () => {
    const snap = buildSnapshotV2(espHipertrofiaV2Piloto) as Record<string, unknown>;
    const { schemaVersion, ...broken } = snap;
    void schemaVersion;
    expect(SnapshotV2Schema.safeParse(broken).success).toBe(false);
  });

  it("rejeita snapshot com número de dias != 7", () => {
    const snap = JSON.parse(JSON.stringify(buildSnapshotV2(espHipertrofiaV2Piloto)));
    snap.days = snap.days.slice(0, 3);
    expect(SnapshotV2Schema.safeParse(snap).success).toBe(false);
  });
});
