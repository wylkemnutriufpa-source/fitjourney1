// Piloto V2 — schema de snapshot serializado. Renderer-burro contract.
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

const ItemV2Schema = z
  .object({
    id: z.string().min(1),
    foodKey: z.string().min(1),
    name: z.string().min(1),
    qty: z.number().nonnegative(),
    unit: z.string().min(1),
    kcal: z.number().nonnegative(),
    proteinG: z.number().nonnegative(),
    carbG: z.number().nonnegative(),
    fatG: z.number().nonnegative(),
    scaleGroup: z.enum(["protein", "carb", "fat", "mixed"]),
    measures: z.array(MeasureV2Schema).optional(),
    substitutions: z.array(SubstitutionV2Schema).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

const MealV2Schema = z
  .object({
    id: z.string().min(1),
    time: z.string().min(1),
    label: z.string().min(1),
    items: z.array(ItemV2Schema).min(1),
    notes: z.string().optional(),
    heroKey: z.string().optional(),
  })
  .passthrough();

const DayV2Schema = z
  .object({
    id: z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]),
    label: z.string().min(1),
    meals: z.array(MealV2Schema).min(1),
  })
  .passthrough();

export const SnapshotV2Schema = z
  .object({
    schemaVersion: z.literal("v2.pilot.1"),
    id: z.string().min(1),
    name: z.string().min(1),
    kcal: z.number().nonnegative(),
    generatedAt: z.string().min(1),
    days: z.array(DayV2Schema).length(7),
  })
  .passthrough();

export type SnapshotV2 = z.infer<typeof SnapshotV2Schema>;
