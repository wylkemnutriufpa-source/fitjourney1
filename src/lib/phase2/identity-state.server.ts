// Phase 2 — Identity State Machine: state resolver
// Resolve o estado atual da identidade (S1/S2/S3) a partir do contexto autenticado.
// Server-only. Usado por server fns que precisam validar o estado antes de operar.
//
// Estados:
//   S1 UNVERIFIED_AUTH_USER  — auth.users existe, email_confirmed_at IS NULL
//   S2 VERIFIED_NO_PROFILE   — confirmado, sem profile (transitório obrigatório)
//   S3 ACTIVE_DOMAIN_USER    — confirmado + profile (nutritionist OU patient)
//   S4 ORPHAN_AUTH_USER      — responsabilidade do cleanup job, não do runtime
//
// Regra: RLS NUNCA depende de S3. Server fns SIM.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { Phase2Errors } from "./errors";

export type IdentityState = "S1" | "S2" | "S3";
export type ProfileRole = "nutritionist" | "patient";

export interface ResolvedIdentity {
  state: IdentityState;
  userId: string;
  emailConfirmed: boolean;
  profile:
    | { role: "nutritionist"; id: string }
    | {
        role: "patient";
        id: string;
        nutritionistId: string | null;
        onboardingVersion: number | null;
        onboardingCompletedAt: string | null;
      }
    | null;
}

/**
 * Resolve o estado de identidade do usuário autenticado.
 * Usa supabaseAdmin para ler auth.users (necessário pois o JWT não traz
 * email_confirmed_at de forma confiável em todas as configs).
 */
export async function resolveIdentityState(
  authedSupabase: SupabaseClient<Database>,
  userId: string,
): Promise<ResolvedIdentity> {
  // 1) email_confirmed_at via admin
  const { data: authUser, error: authErr } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (authErr || !authUser?.user) {
    throw new Error(`Failed to resolve auth user ${userId}: ${authErr?.message ?? "not found"}`);
  }
  const emailConfirmed = Boolean(authUser.user.email_confirmed_at);

  if (!emailConfirmed) {
    return { state: "S1", userId, emailConfirmed, profile: null };
  }

  // 2) profile lookup — usa o client autenticado (RLS aplica auth.uid()=userId)
  const [{ data: nutri }, { data: patient }] = await Promise.all([
    authedSupabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle(),
    authedSupabase
      .from("patients")
      .select("id, nutritionist_id, onboarding_version, onboarding_completed_at")
      .eq("auth_user_id", userId)
      .maybeSingle(),
  ]);

  if (nutri && patient) {
    // Invariante quebrado: usuário não pode ser nutri e paciente ao mesmo tempo
    throw new Error(
      `Identity invariant violated: user ${userId} has both nutritionist and patient profile.`,
    );
  }

  if (nutri) {
    return {
      state: "S3",
      userId,
      emailConfirmed,
      profile: { role: "nutritionist", id: nutri.id },
    };
  }

  if (patient) {
    return {
      state: "S3",
      userId,
      emailConfirmed,
      profile: {
        role: "patient",
        id: patient.id,
        nutritionistId: patient.nutritionist_id ?? null,
        onboardingVersion: patient.onboarding_version ?? null,
        onboardingCompletedAt: patient.onboarding_completed_at ?? null,
      },
    };
  }

  return { state: "S2", userId, emailConfirmed, profile: null };
}

/**
 * Garante que o estado atual está em `allowed`. Lança Phase2Error caso contrário.
 * Use no início de toda server fn de Fase 2.
 */
export function assertState(
  identity: ResolvedIdentity,
  allowed: IdentityState[],
): void {
  if (allowed.includes(identity.state)) return;

  if (identity.state === "S1") throw Phase2Errors.emailNotConfirmed();
  if (identity.state === "S2") throw Phase2Errors.profileRequired();
  if (identity.state === "S3" && identity.profile) {
    throw Phase2Errors.profileAlreadyExists(identity.profile.role);
  }
  // fallback defensivo
  throw Phase2Errors.profileRequired();
}

/**
 * Garante S3 + role específica. Útil para fns que só nutricionistas podem chamar.
 */
export function assertRole(
  identity: ResolvedIdentity,
  required: ProfileRole,
): asserts identity is ResolvedIdentity & {
  state: "S3";
  profile: NonNullable<ResolvedIdentity["profile"]>;
} {
  assertState(identity, ["S3"]);
  if (!identity.profile || identity.profile.role !== required) {
    throw Phase2Errors.wrongProfileRole(
      required,
      identity.profile?.role ?? required,
    );
  }
}
