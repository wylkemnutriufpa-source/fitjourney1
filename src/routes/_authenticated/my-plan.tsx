// Patient App — visualização do plano publicado.
// READ ONLY. Renderização burra. Zero recálculo. Zero normalização.
// Fonte única: snapshot V3 retornado por getMyActivePlan (public.plans).

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyActivePlan } from "@/lib/plans/patient-plan.functions";
import { getMyPatientProfile } from "@/lib/profile/patient-profile.functions";
import { AppShell } from "@/components/AppShell";
import { ClinicalAlerts } from "@/components/patient/ClinicalAlerts";
import { Clock, AlertTriangle, Info } from "lucide-react";
import { useMemo } from "react";
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

  // Saudação calculada uma vez por montagem. Sorteia evitando repetir
  // a última mensagem mostrada (persistido em localStorage).
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
    const snap = data?.snapshot ?? {};
    const tag: string | null =
      snap?.template?.goal_tag ??
      snap?.goal_tag ??
      snap?.objective ??
      null;
    return pickObjectiveMessage(inferObjectiveFromTag(tag));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

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

  const snap = data.snapshot ?? {};
  const meals: any[] = Array.isArray(snap.meals) ? snap.meals : [];
  const review = snap.clinical_review;

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
          <div className="space-y-6">
            {meals.map((m, idx) => {
              const main = m?.main ?? {};
              const items: any[] = Array.isArray(main.items) ? main.items : [];
              return (
                <section
                  key={m?.id ?? idx}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      {m?.label ?? `Refeição ${idx + 1}`}
                    </h2>
                    {m?.time && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        <Clock className="size-3" />
                        {m.time}
                      </span>
                    )}
                  </div>
                  {main.title && (
                    <p className="text-xs text-muted-foreground">{main.title}</p>
                  )}
                  <ul className="text-sm space-y-1">
                    {items.map((it, i) => (
                      <li
                        key={it?.id ?? i}
                        className="flex justify-between gap-3"
                      >
                        <span>{it?.name ?? "—"}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {it?.qty} {it?.unit}
                          {Number.isFinite(it?.kcal) ? ` · ${it.kcal} kcal` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {main.recipe && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {main.recipe}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
