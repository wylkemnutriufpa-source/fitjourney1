import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ensureDraftPlanForPatient, listMyPatientsForPlan } from "@/lib/plans/plans.functions";
import { setPatientActiveStatus } from "@/lib/patients/patient-detail.functions";
import { deletePatientAsNutritionist } from "@/lib/admin/admin.functions";
import { Plus, Search, FileText, Share2, Power, Phone, Trash2 } from "lucide-react";
import { OnlineInviteDialog } from "@/components/patients/OnlineInviteDialog";
import { VideoLoader } from "@/components/VideoLoader";
import { maskPhoneBR } from "@/lib/phone-mask";
import { toast } from "sonner";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({ meta: [{ title: "Pacientes — FitJourney" }] }),
  validateSearch: (search: Record<string, unknown>): { filter?: PatientFilter } => ({
    filter: isPatientFilter(search.filter) ? search.filter : undefined,
  }),
  component: Patients,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/dashboard" homeLabel="Dashboard" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/dashboard" homeLabel="Dashboard" />,
});

type PatientFilter = "all" | "approved" | "anamnesis_pending" | "plans_delivered";

function isPatientFilter(value: unknown): value is PatientFilter {
  return (
    value === "all" ||
    value === "approved" ||
    value === "anamnesis_pending" ||
    value === "plans_delivered"
  );
}

const filterTabs: Array<{ id: PatientFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "approved", label: "Anamnese aprovada" },
  { id: "anamnesis_pending", label: "Anamnese pendente" },
  { id: "plans_delivered", label: "Com plano publicado" },
];

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}

