import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listFeedbacksForNutritionist } from "@/lib/feedback/feedback.functions";
import { adherenceLabel, resultLabel } from "@/lib/feedback/copy";
import { MessageSquareHeart, ChevronRight } from "lucide-react";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";

export const Route = createFileRoute("/_authenticated/feedbacks")({
  head: () => ({ meta: [{ title: "Feedbacks — FitJourney" }] }),
  component: FeedbacksPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/dashboard" homeLabel="Dashboard" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/dashboard" homeLabel="Dashboard" />,
});

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FeedbacksPage() {
  const list = useServerFn(listFeedbacksForNutritionist);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["nutritionist-feedbacks"],
    queryFn: () => list(),
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  const pendingCount = data.filter((f) => !f.reviewed).length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <header className="border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Acompanhamento dos pacientes
          </p>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="size-7 text-primary" />
            Feedbacks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} feedback{pendingCount === 1 ? "" : "s"} aguardando avaliação.
          </p>
        </header>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
            {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            Nenhum feedback recebido ainda.
          </div>
        )}

        <ul className="space-y-2">
          {data.map((f) => (
            <li key={f.id}>
              <Link
                to="/patients/$id"
                params={{ id: f.patientId }}
                className="block rounded-lg border border-border hover:border-primary/50 transition-colors p-4 bg-surface"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{f.patientName}</h3>
                      {!f.reviewed && (
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-mono uppercase">
                          novo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">{f.patientEmail}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <span><strong>Enviado:</strong> {fmtDateTime(f.createdAt)}</span>
                      <span><strong>Peso:</strong> {f.weightKg != null ? `${f.weightKg.toFixed(1)} kg` : "—"}</span>
                      <span><strong>Aderência:</strong> {adherenceLabel(f.adherenceRating)}</span>
                      <span><strong>Resultado:</strong> {resultLabel(f.resultRating)}</span>
                    </div>
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