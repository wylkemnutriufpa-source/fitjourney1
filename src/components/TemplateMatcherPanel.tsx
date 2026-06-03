// Phase 2 UI — Painel matcher de templates.
// Usa o engine puro `matchTemplates` para ranquear a biblioteca pelo alvo informado.
// Não modifica templates. Sem inferência. Só leitura + score.

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Target, ChevronDown, ChevronUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { matchTemplates } from "@/lib/engine";
import { runNutritionEnginesManual } from "@/lib/clinical/run-nutrition-engines";
import type { TemplateMeta, MatchResult, Goal as EngineGoal } from "@/lib/engine";
import { templates as systemTemplates } from "@/lib/template-data";
import { RealPatientPicker } from "./RealPatientPicker";
import type { PatientLite } from "@/lib/plans/plans.functions";
import { getClinicalContext } from "@/lib/clinical/context.functions";

const KCAL_TOLERANCE = 0.15; // ±15% se template não declarar range explícito

function clinicalGoalToEngine(kind: string | undefined): EngineGoal {
  if (kind === "cut") return "cut";
  if (kind === "bulk") return "bulk";
  // performance / health / maintain → manutenção como neutro determinístico
  return "maintain";
}

function toMeta(t: (typeof systemTemplates)[number]): TemplateMeta {
  return {
    id: t.id,
    name: t.name,
    kcalTarget: t.kcal,
    kcalRangeMin: Math.round(t.kcal * (1 - KCAL_TOLERANCE)),
    kcalRangeMax: Math.round(t.kcal * (1 + KCAL_TOLERANCE)),
    proteinGTarget: t.proteinGTarget ?? null,
    carbGTarget: t.carbGTarget ?? null,
    fatGTarget: t.fatGTarget ?? null,
    mealsPerDay: t.meals.length,
    constraintsTags: t.tags ?? [],
    goalTag: t.goalTag ?? null,
  };
}

type Constraint = "vegetariano" | "vegano" | "low-carb" | "sem-lactose" | "sem-gluten" | "fodmap";
const CONSTRAINT_LABELS: Record<Constraint, string> = {
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  "low-carb": "Low carb",
  "sem-lactose": "Sem lactose",
  "sem-gluten": "Sem glúten",
  fodmap: "Low FODMAP",
};

