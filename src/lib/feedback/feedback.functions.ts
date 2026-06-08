// Server fns do módulo Feedback Clínico.
// Toda escrita roda sob a sessão do paciente (RLS aplica).
// Leitura cruzada (nutri lê feedbacks dos pacientes) também via RLS.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AdherenceEnum = z.enum([
  "muito_dificil",
  "dificil",
  "neutro",
  "facil",
  "muito_facil",
]);
const ResultEnum = z.enum(["piores", "abaixo", "dentro", "acima"]);

export type FeedbackDTO = {
  id: string;
  patientId: string;
  nutritionistId: string;
  weightKg: number | null;
  heightCmSnapshot: number | null;
  waistCm: number | null;
  abdomenCm: number | null;
  hipCm: number | null;
  adherenceRating: z.infer<typeof AdherenceEnum>;
  resultRating: z.infer<typeof ResultEnum> | null;
  notes: string | null;
  photoFrontPath: string | null;
  photoSidePath: string | null;
  photoBackPath: string | null;
  createdAt: string;
};

export type NutritionistFeedbackItem = FeedbackDTO & {
  patientName: string;
  patientEmail: string;
  reviewed: boolean;
};

const SELECT_COLS =
  "id, patient_id, nutritionist_id, weight_kg, height_cm_snapshot, waist_cm, abdomen_cm, hip_cm, adherence_rating, result_rating, notes, photo_front_path, photo_side_path, photo_back_path, created_at";

function rowToDto(r: any): FeedbackDTO {
  return {
    id: r.id,
    patientId: r.patient_id,
    nutritionistId: r.nutritionist_id,
    weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
    heightCmSnapshot:
      r.height_cm_snapshot != null ? Number(r.height_cm_snapshot) : null,
    waistCm: r.waist_cm != null ? Number(r.waist_cm) : null,
    abdomenCm: r.abdomen_cm != null ? Number(r.abdomen_cm) : null,
    hipCm: r.hip_cm != null ? Number(r.hip_cm) : null,
    adherenceRating: r.adherence_rating,
    resultRating: r.result_rating ?? null,
    notes: r.notes ?? null,
    photoFrontPath: r.photo_front_path ?? null,
    photoSidePath: r.photo_side_path ?? null,
    photoBackPath: r.photo_back_path ?? null,
    createdAt: r.created_at,
  };
}

// ------------------------------------------------------------------
// submitFeedback — paciente envia um novo registro (imutável).
// Cliente DEVE gerar o id (UUID) antes pra poder fazer o upload de fotos
// no path {patient_id}/{feedback_id}/{front|side}.jpg.
// ------------------------------------------------------------------

const SubmitInput = z.object({
  id: z.string().uuid(),
  weightKg: z.number().min(20).max(400).optional().nullable(),
  waistCm: z.number().min(30).max(250).optional().nullable(),
  abdomenCm: z.number().min(30).max(250).optional().nullable(),
  hipCm: z.number().min(30).max(250).optional().nullable(),
  adherenceRating: AdherenceEnum,
  resultRating: ResultEnum.optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  photoFrontPath: z.string().trim().max(512).optional().nullable(),
  photoSidePath: z.string().trim().max(512).optional().nullable(),
  photoBackPath: z.string().trim().max(512).optional().nullable(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }): Promise<FeedbackDTO> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    // Resolve patient + nutri vinculado + altura cadastrada (snapshot).
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id, nutritionist_id, height_cm")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");
    if (!patient.nutritionist_id) {
      throw new Error(
        "Seu cadastro ainda não está vinculado a um nutricionista.",
      );
    }

    const insertPayload = {
      id: data.id,
      patient_id: patient.id,
      nutritionist_id: patient.nutritionist_id,
      weight_kg: data.weightKg ?? null,
      height_cm_snapshot: patient.height_cm ?? null,
      waist_cm: data.waistCm ?? null,
      abdomen_cm: data.abdomenCm ?? null,
      hip_cm: data.hipCm ?? null,
      adherence_rating: data.adherenceRating,
      result_rating: data.resultRating ?? null,
      notes: data.notes?.trim() || null,
      photo_front_path: data.photoFrontPath || null,
      photo_side_path: data.photoSidePath || null,
      photo_back_path: data.photoBackPath || null,
    };

    const { data: row, error } = await supabase
      .from("patient_feedbacks")
      .insert(insertPayload)
      .select(SELECT_COLS)
      .single();
    if (error) throw new Error(error.message);
    return rowToDto(row);
  });

