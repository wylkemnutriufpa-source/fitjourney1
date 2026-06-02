// Piloto V2 — bridge serializada entre editor e preview.
// sessionStorage com validação na leitura (defesa em profundidade).

import { SnapshotV2Schema, type SnapshotV2 } from "../snapshot.v2.schema";

export const SNAPSHOT_STORAGE_KEY = "v2.pilot.snapshot";

export function saveSnapshot(snap: SnapshotV2): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snap));
}

export type LoadSnapshotResult =
  | { kind: "empty" }
  | { kind: "ok"; snapshot: SnapshotV2 }
  | { kind: "invalid"; error: string };

export function loadSnapshot(): LoadSnapshotResult {
  if (typeof window === "undefined") return { kind: "empty" };
  const raw = window.sessionStorage.getItem(SNAPSHOT_STORAGE_KEY);
  if (!raw) return { kind: "empty" };
  try {
    const json = JSON.parse(raw);
    const parsed = SnapshotV2Schema.safeParse(json);
    if (!parsed.success) {
      return {
        kind: "invalid",
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" | "),
      };
    }
    return { kind: "ok", snapshot: parsed.data };
  } catch (e) {
    return { kind: "invalid", error: (e as Error).message };
  }
}

export function clearSnapshot(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SNAPSHOT_STORAGE_KEY);
}
