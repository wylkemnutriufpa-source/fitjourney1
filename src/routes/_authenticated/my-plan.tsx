// Patient App — visualização do plano publicado.
// READ ONLY. Renderização burra. Zero recálculo. Zero normalização.
// Fonte única: snapshot V3 retornado por getMyActivePlan (public.plans).
// Renderiza com a mesma riqueza visual do editor do nutricionista
// (imagem da refeição, kcal, itens, modo de preparo, substituições em modal,
// orientações nutricionais), porém em modo somente leitura.

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyActivePlan } from "@/lib/plans/patient-plan.functions";
import { getMyPatientProfile } from "@/lib/profile/patient-profile.functions";
import { AppShell } from "@/components/AppShell";
import { ClinicalAlerts } from "@/components/patient/ClinicalAlerts";
import {
  Clock,
  AlertTriangle,
  Info,
  ImageOff,
  Repeat2,
  ChefHat,
} from "lucide-react";
import { useMemo, useState } from "react";
import { imgFor } from "@/lib/food-images";
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
          <div className="space-y-4">
            {meals.map((m, idx) => (
              <MealCard key={m?.id ?? idx} meal={m} index={idx} />
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
// Componentes de renderização burra (read-only)
// ====================================================================

function mealKcal(option: any): number {
  const items: any[] = Array.isArray(option?.items) ? option.items : [];
  return items.reduce(
    (s, it) => s + (Number.isFinite(it?.kcal) ? Number(it.kcal) : 0),
    0,
  );
}

function MealCard({ meal, index }: { meal: any; index: number }) {
  const main = meal?.main ?? {};
  const items: any[] = Array.isArray(main.items) ? main.items : [];
  const equivalents: any[] = Array.isArray(meal?.equivalents)
    ? meal.equivalents
    : [];
  const heroUrl = imgFor(meal?.heroKey || main?.imageKey || "");
  const kcal = mealKcal(main);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-0">
        <div className="relative aspect-square sm:aspect-auto bg-muted min-h-[140px]">
          {heroUrl ? (
            <img
              src={heroUrl}
              alt={main?.title ?? ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-white text-[10px] font-mono">{kcal} kcal</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">
              {meal?.label ?? `Refeição ${index + 1}`}
            </h2>
            {meal?.time && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                <Clock className="size-3" />
                {meal.time}
              </span>
            )}
          </div>

          {main?.title && (
            <p className="text-sm font-medium text-foreground/90">
              {main.title}
            </p>
          )}

          <ul className="text-sm space-y-1">
            {items.map((it, i) => (
              <li
                key={it?.id ?? i}
                className="flex justify-between gap-3 border-b border-border/50 last:border-0 py-1"
              >
                <span>{it?.name ?? "—"}</span>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {it?.qty} {it?.unit}
                  {Number.isFinite(it?.kcal) ? ` · ${it.kcal} kcal` : ""}
                </span>
              </li>
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
                <AccordionTrigger className="py-2 text-xs font-mono uppercase tracking-widest text-primary hover:no-underline">
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
          {equivalents.length > 0 && (
            <EquivalentsButton
              mealLabel={meal?.label ?? `Refeição ${index + 1}`}
              equivalents={equivalents}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EquivalentsButton({
  mealLabel,
  equivalents,
}: {
  mealLabel: string;
  equivalents: any[];
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
            <EquivalentCard key={eq?.id ?? i} option={eq} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EquivalentCard({ option }: { option: any }) {
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
              <li key={it?.id ?? i} className="flex justify-between gap-2">
                <span>{it?.name ?? "—"}</span>
                <span className="text-muted-foreground tabular-nums">
                  {it?.qty} {it?.unit}
                </span>
              </li>
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
