// Phase 2 — Server fn de exposição controlada do motor.
// Adapter `runNutritionEnginesManual` é o ÚNICO ponto que chama os motores
// puros (calcTMB/calcTDEE/calcMacroTarget). Esta server fn é a versão
// "calculadora manual": recebe inputs explícitos do nutricionista, sem
// envolver ClinicalContext (que é o caminho clínico real).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  runNutritionEnginesManual,
} from "@/lib/clinical/run-nutrition-engines";
import type {
  ActivityLevel,
  Goal,
  NutritionTargets,
  Sex,
} from "./types";

const ActivitySchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "high",
  "extreme",
]);
const GoalSchema = z.enum(["cut", "bulk", "maintain"]);
const SexSchema = z.enum(["male", "female"]);

const ManualInputSchema = z.object({
  patientId: z.string().uuid().optional(),
  sex: SexSchema,
  ageYears: z.number().int().min(1).max(120),
  weightKg: z.number().min(20).max(400),
  heightCm: z.number().min(80).max(260),
  activity: ActivitySchema,
  goal: GoalSchema,
});

export type ComputeTargetsInput = z.infer<typeof ManualInputSchema>;

export const computeNutritionTargets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ManualInputSchema.parse(input))
  .handler(async ({ data }): Promise<NutritionTargets> => {
    return runNutritionEnginesManual({
      sex: data.sex as Sex,
      ageYears: data.ageYears,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      activity: data.activity as ActivityLevel,
      goal: data.goal as Goal,
    });
  });