// ------------------------------------------------------------------
// listMyFeedbacks — paciente lê o próprio histórico
// ------------------------------------------------------------------

export const listMyFeedbacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FeedbackDTO[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return [];
    const { data, error } = await supabase
      .from("patient_feedbacks")
      .select(SELECT_COLS)
      .eq("patient_id", patient.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDto);
  });

// ------------------------------------------------------------------
// getMyFeedbackStatus — usado pelo sidebar do paciente pra badge "pendente"
// ------------------------------------------------------------------

export type MyFeedbackStatus = {
  hasNutritionist: boolean;
  frequencyDays: number;
  lastFeedbackAt: string | null;
  daysSinceLast: number | null;
  isPending: boolean;
  heightCm: number | null;
};

export const getMyFeedbackStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyFeedbackStatus> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: patient } = await supabase
      .from("patients")
      .select("id, nutritionist_id, height_cm")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!patient || !patient.nutritionist_id) {
      return {
        hasNutritionist: false,
        frequencyDays: 7,
        lastFeedbackAt: null,
        daysSinceLast: null,
        isPending: false,
        heightCm: patient?.height_cm ?? null,
      };
    }

    // Paciente não tem RLS de SELECT em `nutritionists` (só nutri/admin leem).
    // Usamos o client admin apenas para este campo público de configuração
    // do nutri vinculado — sem expor PII.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: nutri } = await supabaseAdmin
      .from("nutritionists")
      .select("feedback_frequency_days")
      .eq("id", patient.nutritionist_id)
      .maybeSingle();
    const freq = Number(nutri?.feedback_frequency_days ?? 7);

    const { data: last } = await supabase
      .from("patient_feedbacks")
      .select("created_at")
      .eq("patient_id", patient.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();


    const lastAt: string | null = last?.created_at ?? null;
    let daysSince: number | null = null;
    if (lastAt) {
      const diffMs = Date.now() - new Date(lastAt).getTime();
      daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    const isPending = daysSince === null ? true : daysSince >= freq;

    return {
      hasNutritionist: true,
      frequencyDays: freq,
      lastFeedbackAt: lastAt,
      daysSinceLast: daysSince,
      isPending,
      heightCm: patient.height_cm ?? null,
    };
  });

// ------------------------------------------------------------------
// listPatientFeedbacks — nutri lê histórico de um paciente seu
// ------------------------------------------------------------------

const ListPatientInput = z.object({ patientId: z.string().uuid() });

export const listPatientFeedbacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListPatientInput.parse(input))
  .handler(async ({ data, context }): Promise<FeedbackDTO[]> => {
    const { supabase } = context as { supabase: any };
    // RLS faz a checagem de ownership (nutri reads patient feedback).
    const { data: rows, error } = await supabase
      .from("patient_feedbacks")
      .select(SELECT_COLS)
      .eq("patient_id", data.patientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToDto);
  });

export const getMyPendingFeedbacksCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ pendingCount: number }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return { pendingCount: 0 };
    const { count } = await supabase
      .from("patient_feedbacks")
      .select("id", { count: "exact", head: true })
      .eq("nutritionist_id", nutri.id)
      .is("deleted_at", null)
      .is("edited_at", null);
    return { pendingCount: count ?? 0 };
  });

export const listFeedbacksForNutritionist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NutritionistFeedbackItem[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return [];

    const { data: rows, error } = await supabase
      .from("patient_feedbacks")
      .select(`${SELECT_COLS}, edited_at`)
      .eq("nutritionist_id", nutri.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const patientIds = Array.from(new Set((rows ?? []).map((r: any) => r.patient_id)));
    const { data: patients } = patientIds.length
      ? await supabase.from("patients").select("id, full_name, email").in("id", patientIds)
      : { data: [] as Array<{ id: string; full_name: string; email: string }> };
    const pmap = new Map<string, { full_name: string; email: string }>(
      (patients ?? []).map((p: any) => [p.id, { full_name: p.full_name, email: p.email }]),
    );

    return (rows ?? []).map((r: any) => {
      const dto = rowToDto(r);
      const patient = pmap.get(dto.patientId);
      return {
        ...dto,
        patientName: patient?.full_name ?? "—",
        patientEmail: patient?.email ?? "",
        reviewed: Boolean(r.edited_at),
      };
    });
  });

