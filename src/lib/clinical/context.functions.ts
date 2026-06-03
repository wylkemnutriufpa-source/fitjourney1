// Phase 3 — Clinical foundation: server fns que montam o ClinicalContext.
//
// Lê (RLS-aware, via cliente autenticado do nutri OU do paciente):
//   - anamneses aprovadas do paciente (para meta + demografia)
//   - feedbacks do paciente (para leituras de peso)
// Futuro: physical_assessments quando a tabela existir.
//
// NÃO faz inferência. NÃO recalcula. Apenas projeta dados crus em
// ClinicalContext via funções puras.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CanonicalAnamnesisSchema,
  type CanonicalAnamnesis,
} from "@/lib/anamnesis/canonical.schema";
import { buildClinicalContext, type ClinicalContext } from "./context";
import type { ApprovedAnamnesisInput } from "./resolve-goal";
import type { WeightReading } from "./resolve-weight";

const Input = z.object({ patientId: z.string().uuid() });

type Sb = {
  from: (t: string) => any;
};

async function loadContextForPatient(
  supabase: Sb,
  patientId: string,
): Promise<ClinicalContext> {
  const [anamnesesRes, feedbacksRes, paRes] = await Promise.all([
    supabase
      .from("anamneses")
      .select("id, approved_at, data")
      .eq("patient_id", patientId)
      .eq("review_status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false }),
    supabase
      .from("patient_feedbacks")
      .select("id, created_at, weight_kg")
      .eq("patient_id", patientId)
      .not("weight_kg", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("physical_assessments")
      .select("id, assessed_at, weight_kg")
      .eq("patient_id", patientId)
      .not("weight_kg", "is", null)
      .order("assessed_at", { ascending: false }),
  ]);

  if (anamnesesRes.error) {
    throw new Error(
      `clinical context: failed to load anamneses (${anamnesesRes.error.message})`,
    );
  }
  if (feedbacksRes.error) {
    throw new Error(
      `clinical context: failed to load feedbacks (${feedbacksRes.error.message})`,
    );
  }
  if (paRes.error) {
    throw new Error(
      `clinical context: failed to load physical_assessments (${paRes.error.message})`,
    );
  }

  const approvedAnamneses: ApprovedAnamnesisInput[] = [];
  for (const row of anamnesesRes.data ?? []) {
    if (!row.approved_at) continue;
    const canonical = extractCanonical(row.data);
    if (!canonical) continue;
    approvedAnamneses.push({
      id: row.id,
      approvedAt: row.approved_at,
      canonical: { basics: canonical.basics },
    });
  }

  const weightReadings: WeightReading[] = [];
  for (const f of feedbacksRes.data ?? []) {
    if (f.weight_kg == null) continue;
    weightReadings.push({
      source: "feedback",
      weightKg: Number(f.weight_kg),
      measuredAt: f.created_at,
      sourceId: f.id,
    });
  }
  // Avaliação Física: fonte clínica de peso (resolução por recência).
  for (const pa of paRes.data ?? []) {
    if (pa.weight_kg == null) continue;
    weightReadings.push({
      source: "physical_assessment",
      weightKg: Number(pa.weight_kg),
      measuredAt: pa.assessed_at,
      sourceId: pa.id,
    });
  }
  // Anamneses aprovadas também contam como leitura de peso (basics.weightKg).
  for (const a of approvedAnamneses) {
    const w = a.canonical.basics?.weightKg;
    if (typeof w === "number" && w > 0) {
      weightReadings.push({
        source: "anamnesis",
        weightKg: w,
        measuredAt: a.approvedAt,
        sourceId: a.id,
      });
    }
  }

  return buildClinicalContext({
    patientId,
    weightReadings,
    approvedAnamneses,
  });
}

/**
 * Uso do nutricionista: ClinicalContext de qualquer paciente que ele possa ler
 * via RLS.
 */
export const getClinicalContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }): Promise<ClinicalContext> => {
    return loadContextForPatient(context.supabase as Sb, data.patientId);
  });

/**
 * Uso do paciente: ClinicalContext do próprio paciente autenticado.
 * Resolve patient_id a partir de auth_user_id (RLS reforça ownership).
 * Retorna `null` quando o usuário autenticado não tem perfil de paciente
 * — degradação elegante, nunca lança (invariante #9).
 */
export const getMyClinicalContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClinicalContext | null> => {
    const { supabase, userId } = context as { supabase: Sb; userId: string };
    const { data: patient, error } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!patient) return null;
    return loadContextForPatient(supabase, patient.id);
  });

function extractCanonical(raw: unknown): CanonicalAnamnesis | null {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as { canonical?: unknown };
  const parsed = CanonicalAnamnesisSchema.safeParse(envelope.canonical);
  return parsed.success ? parsed.data : null;
}
