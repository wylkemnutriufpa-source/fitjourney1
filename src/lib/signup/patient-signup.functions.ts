// Patient signup via referral code.
// Fluxo público: valida código, cria auth user (auto-confirmado), cria patients row,
// consome o código atomicamente. Cliente faz signInWithPassword logo depois.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    if (row.status !== "active") throw new Error("CODE_NOT_ACTIVE");
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
      nutritionistAvatarUrl: nutri.avatar_url,
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
});

export interface PatientSignupResult {
  ok: true;
  patientId: string;
  email: string;
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
    if (codeRow.status !== "active") throw new Error("CODE_NOT_ACTIVE");
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      throw new Error("CODE_EXPIRED");
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
    if (createErr) throw new Error(createErr.message);
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
      })
      .select("id")
      .single();
    if (patientErr) {
      // rollback do auth user para evitar órfão
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      throw new Error(`PATIENT_INSERT_FAILED: ${patientErr.message}`);
    }

    // 4) consome código (race-safe: só atualiza se ainda estiver active)
    const { data: consumed, error: consumeErr } = await supabaseAdmin
      .from("referral_codes")
      .update({
        status: "consumed",
        consumed_by: authUserId,
        consumed_at: new Date().toISOString(),
      })
      .eq("id", codeRow.id)
      .eq("status", "active")
      .select("id");
    if (consumeErr || !consumed || consumed.length === 0) {
      // race perdida ou erro: rollback paciente + auth
      await supabaseAdmin.from("patients").delete().eq("id", patient.id);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      throw new Error("CODE_RACE_LOST");
    }

    return { ok: true, patientId: patient.id, email: data.email };
  });
