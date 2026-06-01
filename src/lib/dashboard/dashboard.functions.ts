// Server fns do dashboard do nutricionista.
// READ-ONLY. Zero escrita. Falha de leitura não bloqueia outras operações.
//
// getMyWeeklyActivity:
//   - Janela: últimos 7 dias (incluindo hoje), agrupado por dia local (America/Sao_Paulo).
//   - consultations = anamneses criadas pelo nutri (created_at).
//   - newDiets       = planos publicados pelo nutri (published_at).
//   - Escopado por nutritionist_id do usuário autenticado.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TZ = "America/Sao_Paulo";
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dayKey(d: Date): string {
  // YYYY-MM-DD em America/Sao_Paulo
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function weekdayLabel(d: Date): string {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
  const map: Record<string, string> = {
    Sun: "Dom", Mon: "Seg", Tue: "Ter", Wed: "Qua", Thu: "Qui", Fri: "Sex", Sat: "Sáb",
  };
  return map[wd] ?? DAY_LABELS[d.getDay()];
}

export type WeeklyActivityPoint = {
  day: string;          // "Seg"
  date: string;         // "2026-06-01"
  consultations: number;
  newDiets: number;
};

export const getMyWeeklyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklyActivityPoint[]> => {
    const { supabase, userId } = context;

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return [];

    // Janela: últimos 7 dias terminando hoje.
    const now = new Date();
    const sinceMs = now.getTime() - 6 * 24 * 60 * 60 * 1000;
    const since = new Date(sinceMs);
    // Recua até o início do dia local para não cortar pontos do dia mais antigo.
    const sinceIso = new Date(since.getTime() - 12 * 60 * 60 * 1000).toISOString();

    const [anamRes, plansRes] = await Promise.all([
      supabase
        .from("anamneses")
        .select("created_at")
        .eq("nutritionist_id", nutri.id)
        .gte("created_at", sinceIso),
      supabase
        .from("plans")
        .select("published_at")
        .eq("nutritionist_id", nutri.id)
        .eq("status", "published")
        .not("published_at", "is", null)
        .gte("published_at", sinceIso),
    ]);

    // Seed dos 7 dias (hoje no fim, 6 dias atrás no início)
    const buckets = new Map<string, WeeklyActivityPoint>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const k = dayKey(d);
      buckets.set(k, { day: weekdayLabel(d), date: k, consultations: 0, newDiets: 0 });
    }

    for (const row of anamRes.data ?? []) {
      if (!row.created_at) continue;
      const k = dayKey(new Date(row.created_at));
      const b = buckets.get(k);
      if (b) b.consultations += 1;
    }
    for (const row of plansRes.data ?? []) {
      if (!row.published_at) continue;
      const k = dayKey(new Date(row.published_at));
      const b = buckets.get(k);
      if (b) b.newDiets += 1;
    }

    return Array.from(buckets.values());
  });
