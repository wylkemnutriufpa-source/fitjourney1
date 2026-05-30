// Phase 2 — Signup flow (S0 → S1)
// Server fn que executa auth.signUp e emite audit event determinístico.
// NÃO usa supabaseAdmin: signup precisa do fluxo de email confirmation do
// Supabase Auth público. Usa anon client server-side.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { auditEvent } from "@/lib/phase2/audit.server";
import { Phase2Errors } from "@/lib/phase2/errors";
import type { Database } from "@/integrations/supabase/types";

const SignupInput = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  redirectTo: z
    .string()
    .url()
    .max(2048)
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      message: "redirectTo must be http(s)",
    }),
});

export interface SignupNutritionistResult {
  ok: true;
  /** S1 = aguardando confirmação de email. */
  state: "S1";
  /** true se o usuário já existia e o envio re-disparou o email de confirmação. */
  alreadyExisted: boolean;
}

export const signupNutritionist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = SignupInput.safeParse(input);
    if (!parsed.success) {
      auditEvent({
        flow: "signupNutritionist",
        step: "input.validate",
        outcome: "rejected",
        reason: "VALIDATION_FAILED",
        details: { issues: parsed.error.flatten() },
      });
      throw Phase2Errors.validationFailed(parsed.error.flatten());
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<SignupNutritionistResult> => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      auditEvent({
        flow: "signupNutritionist",
        step: "env.check",
        outcome: "failed",
        reason: "MISSING_ENV",
      });
      throw new Error("Supabase env not configured.");
    }

    const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    auditEvent({
      flow: "signupNutritionist",
      step: "auth.signUp",
      outcome: "ok",
      reason: "ATTEMPT",
      details: { email: data.email },
    });

    const { data: signupData, error } = await anon.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: data.redirectTo,
        data: { intended_role: "nutritionist" },
      },
    });

    if (error) {
      auditEvent({
        flow: "signupNutritionist",
        step: "auth.signUp",
        outcome: "failed",
        reason: "SIGNUP_ERROR",
        details: { message: error.message, status: error.status },
      });
      throw new Error(error.message);
    }

    // Supabase devolve user com identities=[] quando o email já existe
    // (não vaza existência, mas re-envia email).
    const alreadyExisted =
      Array.isArray(signupData.user?.identities) &&
      signupData.user!.identities!.length === 0;

    auditEvent({
      flow: "signupNutritionist",
      step: "auth.signUp",
      outcome: "ok",
      state: "S1",
      userId: signupData.user?.id ?? null,
      reason: alreadyExisted ? "ALREADY_EXISTED" : "CREATED",
    });

    return { ok: true, state: "S1", alreadyExisted };
  });
