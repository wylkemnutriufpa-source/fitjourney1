import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SubscriptionEditor } from "@/components/finance/SubscriptionEditor";
import { PhysicalAssessmentCard } from "@/components/patient/PhysicalAssessmentCard";
import { getPatientForNutritionist } from "@/lib/patients/patient-detail.functions";
import { listPublishedPlansForPatient } from "@/lib/plans/plans.functions";
import { getAnamnesisForReview } from "@/lib/anamnesis/review.functions";
import { AnamnesisAnswersView } from "@/components/anamnesis/AnamnesisAnswersView";
import { VideoLoader } from "@/components/VideoLoader";
import {
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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/patients/$id/")({
  head: () => ({ meta: [{ title: "Perfil do paciente — FitJourney" }] }),
  component: PatientProfile,
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
  const fetchDetail = useServerFn(getPatientForNutritionist);
  const fetchPlans = useServerFn(listPublishedPlansForPatient);
  const fetchAnamnesis = useServerFn(getAnamnesisForReview);

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
  const { data: anamnesisFull, isLoading: anamnesisLoading } = useQuery({
    queryKey: ["patient-anamnesis-full", anamnesisId],
    queryFn: () => fetchAnamnesis({ data: { anamnesisId: anamnesisId! } }),
    enabled: !!anamnesisId,
    staleTime: 0,
    refetchOnMount: "always",
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
          className="text-xs font-medium py-2 px-3 flex items-center gap-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Pacientes</span>
        </button>
      }
    >
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-border pb-6 gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={p.fullName}
                className="size-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-16 rounded-full bg-surface border border-border grid place-items-center text-lg font-mono">
                {initialsFromName(p.fullName)}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Paciente desde {formatDate(p.createdAt)}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">{p.fullName}</h1>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span
                  className={
                    "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " + st.cls
                  }
                >
                  <span className={"size-1.5 rounded-full " + st.dot} />
                  {st.label}
                </span>
              </div>
            </div>
          </div>

          {/* Ações do paciente — toolbar dedicada para não competir por espaço no header */}
          <div className="flex items-center gap-2 flex-wrap">
            {p.anamnesis && (
              <Link
                to="/anamneses/$id"
                params={{ id: p.anamnesis.id }}
                className="text-xs font-medium py-2 px-3 flex items-center gap-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              >
                <ClipboardList className="size-3.5" />
                Ver anamnese
              </Link>
            )}
            {hasPublishedPlan && (
              <Link
                to="/patients/$id/diet"
                params={{ id: p.id }}
                className="text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Eye className="size-3.5" />
                Ver plano vigente
              </Link>
            )}
            <Link
              to="/templates"
              search={{ blank: 1, patientId: p.id, patientName: p.fullName }}
              className="text-xs font-medium py-2 px-3 flex items-center gap-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <Sparkles className="size-3.5" />
              Plano do zero
            </Link>
            <Link
              to="/templates"
              search={{ patientId: p.id, patientName: p.fullName }}
              className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
            >
              <FileText className="size-3.5" />
              {hasPublishedPlan ? "Novo plano" : "Elaborar plano"}
            </Link>
          </div>
        </div>


        {/* Dados básicos / contato */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Contato
            </p>
            <dl className="text-sm space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="font-mono text-xs">{p.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <span className="font-mono text-xs">{p.phone ?? "—"}</span>
              </div>
            </dl>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Dados básicos
            </p>
            <dl className="text-sm space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="font-mono text-xs">
                  Nascimento: {formatDate(p.birthDate)}
                  {age != null && <span className="text-muted-foreground"> · {age} anos</span>}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Ruler className="size-4 text-muted-foreground" />
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
            <Link
              to="/templates"
              search={{ patientId: p.id, patientName: p.fullName }}
              className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
            >
              <FileText className="size-3.5" />
              Usar template
            </Link>
            <Link
              to="/templates"
              search={{ blank: 1, patientId: p.id, patientName: p.fullName }}
              className="text-xs font-medium py-2 px-3 flex items-center gap-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <Sparkles className="size-3.5" />
              Montar do zero
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
