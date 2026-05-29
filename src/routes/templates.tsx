import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { templates } from "@/lib/mock-data";
import { Plus, Copy, Edit3, UserPlus } from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates — FitJourney" }] }),
  component: Templates,
});

function Templates() {
  const [activeId, setActiveId] = useState(templates[0].id);
  const active = templates.find((t) => t.id === activeId)!;
  const [variationId, setVariationId] = useState(active.variations[0].id);
  const variation = active.variations.find((v) => v.id === variationId) ?? active.variations[0];

  return (
    <AppShell
      header={
        <button className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90">
          <Plus className="size-3.5" />
          Criar Template
        </button>
      }
    >
      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Biblioteca de Protocolos
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Templates de Dieta</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveId(t.id);
                  setVariationId(t.variations[0].id);
                }}
                className={
                  "w-full text-left p-4 rounded-lg border transition-colors " +
                  (activeId === t.id
                    ? "bg-primary/10 border-primary/40"
                    : "bg-surface border-border hover:border-primary/30")
                }
              >
                <h4 className="font-semibold text-sm">{t.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-background border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-3">
                  {t.variations.length} variações
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Template selecionado
                  </p>
                  <h2 className="text-2xl font-bold mt-1">{active.name}</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xl">{active.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 flex items-center gap-2">
                    <Copy className="size-3.5" />
                    Duplicar
                  </button>
                  <button className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 flex items-center gap-2">
                    <Edit3 className="size-3.5" />
                    Editar
                  </button>
                  <button className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90">
                    <UserPlus className="size-3.5" />
                    Aplicar a Paciente
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  Variações Calóricas
                </p>
                <div className="flex gap-2 flex-wrap">
                  {active.variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariationId(v.id)}
                      className={
                        "px-3 py-2 text-xs font-medium rounded border " +
                        (variationId === v.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {v.label} · {v.kcal} kcal
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Preview · {variation.label} · {variation.meals.length} refeições
              </p>
              {variation.meals.map((m) => (
                <div
                  key={m.id}
                  className="bg-surface border border-border rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-muted-foreground w-12">{m.time}</span>
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{m.label}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary">{m.kcal} kcal</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
