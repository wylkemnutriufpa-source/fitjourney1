import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { patients, type Goal } from "@/lib/mock-data";
import { Plus, Search, ArrowUpRight, FileText, Share2 } from "lucide-react";
import { OnlineInviteDialog } from "@/components/patients/OnlineInviteDialog";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({ meta: [{ title: "Pacientes — FitJourney" }] }),
  component: Patients,
});

const goals: ("Todos" | Goal)[] = ["Todos", "Performance", "Hipertrofia", "Emagrecimento", "Manutenção"];

function Patients() {
  const [q, setQ] = useState("");
  const [goal, setGoal] = useState<(typeof goals)[number]>("Todos");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const okQ = p.name.toLowerCase().includes(q.toLowerCase()) || p.sport.toLowerCase().includes(q.toLowerCase());
      const okG = goal === "Todos" || p.goal === goal;
      return okQ && okG;
    });
  }, [q, goal]);

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
              placeholder="Buscar por nome ou esporte..."
              className="w-full bg-surface border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 bg-surface border border-border rounded-md p-1">
            {goals.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={
                  "px-3 py-1.5 text-xs font-medium rounded transition-colors " +
                  (goal === g
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="text-left p-4 font-medium">Paciente</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Esporte</th>
                <th className="text-left p-4 font-medium">Objetivo</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">TDEE</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Última visita</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-background border border-border grid place-items-center text-[10px] font-mono">
                        {p.initials}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.age}a • {p.sex} • {p.weightKg}kg
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{p.sport}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-background border border-border">
                      {p.goal}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-muted-foreground hidden lg:table-cell">
                    {p.tdee} kcal
                  </td>
                  <td className="p-4 font-mono text-muted-foreground hidden lg:table-cell">
                    {p.lastVisit}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " +
                        (p.status === "Ativo" ? "text-emerald-400" : "text-amber-400")
                      }
                    >
                      <span
                        className={
                          "size-1.5 rounded-full " +
                          (p.status === "Ativo" ? "bg-emerald-400" : "bg-amber-400")
                        }
                      />
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/patients/$id"
                        params={{ id: p.id }}
                        className="size-8 grid place-items-center rounded hover:bg-background text-muted-foreground hover:text-foreground"
                        title="Ver perfil"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                      <Link
                        to="/patients/$id/diet"
                        params={{ id: p.id }}
                        className="size-8 grid place-items-center rounded hover:bg-background text-muted-foreground hover:text-primary"
                        title="Montar dieta"
                      >
                        <FileText className="size-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground text-sm">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <OnlineInviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </AppShell>
  );
}
