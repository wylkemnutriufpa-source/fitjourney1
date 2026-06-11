import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLeads, deleteLead, type LandingLead } from "@/lib/landing/leads.functions";
import { Trash2, Mail, MessageCircle, Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function getFunnelUrl() {
  if (typeof window !== "undefined") return `${window.location.origin}/pacientes`;
  return "/pacientes";
}

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: LeadsPage,
});

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function toCsv(rows: LandingLead[]) {
  const header = ["Data", "Nome", "Email", "WhatsApp", "Origem"];
  const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        escape(fmtDate(r.created_at)),
        escape(r.full_name),
        escape(r.email),
        escape(r.whatsapp),
        escape(r.source),
      ].join(",")
    );
  }
  return lines.join("\n");
}

function LeadsPage() {
  const fetchLeads = useServerFn(listLeads);
  const removeLead = useServerFn(deleteLead);
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: () => fetchLeads(),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeLead({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast.success("Lead removido");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });

  function exportCsv() {
    const csv = toCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitjourney-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Leads da landing page</h2>
          <p className="text-sm text-muted-foreground">
            Contatos capturados pelo modal premium após a intro.{" "}
            <span className="font-medium text-foreground">{leads.length}</span> no total.
          </p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
            Funil de diagnóstico
          </p>
          <p className="text-sm font-medium truncate">{getFunnelUrl()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compartilhe este link — cada conclusão gera um lead automaticamente.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(getFunnelUrl());
              toast.success("Link copiado!");
            }}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition"
          >
            <Copy className="size-3.5" /> Copiar
          </button>
          <a
            href="/pacientes"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            <ExternalLink className="size-3.5" /> Abrir
          </a>
        </div>
      </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={leads.length === 0}
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md border border-border hover:bg-muted transition disabled:opacity-50"
        >
          <Download className="size-3.5" /> Exportar CSV
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum lead capturado ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Contato</th>
                <th className="text-left px-4 py-3">Origem</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((l) => {
                const waLink = `https://wa.me/${l.whatsapp.replace(/\D/g, "")}`;
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(l.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium">{l.full_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <a
                          href={`mailto:${l.email}`}
                          className="inline-flex items-center gap-1.5 text-xs hover:text-primary transition"
                        >
                          <Mail className="size-3" /> {l.email}
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs hover:text-primary transition"
                        >
                          <MessageCircle className="size-3" /> {l.whatsapp}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {l.source}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remover lead "${l.full_name}"?`)) {
                            del.mutate(l.id);
                          }
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        aria-label="Remover"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
