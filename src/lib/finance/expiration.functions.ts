// Banner de vencimento — retorna assinatura ativa e dias restantes
// para o usuário autenticado (paciente OU nutricionista).
//
// Regras D-3 / D-0 / D+2:
//   daysLeft > 3   → ok       (sem banner)
//   1..3           → warn     (banner amarelo, aviso prévio)
//   0              → due      (banner laranja, "vence hoje — perderá acesso em 2 dias")
//   -1, -2         → grace    (banner vermelho, período de graça)
//   <= -3          → blocked  (paywall total, shouldBlock=true)

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ExpirationPhase = "ok" | "warn" | "due" | "grace" | "blocked";

export type ExpirationInfo = {
  kind: "patient" | "nutritionist";
  endsAt: string; // YYYY-MM-DD
  daysLeft: number;
  planLabel: string;
  phase: ExpirationPhase;
  shouldBlock: boolean;
} | null;

const WARN_DAYS = 3;
const GRACE_DAYS = 2;

function daysBetween(todayIso: string, endIso: string): number {
  const a = new Date(todayIso + "T00:00:00Z").getTime();
  const b = new Date(endIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

function phaseFor(daysLeft: number): ExpirationPhase {
  if (daysLeft > WARN_DAYS) return "ok";
  if (daysLeft >= 1) return "warn";
  if (daysLeft === 0) return "due";
  if (daysLeft >= -GRACE_DAYS) return "grace";
  return "blocked";
}

export const getMyExpirationInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExpirationInfo> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const todayIso = new Date().toISOString().slice(0, 10);

    // Admin nunca bloqueia/avisa
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (adminRole) return null;

    // Paciente
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
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub?.ends_at) {
        const daysLeft = daysBetween(todayIso, sub.ends_at);
        const phase = phaseFor(daysLeft);
        return {
          kind: "patient",
          endsAt: sub.ends_at,
          daysLeft,
          planLabel: String(sub.plan_kind ?? "plano"),
          phase,
          shouldBlock: phase === "blocked",
        };
      }
      return null;
    }

    // Nutricionista
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
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.ends_at) return null;

    const daysLeft = daysBetween(todayIso, sub.ends_at);
    const phase = phaseFor(daysLeft);
    return {
      kind: "nutritionist",
      endsAt: sub.ends_at,
      daysLeft,
      planLabel: String(sub.plan_tier ?? "plano").toUpperCase(),
      phase,
      shouldBlock: phase === "blocked",
    };
  });
