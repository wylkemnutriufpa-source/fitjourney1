import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  RefreshCw,
} from "lucide-react";
import {
  loadSnapshot,
  type LoadSnapshotResult,
} from "@/lib/v2/snapshot/storage";
import { imgFor } from "@/lib/food-images";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// PREVIEW V2 — render burro.
// Lê APENAS de sessionStorage (Snapshot V2 serializado).
// PROIBIDO importar editor/store/template-data. Zero cálculo, zero hidratação.

export const Route = createFileRoute("/_authenticated/my-plan-v2-preview")({
  beforeLoad: ({ context }) => {
    if (typeof window === "undefined") return;
    const identity = (context as { identity?: { appRoles?: string[] } } | undefined)?.identity;
    if (identity && !identity.appRoles?.includes("admin")) {
      throw redirect({ to: "/my-dashboard" });
    }
  },
  component: V2Preview,
});

function V2Preview() {
  const [state, setState] = useState<LoadSnapshotResult | null>(null);

  useEffect(() => {
    setState(loadSnapshot());
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm flex items-center justify-between gap-3">
        <strong>PILOTO V2 — Preview lê apenas Snapshot serializado.</strong>
        <button
          className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-muted min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setState(loadSnapshot())}
          aria-label="Atualizar snapshot"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </button>
      </div>

      {state === null && <SnapshotSkeleton />}

      {state?.kind === "empty" && (
        <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum snapshot encontrado. Abra{" "}
          <code className="rounded bg-muted px-1">/templates-v2-editor</code> e
          clique em <strong>Gerar Snapshot</strong>.
        </div>
      )}

      {state?.kind === "invalid" && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">
            Snapshot inválido — render burro recusa renderizar.
          </p>
          <p className="mt-2 break-all text-xs text-destructive/80">
            {state.error}
          </p>
        </div>
      )}

      {state?.kind === "ok" && <SnapshotView snapshot={state.snapshot} />}
    </div>
  );
}

function SnapshotSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-14 rounded" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

type ExpState = Record<string, boolean>;

function useExpansion(planId: string) {
  const mealsKey = `myplan-v2:exp:${planId}:meals`;
  const itemsKey = `myplan-v2:exp:${planId}:items`;
  const [meals, setMeals] = useState<ExpState>({});
  const [items, setItems] = useState<ExpState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(mealsKey) || "{}");
      const i = JSON.parse(localStorage.getItem(itemsKey) || "{}");
      setMeals(m);
      setItems(i);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [mealsKey, itemsKey]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(mealsKey, JSON.stringify(meals));
  }, [meals, mealsKey, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(itemsKey, JSON.stringify(items));
  }, [items, itemsKey, hydrated]);

  return { meals, items, setMeals, setItems, hydrated };
}

