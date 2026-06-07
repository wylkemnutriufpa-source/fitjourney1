// Patient App — visualização do plano publicado.
// READ ONLY. Renderização burra. Zero recálculo. Zero normalização.
// Mesma riqueza visual do editor do nutricionista, sem edição.

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyActivePlan } from "@/lib/plans/patient-plan.functions";
import { getMyPatientProfile } from "@/lib/profile/patient-profile.functions";
import { listFoods, type FoodDTO } from "@/lib/foods.functions";
import { AppShell } from "@/components/AppShell";
import { ClinicalAlerts } from "@/components/patient/ClinicalAlerts";
import {
  Clock,
  AlertTriangle,
  Info,
  ImageOff,
  Repeat2,
  ChefHat,
  Scale,
  ChevronDown,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { imgFor } from "@/lib/food-images";
import { emojiForFood } from "@/lib/food-emojis";
import {
  detectMealKind,
  getSubstitutionsFor,
  type MealKind,
} from "@/lib/plans/substitution-rules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getPeriod,
  periodLabel,
  pickGreetingMessage,
  formatTodayPtBr,
  pickObjectiveMessage,
  inferObjectiveFromTag,
} from "@/lib/patient/greetings";

// ====================================================================
// Expansão persistente (localStorage por plano)
// ====================================================================
type ExpansionCtx = {
  isMealOpen: (id: string) => boolean;
  toggleMeal: (id: string) => void;
  isItemOpen: (id: string) => boolean;
  toggleItem: (id: string) => void;
  setItemOpen: (id: string, open: boolean) => void;
};
const ExpansionContext = createContext<ExpansionCtx | null>(null);
function useExpansion() {
  const c = useContext(ExpansionContext);
  if (!c) throw new Error("ExpansionContext provider missing");
  return c;
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function saveSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota */
  }
}

export const Route = createFileRoute("/_authenticated/my-plan")({
  head: () => ({ meta: [{ title: "Meu Plano — FitJourney" }] }),
  component: MyPlanPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="text-sm text-destructive" role="alert">
        Não foi possível carregar seu plano: {error.message}
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="text-sm text-muted-foreground">Plano não encontrado.</div>
    </AppShell>
  ),
});

