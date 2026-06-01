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

// ---------------------------------------------------------------------------
// getMyGoalDistribution — distribuição das metas clínicas (cut/maintain/bulk/
// performance/health) derivadas da anamnese APROVADA MAIS RECENTE de cada
// paciente do nutri. READ-ONLY. Sem fallback silencioso.

export type GoalKey = "cut" | "maintain" | "bulk" | "performance" | "health";

export type GoalDistribution = {
  key: GoalKey;
  label: string;
  count: number;
  pct: number; // 0..100, arredondado
};

const GOAL_LABEL: Record<GoalKey, string> = {
  performance: "Performance",
  bulk: "Hipertrofia",
  cut: "Emagrecimento",
  maintain: "Manutenção",
  health: "Saúde",
};

export const getMyGoalDistribution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoalDistribution[]> => {
    const { supabase, userId } = context;

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return [];

    const { data: rows } = await supabase
      .from("anamneses")
      .select("patient_id, approved_at, data")
      .eq("nutritionist_id", nutri.id)
      .eq("review_status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false });

    const latestByPatient = new Map<string, GoalKey>();
    for (const r of rows ?? []) {
      if (!r.patient_id || latestByPatient.has(r.patient_id)) continue;
      const goal = (r.data as { basics?: { goal?: string } } | null)?.basics
        ?.goal;
      if (
        goal === "cut" ||
        goal === "maintain" ||
        goal === "bulk" ||
        goal === "performance" ||
        goal === "health"
      ) {
        latestByPatient.set(r.patient_id, goal);
      }
    }

    const counts: Record<GoalKey, number> = {
      performance: 0,
      bulk: 0,
      cut: 0,
      maintain: 0,
      health: 0,
    };
    for (const g of latestByPatient.values()) counts[g] += 1;
    const total = latestByPatient.size;

    const order: GoalKey[] = ["performance", "bulk", "cut", "maintain", "health"];
    return order.map((k) => ({
      key: k,
      label: GOAL_LABEL[k],
      count: counts[k],
      pct: total > 0 ? Math.round((counts[k] / total) * 100) : 0,
    }));
  });

// ---------------------------------------------------------------------------
// getMyAdherenceAverage — média de adesão dos pacientes do nutri, derivada
// de patient_feedbacks. Mapeamento determinístico:
//   muito_dificil=1, dificil=2, neutro=3, facil=4, muito_facil=5
// Retorna pct (0..100) = (avg-1)/4*100. Null se não houver feedback.

const ADHERENCE_SCORE: Record<string, number> = {
  muito_dificil: 1,
  dificil: 2,
  neutro: 3,
  facil: 4,
  muito_facil: 5,
};

export type AdherenceAverage = {
  pct: number | null;
  sampleSize: number;
};

export const getMyAdherenceAverage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdherenceAverage> => {
    const { supabase, userId } = context;

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return { pct: null, sampleSize: 0 };

    const { data: rows } = await supabase
      .from("patient_feedbacks")
      .select("adherence_rating")
      .eq("nutritionist_id", nutri.id);

    const scores: number[] = [];
    for (const r of rows ?? []) {
      const s = ADHERENCE_SCORE[r.adherence_rating ?? ""];
      if (typeof s === "number") scores.push(s);
    }
    if (scores.length === 0) return { pct: null, sampleSize: 0 };

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pct = Math.round(((avg - 1) / 4) * 100);
    return { pct, sampleSize: scores.length };
  });
