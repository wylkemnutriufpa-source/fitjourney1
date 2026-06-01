// Patient signup via referral code.
// Fluxo público: valida código único do nutricionista, cria auth user
// (auto-confirmado) e cria patients row. O convite online é reutilizável:
// ele identifica o nutricionista, não é consumido por paciente.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createAvatarSignedUrl } from "@/lib/profile/avatar-storage";

// ---------- validateReferralCode ----------
const ValidateInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(4)
    .max(32)
    .regex(/^[A-Z0-9]+$/, "Código inválido"),
});

export interface ValidatedReferral {
  ok: true;
  nutritionistId: string;
  nutritionistName: string;
  nutritionistAvatarUrl: string | null;
  nutritionistSpecialty: string | null;
}

export const validateReferralCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ValidateInput.parse(input))
  .handler(async ({ data }): Promise<ValidatedReferral> => {
    const { data: row, error } = await supabaseAdmin
      .from("referral_codes")
      .select("nutritionist_id, status, expires_at")
      .eq("code", data.code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("INVALID_CODE");
    if (row.status !== "active" && row.status !== "consumed") {
      throw new Error("CODE_NOT_ACTIVE");
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      throw new Error("CODE_EXPIRED");
    }

    const { data: nutri, error: nutriErr } = await supabaseAdmin
      .from("nutritionists")
      .select("id, full_name, display_name, avatar_url, specialty")
      .eq("id", row.nutritionist_id)
      .maybeSingle();
    if (nutriErr) throw new Error(nutriErr.message);
    if (!nutri) throw new Error("NUTRITIONIST_NOT_FOUND");

    return {
      ok: true,
      nutritionistId: nutri.id,
      nutritionistName: nutri.display_name?.trim() || nutri.full_name,
      nutritionistAvatarUrl: await createAvatarSignedUrl(supabaseAdmin, nutri.avatar_url),
      nutritionistSpecialty: nutri.specialty,
    };
  });

// ---------- consumeReferralCodeAndCreatePatient ----------
const ConsumeInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(4)
    .max(32)
    .regex(/^[A-Z0-9]+$/, "Código inválido"),
  fullName: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, "Telefone inválido (use formato internacional)")
    .max(20),
});

export interface PatientSignupResult {
  ok: true;
  patientId: string;
  email: string;
  alreadyExists?: boolean;
}

export const consumeReferralCodeAndCreatePatient = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => ConsumeInput.parse(input))
  .handler(async ({ data }): Promise<PatientSignupResult> => {
    // 1) revalida código
    const { data: codeRow, error: codeErr } = await supabaseAdmin
      .from("referral_codes")
      .select("id, nutritionist_id, status, expires_at")
      .eq("code", data.code)
      .maybeSingle();
    if (codeErr) throw new Error(codeErr.message);
    if (!codeRow) throw new Error("INVALID_CODE");
    if (codeRow.status !== "active" && codeRow.status !== "consumed") {
      throw new Error("CODE_NOT_ACTIVE");
    }
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      throw new Error("CODE_EXPIRED");
    }

    // Se a tentativa anterior já criou o paciente, não tenta criar outro auth user.
    // Isso torna o fluxo idempotente para retry com o mesmo email/link.
    const { data: existingPatient, error: existingPatientErr } = await supabaseAdmin
      .from("patients")
      .select("id, email")
      .eq("nutritionist_id", codeRow.nutritionist_id)
      .ilike("email", data.email)
      .maybeSingle();
    if (existingPatientErr) throw new Error(existingPatientErr.message);
    if (existingPatient) {
      return {
        ok: true,
        patientId: existingPatient.id,
        email: existingPatient.email,
        alreadyExists: true,
      };
    }

    // 2) cria auth user já confirmado (convite é controlado)
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          intended_role: "patient",
          full_name: data.fullName,
        },
      });
    if (createErr) {
      if (createErr.message.toLowerCase().includes("email") && createErr.message.toLowerCase().includes("registered")) {
        throw new Error("EMAIL_ALREADY_EXISTS_UNLINKED");
      }
      throw new Error(createErr.message);
    }
    const authUserId = created.user?.id;
    if (!authUserId) throw new Error("AUTH_USER_NOT_CREATED");

    // 3) cria patients row vinculada ao nutricionista
    const { data: patient, error: patientErr } = await supabaseAdmin
      .from("patients")
      .insert({
        auth_user_id: authUserId,
        nutritionist_id: codeRow.nutritionist_id,
        source_referral_code: data.code,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
      })
      .select("id")
      .single();
    if (patientErr) {
      // rollback do auth user para evitar órfão
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      throw new Error(`PATIENT_INSERT_FAILED: ${patientErr.message}`);
    }

    return { ok: true, patientId: patient.id, email: data.email };
  });
