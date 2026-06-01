// Detalhe da anamnese para revisão clínica.
// Lado esquerdo: respostas + canonical derivado. Direita: notas + ações.
// Approve: terminal (trigger no DB bloqueia novos UPDATEs após approval).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  getAnamnesisForReview,
  reviewAnamnesis,
} from "@/lib/anamnesis/review.functions";
import { describeFlag } from "@/lib/anamnesis/v2/alerts.catalog";
import { AnamnesisAnswersView } from "@/components/anamnesis/AnamnesisAnswersView";

export const Route = createFileRoute("/_authenticated/anamneses/$id")({
  head: () => ({ meta: [{ title: "Revisão clínica — FitJourney" }] }),
  component: AnamnesisDetailPage,
});

function AnamnesisDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getAnamnesisForReview);
  const review = useServerFn(reviewAnamnesis);

  const { data, isLoading, error } = useQuery({
    queryKey: ["nutri", "anamnesis", id],
    queryFn: () => fetchDetail({ data: { anamnesisId: id } }),
    staleTime: 0,
  });

  const [notes, setNotes] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (decision: "approved" | "needs_changes") =>
      review({ data: { anamnesisId: id, decision, notes: notes || null } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["nutri", "anamneses"] });
      navigate({ to: "/anamneses" });
    },
    onError: (e: Error) => setActionError(e.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }
  if (error) {
    return (
      <AppShell>
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </AppShell>
    );
  }
  if (!data) return null;

  const isApproved = data.reviewStatus === "approved";
  // initialize notes from existing review_notes only on first render
  if (notes === "" && data.reviewNotes) {
    // safe one-time hydrate (state default would also work)
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <Link
          to="/anamneses"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar à fila
        </Link>

        <header className="border-b border-border pb-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              Anamnese v{data.version}
            </h1>
            <StatusBadge status={data.reviewStatus} />
          </div>
          {data.patient && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="size-3.5" />
                {data.patient.fullName}
              </span>
              {data.patient.birthDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {new Date(data.patient.birthDate).toLocaleDateString("pt-BR")}
                </span>
              )}
              {data.patient.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {data.patient.phone}
                </span>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Enviado em{" "}
            {data.submittedAt
              ? new Date(data.submittedAt).toLocaleString("pt-BR")
              : "—"}
            {" · "}Score: {data.completionScore ?? "—"}%
            {" · "}Catálogo: {data.catalogVersion ?? "—"}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {data.clinicalFlags.length + data.riskFlags.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Flags derivadas
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {data.riskFlags.map((f) => {
                    const d = describeFlag(f, "risk");
                    return (
                      <span
                        key={"r:" + f}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-destructive/10 text-destructive border border-destructive/30"
                      >
                        <AlertTriangle className="size-3" />
                        {d?.label ?? f}
                      </span>
                    );
                  })}
                  {data.clinicalFlags.map((f) => {
                    const d = describeFlag(f, "clinical");
                    if (!d) return null;
                    return (
                      <span
                        key={"c:" + f}
                        className={
                          "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border " +
                          (d.severity === "warning"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "bg-muted text-muted-foreground border-border")
                        }
                      >
                        {d.label}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Respostas do paciente
              </h2>
              <AnamnesisAnswersView rawJson={data.rawAnswersJson} />
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-20 self-start">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Notas clínicas
              </h2>
              {isApproved ? (
                <p className="text-xs text-muted-foreground italic">
                  {data.reviewNotes || "Sem notas registradas."}
                </p>
              ) : (
                <textarea
                  defaultValue={data.reviewNotes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações para o paciente ou registro interno…"
                  className="w-full min-h-[140px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-y"
                />
              )}

              {actionError && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1.5">
                  {actionError}
                </p>
              )}

              {isApproved ? (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1.5 flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 mt-0.5 shrink-0" />
                  <span>
                    Aprovada em{" "}
                    {data.approvedAt
                      ? new Date(data.approvedAt).toLocaleString("pt-BR")
                      : "—"}
                    . Versão imutável.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => mut.mutate("approved")}
                    disabled={mut.isPending}
                    className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {mut.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <CheckCircle2 className="size-4" /> Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => mut.mutate("needs_changes")}
                    disabled={mut.isPending}
                    className="w-full border border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-md py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    <AlertTriangle className="size-4" /> Pedir ajustes
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
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

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
