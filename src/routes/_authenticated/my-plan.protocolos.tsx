// Protocolos Ativos — visão do paciente.
// READ ONLY: lista os protocolos que o profissional aplicou para o paciente.
// Experiência premium: refeições e alimentos expansíveis com substituições.

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Clock,
  Droplets,
  Moon,
  Info,
  ChevronDown,
  Replace,
  UtensilsCrossed,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { emojiForFood } from "@/lib/food-emojis";
import { ProtocolPhaseSections } from "@/components/protocols/ProtocolPhaseSections";
import {
  listMyActiveProtocols,
  type ActiveProtocolRow,
} from "@/lib/protocols/active.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PhaseMeal, PhaseMealItem } from "@/lib/protocols/catalog";
import { getMyClinicalContext } from "@/lib/clinical/context.functions";
import type { ActivityLevel } from "@/lib/engine/types";

const WATER_ML_PER_KG: Record<ActivityLevel, number> = {
  sedentary: 35,
  light: 38,
  moderate: 40,
  high: 45,
  extreme: 50,
};

function personalizedWaterMl(
  weightKg: number | null | undefined,
  activity: ActivityLevel | null | undefined,
): number | null {
  if (!weightKg || !activity) return null;
  return Math.round(weightKg * WATER_ML_PER_KG[activity]);
}

export const Route = createFileRoute("/_authenticated/my-plan/protocolos")({
  head: () => ({ meta: [{ title: "Protocolos Ativos — FitJourney" }] }),
  component: PatientActiveProtocolsPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <p className="text-sm text-destructive" role="alert">
        Erro ao carregar protocolos: {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-sm text-muted-foreground">Nada encontrado.</p>
    </AppShell>
  ),
});

function PatientActiveProtocolsPage() {
  const fetchActive = useServerFn(listMyActiveProtocols);
  const fetchCtx = useServerFn(getMyClinicalContext);
  const { data, isLoading, error } = useQuery({
    queryKey: ["patient", "active-protocols"],
    queryFn: () => fetchActive(),
    staleTime: 60_000,
  });
  const { data: ctx } = useQuery({
    queryKey: ["my-clinical-context"],
    queryFn: () => fetchCtx(),
    staleTime: 60_000,
  });
  const personalWaterMl = personalizedWaterMl(
    ctx?.currentWeight?.weightKg ?? null,
    ctx?.demographics.activity ?? null,
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--gold)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
              Protocolos Ativos
            </span>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight uppercase text-[var(--gold)]"
            style={{ textShadow: "0 0 14px color-mix(in oklab, var(--gold) 30%, transparent)" }}
          >
            Seus Protocolos
          </h1>
          <p className="text-sm text-muted-foreground">
            Aqui estão os protocolos que seu profissional escolheu trabalhar com você.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>
        ) : !data?.protocols.length ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center space-y-2">
            <Info className="size-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Você ainda não tem nenhum protocolo ativo. Quando seu profissional aplicar um, ele
              aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.protocols.map((p) => (
              <ActiveProtocolCard key={p.id} row={p} personalWaterMl={personalWaterMl} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function computeCurrentWeek(row: ActiveProtocolRow): number {
  const started = new Date(row.started_at).getTime();
  const now = Date.now();
  const week = Math.floor((now - started) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(week, row.phase_snapshot.durationWeeks));
}

function ActiveProtocolCard({
  row,
  personalWaterMl,
}: {
  row: ActiveProtocolRow;
  personalWaterMl: number | null;
}) {
  const phase = row.phase_snapshot;
  const week = computeCurrentWeek(row);
  const waterMl = personalWaterMl ?? phase.recommendations.waterMl;
  const waterLabel = `${(waterMl / 1000).toFixed(1)}L água${personalWaterMl ? " (você)" : ""}`;
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-surface to-background p-5 space-y-5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_8%,transparent)]">
      <Sparkles
        className="pointer-events-none absolute -top-1 -right-1 size-7 text-[var(--gold)]/40 animate-pulse"
        aria-hidden
      />
      <header className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {row.protocol_name}
        </p>
        <h2
          className="text-lg font-bold uppercase tracking-wide text-[var(--gold)]"
          style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 35%, transparent)" }}
        >
          {row.module_name} · {phase.name}
        </h2>
        <p className="text-xs text-muted-foreground">{phase.description}</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        <MetricChip icon={<Clock className="size-3" />} label={`Sem ${week}/${phase.durationWeeks}`} />
        <MetricChip icon={<Droplets className="size-3" />} label={waterLabel} />
        <MetricChip icon={<Moon className="size-3" />} label={`${phase.recommendations.sleepHours}h sono`} />
        {phase.dailyKcalTarget && (
          <MetricChip icon={<Flame className="size-3" />} label={`${phase.dailyKcalTarget} kcal/dia`} />
        )}
      </div>

      {phase.meals && phase.meals.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            <UtensilsCrossed className="size-3" /> Cardápio do dia
          </p>
          <div className="space-y-2">
            {phase.meals.map((m) => (
              <MealCard key={m.id} meal={m} />
            ))}
          </div>
        </section>
      )}

      <ProtocolPhaseSections phase={phase} />
    </article>
  );
}

function MetricChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1 rounded-md border border-[var(--gold)]/20 bg-background/60 px-2 py-1.5 text-muted-foreground">
      <span className="text-[var(--gold)]/80">{icon}</span>
      {label}
    </span>
  );
}

function MealCard({ meal }: { meal: PhaseMeal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[var(--gold)]/20 bg-background/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[color-mix(in_oklab,var(--gold)_5%,transparent)] transition-colors"
        aria-expanded={open}
      >
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] text-[var(--gold)] font-mono text-[10px] shrink-0">
          {meal.time}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground truncate">
            {meal.name}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {meal.items.length} {meal.items.length === 1 ? "alimento" : "alimentos"} · {meal.totalKcal} kcal
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-[var(--gold)] transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-[var(--gold)]/15 animate-fade-in">
          {meal.items.map((it, i) => (
            <FoodRow key={`${meal.id}-${i}`} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function FoodRow({ item }: { item: PhaseMealItem }) {
  const subs = item.substitutions ?? [];
  const hasSubs = subs.length > 0;
  const hasRecipe = (item.ingredients?.length ?? 0) > 0 || !!item.preparation;
  const hasDetail = hasSubs || hasRecipe;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40 first:mt-2">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 p-2.5 text-left",
          hasDetail && "hover:bg-[color-mix(in_oklab,var(--gold)_4%,transparent)] transition-colors",
        )}
        aria-expanded={open}
        disabled={!hasDetail}
      >
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] text-lg shrink-0" aria-hidden>
          {emojiForFood(item.name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {item.householdMeasure}
            <span className="text-muted-foreground/60"> · {item.quantityG}g · {item.kcal} kcal</span>
          </p>
        </div>
        {hasDetail && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[var(--gold)]/80 shrink-0">
            {hasSubs ? (
              <>
                <Replace className="size-3" />
                {subs.length} substituições
              </>
            ) : (
              <>
                <Info className="size-3" />
                receita
              </>
            )}
            <ChevronDown
              className={cn("size-3 transition-transform", open && "rotate-180")}
            />
          </span>
        )}
      </button>

      {hasDetail && open && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/40 pt-2 animate-fade-in">
          {hasRecipe && (
            <div className="space-y-1.5">
              {item.ingredients && item.ingredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Ingredientes
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-foreground/90">
                    {item.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.preparation && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Modo de preparo
                  </p>
                  <p className="text-xs text-foreground/90 mt-1">{item.preparation}</p>
                </div>
              )}
              {item.usage && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Como usar
                  </p>
                  <p className="text-xs text-foreground/90 mt-1">{item.usage}</p>
                </div>
              )}
            </div>
          )}
          {hasSubs && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Substituições equivalentes
              </p>
              <ul className="space-y-1">
                {subs.map((s, i) => (
                  <li
                    key={`${s.foodKey}-${i}`}
                    className="flex items-baseline justify-between gap-2 rounded border border-[var(--gold)]/15 bg-background/60 px-2 py-1.5 text-xs"
                  >
                    <div className="min-w-0 flex items-baseline gap-1.5">
                      <span aria-hidden>{emojiForFood(s.name)}</span>
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="text-muted-foreground"> · {s.householdMeasure}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {s.quantityG}g · {s.kcal} kcal
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
