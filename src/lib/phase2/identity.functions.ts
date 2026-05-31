// Phase 2 — Identity state resolver (server fn)
// Endpoint usado por route guards. Resolve S1/S2/S3 e devolve um DTO mínimo.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveIdentityState } from "@/lib/phase2/identity-state.server";

export interface IdentityStateDTO {
  state: "S1" | "S2" | "S3";
  userId: string;
  emailConfirmed: boolean;
  role: "nutritionist" | "patient" | null;
  appRoles: Array<"admin" | "user">;
  patient: {
    id: string;
    onboardingVersion: number | null;
    onboardingCompletedAt: string | null;
  } | null;
}

export const getMyIdentityState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IdentityStateDTO> => {
    const { supabase, userId } = context;
    const id = await resolveIdentityState(supabase, userId);
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      throw new Error(`Failed to resolve app roles: ${rolesError.message}`);
    }

    const patient =
      id.profile?.role === "patient"
        ? {
            id: id.profile.id,
            onboardingVersion: id.profile.onboardingVersion,
            onboardingCompletedAt: id.profile.onboardingCompletedAt,
          }
        : null;

    return {
      state: id.state,
      userId: id.userId,
      emailConfirmed: id.emailConfirmed,
      role: id.profile?.role ?? null,
      appRoles: (roles ?? []).map((r) => r.role as "admin" | "user"),
      patient,
    };
  });
