// Phase 2 — Server fn de exposição controlada do motor.
// Lê anamnese do paciente (RLS aplica como o nutricionista logado),
// extrai inputs e retorna TMB/TDEE + macros alvo.
// Sem persistência. Sem efeito colateral.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcFromAnamnese } from "./tdee";
import { calcMacroTarget } from "./macros";
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

/**
 * Calcula alvos nutricionais a partir de dados manuais (anamnese parcial).
 * Versão 1: inputs explícitos. Versão 2 (futura): aceitar `patientId` e
 * resolver a partir da anamnese persistida.
 */
export const computeNutritionTargets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ManualInputSchema.parse(input))
  .handler(async ({ data }): Promise<NutritionTargets> => {
    const { tmb, tdee } = calcFromAnamnese({
      sex: data.sex as Sex,
      ageYears: data.ageYears,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      activity: data.activity as ActivityLevel,
      goal: data.goal as Goal,
    });
    const target = calcMacroTarget({
      tdee,
      weightKg: data.weightKg,
      goal: data.goal as Goal,
    });
    return { tmb, tdee, target };
  });
