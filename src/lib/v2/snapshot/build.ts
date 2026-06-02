// Piloto V2 — Snapshot builder. Função pura. Sem inferência, sem fallback.
// Editor → buildSnapshotV2(draft) → SnapshotV2 imutável.

import type { PlannerTemplateV2 } from "../template.v2.types";
import { SnapshotV2Schema, type SnapshotV2 } from "../snapshot.v2.schema";

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  Object.values(obj as Record<string, unknown>).forEach((v) => deepFreeze(v));
  return Object.freeze(obj);
}

/**
 * Serializa um rascunho V2 para um Snapshot V2 imutável.
 * Não recalcula macros, não normaliza, não infere. Cópia profunda + freeze + valida.
 * Lança Zod error se o rascunho for inválido — sem mascarar.
 */
export function buildSnapshotV2(template: PlannerTemplateV2): SnapshotV2 {
  const raw = {
    schemaVersion: "v2.pilot.1" as const,
    id: template.id,
    name: template.name,
    kcal: template.kcal,
    generatedAt: new Date().toISOString(),
    days: template.days.map((day) => ({
      id: day.id,
      label: day.label,
      meals: day.meals.map((meal) => ({
        id: meal.id,
        time: meal.time,
        label: meal.label,
        notes: meal.notes,
        heroKey: meal.heroKey,
        items: meal.items.map((it) => ({
          id: it.id,
          foodKey: it.foodKey,
          name: it.name,
          qty: it.qty,
          unit: it.unit,
          kcal: it.kcal,
          proteinG: it.proteinG,
          carbG: it.carbG,
          fatG: it.fatG,
          scaleGroup: it.scaleGroup,
          measures: it.measures?.map((m) => ({ ...m })),
          substitutions: it.substitutions?.map((s) => ({ ...s })),
          notes: it.notes,
        })),
      })),
    })),
  };

  // Round-trip JSON → garante serializabilidade real.
  const serializable = JSON.parse(JSON.stringify(raw));
  const parsed = SnapshotV2Schema.parse(serializable);
  return deepFreeze(parsed);
}
