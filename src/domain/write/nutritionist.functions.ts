// Domain Write — Nutritionist mutations
// Toda mutação de nutritionists vive aqui. Sem exceção.
// Escrita usa supabaseAdmin (service_role) pois client roles não têm mais
// INSERT/UPDATE/DELETE em public.nutritionists (lockdown da Fase 2).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { auditEvent } from "@/lib/phase2/audit.server";
import { Phase2Errors } from "@/lib/phase2/errors";
import { resolveIdentityState } from "@/lib/phase2/identity-state.server";
import { withDomainGate } from "./gate.server";

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
  .handler(
    withDomainGate(
      {
        flow: "createNutritionistProfile",
        allowedStates: ["S2"],
      },
      async ({ data, identity, admin, userId }): Promise<CreateNutritionistResult> => {
        // Email vem do auth.users — fonte autoritativa, não dos claims.
        const { data: authUser, error: authErr } =
          await admin.auth.admin.getUserById(userId);
        if (authErr || !authUser?.user?.email) {
          auditEvent({
            flow: "createNutritionistProfile",
            step: "auth.email.fetch",
            outcome: "failed",
            userId,
            state: identity.state,
            reason: "EMAIL_MISSING",
          });
          throw Phase2Errors.validationFailed({
            email: ["unavailable from auth user"],
          });
        }

        const { data: inserted, error } = await admin
          .from("nutritionists")
          .insert({
            auth_user_id: userId,
            full_name: data.fullName,
            email: authUser.user.email,
            crn: data.crn ?? null,
          })
          .select("id")
          .single();

        if (error) {
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
            // Re-resolve estado pós-corrida via client autenticado original
            // não está disponível aqui; usamos admin pra olhar o estado real.
            const { data: existing } = await admin
              .from("nutritionists")
              .select("id")
              .eq("auth_user_id", userId)
              .maybeSingle();
            if (existing) {
              throw Phase2Errors.profileAlreadyExists("nutritionist");
            }
            // Edge case: 23505 mas nada existe — propaga genérico
            throw Phase2Errors.profileAlreadyExists("nutritionist");
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
          throw new Error(
            `Failed to create nutritionist profile: ${error.message}`,
          );
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
      },
    ),
  );

// Re-uso futuro do resolver para outros pontos do domínio
export { resolveIdentityState };
