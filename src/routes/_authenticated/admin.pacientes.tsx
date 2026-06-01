import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllPatients } from "@/lib/admin/admin.functions";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/pacientes")({
  component: AdminPatientsPage,
});

function AdminPatientsPage() {
  const fetchAll = useServerFn(listAllPatients);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "all-patients"],
    queryFn: () => fetchAll(),
  });
  const [q, setQ] = useState("");
  const [nutriFilter, setNutriFilter] = useState<string>("");

  const nutris = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of data ?? []) {
      if (p.nutritionist_id && p.nutritionist_name) {
        map.set(p.nutritionist_id, p.nutritionist_name);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (nutriFilter && p.nutritionist_id !== nutriFilter) return false;
      if (!lower) return true;
      return (
        p.full_name.toLowerCase().includes(lower) ||
        p.email.toLowerCase().includes(lower)
      );
    });
  }, [data, q, nutriFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nome ou email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={nutriFilter}
          onChange={(e) => setNutriFilter(e.target.value)}
          className="text-sm border border-border rounded-md px-3 bg-background"
        >
          <option value="">Todos os profissionais</option>
          {nutris.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-muted-foreground">
        {isLoading ? "Carregando..." : `${filtered.length} de ${data?.length ?? 0} pacientes`}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Profissional</th>
              <th className="text-left px-4 py-2">Origem</th>
              <th className="text-left px-4 py-2">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-4 py-2 font-medium">{p.full_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-2">
                  {p.nutritionist_name ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2">
                  {p.source_legacy_id ? (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      FJ1
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">FJ2</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground font-mono">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum paciente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
