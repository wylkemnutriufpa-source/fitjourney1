// Nutri — visualiza o plano vigente do paciente (read-only) + histórico
// de planos publicados. Snapshot V3 é IMUTÁVEL após published_at.
// Para editar: publica nova versão a partir de um template (CTA → /templates).
//
// Invariantes respeitadas:
//   - Render BURRO: lê snapshot.meals direto, sem normalizar / hidratar /
//     recalcular.
//   - Patient App read-only (esta tela é a visão do NUTRI, mas sobre o
//     mesmo snapshot que o paciente vê — mesma fonte, mesma forma).
//   - Pipeline soberano: edição clínica acontece ANTES da publicação,
//     no fluxo de template em /templates.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  FileText,
  History,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import {
  listPatientPlansForNutri,
  type PatientPlanFull,
  type PatientPlanSummary,
} from "@/lib/plans/patient-plan.functions";
import { getPatientForNutritionist } from "@/lib/patients/patient-detail.functions";

export const Route = createFileRoute("/_authenticated/patients/$id/diet")({
  head: () => ({ meta: [{ title: "Plano do paciente — FitJourney" }] }),
  component: PatientPlanPage,
});

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function PatientPlanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const fetchPlans = useServerFn(listPatientPlansForNutri);
  const fetchDetail = useServerFn(getPatientForNutritionist);

  const { data: detail } = useQuery({
    queryKey: ["patient-detail", id],
    queryFn: () => fetchDetail({ data: { patientId: id } }),
    staleTime: 30_000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["patient-plans", id],
    queryFn: () => fetchPlans({ data: { patientId: id } }),
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  const patientName = detail?.patient?.full_name ?? "Paciente";

  function publishNew() {
    navigate({
      to: "/templates",
      search: { patientId: id, patientName },
    });
  }

  return (
    <AppShell
      header={
        <div className="flex gap-2">
          <Button size="sm" onClick={publishNew}>
            <Send className="size-3.5" />
            Publicar novo plano
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <Link
            to="/patients/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Voltar ao perfil
          </Link>
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {patientName}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                Plano do paciente
              </h1>
              <p className="text-xs text-muted-foreground">
                Snapshot publicado é imutável. Para alterar, publique uma nova
                versão a partir de um template.
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando planos…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            Erro ao carregar planos: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {data.active ? (
              <ActivePlanView plan={data.active} />
            ) : (
              <EmptyPlanState onPublish={publishNew} />
            )}

            {data.history.length > 0 && (
              <HistoryList history={data.history} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyPlanState({ onPublish }: { readonly onPublish: () => void }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-lg p-10 text-center space-y-4">
      <div className="mx-auto size-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30">
        <Sparkles className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Sem plano publicado</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Este paciente ainda não tem um plano vigente. Escolha um template e
          publique para que ele apareça no app do paciente.
        </p>
      </div>
      <Button onClick={onPublish}>
        <Send className="size-3.5" />
        Publicar a partir de um template
      </Button>
    </div>
  );
}

function ActivePlanView({ plan }: { readonly plan: PatientPlanFull }) {
  const snap: any = plan.snapshot ?? {};
  const meals: any[] = Array.isArray(snap.meals) ? snap.meals : [];
  const totalKcal: number = meals.reduce((acc, m) => {
    const items: any[] = Array.isArray(m?.main?.items) ? m.main.items : [];
    return (
      acc +
      items.reduce(
        (s, it) => s + (Number.isFinite(it?.kcal) ? Number(it.kcal) : 0),
        0,
      )
    );
  }, 0);
  const review = snap.clinical_review;
  const audit = snap.clinicalAudit;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Plano vigente</h2>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Publicado
          </span>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {formatDateTime(plan.publishedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Snapshot sem refeições.
            </p>
          ) : (
            meals.map((m: any, i: number) => {
              const items: any[] = Array.isArray(m?.main?.items)
                ? m.main.items
                : [];
              const kcal = items.reduce(
                (s, it) =>
                  s + (Number.isFinite(it?.kcal) ? Number(it.kcal) : 0),
                0,
              );
              return (
                <div
                  key={(m?.id ?? "") + i}
                  className="bg-surface border border-border rounded-lg p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3" />
                        {m?.time ?? "—"} · {m?.label ?? "—"}
                      </p>
                      <h3 className="font-semibold">
                        {m?.main?.title ?? "Refeição"}
                      </h3>
                    </div>
                    <span className="text-sm font-mono text-primary whitespace-nowrap">
                      {Math.round(kcal)} kcal
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((it: any, j: number) => (
                      <li
                        key={(it?.id ?? "") + j}
                        className="flex justify-between text-sm"
                      >
                        <span>{it?.name ?? "—"}</span>
                        <span className="font-mono text-muted-foreground text-xs">
                          {it?.qty ?? ""} {it?.unit ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {Array.isArray(m?.equivalents) &&
                    m.equivalents.length > 0 && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-2 border-t border-border">
                        {m.equivalents.length} opções equivalentes
                      </p>
                    )}
                </div>
              );
            })
          )}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Totais do snapshot
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono text-primary uppercase">
                  Kcal
                </span>
                <span className="text-3xl font-bold font-mono text-primary">
                  {Math.round(totalKcal)}
                </span>
              </div>
              {audit?.engineOutput?.target && (
                <div className="pt-3 border-t border-border space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Alvo clínico (motor)
                  </p>
                  <p className="text-xs font-mono">
                    {audit.engineOutput.target.kcal} kcal · P{" "}
                    {audit.engineOutput.target.proteinG}g · C{" "}
                    {audit.engineOutput.target.carbG}g · G{" "}
                    {audit.engineOutput.target.fatG}g
                  </p>
                </div>
              )}
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-2 border-t border-border">
                {meals.length} refeições
              </p>
            </div>

            {review?.clinical_warnings?.length > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs space-y-1">
                <p className="font-medium text-amber-400">Observações</p>
                <ul className="space-y-1 text-amber-200/90">
                  {review.clinical_warnings.map((w: string, i: number) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function HistoryList({
  history,
}: {
  readonly history: PatientPlanSummary[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <History className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Histórico de planos</h2>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {history.length} versão{history.length === 1 ? "" : "es"}
        </span>
      </div>
      <ul className="space-y-2">
        {history.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between bg-surface border border-border rounded-md px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Publicado
              </span>
              <span className="font-mono text-xs">
                {formatDateTime(p.publishedAt)}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              v{p.schemaVersion}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
