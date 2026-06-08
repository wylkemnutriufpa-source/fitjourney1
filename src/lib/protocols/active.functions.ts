// Server fns para aplicar/listar protocolos ativos do paciente.
// Pure read/write fina — NÃO é motor clínico. Não calcula TMB/macros/peso.
// Apenas grava o snapshot da fase escolhida e lê. Respeita os invariantes:
// Patient App continua read-only, snapshot é imutável após inserido.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { findProtocolPhase } from "@/lib/protocols/catalog";

const ApplyInput = z.object({
  patientId: z.string().uuid(),
  protocolId: z.string().min(1).max(64),
  moduleId: z.string().min(1).max(64),
  phaseId: z.number().int().min(1).max(50),
});

export type ActiveProtocolRow = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  protocol_id: string;
  protocol_name: string;
  module_id: string;
  module_name: string;
  phase_id: number;
  phase_snapshot: {
    id: number;
    name: string;
    durationWeeks: number;
    description: string;
    dailyKcalTarget?: number;
    macros?: { protein: number; carb: number; fat: number };
    meals?: Array<{
      id: string;
      name: string;
      time: string;
      totalKcal: number;
      items: Array<{
        foodKey: string;
        name: string;
        quantityG: number;
        householdMeasure: string;
        kcal: number;
        imageSlug?: string;
        substitutions?: Array<{
          foodKey: string;
          name: string;
          quantityG: number;
          householdMeasure: string;
          kcal: number;
        }>;
      }>;
    }>;
    teaSchedule?: Array<{ time?: string; name: string; benefits?: string }>;
    recommendations: {
      waterMl: number;
      sleepHours: number;
      teaRoutine: string[];
      strategies: string[];
    };
  };
  started_at: string;
  ends_at: string | null;
  status: "active" | "completed" | "cancelled";
  last_banner_shown_date: string | null;
  created_at: string;
  updated_at: string;
};

export const applyProtocolPhase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApplyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: nutri, error: nutriErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nutriErr) throw new Error(nutriErr.message);
    if (!nutri) throw new Error("Profissional não encontrado");

    const found = findProtocolPhase(data.protocolId, data.moduleId, data.phaseId);
    if (!found) throw new Error("Fase de protocolo inválida");

    const startedAt = new Date();
    const endsAt = new Date(
      startedAt.getTime() + found.phase.durationWeeks * 7 * 24 * 60 * 60 * 1000,
    );

    const { data: row, error } = await supabase
      .from("patient_active_protocols")
      .insert({
        patient_id: data.patientId,
        nutritionist_id: nutri.id,
        protocol_id: data.protocolId,
        protocol_name: found.protocol.name,
        module_id: data.moduleId,
        module_name: found.module.name,
        phase_id: data.phaseId,
        // Deep-clone seguro do snapshot — JSONB no banco fica congelado.
        phase_snapshot: JSON.parse(JSON.stringify(found.phase)),
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "active",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const listMyActiveProtocols = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return { protocols: [] as ActiveProtocolRow[] };
    const { data, error } = await supabase
      .from("patient_active_protocols")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { protocols: (data ?? []) as ActiveProtocolRow[] };
  });

const PatientIdInput = z.object({ patientId: z.string().uuid() });

export const listPatientActiveProtocols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PatientIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("patient_active_protocols")
      .select("*")
      .eq("patient_id", data.patientId)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { protocols: (rows ?? []) as ActiveProtocolRow[] };
  });

const BannerInput = z.object({ activeProtocolId: z.string().uuid() });

export const markBannerShownToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BannerInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { error } = await supabase
      .from("patient_active_protocols")
      .update({ last_banner_shown_date: today })
      .eq("id", data.activeProtocolId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
