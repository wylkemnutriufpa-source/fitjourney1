import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SubscriptionEditor } from "@/components/finance/SubscriptionEditor";
import { PhysicalAssessmentCard } from "@/components/patient/PhysicalAssessmentCard";
import { getPatientForNutritionist, setPatientActiveStatus } from "@/lib/patients/patient-detail.functions";
import { listPublishedPlansForPatient } from "@/lib/plans/plans.functions";
import { getAnamnesisForReview } from "@/lib/anamnesis/review.functions";
import { listPatientFeedbacks } from "@/lib/feedback/feedback.functions";
import { adherenceLabel, resultLabel } from "@/lib/feedback/copy";
import { AnamnesisAnswersView } from "@/components/anamnesis/AnamnesisAnswersView";
import { VideoLoader } from "@/components/VideoLoader";
import { maskPhoneBR } from "@/lib/phone-mask";
import {
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";
  ArrowLeft,
  FileText,
  Sparkles,
  
  Mail,
  Phone,
  Calendar,
  Ruler,
  ClipboardList,
  Loader2,
  CheckCircle2,
  Eye,
  Pencil,
  AlertTriangle,
  Power,
  MessageSquareHeart,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

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
  const age = ageFromBirth(p.birthDate);
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
                  ? "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10")
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
            {hasPublishedPlan && (
              <Link
                to="/patients/$id/diet"
                params={{ id: p.id }}
                className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10"
              >
                <Eye className="size-3.5" />
                Ver plano vigente
              </Link>
            )}
            <Link
              to="/templates"
              search={{ blank: 1, patientId: p.id, patientName: p.fullName }}
              className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <Sparkles className="size-3.5" />
              Plano do zero
            </Link>
            <Link
              to="/templates"
              search={{ patientId: p.id, patientName: p.fullName }}
              className="flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="size-3.5" />
              {hasPublishedPlan ? "Novo plano" : "Elaborar plano"}
            </Link>
          </div>
        </div>


        {/* Dados básicos / contato */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="bg-surface border border-border rounded-lg p-5 space-y-4 sm:p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Dados básicos
            </p>
            <dl className="text-sm space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <Calendar className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 font-mono text-xs">
                  Nascimento: {formatDate(p.birthDate)}
                  {age != null && <span className="text-muted-foreground"> · {age} anos</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Ruler className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs">
                  Altura: {p.heightCm != null ? `${p.heightCm} cm` : "—"}
                </span>
              </div>
            </dl>
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
            <div className="pt-2">
              <AnamnesisAnswersView rawJson={anamnesisFull.rawAnswersJson} />
            </div>
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



        {/* Plano alimentar — entidade única, sem listar versões. */}
        {publishedPlans && publishedPlans.length > 0 && (
          <section className="bg-surface border border-emerald-500/30 rounded-lg p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                Plano alimentar
              </p>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-400" />
                Plano ativo · atualizado em {formatDate(publishedPlans[0].publishedAt)}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                O paciente já visualiza este plano no app.
              </p>
            </div>
            <Link
              to="/patients/$id/diet"
              params={{ id: p.id }}
              className="text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Pencil className="size-3.5" />
              Abrir e editar
            </Link>
          </section>
        )}

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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 inline-flex items-center gap-2 rounded-md hover:bg-primary/90"
      >
        <Sparkles className="size-3.5" />
        Elaborar plano
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="build-plan-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-lg p-6 w-full max-w-md space-y-4"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {patientName}
              </p>
              <h3 id="build-plan-title" className="text-lg font-semibold">
                Como você quer começar?
              </h3>
              <p className="text-xs text-muted-foreground">
                Escolha o ponto de partida. Você pode editar tudo depois.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate({
                  to: "/templates",
                  search: { patientId, patientName },
                });
              }}
              className="w-full text-left p-3 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 flex items-start gap-3 transition-colors"
            >
              <FileText className="size-4 mt-0.5 text-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Usar Template</p>
                <p className="text-[11px] text-muted-foreground">
                  Parta de um modelo pronto com refeições e blocos de
                  substituição já calculados.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate({
                  to: "/templates",
                  search: { blank: 1, patientId, patientName },
                });
              }}
              className="w-full text-left p-3 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 flex items-start gap-3 transition-colors"
            >
              <Sparkles className="size-4 mt-0.5 text-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">
                  Montar por Tabela de Alimentos
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Comece do zero escolhendo alimentos do catálogo. Próximo
                  passo: blocos de substituição automáticos.
                </p>
              </div>
            </button>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
