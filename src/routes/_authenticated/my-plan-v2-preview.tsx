import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SnapshotV2Schema } from "@/lib/v2/snapshot.v2.schema";
import { espHipertrofiaV2Piloto } from "@/lib/v2/template-data.v2";

// Rota OCULTA do piloto V2. Sem link em nav. Acesso manual.
// Render burro: lê o template em memória, valida com SnapshotV2Schema
// e exibe items / measures / substitutions / notes.
// PROIBIDO aqui: cálculo, normalização, hidratação, motor.

export const Route = createFileRoute("/_authenticated/my-plan-v2-preview")({
  component: V2Preview,
});

function V2Preview() {
  const parsed = useMemo(
    () => SnapshotV2Schema.safeParse(espHipertrofiaV2Piloto),
    [],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <strong>PILOTO V2 — NÃO PUBLICAR.</strong> Página de validação interna.
        Render burro. Zero motor. Zero cálculo runtime.
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{espHipertrofiaV2Piloto.name}</h1>
        <p className="text-sm text-muted-foreground">
          {espHipertrofiaV2Piloto.description}
        </p>
        <p className="text-xs text-muted-foreground">
          Validação schema:{" "}
          {parsed.success ? (
            <span className="text-emerald-600">OK</span>
          ) : (
            <span className="text-destructive">FALHOU</span>
          )}
        </p>
      </header>

      {espHipertrofiaV2Piloto.meals.map((meal) => (
        <section
          key={meal.id}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
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
                          {m.gramsEquivalent ? ` (≈${m.gramsEquivalent} g)` : ""}
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
        </section>
      ))}
    </div>
  );
}
