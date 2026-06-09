// removed unused useState import
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SubscriptionEditor } from "@/components/finance/SubscriptionEditor";
import { PhysicalAssessmentCard } from "@/components/patient/PhysicalAssessmentCard";
import { ProtocolDiagnosticCard } from "@/components/patient/ProtocolDiagnosticCard";
import { WaterCalculatorCard } from "@/components/patient/WaterCalculatorCard";
import { getPatientForNutritionist, setPatientActiveStatus } from "@/lib/patients/patient-detail.functions";
import { listPublishedPlansForPatient, getLatestPlanForPatient } from "@/lib/plans/plans.functions";
import { getAnamnesisForReview } from "@/lib/anamnesis/review.functions";
import { listPatientFeedbacks } from "@/lib/feedback/feedback.functions";
import { listPatientActiveProtocols } from "@/lib/protocols/active.functions";
import { adherenceLabel, resultLabel } from "@/lib/feedback/copy";
import { AnamnesisAnswersView } from "@/components/anamnesis/AnamnesisAnswersView";
import { VideoLoader } from "@/components/VideoLoader";
import { maskPhoneBR } from "@/lib/phone-mask";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  
  Mail,
  Phone,
  ClipboardList,
  Loader2,
  
  Eye,
  Pencil,
  AlertTriangle,
  Power,
  MessageSquareHeart,
  ChevronRight,
  Activity,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";

export const Route = createFileRoute("/_authenticated/patients/$id/")({
  head: () => ({ meta: [{ title: "Perfil do paciente — FitJourney" }] }),
  component: PatientProfile,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/patients" homeLabel="Lista de pacientes" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/patients" homeLabel="Lista de pacientes" />,
});

