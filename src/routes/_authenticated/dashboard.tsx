import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { recentActivity } from "@/lib/mock-data";
import { Plus, ArrowUpRight, TrendingUp, Users, Activity, AlertCircle } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getMyNutritionistProfile } from "@/lib/profile/nutritionist-profile.functions";
import { listMyPatientsForPlan } from "@/lib/plans/plans.functions";
import { getMyPendingAnamnesesCount } from "@/lib/anamnesis/review.functions";

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
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon: typeof Users;
}) {
  return (
    <div
      className={
        "p-5 rounded-lg border space-y-2 " +
        (accent
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface border-border")
      }
    >
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
    </div>
  );
}

function Dashboard() {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const fetchPatients = useServerFn(listMyPatientsForPlan);
  const fetchPending = useServerFn(getMyPendingAnamnesesCount);

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
          <Kpi label="Total Pacientes" value={String(totalPatients)} hint="base ativa" icon={Users} />
          <Kpi
            label="Anamneses aprovadas"
            value={String(approvedCount)}
            hint={totalPatients > 0 ? `${Math.round((approvedCount / totalPatients) * 100)}% da base` : "—"}
            icon={Activity}
          />
          <Kpi label="Adesão Média" value="—" hint="em breve" icon={TrendingUp} />
          <Kpi label="Revisões Pendentes" value={pendingValue} hint="Ação hoje" icon={AlertCircle} accent />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6">
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
                <AreaChart data={recentActivity}>
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
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Distribuição por Objetivo
            </p>
            {[
              { label: "Performance", pct: 38, color: "bg-primary" },
              { label: "Hipertrofia", pct: 28, color: "bg-emerald-400" },
              { label: "Emagrecimento", pct: 22, color: "bg-amber-400" },
              { label: "Manutenção", pct: 12, color: "bg-fuchsia-400" },
            ].map((o) => (
              <div key={o.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>{o.label}</span>
                  <span className="font-mono text-muted-foreground">{o.pct}%</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <div className={o.color + " h-full rounded-full"} style={{ width: `${o.pct}%` }} />
                </div>
              </div>
            ))}
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
            {recent.map((p, i) => (
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
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.sport}</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-background border border-border">
                  {p.goal}
                </span>
                <span className="text-xs font-mono text-muted-foreground hidden md:block">
                  {p.tdee} kcal
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
