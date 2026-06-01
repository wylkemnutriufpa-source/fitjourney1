// Patient profile server fns — paciente edita os próprios dados básicos.
// Hoje: telefone/WhatsApp e nome. Nada clínico (isso vai pelo Runner).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MyPatientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  heightCm: number | null;
  avatarUrl: string | null;
  sourceLegacyId: string | null;
  hasAnamnesis: boolean;
}

export const getMyPatientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPatientProfile> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, birth_date, height_cm, avatar_url, source_legacy_id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("PATIENT_NOT_FOUND");

    const { count } = await supabase
      .from("anamneses")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", data.id);

    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      birthDate: data.birth_date ?? null,
      heightCm: data.height_cm != null ? Number(data.height_cm) : null,
      avatarUrl: data.avatar_url ?? null,
      sourceLegacyId: data.source_legacy_id ?? null,
      hasAnamnesis: (count ?? 0) > 0,
    };
  });

// E.164-ish: + opcional, 8 a 15 dígitos. Aceita espaços/hífens/parêntese e normaliza.
const PhoneSchema = z
  .string()
  .trim()
  .min(0)
  .max(32)
  .transform((s) => s.replace(/[\s().-]/g, ""))
  .refine(
    (s) => s === "" || /^\+?\d{8,15}$/.test(s),
    "Telefone inválido. Use formato +55 11 99999-9999.",
  );

const UpdateInput = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: PhoneSchema.optional(),
  heightCm: z.number().min(80).max(260).nullable().optional(),
  avatarUrl: z.string().url().max(1024).nullable().optional(),
});

export const updateMyPatientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: {
      full_name?: string;
      phone?: string | null;
      height_cm?: number | null;
      avatar_url?: string | null;
    } = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.phone !== undefined) patch.phone = data.phone === "" ? null : data.phone;
    if (data.heightCm !== undefined) patch.height_cm = data.heightCm;
    if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl;

    if (Object.keys(patch).length === 0) {
      return { ok: true };
    }

    const { error } = await supabase
      .from("patients")
      .update(patch)
      .eq("auth_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
