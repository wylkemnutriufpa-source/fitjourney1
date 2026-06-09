// Calculadora de água — dois modos:
//  - sem prop: usa getMyClinicalContext (uso no app do paciente).
//  - com patientId: usa getClinicalContext(patientId) (uso no perfil pelo nutri).
// Modo recomendado = derivação do contexto clínico (peso atual + atividade).
// Modo simular = altera peso/atividade localmente sem mutar nada.
// Degrada elegantemente quando ctx não está pronto.

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Droplet, Sparkles, Info } from "lucide-react";
import {
  getMyClinicalContext,
  getClinicalContext,
} from "@/lib/clinical/context.functions";
import type { ActivityLevel } from "@/lib/engine/types";

const ML_PER_KG: Record<ActivityLevel, number> = {
  sedentary: 35,
  light: 38,
  moderate: 40,
  high: 45,
  extreme: 50,
};

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentário",
  light: "Leve",
  moderate: "Moderado",
  high: "Intenso",
  extreme: "Muito intenso",
};

const ACTIVITY_ORDER: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "high",
  "extreme",
];

function computeMl(weightKg: number, activity: ActivityLevel): number {
  return Math.round(weightKg * ML_PER_KG[activity]);
}

function formatLiters(ml: number): string {
  return (ml / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function cupsFromMl(ml: number): number {
  return Math.round(ml / 250);
}

export function WaterCalculatorCard() {
  const fetchCtx = useServerFn(getMyClinicalContext);
  const { data: ctx, isLoading } = useQuery({
    queryKey: ["my-clinical-context"],
    queryFn: () => fetchCtx(),
    staleTime: 60_000,
  });

  const recommended = useMemo(() => {
    if (!ctx) return null;
    const w = ctx.currentWeight?.weightKg ?? null;
    const a = ctx.demographics.activity ?? null;
    if (w == null || a == null) return null;
    return { weightKg: w, activity: a, ml: computeMl(w, a) };
  }, [ctx]);

  const [simulate, setSimulate] = useState(false);
  const [simWeight, setSimWeight] = useState<number>(70);
  const [simActivity, setSimActivity] = useState<ActivityLevel>("moderate");

  // Quando entra em modo simular, semeia com o recomendado (se houver).
  function openSimulate() {
    if (recommended) {
      setSimWeight(Math.round(recommended.weightKg));
      setSimActivity(recommended.activity);
    }
    setSimulate(true);
  }

  const simMl = computeMl(simWeight, simActivity);

  return (
    <section className="border border-border rounded-lg p-5 bg-surface space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Hidratação
          </p>
          <h2 className="text-lg font-semibold mt-1 flex items-center gap-2">
            <Droplet className="size-5 text-primary" />
            Água por dia
          </h2>
        </div>
        {!simulate ? (
          <button
            type="button"
            onClick={openSimulate}
            className="text-xs font-medium py-1.5 px-3 rounded-md border border-border hover:bg-background flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" /> Simular
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSimulate(false)}
            className="text-xs font-medium py-1.5 px-3 rounded-md border border-border hover:bg-background"
          >
            Voltar ao recomendado
          </button>
        )}
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      )}

      {!isLoading && !simulate && (
        <>
          {recommended ? (
            <RecommendedView
              ml={recommended.ml}
              weightKg={recommended.weightKg}
              activity={recommended.activity}
            />
          ) : (
            <div className="rounded-md border border-amber-500/30 bg-amber-50/40 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 flex gap-2">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span>
                Ainda não conseguimos calcular sua recomendação automaticamente —
                precisamos do seu peso atual e do nível de atividade da
                anamnese aprovada. Você pode simular abaixo enquanto isso.
              </span>
            </div>
          )}
        </>
      )}

      {simulate && (
        <SimulatorView
          weightKg={simWeight}
          activity={simActivity}
          ml={simMl}
          onWeight={setSimWeight}
          onActivity={setSimActivity}
        />
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Referência geral: 35 ml/kg ajustado pelo nível de atividade. Ambientes
        quentes, gestação, lactação ou condições clínicas específicas podem
        alterar essa recomendação — siga sempre a orientação do seu
        nutricionista.
      </p>
    </section>
  );
}

function RecommendedView({
  ml,
  weightKg,
  activity,
}: {
  ml: number;
  weightKg: number;
  activity: ActivityLevel;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums">{formatLiters(ml)}</span>
        <span className="text-sm text-muted-foreground">L / dia</span>
        <span className="text-xs text-muted-foreground ml-auto">
          ≈ {cupsFromMl(ml)} copos de 250 ml
        </span>
      </div>
      <div className="text-[11px] font-mono text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        <span>Peso atual: {weightKg.toFixed(1)} kg</span>
        <span>Atividade: {ACTIVITY_LABEL[activity]}</span>
        <span>{ML_PER_KG[activity]} ml/kg</span>
      </div>
    </div>
  );
}

function SimulatorView({
  weightKg,
  activity,
  ml,
  onWeight,
  onActivity,
}: {
  weightKg: number;
  activity: ActivityLevel;
  ml: number;
  onWeight: (v: number) => void;
  onActivity: (v: ActivityLevel) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums">{formatLiters(ml)}</span>
        <span className="text-sm text-muted-foreground">L / dia</span>
        <span className="text-xs text-muted-foreground ml-auto">
          ≈ {cupsFromMl(ml)} copos de 250 ml
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          <span>Peso</span>
          <span>{weightKg} kg</span>
        </div>
        <input
          type="range"
          min={30}
          max={200}
          step={1}
          value={weightKg}
          onChange={(e) => onWeight(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Nível de atividade
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {ACTIVITY_ORDER.map((a) => {
            const active = a === activity;
            return (
              <button
                key={a}
                type="button"
                onClick={() => onActivity(a)}
                className={`text-[10px] py-1.5 rounded-md border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-background text-muted-foreground"
                }`}
              >
                {ACTIVITY_LABEL[a]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