// ------------------------------------------------------------------
// editPatientFeedback — nutri edita campos clínicos (com auditoria)
// ------------------------------------------------------------------

const EditInput = z.object({
  id: z.string().uuid(),
  weightKg: z.number().min(20).max(400).nullable().optional(),
  waistCm: z.number().min(30).max(250).nullable().optional(),
  abdomenCm: z.number().min(30).max(250).nullable().optional(),
  hipCm: z.number().min(30).max(250).nullable().optional(),
  adherenceRating: AdherenceEnum.optional(),
  resultRating: ResultEnum.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const editPatientFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EditInput.parse(input))
  .handler(async ({ data, context }): Promise<FeedbackDTO> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const patch: Record<string, any> = {
      edited_at: new Date().toISOString(),
      edited_by: userId,
    };
    if (data.weightKg !== undefined) patch.weight_kg = data.weightKg;
    if (data.waistCm !== undefined) patch.waist_cm = data.waistCm;
    if (data.abdomenCm !== undefined) patch.abdomen_cm = data.abdomenCm;
    if (data.hipCm !== undefined) patch.hip_cm = data.hipCm;
    if (data.adherenceRating !== undefined)
      patch.adherence_rating = data.adherenceRating;
    if (data.resultRating !== undefined)
      patch.result_rating = data.resultRating;
    if (data.notes !== undefined)
      patch.notes = data.notes?.trim() || null;

    const { data: row, error } = await supabase
      .from("patient_feedbacks")
      .update(patch)
      .eq("id", data.id)
      .is("deleted_at", null)
      .select(SELECT_COLS)
      .single();
    if (error) throw new Error(error.message);
    return rowToDto(row);
  });

// ------------------------------------------------------------------
// editMyFeedback — paciente corrige o próprio feedback enviado há até 24h
// e que ainda não foi revisado pelo nutricionista. RLS reforça a regra.
// Não toca em edited_at/edited_by (esses são marcadores de revisão do nutri).
// ------------------------------------------------------------------

export const editMyFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EditInput.parse(input))
  .handler(async ({ data, context }): Promise<FeedbackDTO> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");

    const patch: Record<string, any> = {};
    if (data.weightKg !== undefined) patch.weight_kg = data.weightKg;
    if (data.waistCm !== undefined) patch.waist_cm = data.waistCm;
    if (data.abdomenCm !== undefined) patch.abdomen_cm = data.abdomenCm;
    if (data.hipCm !== undefined) patch.hip_cm = data.hipCm;
    if (data.adherenceRating !== undefined)
      patch.adherence_rating = data.adherenceRating;
    if (data.resultRating !== undefined)
      patch.result_rating = data.resultRating;
    if (data.notes !== undefined)
      patch.notes = data.notes?.trim() || null;

    const { data: row, error } = await supabase
      .from("patient_feedbacks")
      .update(patch)
      .eq("id", data.id)
      .eq("patient_id", patient.id)
      .is("deleted_at", null)
      .select(SELECT_COLS)
      .single();
    if (error) throw new Error(error.message);
    return rowToDto(row);
  });

// ------------------------------------------------------------------
// softDeletePatientFeedback — nutri arquiva feedback (preserva histórico)
// ------------------------------------------------------------------

const DeleteInput = z.object({ id: z.string().uuid() });

export const softDeletePatientFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { error } = await supabase
      .from("patient_feedbacks")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq("id", data.id)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ------------------------------------------------------------------
// Configuração da frequência de feedback (lado nutri)
// ------------------------------------------------------------------

export const getMyFeedbackFrequency = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ days: number } | null> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data, error } = await supabase
      .from("nutritionists")
      .select("feedback_frequency_days")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { days: Number(data.feedback_frequency_days ?? 7) };
  });

const SetFreqInput = z.object({ days: z.number().int().min(1).max(90) });

export const setMyFeedbackFrequency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetFreqInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { error } = await supabase
      .from("nutritionists")
      .update({ feedback_frequency_days: data.days })
      .eq("auth_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, days: data.days };
  });

// ------------------------------------------------------------------
// getSignedPhotoUrl — usado por paciente e nutri pra visualizar foto
// ------------------------------------------------------------------

const SignInput = z.object({ path: z.string().min(1).max(512) });

export const getSignedFeedbackPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SignInput.parse(input))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { supabase } = context as { supabase: any };
    const { data: signed, error } = await supabase.storage
      .from("feedback-photos")
      .createSignedUrl(data.path, 60 * 10); // 10 min
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
