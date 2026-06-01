// Banner de vencimento — retorna assinatura ativa e dias restantes
// para o usuário autenticado (paciente OU nutricionista).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ExpirationInfo = {
  kind: "patient" | "nutritionist";
  endsAt: string; // YYYY-MM-DD
  daysLeft: number; // pode ser negativo se já vencido
  planLabel: string;
} | null;

function daysBetween(todayIso: string, endIso: string): number {
  const a = new Date(todayIso + "T00:00:00Z").getTime();
  const b = new Date(endIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

export const getMyExpirationInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExpirationInfo> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const todayIso = new Date().toISOString().slice(0, 10);

    // Tenta como paciente
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (patient) {
      const { data: sub } = await supabase
        .from("patient_subscriptions")
        .select("plan_kind, ends_at, status")
        .eq("patient_id", patient.id)
        .eq("status", "active")
        .not("ends_at", "is", null)
        .order("ends_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (sub?.ends_at) {
        return {
          kind: "patient",
          endsAt: sub.ends_at,
          daysLeft: daysBetween(todayIso, sub.ends_at),
          planLabel: String(sub.plan_kind ?? "plano"),
        };
      }
      return null;
    }

    // Tenta como nutricionista
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return null;

    const { data: sub } = await supabase
      .from("nutritionist_subscriptions")
      .select("plan_tier, ends_at, status")
      .eq("nutritionist_id", nutri.id)
      .eq("status", "active")
      .not("ends_at", "is", null)
      .order("ends_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!sub?.ends_at) return null;

    return {
      kind: "nutritionist",
      endsAt: sub.ends_at,
      daysLeft: daysBetween(todayIso, sub.ends_at),
      planLabel: String(sub.plan_tier ?? "plano").toUpperCase(),
    };
  });
