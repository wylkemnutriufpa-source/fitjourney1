// Server fns para o snapshot de Diagnóstico Clínico do paciente.
//
// Regras invariantes:
// - Fonte única: anamnese APROVADA. Nunca draft/submitted.
// - Snapshot imutável (UNIQUE por anamnesis_id; trigger no DB bloqueia UPDATE/DELETE).
// - Geração determinística (RNG seedado por anamnesis_id) → mesma anamnese, mesmas frases.
// - Degradação elegante: falha de geração nunca bloqueia aprovação.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CanonicalAnamnesisSchema } from "@/lib/anamnesis/canonical.schema";
import { gerarDiagnostico, type TriggerRow, type Diagnosis } from "./engine";
import { adaptAnamnesisToQuiz, seededRng } from "./from-anamnesis";

// ─── Helper interno: gera e persiste. Pode ser chamado por outras server fns
// (ex.: reviewAnamnesis após aprovar). Idempotente por anamnesis_id.
export async function generatePatientDiagnosisFromAnamnesisId(
  anamnesisId: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: ana, error: aErr } = await supabaseAdmin
    .from("anamneses")
    .select("id, patient_id, nutritionist_id, review_status, data")
    .eq("id", anamnesisId)
    .maybeSingle();
  if (aErr || !ana) return { ok: false, reason: aErr?.message ?? "ANAMNESIS_NOT_FOUND" };
  if (ana.review_status !== "approved") return { ok: false, reason: "NOT_APPROVED" };

  // Idempotência — se já existe, retorna o existente.
  const { data: existing } = await supabaseAdmin
    .from("patient_diagnoses")
    .select("id")
    .eq("anamnesis_id", anamnesisId)
    .maybeSingle();
  if (existing) return { ok: true, id: existing.id as string };

  // Extrai canonical do envelope.
  const envelope = (ana.data ?? {}) as { canonical?: unknown };
  const parsed = CanonicalAnamnesisSchema.safeParse(envelope.canonical);
  if (!parsed.success) {
    return { ok: false, reason: "CANONICAL_INVALID: " + parsed.error.message };
  }
  const canonical = parsed.data;

  // Nome do paciente (para personalizar saudação).
  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("full_name")
    .eq("id", ana.patient_id as string)
    .maybeSingle();

  // Gatilhos ativos.
  const { data: trigRows, error: tErr } = await supabaseAdmin
    .from("diagnostic_triggers")
    .select("slug, nome, prioridade, ativo, frases, dicas")
    .eq("ativo", true);
  if (tErr) return { ok: false, reason: tErr.message };
  const triggers: TriggerRow[] = (trigRows ?? []).map((r: any) => ({
    slug: r.slug,
    nome: r.nome,
    prioridade: r.prioridade ?? 0,
    ativo: !!r.ativo,
    frases: Array.isArray(r.frases) ? r.frases : [],
    dicas: Array.isArray(r.dicas) ? r.dicas : [],
  }));

  const quiz = adaptAnamnesisToQuiz(canonical, patient?.full_name ?? "");
  const rng = seededRng(anamnesisId);
  const diagnosis: Diagnosis = gerarDiagnostico(quiz, triggers, rng);

  const triggersVersion = triggers
    .map((t) => t.slug)
    .sort()
    .join(",");

  if (!ana.nutritionist_id) return { ok: false, reason: "PATIENT_HAS_NO_NUTRITIONIST" };

  const { data: inserted, error: iErr } = await (supabaseAdmin as any)
    .from("patient_diagnoses")
    .insert({
      patient_id: ana.patient_id,
      nutritionist_id: ana.nutritionist_id,
      anamnesis_id: ana.id,
      diagnosis: JSON.parse(JSON.stringify(diagnosis)),
      triggers_version: triggersVersion,
    })
    .select("id")
    .single();
  if (iErr || !inserted) return { ok: false, reason: iErr?.message ?? "INSERT_FAILED" };

  return { ok: true, id: inserted.id as string };
}

// ─── Server fn explícita (admin ou nutri dono) — regenerar / forçar geração.
const GenInput = z.object({ anamnesisId: z.string().uuid() });

export const generatePatientDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Autorização: nutri dono da anamnese OU admin.
    const { data: ana } = await supabase
      .from("anamneses")
      .select("nutritionist_id")
      .eq("id", data.anamnesisId)
      .maybeSingle();
    if (!ana) throw new Error("ANAMNESIS_NOT_FOUND");

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin && (!nutri || nutri.id !== ana.nutritionist_id)) {
      throw new Error("FORBIDDEN");
    }

    const result = await generatePatientDiagnosisFromAnamnesisId(data.anamnesisId);
    if (!result.ok) throw new Error(result.reason);
    return { ok: true, id: result.id };
  });

// ─── Paciente lê o próprio diagnóstico (mais recente).
export const getMyDiagnosis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return null;

    const { data: row } = await supabase
      .from("patient_diagnoses")
      .select("id, anamnesis_id, diagnosis, generated_at")
      .eq("patient_id", patient.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return null;

    return {
      id: row.id as string,
      anamnesisId: row.anamnesis_id as string,
      generatedAt: row.generated_at as string,
      diagnosis: row.diagnosis as Diagnosis,
    };
  });
