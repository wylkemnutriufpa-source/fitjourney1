// Clinical Review Queue — nutricionista.
// Lista anamneses com filtros por status. Inclui última atualização no card.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, ChevronRight, AlertCircle } from "lucide-react";
import { listAnamnesesForNutritionist } from "@/lib/anamnesis/review.functions";
import { AppShell } from "@/components/AppShell";
import { describeFlag } from "@/lib/anamnesis/v2/alerts.catalog";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";

type StatusFilter = "submitted" | "needs_changes" | "approved" | "all";

const tabs: { id: StatusFilter; label: string }[] = [
  { id: "submitted", label: "Pendentes" },
  { id: "needs_changes", label: "Requer ajustes" },
  { id: "approved", label: "Aprovadas" },
  { id: "all", label: "Todas" },
];

export const Route = createFileRoute("/_authenticated/anamneses/")({
  head: () => ({ meta: [{ title: "Anamneses — FitJourney" }] }),
  component: AnamnesesQueuePage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/dashboard" homeLabel="Dashboard" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/dashboard" homeLabel="Dashboard" />,
});

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 30) return `há ${diffDays}d`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)}mes`;
  return `há ${Math.floor(diffDays / 365)}a`;
}

function AnamnesesQueuePage() {
  const [status, setStatus] = useState<StatusFilter>("submitted");
  const fetchList = useServerFn(listAnamnesesForNutritionist);

  const { data, isLoading, error } = useQuery({
    queryKey: ["nutri", "anamneses", status],
    queryFn: () => fetchList({ data: { status } }),
    staleTime: 15_000,
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <header className="border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Workflow clínico
          </p>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-7 text-primary" />
            Anamneses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revise as anamneses dos seus pacientes. Aprovar uma versão a torna
            imutável e dispara os alertas clínicos no app do paciente.
          </p>
        </header>

        <nav className="flex gap-1 border-b border-border">
          {tabs.map((t) => {
            const active = status === t.id;
            const showBadge = t.id === "submitted" && (data?.pendingCount ?? 0) > 0;
            return (
              <button
                key={t.id}
                onClick={() => setStatus(t.id)}
                className={
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 " +
                  (active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                {t.label}
                {showBadge && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
                    {data?.pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
            {(error as Error).message}
          </p>
        )}

        {data && data.items.length === 0 && !isLoading && (
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            Nenhuma anamnese neste filtro.
          </div>
        )}

        <ul className="space-y-2">
          {(data?.items ?? []).map((item) => (
            <li key={item.id}>
              <Link
                to="/anamneses/$id"
                params={{ id: item.id }}
                className="block rounded-lg border border-border hover:border-primary/50 transition-colors p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{item.patientName}</h3>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        v{item.version}
                      </span>
                      <StatusBadge status={item.reviewStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.patientEmail}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-muted-foreground">
                        Score:{" "}
                        <span className="text-foreground font-mono">
                          {item.completionScore ?? "—"}%
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Atualizado{" "}
                        <span className="text-foreground">{fmtDate(item.updatedAt)}</span>
                      </span>
                      {item.submittedAt && (
                        <span className="text-muted-foreground">
                          Enviado{" "}
                          <span className="text-foreground">{fmtDate(item.submittedAt)}</span>
                        </span>
                      )}
                    </div>

                    {item.clinicalFlags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.clinicalFlags.slice(0, 6).map((f) => {
                          const d = describeFlag(f, "clinical");
                          if (!d) return null;
                          return (
                            <span
                              key={f}
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono " +
                                (d.severity === "critical"
                                  ? "bg-destructive/10 text-destructive"
                                  : d.severity === "warning"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                    : "bg-muted text-muted-foreground")
                              }
                            >
                              {d.severity !== "info" && <AlertCircle className="size-2.5" />}
                              {d.label}
                            </span>
                          );
                        })}
                        {item.clinicalFlags.length > 6 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{item.clinicalFlags.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Pendente", cls: "bg-primary/10 text-primary border-primary/30" },
    needs_changes: { label: "Requer ajustes", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
    approved: { label: "Aprovada", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
    draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={"inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono " + s.cls}>
      {s.label}
    </span>
  );
}