function SnapshotView({
  snapshot,
}: {
  snapshot: Extract<LoadSnapshotResult, { kind: "ok" }>["snapshot"];
}) {
  const [activeDayId, setActiveDayId] = useState(snapshot.days[0]?.id);
  const day = snapshot.days.find((d) => d.id === activeDayId) ?? snapshot.days[0];
  const { meals, items, setMeals, setItems, hydrated } = useExpansion(snapshot.id);

  // Defaults após hydrate: abre só a primeira refeição se nada salvo
  useEffect(() => {
    if (!hydrated) return;
    if (Object.keys(meals).length === 0 && day?.meals[0]) {
      setMeals({ [day.meals[0].id]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, day?.id]);

  const allMealIds = useMemo(() => day?.meals.map((m) => m.id) ?? [], [day]);
  const allItemIds = useMemo(
    () => day?.meals.flatMap((m) => m.items.map((it) => it.id)) ?? [],
    [day],
  );
  const allOpen =
    allMealIds.length > 0 &&
    allMealIds.every((id) => meals[id]) &&
    allItemIds.every((id) => items[id]);

  const toggleAll = () => {
    if (allOpen) {
      setMeals({});
      setItems({});
    } else {
      setMeals(Object.fromEntries(allMealIds.map((id) => [id, true])));
      setItems(Object.fromEntries(allItemIds.map((id) => [id, true])));
    }
  };

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

      <nav className="flex flex-wrap gap-1.5" aria-label="Selecionar dia">
        {snapshot.days.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDayId(d.id)}
            aria-pressed={d.id === day.id}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium border transition-colors min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              d.id === day.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            {d.label}
          </button>
        ))}
      </nav>

      <div className="flex justify-end">
        <button
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={allOpen ? "Recolher todas as refeições" : "Expandir todas as refeições"}
        >
          {allOpen ? (
            <>
              <ChevronsDownUp className="h-3.5 w-3.5" />
              Recolher todas
            </>
          ) : (
            <>
              <ChevronsUpDown className="h-3.5 w-3.5" />
              Expandir todas
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {day.meals.map((meal, idx) => (
          <MealSection
            key={meal.id}
            meal={meal}
            open={!!meals[meal.id]}
            onToggle={() => setMeals({ ...meals, [meal.id]: !meals[meal.id] })}
            itemsState={items}
            setItemsState={setItems}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}

type V2Meal = Extract<LoadSnapshotResult, { kind: "ok" }>["snapshot"]["days"][number]["meals"][number];
type V2Item = V2Meal["items"][number];

function MealSection({
  meal,
  open,
  onToggle,
  itemsState,
  setItemsState,
  index,
}: {
  meal: V2Meal;
  open: boolean;
  onToggle: () => void;
  itemsState: ExpState;
  setItemsState: (s: ExpState) => void;
  index: number;
}) {
  const reduce = useReducedMotion();
  const heroSrc = meal.heroKey ? imgFor(meal.heroKey) : undefined;
  const contentId = `v2-meal-content-${meal.id}`;
  const totalKcal = meal.items.reduce((s, it) => s + (it.kcal || 0), 0);

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-14"
      >
        {heroSrc && (
          <img
            src={heroSrc}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            className="h-14 w-14 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate">
            {meal.time} — {meal.label}
          </h2>
          <p className="text-xs text-muted-foreground">
            {meal.items.length} {meal.items.length === 1 ? "item" : "itens"} · {totalKcal} kcal
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {meal.notes && (
                <p className="text-sm text-muted-foreground">ℹ {meal.notes}</p>
              )}
              <ul className="space-y-2">
                {meal.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    open={!!itemsState[item.id]}
                    onToggle={() =>
                      setItemsState({
                        ...itemsState,
                        [item.id]: !itemsState[item.id],
                      })
                    }
                  />
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ItemRow({
  item,
  open,
  onToggle,
}: {
  item: V2Item;
  open: boolean;
  onToggle: () => void;
}) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const hasDetails =
    (item.measures && item.measures.length > 0) ||
    (item.substitutions && item.substitutions.length > 0) ||
    !!item.notes;
  const contentId = `v2-item-content-${item.id}`;

  // Mobile: abre Sheet em vez de inline
  if (isMobile && hasDetails) {
    return (
      <li className="rounded-md border border-border/60">
        <button
          type="button"
          onClick={onToggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="w-full text-left p-3 flex items-baseline justify-between gap-3 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {item.qty} {item.unit} · {item.kcal} kcal
          </span>
        </button>
        <Sheet open={open} onOpenChange={(v) => v !== open && onToggle()}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>{item.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {item.qty} {item.unit} · {item.kcal} kcal
              </p>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <ItemDetails item={item} />
            </div>
          </SheetContent>
        </Sheet>
      </li>
    );
  }

  // Desktop / sem detalhes: inline
  return (
    <li className="rounded-md border border-border/60">
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        aria-expanded={hasDetails ? open : undefined}
        aria-controls={hasDetails ? contentId : undefined}
        disabled={!hasDetails}
        className={cn(
          "w-full text-left p-3 flex items-baseline justify-between gap-3 min-h-11 rounded-md",
          hasDetails && "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
        )}
      >
        <span className="font-medium">{item.name}</span>
        <span className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-2">
          {item.qty} {item.unit} · {item.kcal} kcal
          {hasDetails && (
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {hasDetails && open && (
          <motion.div
            id={contentId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              <ItemDetails item={item} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function ItemDetails({ item }: { item: V2Item }) {
  return (
    <>
      {item.measures && item.measures.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Medidas caseiras
          </p>
          <ul className="text-sm space-y-0.5">
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
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Substituições
          </p>
          <ul className="text-sm space-y-0.5">
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
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Observações
          </p>
          <p className="text-sm">{item.notes}</p>
        </div>
      )}
    </>
  );
}
