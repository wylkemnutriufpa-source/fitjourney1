// Piloto V2 — schema de snapshot. Superset compatível com V1.
// Snapshots V1 atuais passam sem alteração (passthrough + campos novos opcionais).
// NÃO substitui src/lib/plans/snapshot.schema.ts.

import { z } from "zod";

const MeasureV2Schema = z
  .object({
    label: z.string().min(1),
    gramsEquivalent: z.number().nonnegative().optional(),
    fromCatalog: z.boolean().optional(),
  })
  .passthrough();

const SubstitutionV2Schema = z
  .object({
    foodKey: z.string().min(1),
    name: z.string().min(1),
    qty: z.number().nonnegative(),
    unit: z.string().min(1),
    kcal: z.number().nonnegative(),
    proteinG: z.number().nonnegative(),
    carbG: z.number().nonnegative(),
    fatG: z.number().nonnegative(),
    scaleGroup: z.enum(["protein", "carb", "fat", "mixed"]),
    note: z.string().optional(),
  })
  .passthrough();

// Item aceita o mínimo V1 (id, foodKey, name, qty, unit, kcal, scaleGroup)
// e os campos soberanos V2 como opcionais. Tudo via passthrough.
const ItemV2Schema = z
  .object({
    id: z.string().min(1),
    foodKey: z.string().min(1),
    name: z.string().min(1),
    qty: z.number().nonnegative(),
    unit: z.string().min(1),
    kcal: z.number().nonnegative(),
    scaleGroup: z.string().min(1),
    // V2 opcional
    measures: z.array(MeasureV2Schema).optional(),
    substitutions: z.array(SubstitutionV2Schema).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

const MealOptionV2Schema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    imageKey: z.string().min(1),
    items: z.array(ItemV2Schema).min(1),
    recipe: z.string().optional(),
  })
  .passthrough();

// Refeição V2 aceita DUAS formas:
//  - V1: { main, equivalents } (legado, intocado)
//  - V2: { items, notes } (composição soberana)
// Ambos os blocos são opcionais para que snapshots V1 e V2 validem.
const MealV2Schema = z
  .object({
    id: z.string().min(1),
    time: z.string().min(1),
    label: z.string().min(1),
    main: MealOptionV2Schema.optional(),
    equivalents: z.array(MealOptionV2Schema).optional(),
    items: z.array(ItemV2Schema).optional(),
    notes: z.string().optional(),
    heroKey: z.string().optional(),
  })
  .passthrough();

export const SnapshotV2Schema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kcal: z.number().nonnegative(),
    meals: z.array(MealV2Schema).min(1),
  })
  .passthrough();

export type SnapshotV2 = z.infer<typeof SnapshotV2Schema>;