export function TemplateMatcherPanel({
  defaultKcal,
  defaultProtein,
  defaultCarb,
  defaultFat,
  onPickTemplate,
}: {
  readonly defaultKcal?: number;
  readonly defaultProtein?: number;
  readonly defaultCarb?: number;
  readonly defaultFat?: number;
  readonly onPickTemplate?: (templateId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [kcal, setKcal] = useState<number>(defaultKcal ?? 2200);
  const [proteinG, setProteinG] = useState<number>(defaultProtein ?? 140);
  const [carbG, setCarbG] = useState<number>(defaultCarb ?? 260);
  const [fatG, setFatG] = useState<number>(defaultFat ?? 70);
  const [meals, setMeals] = useState<number>(5);
  const [constraints, setConstraints] = useState<Set<Constraint>>(new Set());

  // ClinicalContext do paciente selecionado (RLS-aware).
  const fetchContext = useServerFn(getClinicalContext);
  const ctxQuery = useQuery({
    queryKey: ["clinical-context", patient?.id],
    queryFn: () =>
      patient ? fetchContext({ data: { patientId: patient.id } }) : null,
    enabled: !!patient,
    staleTime: 60_000,
  });
  const ctx = ctxQuery.data ?? null;

  // Quando o contexto chega e é calculable, recalcula alvo determinístico
  // via engine puro e pré-popula os campos. NUNCA inventa dado faltante.
  useEffect(() => {
    if (!ctx || !ctx.calculable) return;
    const { demographics, currentWeight, currentGoal } = ctx;
    if (
      !demographics.sex ||
      demographics.ageYears == null ||
      demographics.heightCm == null ||
      !demographics.activity ||
      !currentWeight ||
      !currentGoal
    ) return;
    try {
      const { target } = runNutritionEnginesManual({
        sex: demographics.sex,
        ageYears: demographics.ageYears,
        weightKg: currentWeight.weightKg,
        heightCm: demographics.heightCm,
        activity: demographics.activity,
        goal: clinicalGoalToEngine(currentGoal.kind),
      });
      setKcal(target.kcal);
      setProteinG(target.proteinG);
      setCarbG(target.carbG);
      setFatG(target.fatG);
    } catch {
      // ignora — mantém valores atuais
    }
  }, [ctx]);

  const ranked = useMemo<MatchResult[]>(() => {
    const metas = systemTemplates.map(toMeta);
    return matchTemplates({
      target: { kcal, proteinG, carbG, fatG },
      mealsPerDay: meals,
      restrictions: Array.from(constraints),
      templates: metas,
    });
  }, [kcal, proteinG, carbG, fatG, meals, constraints]);

  const toggle = (c: Constraint) => {
    setConstraints((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <div className="border border-border rounded-lg bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium">Sugerir template por alvo nutricional</span>
          <span className="text-[10px] font-mono uppercase text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-2">
            matcher · score 0–100
          </span>
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Paciente (opcional · auto-preenche alvo)
            </p>
            <RealPatientPicker value={patient} onChange={setPatient} />
            {patient && ctx && !ctx.calculable && (
              <p className="text-[10px] font-mono text-amber-400/90">
                Anamnese de {patient.fullName} incompleta para cálculo
                (faltando: {ctx.missingForCalc.join(", ") || "—"}). Preencha os
                campos manualmente.
              </p>
            )}
            {patient && ctx?.calculable && (
              <p className="text-[10px] font-mono text-primary/80">
                Alvo recalculado pelo motor a partir da anamnese aprovada de{" "}
                {patient.fullName}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <NumInput label="kcal alvo" value={kcal} onChange={setKcal} step={50} />
            <NumInput label="prot (g)" value={proteinG} onChange={setProteinG} step={5} />
            <NumInput label="carb (g)" value={carbG} onChange={setCarbG} step={5} />
            <NumInput label="gord (g)" value={fatG} onChange={setFatG} step={5} />
            <NumInput label="refeições/dia" value={meals} onChange={setMeals} step={1} min={2} max={8} />
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Restrições obrigatórias
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CONSTRAINT_LABELS) as Constraint[]).map((c) => {
                const active = constraints.has(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggle(c)}
                    className={
                      "text-xs px-2.5 py-1 rounded-full border transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {CONSTRAINT_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Target className="size-3" />
              Top 5 templates por compatibilidade
            </p>
            {ranked.slice(0, 5).map((r) => (
              <ScoreRow key={r.templateId} r={r} onPick={onPickTemplate} />
            ))}
            {ranked.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Nenhum template na biblioteca.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({ r, onPick }: { r: MatchResult; onPick?: (id: string) => void }) {
  const ok = r.autoSelectable;
  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded border border-border bg-background">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{r.name}</span>
          <span
            className={
              "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border " +
              (ok
                ? "text-primary border-primary/40"
                : "text-muted-foreground border-border")
            }
          >
            {ok ? "auto-selecionável" : "abaixo do limite"}
          </span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
          kcal {r.breakdown.kcal}/40 · macros {r.breakdown.macros}/40 · restrições{" "}
          {r.breakdown.constraints}/20
          {r.reasons.length > 0 && " · " + r.reasons.slice(0, 2).join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-12 text-right">
          <div className="text-base font-bold tracking-tighter">{r.score}</div>
          <div className="text-[9px] font-mono text-muted-foreground -mt-1">score</div>
        </div>
        {onPick && (
          <button
            onClick={() => onPick(r.templateId)}
            className="text-[10px] font-mono uppercase px-2 py-1 rounded border border-border hover:border-primary/40 hover:text-primary"
          >
            abrir
          </button>
        )}
      </div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs font-mono"
      />
    </label>
  );
}
