// Dashboard financeiro do nutricionista.
// KPIs (MRR/ARR/ativos/ticket) + vencendo em 30d + lista completa.
// Read-only puro sobre patient_subscriptions.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  getFinanceOverview,
  type Subscription,
  type SubscriptionPlanKind,
} from "@/lib/finance/subscriptions.functions";
import {
  daysUntil,
  formatMoneyBRL,
  formatShortDate,
  planKindLabel,
  shortName,
  statusLabel,
} from "@/lib/finance/format";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — FitJourney" }] }),
  component: FinanceiroPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="text-sm text-destructive" role="alert">
        Erro ao carregar o financeiro: {error.message}
      </div>
    </AppShell>
  ),
});

function FinanceiroPage() {
  const fetchOverview = useServerFn(getFinanceOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["finance", "overview"],
    queryFn: () => fetchOverview(),
    staleTime: 30_000,
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Receita recorrente
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das assinaturas ativas e renovações.
          </p>
        </header>

        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi
                icon={DollarSign}
                label="MRR"
                value={formatMoneyBRL(data.mrrCents)}
                hint="Receita mensal recorrente"
              />
              <Kpi
                icon={TrendingUp}
                label="ARR"
                value={formatMoneyBRL(data.arrCents)}
                hint="Projeção 12 meses"
              />
              <Kpi
                icon={Users}
                label="Ativos"
                value={String(data.activeCount)}
                hint="Pacientes assinantes"
              />
              <Kpi
                icon={Calendar}
                label="Ticket médio"
                value={formatMoneyBRL(data.averageTicketCents)}
                hint="Por assinatura ativa"
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel
                title="Vencendo em 30 dias"
                count={data.expiringIn30.length}
                icon={AlertTriangle}
                accent="amber"
              >
                <SubscriptionList items={data.expiringIn30} emptyMsg="Nenhuma renovação nos próximos 30 dias." />
              </Panel>

              <Panel title="Distribuição por plano" icon={TrendingUp}>
                <ul className="space-y-1.5">
                  {(Object.keys(data.byPlanKind) as SubscriptionPlanKind[]).map(
                    (k) => (
                      <li
                        key={k}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {planKindLabel(k)}
                        </span>
                        <span className="font-mono">{data.byPlanKind[k]}</span>
                      </li>
                    ),
                  )}
                </ul>
              </Panel>
            </section>

            <section className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Todas as assinaturas
                </p>
                <h3 className="text-lg font-semibold mt-1">
                  {data.all.length} registro{data.all.length === 1 ? "" : "s"}
                </h3>
              </div>
              {data.all.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Nenhuma assinatura registrada. Cadastre na ficha do paciente.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="text-left px-5 py-2">Paciente</th>
                        <th className="text-left px-5 py-2">Plano</th>
                        <th className="text-right px-5 py-2">Valor</th>
                        <th className="text-left px-5 py-2">Início</th>
                        <th className="text-left px-5 py-2">Fim</th>
                        <th className="text-left px-5 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.all.map((s) => (
                        <tr
                          key={s.id}
                          className="border-t border-border hover:bg-background/50"
                        >
                          <td className="px-5 py-2">
                            <Link
                              to="/patients/$id"
                              params={{ id: s.patientId }}
                              className="text-primary hover:underline"
                            >
                              {s.patientName ?? `${s.patientId.slice(0, 8)}…`}
                            </Link>
                          </td>
                          <td className="px-5 py-2">
                            {planKindLabel(s.planKind)}
                          </td>
                          <td className="px-5 py-2 text-right font-mono">
                            {formatMoneyBRL(s.priceCents)}
                          </td>
                          <td className="px-5 py-2">
                            {formatShortDate(s.startsAt)}
                          </td>
                          <td className="px-5 py-2">
                            {formatShortDate(s.endsAt)}
                          </td>
                          <td className="px-5 py-2">{statusLabel(s.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-xl font-bold tracking-tight truncate">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  count,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  count?: number;
  icon: typeof DollarSign;
  accent?: "amber";
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <Icon
            className={
              "size-3 " + (accent === "amber" ? "text-amber-500" : "")
            }
          />
          {title}
        </div>
        {typeof count === "number" && (
          <span className="text-xs font-mono text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SubscriptionList({
  items,
  emptyMsg,
}: {
  items: Subscription[];
  emptyMsg: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMsg}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((s) => {
        const d = daysUntil(s.endsAt);
        return (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <Link
              to="/patients/$id"
              params={{ id: s.patientId }}
              className="text-primary hover:underline truncate"
            >
              {s.patientName ?? `${s.patientId.slice(0, 8)}…`}
            </Link>
            <span className="text-xs font-mono text-muted-foreground">
              {formatShortDate(s.endsAt)}
              {d !== null && d >= 0 ? ` · ${d}d` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