function MyPlanPage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const fetchPlan = useServerFn(getMyActivePlan);
  const fetchProfile = useServerFn(getMyPatientProfile);
  const fetchFoods = useServerFn(listFoods);

  const { data, isLoading, error } = useQuery({
    queryKey: ["patient", "active-plan"],
    queryFn: () => fetchPlan(),
    staleTime: 30_000,
  });
  const { data: profile } = useQuery({
    queryKey: ["my-patient-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });
  const { data: foods } = useQuery({
    queryKey: ["foods-catalog"],
    queryFn: () => fetchFoods(),
    staleTime: 5 * 60_000,
  });

  const greeting = useMemo(() => {
    const now = new Date();
    const period = getPeriod(now.getHours());
    return {
      label: periodLabel(period),
      message: pickGreetingMessage(period),
      date: formatTodayPtBr(now),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = (profile?.fullName ?? "").trim().split(/\s+/)[0] ?? "";

  const objectiveMsg = useMemo(() => {
    const snap: any = data?.snapshot ?? {};
    const tag: string | null =
      snap?.template?.goal_tag ?? snap?.goal_tag ?? snap?.objective ?? null;
    return pickObjectiveMessage(inferObjectiveFromTag(tag));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (path !== "/my-plan") {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <AppShell>
        <MyPlanSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <p className="text-sm text-destructive">
          Erro ao carregar o plano: {(error as Error).message}
        </p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="space-y-3 max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight">Meu Plano</h1>
          <p className="text-sm text-muted-foreground">
            Você ainda não tem um plano publicado. Assim que seu nutricionista
            publicar, ele aparecerá aqui.
          </p>
        </div>
      </AppShell>
    );
  }

  const snap: any = data.snapshot ?? {};
  const meals: any[] = Array.isArray(snap.meals) ? snap.meals : [];
  const review = snap.clinical_review;
  const orientacoes: string =
    typeof snap.orientacoes === "string" ? snap.orientacoes.trim() : "";

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        <ClinicalAlerts />
        <header className="border-b border-border pb-5 space-y-2">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting.label}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            {greeting.message}
          </p>
          {objectiveMsg && (
            <p className="text-xs sm:text-sm text-primary/90 italic">
              {objectiveMsg}
            </p>
          )}
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 pt-1">
            {greeting.date}
          </p>
        </header>

        {review?.clinical_warnings?.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-50/40 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium mb-1">
              <AlertTriangle className="size-3.5" />
              Observações clínicas
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {review.clinical_warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <PlanMeals planId={data.id} meals={meals} foods={foods} />

        {orientacoes && (
          <section className="border border-border rounded-lg p-5 bg-surface space-y-2">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Orientações nutricionais
            </h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {orientacoes}
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}

// ====================================================================
// Skeleton de carregamento
// ====================================================================
function MyPlanSkeleton() {
  return (
    <div className="space-y-8 max-w-3xl" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border border-border rounded-lg overflow-hidden grid grid-cols-[88px_1fr_auto] sm:grid-cols-[112px_1fr_auto] gap-3 items-center"
          >
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="py-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="size-4 mr-3" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando seu plano…</span>
    </div>
  );
}

// ====================================================================
// Lista de refeições + provider de expansão persistente
// ====================================================================
function PlanMeals({
  planId,
  meals,
  foods,
}: {
  planId: string;
  meals: any[];
  foods: FoodDTO[] | undefined;
}) {
  const storageKey = `myplan:exp:${planId}`;

  const allMealIds = useMemo(
    () => meals.map((m, idx) => `meal-${m?.id ?? idx}`),
    [meals],
  );
  const allItemIds = useMemo(() => {
    const ids: string[] = [];
    meals.forEach((m, idx) => {
      const mid = `meal-${m?.id ?? idx}`;
      const items: any[] = Array.isArray(m?.main?.items) ? m.main.items : [];
      items.forEach((it, i) => ids.push(`${mid}-item-${it?.id ?? i}`));
    });
    return ids;
  }, [meals]);

  const [openMeals, setOpenMeals] = useState<Set<string>>(() => {
    const saved = loadSet(`${storageKey}:meals`);
    if (saved.size > 0) return saved;
    // padrão: primeira refeição aberta
    return new Set(allMealIds.slice(0, 1));
  });
  const [openItems, setOpenItems] = useState<Set<string>>(() =>
    loadSet(`${storageKey}:items`),
  );

  useEffect(() => {
    saveSet(`${storageKey}:meals`, openMeals);
  }, [storageKey, openMeals]);
  useEffect(() => {
    saveSet(`${storageKey}:items`, openItems);
  }, [storageKey, openItems]);

  const ctx = useMemo<ExpansionCtx>(
    () => ({
      isMealOpen: (id) => openMeals.has(id),
      toggleMeal: (id) =>
        setOpenMeals((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        }),
      isItemOpen: (id) => openItems.has(id),
      toggleItem: (id) =>
        setOpenItems((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        }),
      setItemOpen: (id, open) =>
        setOpenItems((prev) => {
          const next = new Set(prev);
          open ? next.add(id) : next.delete(id);
          return next;
        }),
    }),
    [openMeals, openItems],
  );

  const allExpanded =
    allMealIds.length > 0 &&
    allMealIds.every((id) => openMeals.has(id)) &&
    allItemIds.every((id) => openItems.has(id));

  const handleToggleAll = useCallback(() => {
    if (allExpanded) {
      setOpenMeals(new Set());
      setOpenItems(new Set());
    } else {
      setOpenMeals(new Set(allMealIds));
      setOpenItems(new Set(allItemIds));
    }
  }, [allExpanded, allMealIds, allItemIds]);

  if (meals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        <Info className="inline size-3.5 mr-1" />
        Este plano não possui refeições registradas.
      </p>
    );
  }

  return (
    <ExpansionContext.Provider value={ctx}>
      <section aria-label="Refeições do plano" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Refeições ({meals.length})
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleAll}
            aria-pressed={allExpanded}
            className="h-8 text-xs gap-1.5"
          >
            {allExpanded ? (
              <>
                <ChevronsDownUp className="size-3.5" /> Recolher tudo
              </>
            ) : (
              <>
                <ChevronsUpDown className="size-3.5" /> Expandir tudo
              </>
            )}
          </Button>
        </div>
        <div className="space-y-3">
          {meals.map((m, idx) => (
            <MealCard
              key={m?.id ?? idx}
              meal={m}
              index={idx}
              foods={foods}
              mealId={`meal-${m?.id ?? idx}`}
            />
          ))}
        </div>
      </section>
    </ExpansionContext.Provider>
  );
}

// ====================================================================
// Helpers de matching com o catálogo (mesmo padrão do editor do nutri)
// ====================================================================

function normalizeFoodLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(cozido|cozida|grelhado|grelhada|preto|preta|de galinha|hidratada)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCatalogFood(
  foods: FoodDTO[] | undefined,
  item: { name: string; foodKey?: string | null },
): FoodDTO | null {
  if (!foods?.length) return null;

  const itemName = normalizeFoodLabel(item.name);
  const exactName = foods.find((f) => normalizeFoodLabel(f.name) === itemName);
  if (exactName) return exactName;

  const aliasMatchers: Array<[RegExp, (foodName: string) => boolean]> = [
    [/arroz integral/, (n) => n.includes("arroz integral")],
    [/\barroz\b/, (n) => n.includes("arroz branco")],
    [/feijao preto/, (n) => n.includes("feijao preto")],
    [/\bfeijao\b/, (n) => n.includes("feijao carioca")],
    [/salada|folhas|alface/, (n) => n.includes("alface")],
    [/fruta sobremesa|\bmaca\b/, (n) => n.includes("maca")],
    [/\bleite\b/, (n) => n.includes("leite vaca integral")],
    [/iogurte/, (n) => n.includes("iogurte natural integral")],
    [/aveia/, (n) => n.includes("aveia")],
    [/banana|fruta picada/, (n) => n.includes("banana")],
    [/frango desfiado|frango grelhado|\bfrango\b/, (n) => n.includes("peito frango")],
    [/tilapia|\bpeixe\b/, (n) => n.includes("tilapia")],
    [/carne|patinho|alcatra|coxao/, (n) =>
      n.includes("patinho") || n.includes("alcatra") || n.includes("coxao") || n.includes("carne")],
    [/queijo branco|queijo minas/, (n) => n.includes("queijo minas")],
    [/pao integral/, (n) => n.includes("pao integral")],
    [/pao frances|\bpao\b/, (n) => n.includes("pao frances")],
    [/macarrao/, (n) => n.includes("macarrao cozido")],
    [/\bovo\b/, (n) => /\bovo\b/.test(n)],
    [/goma de tapioca|\btapioca\b/, (n) => n.includes("goma tapioca")],
    [/\bcuscuz\b/, (n) => n.includes("cuscuz")],
    [/\bcafe\b/, (n) => n.includes("cafe")],
    [/\bcha\b/, (n) => n.includes("cha")],
    [/batata doce/, (n) => n.includes("batata doce")],
    [/\bbatata\b/, (n) => n.includes("batata")],
    [/legume|brocolis|cenoura|abobrinha/, (n) =>
      n.includes("brocolis") || n.includes("cenoura") || n.includes("abobrinha")],
  ];

  for (const [pat, matchFn] of aliasMatchers) {
    if (pat.test(itemName)) {
      const alias = foods.find((f) => matchFn(normalizeFoodLabel(f.name)));
      if (alias) return alias;
    }
  }

  const tokens = itemName.split(" ").filter((t) => t.length >= 4);
  if (tokens.length) {
    const partial = foods.find((f) => {
      const fname = normalizeFoodLabel(f.name);
      return tokens.some((t) => fname.includes(t));
    });
    if (partial) return partial;
  }

  return null;
}

// ====================================================================
// Componentes de renderização burra (read-only)
// ====================================================================

function mealKcal(option: any): number {
  const items: any[] = Array.isArray(option?.items) ? option.items : [];
  return items.reduce(
    (s, it) => s + (Number.isFinite(it?.kcal) ? Number(it.kcal) : 0),
    0,
  );
}

function MealCard({
  meal,
  index,
  foods,
  mealId,
}: {
  meal: any;
  index: number;
  foods: FoodDTO[] | undefined;
  mealId: string;
}) {
  const main = meal?.main ?? {};
  const items: any[] = Array.isArray(main.items) ? main.items : [];
  const equivalents: any[] = Array.isArray(meal?.equivalents)
    ? meal.equivalents
    : [];
  const heroUrl = resolveBlockImage({
    heroKey: meal?.heroKey,
    imageKey: main?.imageKey,
    items,
    mealKind: detectMealKind(meal?.label, meal?.time),
  });
  const kcal = mealKcal(main);
  const mealKind: MealKind = detectMealKind(meal?.label, meal?.time);
  const { isMealOpen, toggleMeal } = useExpansion();
  const open = isMealOpen(mealId);
  const reduce = useReducedMotion();
  const panelId = `${mealId}-panel`;
  const titleId = `${mealId}-title`;

  return (
    <article
      className="border border-border rounded-lg overflow-hidden bg-background"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        onClick={() => toggleMeal(mealId)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full grid grid-cols-[88px_1fr_auto] sm:grid-cols-[112px_1fr_auto] gap-3 items-center text-left hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square bg-muted">
          {heroUrl ? (
            <img
              src={heroUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="py-3 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {meal?.label ?? `Refeição ${index + 1}`}
            </p>
            {meal?.time && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <Clock className="size-3" aria-hidden />
                {meal.time}
              </span>
            )}
          </div>
          {main?.title && (
            <h3
              id={titleId}
              className="text-sm sm:text-base font-semibold truncate"
            >
              {main.title}
            </h3>
          )}
          <p className="text-[11px] text-muted-foreground">
            {items.length} {items.length === 1 ? "alimento" : "alimentos"} ·{" "}
            <span className="tabular-nums">{kcal} kcal</span>
          </p>
        </div>
        <ChevronDown
          aria-hidden
          className={`size-4 mr-3 text-muted-foreground transition-transform motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={titleId}
            key="content"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-2.5">
              <ul className="text-sm">
                {items.map((it, i) => (
                  <FoodItemReadonlyRow
                    key={it?.id ?? i}
                    item={it}
                    foods={foods}
                    mealKind={mealKind}
                    itemId={`${mealId}-item-${it?.id ?? i}`}
                  />
                ))}
                {items.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">
                    Sem alimentos registrados.
                  </li>
                )}
              </ul>

              {main?.recipe && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="recipe" className="border-0">
                    <AccordionTrigger className="py-1.5 text-xs font-mono uppercase tracking-widest text-primary hover:no-underline">
                      <span className="inline-flex items-center gap-1.5">
                        <ChefHat className="size-3.5" aria-hidden /> Modo de preparo
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {main.recipe}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {equivalents.length > 0 && (
                <EquivalentsButton
                  mealLabel={meal?.label ?? `Refeição ${index + 1}`}
                  equivalents={equivalents}
                  foods={foods}
                  mealKind={mealKind}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ====================================================================
// Linha de alimento — inline no desktop, Sheet (drawer) no mobile
// ====================================================================
function FoodItemReadonlyRow({
  item,
  foods,
  mealKind,
  itemId,
}: {
  item: any;
  foods: FoodDTO[] | undefined;
  mealKind: MealKind;
  itemId?: string;
}) {
  const autoId = useId();
  const stableId = itemId ?? `eq-item-${autoId}`;
  const { isItemOpen, toggleItem, setItemOpen } = useExpansion();
  // Para rows dentro do modal de equivalentes (sem itemId persistente),
  // usamos estado local efêmero.
  const persistent = !!itemId;
  const [localOpen, setLocalOpen] = useState(false);
  const open = persistent ? isItemOpen(stableId) : localOpen;
  const setOpen = (next: boolean) => {
    if (persistent) setItemOpen(stableId, next);
    else setLocalOpen(next);
  };
  const handleToggle = () => {
    if (persistent) toggleItem(stableId);
    else setLocalOpen((v) => !v);
  };
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const panelId = `${stableId}-panel`;

  const match = useMemo(
    () => (item?.name ? findCatalogFood(foods, item) : null),
    [foods, item?.name, item?.foodKey],
  );
  const measures = match?.householdMeasures ?? [];
  const hasMeasures = measures.length > 0;

  const itemKcal = Number.isFinite(item?.kcal) ? Number(item.kcal) : 0;

  const substitutions = useMemo(
    () => getSubstitutionsFor(item?.name ?? "", mealKind, itemKcal),
    [item?.name, mealKind, itemKcal],
  );

  const triggerLabel = (
    <>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm leading-none shrink-0" aria-hidden>
          {emojiForFood(item?.name)}
        </span>
        <span className="truncate">{item?.name ?? "—"}</span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="text-muted-foreground tabular-nums text-xs">
          {item?.qty} {item?.unit}
          {Number.isFinite(item?.kcal) ? ` · ${item.kcal} kcal` : ""}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-3.5 text-muted-foreground transition-transform motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </span>
    </>
  );

  const detailsBody = (
    <div className="space-y-4">
      <section className="space-y-1.5" aria-label="Medidas caseiras">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
          <Scale className="size-3" aria-hidden /> Medidas caseiras
        </h4>
        {hasMeasures ? (
          <div className="grid grid-cols-1 gap-1">
            {measures.map((m) => (
              <div
                key={m.id}
                className="text-sm border border-border rounded px-2.5 py-2 flex items-center justify-between gap-2"
              >
                <span>{m.measureName}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {m.gramsEquivalent} g
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Sem medidas caseiras cadastradas.
          </p>
        )}
      </section>

      <section className="space-y-1.5" aria-label="Substituições">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
            <Repeat2 className="size-3" aria-hidden /> Substituições
          </h4>
          <span className="text-[10px] font-mono text-muted-foreground">
            ~{itemKcal || 0} kcal
          </span>
        </div>
        {substitutions.length > 0 ? (
          <ul className="space-y-1">
            {substitutions.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className="text-sm border border-border rounded px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                    {s.qty} {s.unit}
                    {s.kcal ? ` · ${s.kcal} kcal` : ""}
                  </span>
                </div>
                {s.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Sem substituições sugeridas para este alimento.
          </p>
        )}
      </section>
    </div>
  );

  return (
    <li className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={isMobile ? undefined : panelId}
        className="w-full min-h-11 flex items-center justify-between gap-3 py-2 text-left hover:bg-primary/5 rounded-sm px-1 -mx-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {triggerLabel}
      </button>

      {/* Mobile: Sheet/Drawer com melhor legibilidade */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <span aria-hidden>{emojiForFood(item?.name)}</span>
                <span>{item?.name ?? "—"}</span>
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {item?.qty} {item?.unit}
                {Number.isFinite(item?.kcal) ? ` · ${item.kcal} kcal` : ""}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 pb-6">{detailsBody}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              role="region"
              key="details"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-1 pb-3 pt-1">{detailsBody}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}

function EquivalentsButton({
  mealLabel,
  equivalents,
  foods,
  mealKind,
}: {
  mealLabel: string;
  equivalents: any[];
  foods: FoodDTO[] | undefined;
  mealKind: MealKind;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Repeat2 className="size-3.5" /> Ver substituições (
          {equivalents.length})
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Substituições — {mealLabel}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Cada opção abaixo substitui a refeição inteira.
        </p>
        <div className="space-y-3 pt-2">
          {equivalents.map((eq, i) => (
            <EquivalentCard
              key={eq?.id ?? i}
              option={eq}
              foods={foods}
              mealKind={mealKind}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EquivalentCard({
  option,
  foods,
  mealKind,
}: {
  option: any;
  foods: FoodDTO[] | undefined;
  mealKind: MealKind;
}) {
  const items: any[] = Array.isArray(option?.items) ? option.items : [];
  const imgUrl = resolveBlockImage({
    imageKey: option?.imageKey,
    items,
    mealKind,
  });
  const kcal = mealKcal(option);
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="grid grid-cols-[88px_1fr] gap-0">
        <div className="relative aspect-square bg-muted">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={option?.title ?? ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-4" />
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              {option?.title ?? "Opção equivalente"}
            </p>
            <span className="text-[10px] font-mono text-muted-foreground">
              {kcal} kcal
            </span>
          </div>
          <ul className="text-xs space-y-0.5">
            {items.map((it, i) => (
              <FoodItemReadonlyRow
                key={it?.id ?? i}
                item={it}
                foods={foods}
                mealKind={mealKind}
              />
            ))}
          </ul>
          {option?.recipe && (
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap pt-1 border-t border-border/50">
              {option.recipe}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
