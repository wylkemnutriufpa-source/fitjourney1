import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, Save, X, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminListTriggers,
  adminUpsertTrigger,
  adminDeleteTrigger,
  type TriggerDTO,
} from "@/lib/diagnostic/diagnostic.functions";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";

export const Route = createFileRoute("/_authenticated/admin/diagnostico")({
  head: () => ({ meta: [{ title: "Biblioteca de Gatilhos — FitJourney" }] }),
  component: AdminDiagnosticoPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/admin" homeLabel="Admin" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/admin" homeLabel="Admin" />,
});

type Editing = Partial<TriggerDTO> & { fraseDraft?: string };

function AdminDiagnosticoPage() {
  const list = useServerFn(adminListTriggers);
  const upsert = useServerFn(adminUpsertTrigger);
  const del = useServerFn(adminDeleteTrigger);

  const [items, setItems] = useState<TriggerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await list());
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!editing) return;
    setErr(null);
    setSaving(true);
    try {
      await upsert({
        data: {
          id: editing.id,
          slug: (editing.slug ?? "").trim(),
          nome: (editing.nome ?? "").trim(),
          prioridade: Number(editing.prioridade ?? 5),
          ativo: editing.ativo ?? true,
          frases: (editing.frases ?? []).map((f) => f.trim()).filter(Boolean),
        },
      });
      setEditing(null);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este gatilho? Esta ação não pode ser desfeita.")) return;
    try {
      await del({ data: { id } });
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao excluir.");
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl space-y-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Admin
          </Link>
        </div>
        <header className="space-y-2 border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Biblioteca clínica
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Gatilhos & Frases do Diagnóstico
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Banco de gatilhos que alimenta o diagnóstico gratuito da landing
            de pacientes. Cada gatilho deve ter pelo menos 2-3 frases — o
            sistema sorteia uma para evitar respostas robóticas. Use{" "}
            <code className="px-1 py-0.5 rounded bg-muted text-xs">
              {"{diferencaKg}"}
            </code>{" "}
            ou{" "}
            <code className="px-1 py-0.5 rounded bg-muted text-xs">
              {"{imc}"}
            </code>{" "}
            para variáveis automáticas.
          </p>
        </header>

        {err && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
            {err}
          </p>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {items.length} gatilho{items.length !== 1 ? "s" : ""}
          </span>
          <Button
            onClick={() =>
              setEditing({
                slug: "",
                nome: "",
                prioridade: 5,
                ativo: true,
                frases: [""],
              })
            }
            className="gradient-primary text-primary-foreground rounded-full"
          >
            <Plus className="size-4 mr-1" /> Novo gatilho
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-2">
            {items.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{t.nome}</span>
                      <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.slug}
                      </code>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        prio {t.prioridade}
                      </span>
                      {!t.ativo && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.frases.length} frase{t.frases.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing({ ...t })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
            <div className="bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editing.id ? "Editar gatilho" : "Novo gatilho"}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium">
                    Slug (a-z, números, _)
                  </span>
                  <Input
                    value={editing.slug ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: e.target.value })
                    }
                    placeholder="hipertensao"
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium">Prioridade</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editing.prioridade ?? 5}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        prioridade: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium">Nome amigável</span>
                <Input
                  value={editing.nome ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, nome: e.target.value })
                  }
                  className="mt-1"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.ativo ?? true}
                  onChange={(e) =>
                    setEditing({ ...editing, ativo: e.target.checked })
                  }
                />
                Ativo (aparece no diagnóstico)
              </label>

              <div>
                <p className="text-xs font-medium mb-2">
                  Frases ({(editing.frases ?? []).length})
                </p>
                <div className="space-y-2">
                  {(editing.frases ?? []).map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <Textarea
                        value={f}
                        onChange={(e) => {
                          const next = [...(editing.frases ?? [])];
                          next[i] = e.target.value;
                          setEditing({ ...editing, frases: next });
                        }}
                        rows={2}
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            frases: (editing.frases ?? []).filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      frases: [...(editing.frases ?? []), ""],
                    })
                  }
                  className="mt-2"
                >
                  <Plus className="size-3.5 mr-1" /> Adicionar frase
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-primary text-primary-foreground"
                >
                  <Save className="size-4 mr-1" />
                  {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
