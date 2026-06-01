// Piloto V2 — Regra Matriz. Função pura, sem side-effects.
// Proteína ↔ Proteína | Carbo ↔ Carbo | Gordura ↔ Gordura.
// "mixed" é aceito em qualquer direção (refeição composta).

import type { ScaleGroupV2 } from "./template.v2.types";

export type MatrixResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateMatrix(
  itemGroup: ScaleGroupV2,
  substitutionGroup: ScaleGroupV2,
): MatrixResult {
  if (itemGroup === "mixed" || substitutionGroup === "mixed") {
    return { ok: true };
  }
  if (itemGroup === substitutionGroup) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `Matriz: ${itemGroup} não pode ser substituído por ${substitutionGroup}.`,
  };
}
