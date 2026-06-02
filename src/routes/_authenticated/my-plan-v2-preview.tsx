import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  loadSnapshot,
  type LoadSnapshotResult,
} from "@/lib/v2/snapshot/storage";
import { imgFor } from "@/lib/food-images";

// PREVIEW V2 — render burro.
// Lê APENAS de sessionStorage (Snapshot V2 serializado).
// PROIBIDO importar editor/store/template-data. Zero cálculo, zero hidratação.

export const Route = createFileRoute("/_authenticated/my-plan-v2-preview")({
  component: V2Preview,
});

function V2Preview() {
  const [state, setState] = useState<LoadSnapshotResult>({ kind: "empty" });

  useEffect(() => {
    setState(loadSnapshot());
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm flex items-center justify-between">
        <strong>PILOTO V2 — Preview lê apenas Snapshot serializado.</strong>
        <button
          className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
          onClick={() => setState(loadSnapshot())}
        >
          Atualizar
        </button>
      </div>

      {state.kind === "empty" && (
        <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum snapshot encontrado. Abra{" "}
          <code className="rounded bg-muted px-1">/templates-v2-editor</code> e
          clique em <strong>Gerar Snapshot</strong>.
        </div>
      )}

      {state.kind === "invalid" && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">
            Snapshot inválido — render burro recusa renderizar.
          </p>
          <p className="mt-2 break-all text-xs text-destructive/80">
            {state.error}
          </p>
        </div>
      )}

      {state.kind === "ok" && <SnapshotView snapshot={state.snapshot} />}
    </div>
  );
}

function SnapshotView({
  snapshot,
}: {
  snapshot: Extract<LoadSnapshotResult, { kind: "ok" }>["snapshot"];
}) {
  const [activeDayId, setActiveDayId] = useState(snapshot.days[0]?.id);
  const day = snapshot.days.find((d) => d.id === activeDayId) ?? snapshot.days[0];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{snapshot.name}</h1>
        <p className="text-xs text-muted-foreground">
          Snapshot {snapshot.schemaVersion} · gerado{" "}
          {new Date(snapshot.generatedAt).toLocaleString("pt-BR")} · meta{" "}
          {snapshot.kcal} kcal
        </p>
      </header>

      <nav className="flex flex-wrap gap-1.5">
        {snapshot.days.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDayId(d.id)}
            className={`rounded px-3 py-1.5 text-xs font-medium border transition-colors ${
              d.id === day.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {d.label}
          </button>
        ))}
      </nav>

      <div className="space-y-4">
        {day.meals.map((meal) => {
          const heroSrc = meal.heroKey ? imgFor(meal.heroKey) : undefined;
          return (
            <section
              key={meal.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {heroSrc && (
                <img
                  src={heroSrc}
                  alt={meal.label}
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="p-4 space-y-3">
                <header>
                  <h2 className="text-lg font-semibold">
                    {meal.time} — {meal.label}
                  </h2>
                  {meal.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      ℹ {meal.notes}
                    </p>
                  )}
                </header>

                <ul className="space-y-3">
                  {meal.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-border/60 p-3 space-y-2"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.qty} {item.unit} · {item.kcal} kcal
                        </span>
                      </div>

                      {item.measures && item.measures.length > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Medidas caseiras
                          </p>
                          <ul className="text-sm">
                            {item.measures.map((m, i) => (
                              <li key={i}>
                                • {m.label}
                                {m.gramsEquivalent
                                  ? ` (≈${m.gramsEquivalent} g)`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.substitutions && item.substitutions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Substituições
                          </p>
                          <ul className="text-sm">
                            {item.substitutions.map((s, i) => (
                              <li key={i}>
                                • {s.name} — {s.qty} {s.unit} · {s.kcal} kcal
                                {s.note ? ` — ${s.note}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.notes && (
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Observações
                          </p>
                          <p className="text-sm">{item.notes}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
