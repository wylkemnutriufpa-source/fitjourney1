// Protocolos Ativos — visão do paciente.
// READ ONLY: lista os protocolos que o profissional aplicou para o paciente.
// Mostra fase atual, semana, recomendações e duração.

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Clock, Droplets, Moon, Leaf, CheckCircle2, Info } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  listMyActiveProtocols,
  type ActiveProtocolRow,
} from "@/lib/protocols/active.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/my-plan/protocolos")({
  head: () => ({ meta: [{ title: "Protocolos Ativos — FitJourney" }] }),
  component: PatientActiveProtocolsPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <p className="text-sm text-destructive" role="alert">
        Erro ao carregar protocolos: {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-sm text-muted-foreground">Nada encontrado.</p>
    </AppShell>
  ),
});

function PatientActiveProtocolsPage() {
  const fetchActive = useServerFn(listMyActiveProtocols);
  const { data, isLoading, error } = useQuery({
    queryKey: ["patient", "active-protocols"],
    queryFn: () => fetchActive(),
    staleTime: 60_000,
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--gold)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
              Protocolos Ativos
            </span>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight uppercase text-[var(--gold)]"
            style={{ textShadow: "0 0 14px color-mix(in oklab, var(--gold) 30%, transparent)" }}
          >
            Seus Protocolos
          </h1>
          <p className="text-sm text-muted-foreground">
            Aqui estão os protocolos que seu profissional escolheu trabalhar com você.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>
        ) : !data?.protocols.length ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center space-y-2">
            <Info className="size-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Você ainda não tem nenhum protocolo ativo. Quando seu profissional aplicar um, ele
              aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.protocols.map((p) => (
              <ActiveProtocolCard key={p.id} row={p} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function computeCurrentWeek(row: ActiveProtocolRow): number {
  const started = new Date(row.started_at).getTime();
  const now = Date.now();
  const week = Math.floor((now - started) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(week, row.phase_snapshot.durationWeeks));
}

function ActiveProtocolCard({ row }: { row: ActiveProtocolRow }) {
  const phase = row.phase_snapshot;
  const week = computeCurrentWeek(row);
  return (
    <article className="relative overflow-hidden rounded-lg border border-[var(--gold)]/30 bg-surface p-5 space-y-4 shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_8%,transparent)]">
      <Sparkles
        className="pointer-events-none absolute -top-1 -right-1 size-7 text-[var(--gold)]/40 animate-pulse"
        aria-hidden
      />
      <header className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {row.protocol_name}
        </p>
        <h2
          className="text-lg font-bold uppercase tracking-wide text-[var(--gold)]"
          style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 35%, transparent)" }}
        >
          {row.module_name} · {phase.name}
        </h2>
        <p className="text-xs text-muted-foreground">{phase.description}</p>
      </header>

      <div className="grid grid-cols-3 gap-3 text-[10px] font-mono text-muted-foreground border-t border-[var(--gold)]/15 pt-3">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3 text-[var(--gold)]/70" />
          Semana {week} / {phase.durationWeeks}
        </span>
        <span className="inline-flex items-center gap-1">
          <Droplets className="size-3 text-[var(--gold)]/70" />
          {(phase.recommendations.waterMl / 1000).toFixed(1)}L
        </span>
        <span className="inline-flex items-center gap-1">
          <Moon className="size-3 text-[var(--gold)]/70" />
          {phase.recommendations.sleepHours}h sono
        </span>
      </div>

      {phase.recommendations.strategies.length > 0 && (
        <section className="space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Estratégias da fase
          </p>
          <ul className="space-y-1">
            {phase.recommendations.strategies.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="size-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase.recommendations.teaRoutine.length > 0 && (
        <section className="space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Rotina de chás
          </p>
          <ul className="space-y-1">
            {phase.recommendations.teaRoutine.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Leaf className="size-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase.dailyKcalTarget && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Meta calórica diária: {phase.dailyKcalTarget} kcal
        </p>
      )}
    </article>
  );
}
