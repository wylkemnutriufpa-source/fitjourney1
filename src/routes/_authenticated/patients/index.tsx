import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listMyPatientsForPlan } from "@/lib/plans/plans.functions";
import { Plus, Search, FileText, Share2, Loader2 } from "lucide-react";
import { OnlineInviteDialog } from "@/components/patients/OnlineInviteDialog";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({ meta: [{ title: "Pacientes — FitJourney" }] }),
  component: Patients,
});

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

function Patients() {
  const fetchPatients = useServerFn(listMyPatientsForPlan);
  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ["patients-index"],
    queryFn: () => fetchPatients(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const [q, setQ] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients.filter((p) => {
      if (!term) return true;
      return (
        p.fullName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.phone ?? "").toLowerCase().includes(term)
      );
    });
  }, [patients, q]);

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
                  <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">
                    <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                    Carregando pacientes…
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
                const hasAnamnesis = p.anamnesisStatus !== "none";
                return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-background border border-border grid place-items-center text-[10px] font-mono">
                        {initialsFromName(p.fullName)}
                      </div>
                      <div>
                        <p className="font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-muted-foreground hidden md:table-cell">
                    {p.phone ?? "Sem telefone"}
                  </td>
                  <td className="p-4 font-mono text-muted-foreground hidden lg:table-cell">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase ${statusMeta.cls}`}>
                      <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {hasAnamnesis ? (
                        <Link
                          to="/anamneses/$id"
                          params={{ id: "" }}
                          search={{} as never}
                          // Quick view: usa rota da anamnese vinculada via paciente.
                          // Atalho usa primeira anamnese pendente/aprovada.
                          className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground"
                          title="Abrir anamnese"
                          onClick={(e) => {
                            // Sem id direto aqui; redireciona para fila filtrando por paciente.
                            e.preventDefault();
                            window.location.href = `/anamneses`;
                          }}
                        >
                          <FileText className="size-4" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="size-8 grid place-items-center rounded text-muted-foreground/50 cursor-not-allowed"
                          title="Disponível após anamnese"
                        >
                          <FileText className="size-4" />
                        </button>
                      )}
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
