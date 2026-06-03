// Avaliação Física — entidade única com histórico.
//
// Invariantes:
//   - Cada avaliação é uma linha NOVA (assessed_at). Nada é sobrescrito.
//   - ClinicalContext lê peso daqui por RECÊNCIA (resolve-weight).
//   - Janela operacional de correção: 24h (RLS + trigger).
//   - Paciente lê, nunca escreve.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PhysicalAssessment = {
  id: string;
  patientId: string;
  nutritionistId: string;
  assessedAt: string;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  leanMassKg: number | null;
  fatMassKg: number | null;
  visceralFat: number | null;
  neckCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  abdomenCm: number | null;
  hipCm: number | null;
  armRelaxedCm: number | null;
  armContractedCm: number | null;
  forearmCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  notes: string | null;
  createdAt: string;
};

function mapRow(r: any): PhysicalAssessment {
  return {
    id: r.id,
    patientId: r.patient_id,
    nutritionistId: r.nutritionist_id,
    assessedAt: r.assessed_at,
    weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
    heightCm: r.height_cm != null ? Number(r.height_cm) : null,
    bodyFatPct: r.body_fat_pct != null ? Number(r.body_fat_pct) : null,
    leanMassKg: r.lean_mass_kg != null ? Number(r.lean_mass_kg) : null,
    fatMassKg: r.fat_mass_kg != null ? Number(r.fat_mass_kg) : null,
    visceralFat: r.visceral_fat != null ? Number(r.visceral_fat) : null,
    neckCm: r.neck_cm != null ? Number(r.neck_cm) : null,
    chestCm: r.chest_cm != null ? Number(r.chest_cm) : null,
    waistCm: r.waist_cm != null ? Number(r.waist_cm) : null,
    abdomenCm: r.abdomen_cm != null ? Number(r.abdomen_cm) : null,
    hipCm: r.hip_cm != null ? Number(r.hip_cm) : null,
    armRelaxedCm: r.arm_relaxed_cm != null ? Number(r.arm_relaxed_cm) : null,
    armContractedCm: r.arm_contracted_cm != null ? Number(r.arm_contracted_cm) : null,
    forearmCm: r.forearm_cm != null ? Number(r.forearm_cm) : null,
    thighCm: r.thigh_cm != null ? Number(r.thigh_cm) : null,
    calfCm: r.calf_cm != null ? Number(r.calf_cm) : null,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}

const CreateInput = z.object({
  patientId: z.string().uuid(),
  assessedAt: z.string().datetime().optional(),
  weightKg: z.number().positive().max(400).optional().nullable(),
  heightCm: z.number().positive().max(260).optional().nullable(),
  bodyFatPct: z.number().min(1).max(70).optional().nullable(),
  leanMassKg: z.number().positive().max(300).optional().nullable(),
  fatMassKg: z.number().min(0).max(300).optional().nullable(),
  visceralFat: z.number().min(0).max(60).optional().nullable(),
  neckCm: z.number().min(0).max(120).optional().nullable(),
  chestCm: z.number().min(0).max(200).optional().nullable(),
  waistCm: z.number().min(0).max(250).optional().nullable(),
  abdomenCm: z.number().min(0).max(250).optional().nullable(),
  hipCm: z.number().min(0).max(250).optional().nullable(),
  armRelaxedCm: z.number().min(0).max(100).optional().nullable(),
  armContractedCm: z.number().min(0).max(100).optional().nullable(),
  forearmCm: z.number().min(0).max(80).optional().nullable(),
  thighCm: z.number().min(0).max(120).optional().nullable(),
  calfCm: z.number().min(0).max(80).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createPhysicalAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }): Promise<PhysicalAssessment> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    const { data: pat, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pat) throw new Error("Paciente não pertence a você.");

    const row: Record<string, any> = {
      patient_id: data.patientId,
      nutritionist_id: nutri.id,
      created_by: userId,
      assessed_at: data.assessedAt ?? new Date().toISOString(),
      weight_kg: data.weightKg ?? null,
      height_cm: data.heightCm ?? null,
      body_fat_pct: data.bodyFatPct ?? null,
      lean_mass_kg: data.leanMassKg ?? null,
      fat_mass_kg: data.fatMassKg ?? null,
      visceral_fat: data.visceralFat ?? null,
      neck_cm: data.neckCm ?? null,
      chest_cm: data.chestCm ?? null,
      waist_cm: data.waistCm ?? null,
      abdomen_cm: data.abdomenCm ?? null,
      hip_cm: data.hipCm ?? null,
      arm_relaxed_cm: data.armRelaxedCm ?? null,
      arm_contracted_cm: data.armContractedCm ?? null,
      forearm_cm: data.forearmCm ?? null,
      thigh_cm: data.thighCm ?? null,
      calf_cm: data.calfCm ?? null,
      notes: data.notes ?? null,
    };

    const { data: inserted, error } = await supabase
      .from("physical_assessments")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(inserted);
  });

const ListInput = z.object({ patientId: z.string().uuid() });

export const listPhysicalAssessmentsForPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data, context }): Promise<PhysicalAssessment[]> => {
    const { supabase } = context as { supabase: any };
    const { data: rows, error } = await supabase
      .from("physical_assessments")
      .select("*")
      .eq("patient_id", data.patientId)
      .order("assessed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapRow);
  });

export const listMyPhysicalAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PhysicalAssessment[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return [];
    const { data: rows, error } = await supabase
      .from("physical_assessments")
      .select("*")
      .eq("patient_id", patient.id)
      .order("assessed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapRow);
  });
