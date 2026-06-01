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
} from "lucide-react";
import { useMemo, useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getPeriod,
  periodLabel,
  pickGreetingMessage,
  formatTodayPtBr,
  pickObjectiveMessage,
  inferObjectiveFromTag,
} from "@/lib/patient/greetings";

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
        <p className="text-sm text-muted-foreground">Carregando seu plano…</p>
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

        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <Info className="inline size-3.5 mr-1" />
            Este plano não possui refeições registradas.
          </p>
        ) : (
          <div className="space-y-5">
            {meals.map((m, idx) => (
              <MealCard
                key={m?.id ?? idx}
                meal={m}
                index={idx}
                foods={foods}
              />
            ))}
          </div>
        )}

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
}: {
  meal: any;
  index: number;
  foods: FoodDTO[] | undefined;
}) {
  const main = meal?.main ?? {};
  const items: any[] = Array.isArray(main.items) ? main.items : [];
  const equivalents: any[] = Array.isArray(meal?.equivalents)
    ? meal.equivalents
    : [];
  const heroUrl = imgFor(meal?.heroKey || main?.imageKey || "");
  const kcal = mealKcal(main);
  const mealKind: MealKind = detectMealKind(meal?.label, meal?.time);

  return (
    <article className="space-y-2">
      {/* Cabeçalho fora do card — hora ao lado do nome da refeição */}
      <header className="px-1 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {meal?.label ?? `Refeição ${index + 1}`}
          </p>
          {meal?.time && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <Clock className="size-3" />
              {meal.time}
            </span>
          )}
        </div>
        {main?.title && (
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {main.title}
          </h2>
        )}
      </header>

      {/* Card horizontal com imagem menor (não estica) */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div className="grid grid-cols-[112px_1fr] sm:grid-cols-[140px_1fr] gap-0">
          <div className="relative aspect-square bg-muted">
            {heroUrl ? (
              <img
                src={heroUrl}
                alt={main?.title ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                <ImageOff className="size-5" />
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <p className="text-white text-[10px] font-mono">{kcal} kcal</p>
            </div>
          </div>

          <div className="p-3 space-y-2.5">
            <ul className="text-sm space-y-1">
              {items.map((it, i) => (
                <FoodItemReadonlyRow
                  key={it?.id ?? i}
                  item={it}
                  foods={foods}
                  mealKind={mealKind}
                />
              ))}
              {items.length === 0 && (
                <li className="text-xs text-muted-foreground italic">
                  Sem alimentos registrados.
                </li>
              )}
            </ul>

            {/* Modo de preparo (collapsable) */}
            {main?.recipe && (
              <Accordion type="single" collapsible>
                <AccordionItem value="recipe" className="border-0">
                  <AccordionTrigger className="py-1.5 text-xs font-mono uppercase tracking-widest text-primary hover:no-underline">
                    <span className="inline-flex items-center gap-1.5">
                      <ChefHat className="size-3.5" /> Modo de preparo
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {main.recipe}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Substituições / equivalentes em modal */}
            {/* Substituições da REFEIÇÃO INTEIRA (montagens equivalentes) */}
            {equivalents.length > 0 && (
              <EquivalentsButton
                mealLabel={meal?.label ?? `Refeição ${index + 1}`}
                equivalents={equivalents}
                foods={foods}
                mealKind={mealKind}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function FoodItemReadonlyRow({
  item,
  foods,
  mealKind,
}: {
  item: any;
  foods: FoodDTO[] | undefined;
  mealKind: MealKind;
}) {
  const [open, setOpen] = useState(false);
  const match = useMemo(
    () => (item?.name ? findCatalogFood(foods, item) : null),
    [foods, item?.name, item?.foodKey],
  );
  const measures = match?.householdMeasures ?? [];
  const hasMeasures = measures.length > 0;

  const itemKcal = Number.isFinite(item?.kcal) ? Number(item.kcal) : 0;

  // Substituições CURADAS por contexto da refeição (3-4 opções coerentes).
  // Não usa scaleGroup aberto para evitar trocas absurdas
  // (ex.: arroz por pão no almoço, carne por feijão).
  const substitutions = useMemo(
    () => getSubstitutionsFor(item?.name ?? "", mealKind, itemKcal),
    [item?.name, mealKind, itemKcal],
  );

  return (
    <li className="border-b border-border/50 last:border-0">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 py-1.5 text-left hover:bg-primary/5 rounded-sm px-1 -mx-1 transition-colors"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm leading-none shrink-0" aria-hidden>{emojiForFood(item?.name)}</span>
              <span className="truncate">{item?.name ?? "—"}</span>
            </span>
            <span className="text-muted-foreground tabular-nums text-xs shrink-0">
              {item?.qty} {item?.unit}
              {Number.isFinite(item?.kcal) ? ` · ${item.kcal} kcal` : ""}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Alimento
            </p>
            <DialogTitle className="text-base">{item?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {item?.qty} {item?.unit}
              {Number.isFinite(item?.kcal) ? ` · ${item.kcal} kcal` : ""}
            </p>
          </DialogHeader>

          {/* Medidas caseiras */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Medidas caseiras
            </h3>
            {hasMeasures ? (
              <div className="grid grid-cols-1 gap-1">
                {measures.map((m) => (
                  <div
                    key={m.id}
                    className="text-xs border border-border rounded px-2 py-1.5 flex items-center justify-between gap-2"
                  >
                    <span>{m.measureName}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {m.gramsEquivalent} g
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                Sem medidas caseiras cadastradas para este alimento.
              </p>
            )}
          </section>

          {/* Substituições equivalentes (mesmo grupo nutricional) */}
          <section className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Substituições equivalentes
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                ~{itemKcal || 0} kcal
              </span>
            </div>
            {substitutions.length > 0 ? (
              <div className="space-y-1">
                {substitutions.map((s, i) => (
                  <div
                    key={`${s.name}-${i}`}
                    className="text-xs border border-border rounded px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{s.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {s.qty} {s.unit}
                        {s.kcal ? ` · ${s.kcal} kcal` : ""}
                      </span>
                    </div>
                    {s.note && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {s.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                Sem substituições sugeridas para este alimento neste momento da refeição.
              </p>
            )}
            <p className="text-[10px] text-muted-foreground pt-1 leading-relaxed">
              Opções coerentes para esta refeição. Mantenha quantidades próximas
              das indicadas para preservar o equilíbrio do plano.
            </p>
          </section>
        </DialogContent>
      </Dialog>
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
  const imgUrl = imgFor(option?.imageKey || "");
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
