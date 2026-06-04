import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ensureDraftPlanForPatient, listMyPatientsForPlan } from "@/lib/plans/plans.functions";
import { setPatientActiveStatus } from "@/lib/patients/patient-detail.functions";
import { Plus, Search, FileText, Share2, Power } from "lucide-react";
import { OnlineInviteDialog } from "@/components/patients/OnlineInviteDialog";
import { VideoLoader } from "@/components/VideoLoader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({ meta: [{ title: "Pacientes — FitJourney" }] }),
  validateSearch: (search: Record<string, unknown>): { filter?: PatientFilter } => ({
    filter: isPatientFilter(search.filter) ? search.filter : undefined,
  }),
  component: Patients,
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

  const openPrePlan = async (patientId: string) => {
    if (openingDraftFor) return;
    setOpeningDraftFor(patientId);
    try {
      const draft = await ensureDraft({ data: { patientId } });
      window.location.assign(`/templates?draftPlanId=${encodeURIComponent(draft.planId)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar pré-plano.");
    } finally {
      setOpeningDraftFor(null);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients.filter((p) => {
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
  }, [patients, q, filter]);

  return (
    <AppShell
      header={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="bg-surface border border-border text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:border-primary hover:text-primary transition-colors"
          >
            <Share2 className="size-3.5" />
            ONLINE
          </button>
          <Link
            to="/patients/new"
            className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="bg-surface border border-primary/40 text-primary text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Share2 className="size-3.5" />
              Convite Online
            </button>
            <Link
              to="/patients/new"
              className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              Adicionar Paciente
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full bg-surface border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
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
                    {p.phone ?? "Sem telefone"}
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
                        <a
                          href={p.autoDraft ? `/templates?draftPlanId=${encodeURIComponent(p.autoDraft.planId)}` : "#"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!p.autoDraft) {
                              e.preventDefault();
                              void openPrePlan(p.id);
                            }
                          }}
                          aria-disabled={openingDraftFor === p.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase text-primary hover:text-primary/80 transition-colors"
                          title={p.autoDraft?.reason ?? "Gerar ou abrir pré-plano sugerido"}
                        >
                          <span className="size-1.5 rounded-full bg-primary" />
                          {openingDraftFor === p.id ? "Abrindo pré-plano…" : p.autoDraft ? "Abrir pré-plano" : "Gerar pré-plano"}
                          {p.autoDraft?.templateName && (
                            <span className="text-muted-foreground normal-case font-normal">
                              · {p.autoDraft.templateName}
                            </span>
                          )}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        disabled={activeMutation.isPending}
                        onClick={() => activeMutation.mutate({ patientId: p.id, isActive: !p.isActive })}
                        className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-50"
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
        className="md:hidden fixed bottom-4 right-4 z-30 bg-primary text-primary-foreground text-xs font-semibold py-3 px-4 flex items-center gap-2 rounded-full shadow-lg shadow-primary/25 hover:bg-primary/90"
      >
        <Share2 className="size-4" />
        Convite Online
      </button>
      <OnlineInviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </AppShell>
  );
}
