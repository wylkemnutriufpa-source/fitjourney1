// Paciente vê a própria avaliação física — read-only.
// Atual + histórico simplificado. Sem edição.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listMyPhysicalAssessments } from "@/lib/physical-assessments/physical-assessments.functions";

export const Route = createFileRoute("/_authenticated/my-plan/physical-assessment")({
  head: () => ({ meta: [{ title: "Avaliação Física — FitJourney" }] }),
  component: MyPhysicalAssessmentPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/my-dashboard" homeLabel="Início" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/my-dashboard" homeLabel="Início" />,
});

function fmt(v: number | null, unit = "", digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function MyPhysicalAssessmentPage() {
  const listFn = useServerFn(listMyPhysicalAssessments);
  const { data, isLoading } = useQuery({
    queryKey: ["my-physical-assessments"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  const list = data ?? [];
  const current = list[0] ?? null;
  const history = list.slice(1);

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <header className="space-y-2">
          <Link
            to="/my-dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> voltar
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Avaliação Física
          </h1>
          <p className="text-xs text-muted-foreground max-w-xl">
            Suas avaliações registradas pelo seu nutricionista. Cada avaliação
            é um ponto no histórico.
          </p>
        </header>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

        {!isLoading && !current && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <p className="text-sm">Você ainda não tem avaliação física registrada.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Quando seu nutricionista registrar sua primeira avaliação, ela
              aparecerá aqui.
            </p>
          </div>
        )}

        {current && (
          <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Atual
                </p>
                <h2 className="text-lg font-semibold mt-1">
                  {fmtDate(current.assessedAt)}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric label="Peso" value={fmt(current.weightKg, "kg")} />
              <Metric label="Altura" value={fmt(current.heightCm, "cm", 0)} />
              <Metric label="% Gordura" value={fmt(current.bodyFatPct, "%")} />
              <Metric label="Massa magra" value={fmt(current.leanMassKg, "kg")} />
              <Metric label="Cintura" value={fmt(current.waistCm, "cm")} />
              <Metric label="Abdômen" value={fmt(current.abdomenCm, "cm")} />
              <Metric label="Quadril" value={fmt(current.hipCm, "cm")} />
              <Metric label="Braço c." value={fmt(current.armContractedCm, "cm")} />
            </div>
            {current.notes && (
              <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic">
                {current.notes}
              </p>
            )}
          </section>
        )}

        {history.length > 0 && (
          <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Histórico · {history.length} avaliação{history.length === 1 ? "" : "es"} anterior{history.length === 1 ? "" : "es"}
            </h3>
            <ul className="space-y-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-xs font-mono"
                >
                  <span>{fmtDate(h.assessedAt)}</span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span>{fmt(h.weightKg, "kg")}</span>
                    <span>{fmt(h.bodyFatPct, "%")}</span>
                    <span>{fmt(h.waistCm, "cm")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 px-3 py-2">
      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