function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "P"
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function ageFromBirth(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function statusMeta(status: string | undefined) {
  switch (status) {
    case "approved":
      return { label: "Anamnese aprovada", cls: "text-emerald-400", dot: "bg-emerald-400" };
    case "submitted":
      return { label: "Anamnese pendente", cls: "text-primary", dot: "bg-primary" };
    case "needs_changes":
      return { label: "Requer ajustes", cls: "text-amber-400", dot: "bg-amber-400" };
    case "draft":
      return { label: "Rascunho em andamento", cls: "text-muted-foreground", dot: "bg-muted-foreground" };
    default:
      return { label: "Aguardando anamnese", cls: "text-amber-400", dot: "bg-amber-400" };
  }
}

function PatientProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getPatientForNutritionist);
  const fetchPlans = useServerFn(listPublishedPlansForPatient);
  const fetchAnamnesis = useServerFn(getAnamnesisForReview);
  const fetchFeedbacks = useServerFn(listPatientFeedbacks);
  const fetchActiveProtocols = useServerFn(listPatientActiveProtocols);
  const setActiveStatus = useServerFn(setPatientActiveStatus);

  const { data, isLoading, error } = useQuery({
    queryKey: ["patient-detail", id],
    queryFn: () => fetchDetail({ data: { patientId: id } }),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: publishedPlans } = useQuery({
    queryKey: ["patient-published-plans", id],
    queryFn: () => fetchPlans({ data: { patientId: id } }),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const fetchLatestPlan = useServerFn(getLatestPlanForPatient);
  const { data: latestPlan } = useQuery({
    queryKey: ["patient-latest-plan", id],
    queryFn: () => fetchLatestPlan({ data: { patientId: id } }),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const anamnesisId = data?.anamnesis?.id ?? null;
  const activeMutation = useMutation({
    mutationFn: (isActive: boolean) => setActiveStatus({ data: { patientId: id, isActive } }),
    onSuccess: async (result) => {
      toast.success(result.isActive ? "Paciente reativado." : "Paciente inativado.");
      await qc.invalidateQueries({ queryKey: ["patient-detail", id] });
      await qc.invalidateQueries({ queryKey: ["patients-index"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao atualizar status."),
  });
  const { data: anamnesisFull, isLoading: anamnesisLoading } = useQuery({
    queryKey: ["patient-anamnesis-full", anamnesisId],
    queryFn: () => fetchAnamnesis({ data: { anamnesisId: anamnesisId! } }),
    enabled: !!anamnesisId,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: patientFeedbacks } = useQuery({
    queryKey: ["patient-feedbacks", id],
    queryFn: () => fetchFeedbacks({ data: { patientId: id } }),
    staleTime: 10_000,
  });
  const { data: activeProtocolsData } = useQuery({
    queryKey: ["patient-active-protocols", id],
    queryFn: () => fetchActiveProtocols({ data: { patientId: id } }),
    staleTime: 10_000,
  });
  const activeProtocols = activeProtocolsData?.protocols ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <VideoLoader size="md" label="Carregando paciente…" />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="space-y-4">
          <p className="text-sm text-destructive">
            {(error as Error | undefined)?.message ?? "Paciente não encontrado."}
          </p>
          <Link to="/patients" className="text-xs font-mono uppercase text-primary hover:underline">
            ← Voltar para pacientes
          </Link>
        </div>
      </AppShell>
    );
  }

  const p = data;
  void ageFromBirth;
  const st = statusMeta(p.anamnesis?.reviewStatus);
  const hasApprovedAnamnesis = p.anamnesis?.reviewStatus === "approved";

  const hasPublishedPlan = (publishedPlans?.length ?? 0) > 0;

  return (
    <AppShell
      header={
        <button
          type="button"
          onClick={() => navigate({ to: "/patients" })}
          className="hidden min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground sm:flex"
        >
          <ArrowLeft className="size-3.5" />
          <span>Pacientes</span>
        </button>
      }
    >
      <div className="space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6 sm:gap-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={p.fullName}
                className="size-14 shrink-0 rounded-full border border-border object-cover sm:size-16"
              />
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-full border border-border bg-surface text-base font-mono sm:size-16 sm:text-lg">
                {initialsFromName(p.fullName)}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Paciente desde {formatDate(p.createdAt)}
              </p>
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{p.fullName}</h1>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span
                  className={
                    "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " + st.cls
                  }
                >
                  <span className={"size-1.5 rounded-full " + st.dot} />
                  {st.label}
                </span>
                <span className={"inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " + (p.isActive ? "text-emerald-400" : "text-muted-foreground")}>
                  <span className={"size-1.5 rounded-full " + (p.isActive ? "bg-emerald-400" : "bg-muted-foreground")} />
                  {p.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>

          {/* Ações do paciente — toolbar dedicada para não competir por espaço no header */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <button
              type="button"
              disabled={activeMutation.isPending}
              onClick={() => activeMutation.mutate(!p.isActive)}
              className={
                "flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 " +
                (p.isActive
                  ? "border-rose-700/40 text-rose-200 hover:bg-rose-900/20 hover:border-rose-700/60"
                  : "border-emerald-800/50 text-emerald-200 hover:bg-emerald-900/25 hover:border-emerald-700/70")
              }
            >
              {activeMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Power className="size-3.5" />}
              {p.isActive ? "Inativar" : "Reativar"}
            </button>
            {p.anamnesis && (
              <Link
                to="/anamneses/$id"
                params={{ id: p.anamnesis.id }}
                className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <ClipboardList className="size-3.5" />
                Ver anamnese
              </Link>
            )}
            <Link
              to="/templates"
              search={{ patientId: p.id, patientName: p.fullName }}
              className="col-span-2 sm:col-span-1 flex min-h-11 items-center justify-center gap-2 rounded-md border-2 border-[var(--gold)]/70 bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] px-4 py-2.5 text-xs font-bold tracking-wide text-[var(--gold)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_25%,transparent),0_6px_24px_-8px_color-mix(in_oklab,var(--gold)_45%,transparent)] hover:bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] hover:border-[var(--gold)] transition-all"
            >
              <Sparkles className="size-4" />
              Plano com Smart-templates
            </Link>
            <Link
              to="/templates"
              search={{ blank: 1, patientId: p.id, patientName: p.fullName }}
              className="col-span-2 sm:col-span-1 flex min-h-11 items-center justify-center gap-2 rounded-md border-2 border-[var(--gold)]/70 bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] px-4 py-2.5 text-xs font-bold tracking-wide text-[var(--gold)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_25%,transparent),0_6px_24px_-8px_color-mix(in_oklab,var(--gold)_45%,transparent)] hover:bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] hover:border-[var(--gold)] transition-all"
            >
              <FileText className="size-4" />
              {hasPublishedPlan ? "Novo plano com IA" : "Plano com IA FitJourney"}
            </Link>
            <Link
              to="/protocolos"
              search={{ patientId: p.id, patientName: p.fullName }}
              className="col-span-2 sm:col-span-1 flex min-h-11 items-center justify-center gap-2 rounded-md border-2 border-[var(--gold)]/70 bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] px-4 py-2.5 text-xs font-bold tracking-wide text-[var(--gold)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_25%,transparent),0_6px_24px_-8px_color-mix(in_oklab,var(--gold)_45%,transparent)] hover:bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] hover:border-[var(--gold)] transition-all"
            >
              <Sparkles className="size-4" />
              Aplicar Protocolo
            </Link>
          </div>
        </div>


        {/* Contato */}
        <section className="grid grid-cols-1 gap-6">
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4 sm:p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Contato · {p.isActive ? "Paciente ativo" : "Paciente inativo"}
            </p>
            <dl className="text-sm space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-all font-mono text-xs">{p.email}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs">{p.phone ? maskPhoneBR(p.phone) : "—"}</span>
              </div>
            </dl>
          </div>
        </section>

        {/* Status clínico — Plano alimentar + Protocolo ativo (visão rápida) */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Plano alimentar */}
          {(() => {
            const hasDraft = !!latestPlan && latestPlan.status === "draft";
            const showCard = hasPublishedPlan || hasDraft;
            const tone = hasPublishedPlan
              ? "border-emerald-500/40 bg-emerald-500/5"
              : hasDraft
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border bg-surface";
            return (
              <div className={"rounded-lg border p-5 space-y-2 " + tone}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Plano alimentar
                </p>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <FileText className={"size-4 " + (hasPublishedPlan ? "text-emerald-400" : hasDraft ? "text-amber-400" : "text-muted-foreground")} />
                  {hasPublishedPlan
                    ? (latestPlan?.title ?? "Plano ativo publicado")
                    : hasDraft
                      ? (latestPlan?.title ?? "Rascunho em andamento")
                      : "Sem plano publicado"}
                </h3>
                {hasPublishedPlan && publishedPlans && (
                  <p className="text-[11px] text-muted-foreground">
                    Publicado em {formatDate(publishedPlans[0].publishedAt)} · paciente já visualiza no app.
                  </p>
                )}
                {!hasPublishedPlan && hasDraft && (
                  <p className="text-[11px] text-muted-foreground">
                    Editado em {formatDate(latestPlan!.updatedAt)} · ainda não publicado para o paciente.
                  </p>
                )}
                {!showCard && (
                  <p className="text-[11px] text-muted-foreground">
                    Elabore um plano via template ou IA FitJourney.
                  </p>
                )}
                {showCard && (
                  <Link
                    to="/patients/$id/diet"
                    params={{ id: p.id }}
                    className={"inline-flex items-center gap-1.5 text-xs font-semibold pt-1 hover:underline " + (hasPublishedPlan ? "text-emerald-400" : "text-amber-400")}
                  >
                    <Pencil className="size-3" />
                    {hasPublishedPlan ? "Abrir e editar" : "Continuar editando"}
                  </Link>
                )}
              </div>
            );
          })()}

          {/* Protocolo ativo */}
          <div className={"rounded-lg border p-5 space-y-2 " + (activeProtocols.length > 0 ? "border-[var(--gold)]/50 bg-[color-mix(in_oklab,var(--gold)_6%,transparent)]" : "border-border bg-surface")}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Protocolo clínico
            </p>
            {activeProtocols.length === 0 ? (
              <>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  Nenhum protocolo ativo
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Aplique um protocolo clínico para guiar a evolução do paciente.
                </p>
                <Link
                  to="/protocolos"
                  search={{ patientId: p.id, patientName: p.fullName }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold)] hover:underline pt-1"
                >
                  <Sparkles className="size-3" /> Aplicar protocolo
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-[var(--gold)]" />
                  {activeProtocols.length} protocolo{activeProtocols.length > 1 ? "s" : ""} ativo{activeProtocols.length > 1 ? "s" : ""}
                </h3>
                <ul className="space-y-1.5 pt-1">
                  {activeProtocols.map((ap) => (
                    <li key={ap.id} className="text-xs">
                      <p className="font-semibold">{ap.protocol_name}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="size-3" />
                        {ap.module_name} · Fase: {ap.phase_snapshot?.name} · {ap.phase_snapshot?.durationWeeks}sem · iniciado {formatDate(ap.started_at)}
                      </p>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/protocolos"
                  search={{ patientId: p.id, patientName: p.fullName }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold)] hover:underline pt-1"
                >
                  <Sparkles className="size-3" /> Gerenciar protocolos
                </Link>
              </>
            )}
          </div>
        </section>



        {/* Anamnese clínica — visível no perfil + atalho para revisão/edição */}
        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Anamnese clínica
              </p>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="size-5 text-muted-foreground" />
                {hasApprovedAnamnesis
                  ? "Anamnese aprovada"
                  : p.anamnesis
                    ? st.label
                    : "Sem anamnese ainda"}
              </h3>
            </div>
            {p.anamnesis && (
              <Link
                to="/anamneses/$id"
                params={{ id: p.anamnesis.id }}
                className="text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md border border-primary/40 text-primary hover:bg-primary/10"
              >
                <Pencil className="size-3.5" />
                {hasApprovedAnamnesis ? "Revisar anamnese" : "Abrir para edição"}
              </Link>
            )}
          </div>

          {hasApprovedAnamnesis && (
            <div className="text-[11px] text-muted-foreground border-l-2 border-emerald-500/40 pl-3 py-1">
              Anamnese aprovada é imutável por contrato clínico. Para alterar,
              uma nova revisão é criada preservando todo o histórico.
            </div>
          )}

          {!p.anamnesis && (
            <p className="text-xs text-muted-foreground">
              Nenhuma anamnese foi iniciada para este paciente. Peça que ele
              acesse o app e preencha a anamnese clínica, ou crie em nome dele
              pelo módulo de Anamneses.
            </p>
          )}

          {p.anamnesis && anamnesisLoading && (
            <div className="py-4">
              <VideoLoader size="sm" label="Carregando respostas…" />
            </div>
          )}

          {p.anamnesis && anamnesisFull && !anamnesisLoading && (
            <details className="pt-2 group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary/40 hover:text-foreground transition-colors">
                <span className="flex items-center gap-2">
                  <Eye className="size-3.5" />
                  Ver respostas da anamnese
                </span>
                <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
              </summary>
              <div className="pt-4">
                <AnamnesisAnswersView rawJson={anamnesisFull.rawAnswersJson} />
              </div>
            </details>
          )}

          {p.anamnesis && !anamnesisLoading && !anamnesisFull && (
            <p className="text-xs text-amber-500 flex items-center gap-2">
              <AlertTriangle className="size-3.5" />
              Não foi possível carregar as respostas da anamnese.
            </p>
          )}
        </section>


        {/* Plano contratado */}
        <section>
          <SubscriptionEditor patientId={p.id} />
        </section>

        {/* Avaliação Física — entidade única com histórico */}
        <PhysicalAssessmentCard patientId={p.id} />

        {/* Hidratação personalizada — calculadora baseada no contexto clínico do paciente */}
        <WaterCalculatorCard patientId={p.id} />

        {/* Diagnóstico clínico × protocolo aplicado — informativo, não bloqueante */}
        <ProtocolDiagnosticCard patientId={p.id} />

        {/* Feedbacks do paciente — atalho + últimos 3 */}
        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Acompanhamento
              </p>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquareHeart className="size-5 text-primary" />
                Feedbacks ({patientFeedbacks?.length ?? 0})
              </h3>
            </div>
            <Link
              to="/patients/$id/feedbacks"
              params={{ id: p.id }}
              className="text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md border border-primary/40 text-primary hover:bg-primary/10"
            >
              <Pencil className="size-3.5" />
              Ver todos · editar · arquivar
            </Link>
          </div>

          {(!patientFeedbacks || patientFeedbacks.length === 0) ? (
            <p className="text-xs text-muted-foreground">
              Este paciente ainda não enviou nenhum feedback.
            </p>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
              {patientFeedbacks.slice(0, 3).map((f) => (
                <li key={f.id}>
                  <Link
                    to="/patients/$id/feedbacks"
                    params={{ id: p.id }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">
                        {new Date(f.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold tabular-nums">
                          {f.weightKg != null ? `${f.weightKg.toFixed(1)} kg` : "—"}
                        </span>
                        <span className="text-muted-foreground"> · {adherenceLabel(f.adherenceRating)} · {resultLabel(f.resultRating)}</span>
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>




        {/* Elaboração do plano */}
        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Elaboração do plano alimentar
              </p>
              <h3 className="text-lg font-semibold mt-1">
                {hasApprovedAnamnesis
                  ? "Pronto para elaborar"
                  : "Aguardando anamnese aprovada"}
              </h3>
            </div>
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            {hasApprovedAnamnesis
              ? "A anamnese clínica foi aprovada. Você pode escolher um template homologado ou montar do zero."
              : "Aprove a anamnese do paciente antes de elaborar o plano alimentar."}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <BuildPlanCTA patientId={p.id} patientName={p.fullName} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ============================================================
// CTA "Elaborar plano" — Sprint 6 Fatia A.1
// Substitui os dois botões antigos por um único fluxo com escolha
// explícita: Usar Template vs Montar por Tabela de Alimentos.
// ============================================================
function BuildPlanCTA({
  patientId,
  patientName,
}: {
  readonly patientId: string;
  readonly patientName: string;
}) {
  return (
    <>
      <Link
        to="/templates"
        search={{ patientId, patientName }}
        className="text-xs font-semibold py-2 px-3 inline-flex items-center gap-2 rounded-md border-2 border-[var(--gold)]/70 bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] text-[var(--gold)] hover:bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] hover:border-[var(--gold)] transition-all"
      >
        <Sparkles className="size-3.5" />
        Plano com Smart-templates
      </Link>
      <Link
        to="/templates"
        search={{ blank: 1, patientId, patientName }}
        className="bg-emerald-600 text-white text-xs font-semibold py-2 px-3 inline-flex items-center gap-2 rounded-md hover:bg-emerald-500"
      >
        <FileText className="size-3.5" />
        Plano com IA FitJourney
      </Link>
    </>
  );
}
