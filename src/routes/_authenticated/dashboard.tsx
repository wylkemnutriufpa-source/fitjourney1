import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Plus, ArrowUpRight, TrendingUp, Users, Activity, AlertCircle } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getMyNutritionistProfile } from "@/lib/profile/nutritionist-profile.functions";
import { listMyPatientsForPlan } from "@/lib/plans/plans.functions";
import { getMyPendingAnamnesesCount } from "@/lib/anamnesis/review.functions";
import {
  getMyWeeklyActivity,
  getMyGoalDistribution,
  getMyAdherenceAverage,
} from "@/lib/dashboard/dashboard.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FitJourney" }] }),
  component: Dashboard,
});

function Kpi({
  label,
  value,
  hint,
  accent,
  icon: Icon,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon: typeof Users;
  to?: "/patients" | "/anamneses" | "/financeiro";
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p
          className={
            "text-[10px] font-mono uppercase tracking-widest " +
            (accent ? "text-primary-foreground/70" : "text-muted-foreground")
          }
        >
          {label}
        </p>
        <Icon className={"size-4 " + (accent ? "opacity-70" : "text-muted-foreground")} />
      </div>
      <p className="text-4xl font-bold tracking-tighter">{value}</p>
      {hint && (
        <p
          className={
            "text-[10px] font-mono uppercase " +
            (accent ? "text-primary-foreground/80" : "text-emerald-400")
          }
        >
          {hint}
        </p>
      )}
    </>
  );
  const cls =
    "p-5 rounded-lg border space-y-2 transition-colors " +
    (accent
      ? "bg-primary text-primary-foreground border-primary "
      : "bg-surface border-border ") +
    (to ? (accent ? "hover:bg-primary/90 cursor-pointer" : "hover:border-primary/50 hover:bg-accent/30 cursor-pointer") : "");
  if (to) {
    return (
      <Link to={to} className={cls + " block focus:outline-none focus:ring-2 focus:ring-primary/40"}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function Dashboard() {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const fetchPatients = useServerFn(listMyPatientsForPlan);
  const fetchPending = useServerFn(getMyPendingAnamnesesCount);
  const fetchWeekly = useServerFn(getMyWeeklyActivity);
  const fetchGoals = useServerFn(getMyGoalDistribution);
  const fetchAdherence = useServerFn(getMyAdherenceAverage);

  const { data: profile } = useQuery({
    queryKey: ["nutri-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });
  const { data: patientsList = [] } = useQuery({
    queryKey: ["patients-index"],
    queryFn: () => fetchPatients(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: pending } = useQuery({
    queryKey: ["nutri", "pending-count"],
    queryFn: () => fetchPending(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: weekly = [] } = useQuery({
    queryKey: ["nutri", "weekly-activity"],
    queryFn: () => fetchWeekly(),
    staleTime: 60_000,
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["nutri", "goal-distribution"],
    queryFn: () => fetchGoals(),
    staleTime: 60_000,
  });
  const { data: adherence } = useQuery({
    queryKey: ["nutri", "adherence-avg"],
    queryFn: () => fetchAdherence(),
    staleTime: 60_000,
  });


  const recent = patientsList.slice(0, 5);
  const totalPatients = patientsList.length;
  const approvedCount = patientsList.filter((p) => p.anamnesisStatus === "approved").length;
  const greetingName =
    profile?.displayName?.trim() ||
    profile?.fullName?.split(" ")[0] ||
    "profissional";
  const pendingValue = String(pending?.pendingCount ?? 0).padStart(2, "0");

  return (
    <AppShell
      header={
        <Link
          to="/patients/new"
          className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          Novo Paciente
        </Link>
      }
    >
      <div className="space-y-10">
        <section className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Olá, {greetingName}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Total Pacientes" value={String(totalPatients)} hint="base ativa" icon={Users} to="/patients" />
          <Kpi
            label="Anamneses aprovadas"
            value={String(approvedCount)}
            hint={totalPatients > 0 ? `${Math.round((approvedCount / totalPatients) * 100)}% da base` : "—"}
            icon={Activity}
            to="/patients"
          />
          <Kpi
            label="Adesão Média"
            value={adherence?.pct != null ? `${adherence.pct}%` : "—"}
            hint={
              adherence?.sampleSize
                ? `${adherence.sampleSize} feedback${adherence.sampleSize > 1 ? "s" : ""}`
                : "sem feedbacks"
            }
            icon={TrendingUp}
            to="/insights"
          />
          <Kpi label="Revisões Pendentes" value={pendingValue} hint="Ação hoje" icon={AlertCircle} accent to="/anamneses" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link
            to="/financeiro"
            className="lg:col-span-2 bg-surface border border-border rounded-lg p-6 block hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Atividade da Semana
                </p>
                <h3 className="text-lg font-semibold mt-1">
                  Consultas e dietas geradas
                </h3>
              </div>
              <div className="flex gap-4 text-[10px] font-mono uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Consultas
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2 rounded-full bg-muted-foreground" /> Dietas
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.17 230)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.72 0.17 230)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="oklch(0.68 0.02 240)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.013 240)",
                      border: "1px solid oklch(0.30 0.012 240)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="consultations"
                    stroke="oklch(0.72 0.17 230)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="newDiets"
                    stroke="oklch(0.68 0.02 240)"
                    strokeWidth={1.5}
                    fillOpacity={0}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Link>

          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Distribuição por Objetivo
            </p>
            {(() => {
              const COLORS: Record<string, string> = {
                performance: "bg-primary",
                bulk: "bg-emerald-400",
                cut: "bg-amber-400",
                maintain: "bg-fuchsia-400",
                health: "bg-sky-400",
              };
              const hasAny = goals.some((g) => g.count > 0);
              if (!hasAny) {
                return (
                  <p className="text-xs font-mono text-muted-foreground">
                    Sem anamneses aprovadas ainda.
                  </p>
                );
              }
              return goals.map((g) => (
                <div key={g.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{g.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {g.count} · {g.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className={(COLORS[g.key] ?? "bg-muted") + " h-full rounded-full"}
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>


        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Pacientes Recentes
              </p>
              <h3 className="text-lg font-semibold mt-1">Últimas consultas</h3>
            </div>
            <Link
              to="/patients"
              className="text-xs font-mono uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {recent.length === 0 && (
              <div className="p-6 text-xs font-mono text-muted-foreground">
                Nenhum paciente cadastrado ainda.
              </div>
            )}
            {recent.map((p, i) => {
              const initials =
                p.fullName
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("") || "P";
              return (
                <Link
                  key={p.id}
                  to="/patients/$id"
                  params={{ id: p.id }}
                  className={
                    "flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors " +
                    (i < recent.length - 1 ? "border-b border-border" : "")
                  }
                >
                  <div className="size-10 rounded-full bg-background border border-border grid place-items-center text-xs font-mono">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{p.email}</p>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-background border border-border">
                    {p.anamnesisStatus === "approved" ? "aprovada" : p.anamnesisStatus}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
