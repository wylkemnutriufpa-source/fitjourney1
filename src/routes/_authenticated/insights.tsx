// Insights — visão analítica de adesão para o nutricionista.
// READ-ONLY. Consome getMyAdherenceInsights.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { getMyAdherenceInsights } from "@/lib/dashboard/dashboard.functions";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Insights — FitJourney" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const fetchInsights = useServerFn(getMyAdherenceInsights);
  const { data, isLoading } = useQuery({
    queryKey: ["adherence-insights"],
    queryFn: () => fetchInsights(),
    staleTime: 30_000,
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="space-y-2 border-b border-border pb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Dashboard
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Insights
          </p>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="size-7 text-primary" />
            Adesão dos pacientes
          </h1>
        </section>

        {isLoading || !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : data.average.sampleSize === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Ainda não há feedbacks dos pacientes. Os gráficos aparecerão aqui assim
            que os primeiros forem enviados.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Adesão média"
                value={data.average.pct != null ? `${data.average.pct}%` : "—"}
                hint={`${data.average.sampleSize} feedbacks`}
              />
              <StatCard
                label="Pacientes ativos"
                value={String(data.perPatient.length)}
                hint="com pelo menos 1 feedback"
              />
              <StatCard
                label="Melhor adesão"
                value={
                  data.perPatient[0]
                    ? `${data.perPatient[0].pct}%`
                    : "—"
                }
                hint={data.perPatient[0]?.fullName ?? "—"}
              />
            </section>

            <section className="bg-surface border border-border rounded-lg p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary mb-1">
                Evolução semanal
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Média de adesão por semana (últimas 12 semanas).
              </p>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Adesão"]}
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pct"
                      stroke="oklch(0.62 0.16 155)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-surface border border-border rounded-lg p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary mb-1">
                Distribuição das respostas
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Quantidade de feedbacks por nível de adesão.
              </p>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={data.distribution}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="oklch(0.62 0.16 155)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-surface border border-border rounded-lg p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary mb-4">
                Ranking por paciente
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3">Paciente</th>
                      <th className="py-2 pr-3 text-right">Adesão</th>
                      <th className="py-2 pr-3 text-right">Feedbacks</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perPatient.map((p) => (
                      <tr key={p.patientId} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-3">{p.fullName}</td>
                        <td className="py-2 pr-3 text-right font-mono">{p.pct}%</td>
                        <td className="py-2 pr-3 text-right text-muted-foreground">
                          {p.sampleSize}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          <Link
                            to="/patients/$id"
                            params={{ id: p.patientId }}
                            className="text-xs text-primary hover:underline"
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
