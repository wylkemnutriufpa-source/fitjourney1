// Phase 2 — Server functions for nutritionist onboarding
// Escopo desta leva: APENAS createNutritionistProfile (S2 → S3).
// Adiado: redeemReferralAndCreatePatient (Fase 2B).
//
// Invariantes aplicadas:
//  - Sem fallback silencioso. Toda falha emite auditEvent.
//  - Gate S2 obrigatório via assertState(["S2"]).
//  - RLS aplica WITH CHECK (auth.uid() = auth_user_id). Aqui só validamos
//    e inserimos via client autenticado — sem supabaseAdmin.
//  - Sem dependência de UI. Server fn retorna DTO determinístico.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveIdentityState, assertState } from "./identity-state.server";
import { auditEvent } from "./audit.server";
import { isPhase2Error, Phase2Errors } from "./errors";

const CreateNutritionistInput = z.object({
  fullName: z.string().trim().min(1).max(255),
  crn: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9\-\/\. ]+$/, "CRN contains invalid characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export interface CreateNutritionistResult {
  ok: true;
  nutritionistId: string;
  state: "S3";
}

export const createNutritionistProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const parsed = CreateNutritionistInput.safeParse(input);
    if (!parsed.success) {
      auditEvent({
        flow: "createNutritionistProfile",
        step: "input.validate",
        outcome: "rejected",
        reason: "VALIDATION_FAILED",
        details: { issues: parsed.error.flatten() },
      });
      throw Phase2Errors.validationFailed(parsed.error.flatten());
    }
    return parsed.data;
  })
  .handler(async ({ data, context }): Promise<CreateNutritionistResult> => {
    const { supabase, userId, claims } = context;
    const email = (claims?.email as string | undefined) ?? null;

    // 1) Resolve estado atual e exige S2
    let identity;
    try {
      identity = await resolveIdentityState(supabase, userId);
    } catch (e) {
      auditEvent({
        flow: "createNutritionistProfile",
        step: "identity.resolve",
        outcome: "failed",
        userId,
        reason: "RESOLVE_ERROR",
        details: { message: e instanceof Error ? e.message : String(e) },
      });
      throw e;
    }

    try {
      assertState(identity, ["S2"]);
    } catch (e) {
      auditEvent({
        flow: "createNutritionistProfile",
        step: "state.gate",
        outcome: "rejected",
        userId,
        state: identity.state,
        reason: isPhase2Error(e) ? e.code : "STATE_REJECTED",
      });
      throw e;
    }

    if (!email) {
      // claims sem email é estado inesperado — não podemos seguir sem persistir email
      auditEvent({
        flow: "createNutritionistProfile",
        step: "claims.email",
        outcome: "failed",
        userId,
        state: "S2",
        reason: "EMAIL_MISSING_IN_CLAIMS",
      });
      throw Phase2Errors.validationFailed({ email: ["missing in auth claims"] });
    }

    // 2) Insert via client autenticado — RLS valida auth.uid() = auth_user_id
    const { data: inserted, error } = await supabase
      .from("nutritionists")
      .insert({
        auth_user_id: userId,
        full_name: data.fullName,
        email,
        crn: data.crn ?? null,
      })
      .select("id")
      .single();

    if (error) {
      // 23505 = unique_violation (Postgres). Corrida perdida: outro request criou primeiro.
      const code = (error as { code?: string }).code;
      if (code === "23505") {
        auditEvent({
          flow: "createNutritionistProfile",
          step: "profile.insert",
          outcome: "race_lost",
          userId,
          state: "S2",
          reason: "UNIQUE_VIOLATION",
          details: { pgCode: code },
        });
        // Re-resolve para responder com o estado real (provavelmente S3).
        const fresh = await resolveIdentityState(supabase, userId);
        if (fresh.state === "S3" && fresh.profile?.role === "nutritionist") {
          throw Phase2Errors.profileAlreadyExists("nutritionist");
        }
        throw Phase2Errors.profileAlreadyExists(
          fresh.profile?.role ?? "nutritionist",
        );
      }

      auditEvent({
        flow: "createNutritionistProfile",
        step: "profile.insert",
        outcome: "failed",
        userId,
        state: "S2",
        reason: "INSERT_ERROR",
        details: { message: error.message, code },
      });
      throw new Error(`Failed to create nutritionist profile: ${error.message}`);
    }

    auditEvent({
      flow: "createNutritionistProfile",
      step: "profile.insert",
      outcome: "ok",
      userId,
      state: "S3",
      details: { nutritionistId: inserted.id },
    });

    return { ok: true, nutritionistId: inserted.id, state: "S3" };
  });