function anamnesisStatusMeta(status: string): { label: string; cls: string; dot: string } {
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

function Patients() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const fetchPatients = useServerFn(listMyPatientsForPlan);
  const ensureDraft = useServerFn(ensureDraftPlanForPatient);
  const setActiveStatus = useServerFn(setPatientActiveStatus);
  const deletePatientFn = useServerFn(deletePatientAsNutritionist);
  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ["patients-index"],
    queryFn: () => fetchPatients(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<PatientFilter>(search.filter ?? "all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [openingDraftFor, setOpeningDraftFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; email: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const activeMutation = useMutation({
    mutationFn: ({ patientId, isActive }: { patientId: string; isActive: boolean }) =>
      setActiveStatus({ data: { patientId, isActive } }),
    onSuccess: async (_result, vars) => {
      toast.success(vars.isActive ? "Paciente reativado." : "Paciente inativado.");
      await qc.invalidateQueries({ queryKey: ["patients-index"] });
      await qc.invalidateQueries({ queryKey: ["patient-detail", vars.patientId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao atualizar status."),
  });
  const deleteMutation = useMutation({
    mutationFn: (patientId: string) => deletePatientFn({ data: { patient_id: patientId } }),
    onSuccess: async () => {
      toast.success("Paciente excluído permanentemente.");
      setConfirmDelete(null);
      setDeleteInput("");
      await qc.invalidateQueries({ queryKey: ["patients-index"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao excluir paciente."),
  });


  const openPrePlan = async (patientId: string) => {
    if (openingDraftFor) return;
    setOpeningDraftFor(patientId);
    try {
      const draft = await ensureDraft({ data: { patientId } });
      navigate({ to: "/templates", search: { draftPlanId: draft.planId } as any });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar pré-plano.");
    } finally {
      setOpeningDraftFor(null);
    }
  };

  const openExistingDraft = (draftPlanId: string) => {
    navigate({ to: "/templates", search: { draftPlanId } as any });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = patients.filter((p) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "approved" && p.anamnesisStatus === "approved") ||
        (filter === "anamnesis_pending" && p.anamnesisStatus === "submitted") ||
        (filter === "plans_delivered" && p.planStatus === "delivered");
      if (!matchesFilter) return false;
      if (!term) return true;
      return (
        p.fullName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.phone ?? "").toLowerCase().includes(term)
      );
    });
    // Pacientes inativos vão para o final da lista, mantendo ordem original entre iguais.
    return list.slice().sort((a, b) => {
      const aActive = a.isActive === false ? 1 : 0;
      const bActive = b.isActive === false ? 1 : 0;
      return aActive - bActive;
    });
  }, [patients, q, filter]);

  return (
    <AppShell
      header={
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            <Share2 className="size-3.5" />
            ONLINE
          </button>
          <Link
            to="/patients/new"
            className="flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Adicionar Paciente
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Base ativa
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
            <p className="text-xs font-mono text-muted-foreground">
              {filtered.length} de {patients.length} resultados
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-primary/40 bg-surface px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:flex-none"
            >
              <Share2 className="size-3.5" />
              Convite Online
            </button>
            <Link
              to="/patients/new"
              className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none"
            >
              <Plus className="size-3.5" />
              Adicionar Paciente
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full bg-surface border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id);
                  navigate({
                    to: "/patients",
                    search: tab.id === "all" ? {} : { filter: tab.id },
                    replace: true,
                  });
                }}
                className={
                  "rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors " +
                  (active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3 pb-20 md:hidden">
          {isLoading && (
            <div className="rounded-lg border border-border bg-surface p-8">
              <VideoLoader size="md" label="Carregando pacientes…" />
            </div>
          )}
          {error && !isLoading && (
            <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-destructive">
              Erro ao carregar pacientes reais.
            </div>
          )}
          {!isLoading && !error && filtered.map((p) => {
            const statusMeta = anamnesisStatusMeta(p.anamnesisStatus);
            return (
              <div
                key={p.id}
                className="rounded-lg border border-border bg-surface p-4 space-y-4"
              >
                <Link to="/patients/$id" params={{ id: p.id }} className={"flex min-w-0 items-start gap-3 " + (!p.isActive ? "opacity-60" : "")}>
                  <div className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-background text-[10px] font-mono">
                    {initialsFromName(p.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.fullName}</p>
                    <p className="truncate text-xs font-mono text-muted-foreground">{p.email}</p>
                    {p.phone && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-mono text-muted-foreground">
                        <Phone className="size-3 shrink-0" />
                        {maskPhoneBR(p.phone)}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] font-mono uppercase text-muted-foreground">
                      Cadastro {formatDate(p.createdAt)}
                    </p>
                  </div>
                </Link>
                <div className={"flex flex-wrap gap-2 " + (!p.isActive ? "opacity-60" : "")}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[10px] font-mono uppercase ${statusMeta.cls}`}>
                    <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </span>
                  <span className={"inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[10px] font-mono uppercase " + (p.isActive ? "text-emerald-400" : "text-muted-foreground")}>
                    <span className={"size-1.5 rounded-full " + (p.isActive ? "bg-emerald-400" : "bg-muted-foreground")} />
                    {p.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <span className={"inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[10px] font-mono uppercase " + (p.planStatus === "delivered" ? "text-emerald-400" : "text-amber-400")}>
                    <span className={"size-1.5 rounded-full " + (p.planStatus === "delivered" ? "bg-emerald-400" : "bg-amber-400")} />
                    {p.planStatus === "delivered" ? "Com plano" : "Sem plano"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={activeMutation.isPending}
                    onClick={() => activeMutation.mutate({ patientId: p.id, isActive: !p.isActive })}
                    className={
                      "flex min-h-10 items-center justify-center gap-2 rounded-md border text-xs font-semibold disabled:opacity-50 " +
                      (p.isActive
                        ? "border-rose-500/30 text-rose-300/90 hover:bg-rose-500/10 hover:border-rose-500/50"
                        : "border-emerald-500/30 text-emerald-300/90 hover:bg-emerald-500/10 hover:border-emerald-500/50")
                    }
                  >
                    <Power className="size-4" />
                    {p.isActive ? "Inativar" : "Reativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete({ id: p.id, name: p.fullName, email: p.email }); setDeleteInput(""); }}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                    title="Excluir paciente permanentemente"
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </button>
                  <Link
                    to="/patients/$id"
                    params={{ id: p.id }}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <FileText className="size-4" />
                    Perfil
                  </Link>
                </div>

              </div>
            );
          })}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              Nenhum paciente encontrado.
            </div>
          )}
        </div>

        <div className="hidden bg-surface border border-border rounded-lg overflow-hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="text-left p-4 font-medium">Paciente</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Contato</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Cadastro</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <VideoLoader size="md" label="Carregando pacientes…" />
                  </td>
                </tr>
              )}
              {error && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-destructive text-sm">
                    Erro ao carregar pacientes reais.
                  </td>
                </tr>
              )}
              {!isLoading && !error && filtered.map((p) => {
                const statusMeta = anamnesisStatusMeta(p.anamnesisStatus);
                return (
                <tr
                  key={p.id}
                  onClick={() => navigate({ to: "/patients/$id", params: { id: p.id } })}
                  className={"border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer " + (!p.isActive ? "opacity-60" : "")}
                >
                  <td className="p-4">
                    <Link
                      to="/patients/$id"
                      params={{ id: p.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 group"
                    >
                      <div className="size-9 rounded-full bg-background border border-border grid place-items-center text-[10px] font-mono">
                        {initialsFromName(p.fullName)}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {p.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-muted-foreground hidden md:table-cell">
                    {p.phone ? maskPhoneBR(p.phone) : "Sem telefone"}
                  </td>
                  <td className="p-4 font-mono text-muted-foreground hidden lg:table-cell">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase ${statusMeta.cls}`}>
                        <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                      <span className={"inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " + (p.isActive ? "text-emerald-400" : "text-muted-foreground")}>
                        <span className={"size-1.5 rounded-full " + (p.isActive ? "bg-emerald-400" : "bg-muted-foreground")} />
                        {p.isActive ? "Ativo" : "Inativo"}
                      </span>
                      <span className={
                        "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " +
                        (p.planStatus === "delivered" ? "text-emerald-400" : "text-amber-400")
                      }>
                        <span className={"size-1.5 rounded-full " + (p.planStatus === "delivered" ? "bg-emerald-400" : "bg-amber-400")} />
                        {p.planStatus === "delivered" ? "Com plano" : "Sem plano"}
                      </span>
                      {p.anamnesisStatus === "approved" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (p.autoDraft) {
                              openExistingDraft(p.autoDraft.planId);
                            } else {
                              void openPrePlan(p.id);
                            }
                          }}
                          disabled={openingDraftFor === p.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                          title={p.autoDraft?.reason ?? "Gerar ou abrir pré-plano sugerido"}
                        >
                          <span className="size-1.5 rounded-full bg-primary" />
                          {openingDraftFor === p.id ? "Abrindo pré-plano…" : p.autoDraft ? "Abrir pré-plano" : "Gerar pré-plano"}
                          {p.autoDraft?.templateName && (
                            <span className="text-muted-foreground normal-case font-normal">
                              · {p.autoDraft.templateName}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        disabled={activeMutation.isPending}
                        onClick={() => activeMutation.mutate({ patientId: p.id, isActive: !p.isActive })}
                        className={
                          "size-8 grid place-items-center rounded disabled:opacity-50 " +
                          (p.isActive
                            ? "text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10"
                            : "text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10")
                        }
                        title={p.isActive ? "Inativar paciente" : "Reativar paciente"}
                      >
                        <Power className="size-4" />
                      </button>
                      <Link
                        to="/patients/$id"
                        params={{ id: p.id }}
                        className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        title="Abrir perfil do paciente"
                      >
                        <FileText className="size-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setInviteOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:hidden"
      >
        <Share2 className="size-4" />
        Convite Online
      </button>
      <OnlineInviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </AppShell>
  );
}
