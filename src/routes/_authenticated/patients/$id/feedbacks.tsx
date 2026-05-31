// Nutri — visualiza feedbacks de um paciente seu (histórico + gráfico).

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import {
  listPatientFeedbacks,
  getSignedFeedbackPhotoUrl,
} from "@/lib/feedback/feedback.functions";
import {
  adherenceLabel,
  resultLabel,
} from "@/lib/feedback/copy";
import { FeedbackChart } from "@/components/feedback/FeedbackChart";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/patients/$id/feedbacks",
)({
  head: () => ({ meta: [{ title: "Feedbacks do paciente — FitJourney" }] }),
  component: PatientFeedbacksPage,
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

function PatientFeedbacksPage() {
  const { id } = Route.useParams();
  const list = useServerFn(listPatientFeedbacks);

  // Pega altura do patient pra fallback do IMC.
  const { data: patientRow } = useQuery({
    queryKey: ["patient-height", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("full_name, height_cm")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 60_000,
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["patient-feedbacks", id],
    queryFn: () => list({ data: { patientId: id } }),
    staleTime: 10_000,
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <header className="border-b border-border pb-4 space-y-1">
          <Link
            to="/patients/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Perfil do paciente
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-1">
            Acompanhamento
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Feedbacks{patientRow?.full_name ? ` — ${patientRow.full_name}` : ""}
          </h1>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <FeedbackChart
              feedbacks={data}
              fallbackHeightCm={
                patientRow?.height_cm ? Number(patientRow.height_cm) : null
              }
            />

            <section className="space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                Histórico ({data.length})
              </h2>
              {data.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Este paciente ainda não enviou nenhum feedback.
                </div>
              ) : (
                data.map((f, idx) => {
                  const previous = data[idx + 1];
                  const delta =
                    f.weightKg != null && previous?.weightKg != null
                      ? Math.round((f.weightKg - previous.weightKg) * 10) / 10
                      : null;
                  return (
                    <article
                      key={f.id}
                      className="rounded-lg border border-border bg-surface p-4 sm:p-5 space-y-3"
                    >
                      <header className="flex items-baseline justify-between gap-3 flex-wrap">
                        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          {fmtDateTime(f.createdAt)}
                        </p>
                      </header>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Peso
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {f.weightKg != null
                              ? `${f.weightKg.toFixed(1)} kg`
                              : "—"}
                          </p>
                          {delta != null && (
                            <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
                              {delta > 0 ? "+" : ""}
                              {delta.toFixed(1)} kg
                            </p>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Aderência
                          </p>
                          <p className="text-sm font-semibold">
                            {adherenceLabel(f.adherenceRating)}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Resultado
                          </p>
                          <p className="text-sm font-semibold">
                            {resultLabel(f.resultRating)}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Fotos
                          </p>
                          <p className="text-sm font-semibold">
                            {[f.photoFrontPath, f.photoSidePath].filter(Boolean)
                              .length || "—"}
                          </p>
                        </div>
                      </div>
                      {f.notes && (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap border-l-2 border-primary/40 pl-3">
                          {f.notes}
                        </p>
                      )}
                      {(f.photoFrontPath || f.photoSidePath) && (
                        <div className="flex gap-2 pt-1">
                          {f.photoFrontPath && (
                            <Thumb path={f.photoFrontPath} label="Frontal" />
                          )}
                          {f.photoSidePath && (
                            <Thumb path={f.photoSidePath} label="Lateral" />
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Thumb({ path, label }: { path: string; label: string }) {
  const sign = useServerFn(getSignedFeedbackPhotoUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["feedback-photo", path],
    queryFn: () => sign({ data: { path } }),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <a
      href={data?.url}
      target="_blank"
      rel="noreferrer"
      className="relative size-24 rounded-md border border-border overflow-hidden bg-background grid place-items-center hover:border-primary/60 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : data?.url ? (
        <img src={data.url} alt={label} className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" />
      )}
      <span className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur text-[9px] font-mono uppercase tracking-widest text-center py-0.5">
        {label}
      </span>
    </a>
  );
}
