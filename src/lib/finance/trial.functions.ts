// Trial de 3 dias para nutricionista.
// Conta a partir de nutritionists.created_at. Se houver subscription ativa, trial não se aplica.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TRIAL_DAYS = 3;

export type NutriTrialStatus = {
  isNutritionist: boolean;
  hasActiveSubscription: boolean;
  trialEndsAt: string | null; // ISO date YYYY-MM-DD
  daysLeftInTrial: number | null; // negativo se expirado
  trialExpired: boolean;
  // true = bloqueio total (sem subscription E trial expirado)
  shouldBlock: boolean;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const getMyNutriTrialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NutriTrialStatus> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    // Admin nunca é bloqueado pelo paywall.
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (adminRole) {
      return {
        isNutritionist: false,
        hasActiveSubscription: true,
        trialEndsAt: null,
        daysLeftInTrial: null,
        trialExpired: false,
        shouldBlock: false,
      };
    }

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id, created_at")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!nutri) {
      return {
        isNutritionist: false,
        hasActiveSubscription: false,
        trialEndsAt: null,
        daysLeftInTrial: null,
        trialExpired: false,
        shouldBlock: false,
      };
    }

    const todayIso = isoDate(new Date());

    const { data: sub } = await supabase
      .from("nutritionist_subscriptions")
      .select("ends_at, status")
      .eq("nutritionist_id", nutri.id)
      .eq("status", "active")
      .order("ends_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const hasActiveSub =
      !!sub && (sub.ends_at === null || sub.ends_at >= todayIso);

    const created = new Date(nutri.created_at);
    const trialEnd = new Date(created.getTime() + TRIAL_DAYS * 86_400_000);
    const trialEndsAt = isoDate(trialEnd);
    const daysLeft = Math.round(
      (new Date(trialEndsAt + "T00:00:00Z").getTime() -
        new Date(todayIso + "T00:00:00Z").getTime()) /
        86_400_000,
    );
    const trialExpired = daysLeft < 0;

    return {
      isNutritionist: true,
      hasActiveSubscription: hasActiveSub,
      trialEndsAt,
      daysLeftInTrial: daysLeft,
      trialExpired,
      shouldBlock: !hasActiveSub && trialExpired,
    };
  });
