// Autosave de rascunho de anamnese NO BANCO.
// Rascunho = linha em `anamneses` com review_status='draft' E status='draft'.
// Imutabilidade clínica preservada: só rascunho é mutável; submitted/approved
// continuam imutáveis (trigger anamneses_approved_immutable).
//
// Fluxo:
//   - Paciente preenche → debounce ~2s → saveAnamnesisDraft (upsert)
//   - Paciente troca de aparelho → loadAnamnesisDraft restaura
//   - Paciente clica "Descartar" → discardAnamnesisDraft
//   - Paciente envia → submitInitialAnamnesis (apaga drafts e cria submitted)
//   - Nutri precisa "limpar" rascunho do paciente → discardPatientAnamnesisDraft

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnswersSchema = z
  .record(z.string().min(1).max(128), z.unknown())
  .refine((r) => Object.keys(r).length <= 500, "Too many answers");

// ---------------- loadAnamnesisDraft (paciente) ----------------
export const loadAnamnesisDraft = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
      const { supabase, userId } = context as {
        supabase: any;
        userId: string;
      };
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (!patient) return { found: false };

      const { data: row, error } = await supabase
        .from("anamneses")
        .select("data, updated_at")
        .eq("patient_id", patient.id)
        .eq("review_status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return { found: false };

      const raw: Record<string, any> =
        row.data && typeof row.data === "object" && "raw" in row.data
          ? ((row.data as any).raw ?? {})
          : {};
      return { found: true as const, answers: raw, updatedAt: row.updated_at as string };
    },
  );

// ---------------- saveAnamnesisDraft (paciente) ----------------
const SaveInput = z.object({ answers: AnswersSchema });

export const saveAnamnesisDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveInput.parse(input))
  .handler(async ({ data, context }): Promise<{ updatedAt: string }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id, nutritionist_id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");

    const payload = JSON.parse(JSON.stringify({ raw: data.answers }));

    // Tenta encontrar rascunho existente.
    const { data: existing } = await supabase
      .from("anamneses")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("review_status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    if (existing?.id) {
      const { error } = await supabase
        .from("anamneses")
        .update({ data: payload, updated_at: nowIso })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { updatedAt: nowIso };
    }

    const { error } = await supabase.from("anamneses").insert({
      patient_id: patient.id,
      nutritionist_id: patient.nutritionist_id,
      schema_version: 3,
      data: payload,
      origin: "online",
      status: "draft",
      review_status: "draft",
      version: 0,
      created_by: null,
    });
    if (error) throw new Error(error.message);
    return { updatedAt: nowIso };
  });

// ---------------- discardAnamnesisDraft (paciente apaga próprio rascunho) ----
export const discardAnamnesisDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; removed: number }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return { ok: true, removed: 0 };

    const { data, error } = await supabase
      .from("anamneses")
      .delete()
      .eq("patient_id", patient.id)
      .eq("review_status", "draft")
      .select("id");
    if (error) throw new Error(error.message);
    return { ok: true, removed: data?.length ?? 0 };
  });

// ---------------- discardPatientAnamnesisDraft (nutri admin) ---------------
const DiscardForPatientInput = z.object({ patientId: z.string().uuid() });

export const discardPatientAnamnesisDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DiscardForPatientInput.parse(input))
  .handler(
    async ({ data, context }): Promise<{ ok: true; removed: number }> => {
      const { supabase } = context as { supabase: any };
      // RLS faz a checagem de ownership (nutri deletes patient anamnesis draft)
      const { data: removed, error } = await supabase
        .from("anamneses")
        .delete()
        .eq("patient_id", data.patientId)
        .eq("review_status", "draft")
        .select("id");
      if (error) throw new Error(error.message);
      return { ok: true, removed: removed?.length ?? 0 };
    },
  );
