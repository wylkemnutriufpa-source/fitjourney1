// Phase 2 UI — Calculadora determinística de alvo nutricional.
// Usa o engine puro (TDEE + macros). Sem inferência. Sem IO.
// Dados do paciente vêm como prop; usuário escolhe atividade + objetivo.

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import {
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/engine";
import { runNutritionEnginesManual } from "@/lib/clinical/run-nutrition-engines";

interface Props {
  readonly sex: Sex;
  readonly ageYears: number;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly defaultActivity?: ActivityLevel;
  readonly defaultGoal?: Goal;
}

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentário (1.2)",
  light: "Leve (1.375)",
  moderate: "Moderado (1.55)",
  high: "Alto (1.725)",
  extreme: "Extremo (1.9)",
};

const GOAL_LABELS: Record<Goal, string> = {
  cut: "Cutting (déficit)",
  maintain: "Manutenção",
  bulk: "Bulking (superávit)",
};

const KCAL_PROT = 4;
const KCAL_CARB = 4;
const KCAL_FAT = 9;

export function NutritionTargetCard({
  sex,
  ageYears,
  weightKg,
  heightCm,
  defaultActivity = "moderate",
  defaultGoal = "maintain",
}: Props) {
  const [activity, setActivity] = useState<ActivityLevel>(defaultActivity);
  const [goal, setGoal] = useState<Goal>(defaultGoal);

  const result = useMemo(() => {
    try {
      const { tmb, tdee, target } = runNutritionEnginesManual({
        sex,
        ageYears,
        weightKg,
        heightCm,
        activity,
        goal,
      });
      return { tmb, tdee, target, error: null as string | null };
    } catch (e) {
      return {
        tmb: 0,
        tdee: 0,
        target: { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
        error: e instanceof Error ? e.message : "erro de cálculo",
      };
    }
  }, [sex, ageYears, weightKg, heightCm, activity, goal]);

  const { tmb, tdee, target, error } = result;

  const macros = [
    {
      k: "Proteínas",
      g: target.proteinG,
      kcal: target.proteinG * KCAL_PROT,
      c: "bg-primary",
    },
    {
      k: "Carboidratos",
      g: target.carbG,
      kcal: target.carbG * KCAL_CARB,
      c: "bg-emerald-400",
    },
    { k: "Gorduras", g: target.fatG, kcal: target.fatG * KCAL_FAT, c: "bg-amber-400" },
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Calculator className="size-3.5" />
          Motor de Cálculo (Mifflin-St Jeor)
        </p>
        <span className="text-[9px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5">
          determinístico
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Atividade
          </span>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs font-mono"
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Objetivo
          </span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs font-mono"
          >
            {(Object.keys(GOAL_LABELS) as Goal[]).map((k) => (
              <option key={k} value={k}>
                {GOAL_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="text-xs text-destructive font-mono">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <Stat label="TMB" value={tmb} unit="kcal" />
            <Stat label="TDEE" value={tdee} unit="kcal" />
            <Stat label="Alvo" value={target.kcal} unit="kcal" accent />
          </div>

          <div className="space-y-3 pt-2">
            {macros.map((m) => {
              const pct = target.kcal > 0 ? Math.round((m.kcal / target.kcal) * 100) : 0;
              return (
                <div key={m.k} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{m.k}</span>
                    <span className="font-mono text-muted-foreground">
                      {m.g}g · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className={m.c + " h-full rounded-full"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded border px-3 py-2 " +
        (accent ? "bg-primary/10 border-primary/30" : "bg-background border-border")
      }
    >
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "text-lg font-bold tracking-tighter " + (accent ? "text-primary" : "")
        }
      >
        {value.toLocaleString("pt-BR")}
        <span className="text-[10px] text-muted-foreground font-mono ml-1">{unit}</span>
      </p>
    </div>
  );
}
