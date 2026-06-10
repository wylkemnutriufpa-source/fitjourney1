// Patient detail server fn — usado pelo perfil do paciente (visão do nutri).
// Dados reais. RLS garante que só o nutri dono enxerga.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAvatarSignedUrl } from "@/lib/profile/avatar-storage";

export interface PatientDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  heightCm: number | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  anamnesis: {
    id: string;
    version: number;
    reviewStatus: string;
    approvedAt: string | null;
    submittedAt: string | null;
    updatedAt: string;
  } | null;
}

const Input = z.object({ patientId: z.string().uuid() });
const ActiveStatusInput = z.object({ patientId: z.string().uuid(), isActive: z.boolean() });

export const getPatientForNutritionist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<PatientDetail> => {
    const { supabase } = context;

    const { data: p, error } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, birth_date, height_cm, avatar_url, is_active, created_at")
      .eq("id", data.patientId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) throw new Error("PATIENT_NOT_FOUND");

    // Pega a anamnese mais relevante: aprovada > submitted > mais recente
    const { data: anamneses } = await supabase
      .from("anamneses")
      .select("id, version, review_status, approved_at, submitted_at, updated_at")
      .eq("patient_id", data.patientId)
      .order("updated_at", { ascending: false })
      .limit(20);

    const list = anamneses ?? [];
    const approved = list.find((a: any) => a.review_status === "approved");
    const chosen = approved ?? list[0] ?? null;

    return {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      phone: p.phone ?? null,
      birthDate: p.birth_date ?? null,
      heightCm: p.height_cm != null ? Number(p.height_cm) : null,
      avatarUrl: await createAvatarSignedUrl(supabase, p.avatar_url),
      isActive: p.is_active ?? true,
      createdAt: p.created_at,
      anamnesis: chosen
        ? {
            id: chosen.id,
            version: chosen.version,
            reviewStatus: chosen.review_status,
            approvedAt: chosen.approved_at,
            submittedAt: chosen.submitted_at,
            updatedAt: chosen.updated_at,
          }
        : null,
    };
  });

export const setPatientActiveStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ActiveStatusInput.parse(input))
  .handler(async ({ data, context }): Promise<{ isActive: boolean }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("Paciente não pertence a você.");

    // C-04: usa context.supabase (RLS as user) — não bypassa RLS.
    const { data: updated, error: upErr } = await supabase
      .from("patients")
      .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
      .eq("id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .select("is_active")
      .single();
    if (upErr) throw new Error(upErr.message);

    return { isActive: updated.is_active ?? data.isActive };
  });
