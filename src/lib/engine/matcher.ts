// Phase 2 — Template Matcher
// Score ponderado: kcal 40% + macros 40% + restrições 20%.
// Determinístico. Puro. Sem IO.

import type { MacroTarget, MatchResult, TemplateMeta } from "./types";

const KCAL_WEIGHT = 40;
const MACROS_WEIGHT = 40;
const CONSTRAINTS_WEIGHT = 20;
const AUTO_SELECT_THRESHOLD = 80;

const KCAL_TOLERANCE_PCT = 0.1; // ±10% considerado match perfeito de kcal
const MACRO_TOLERANCE_PCT = 0.1; // ±10% considerado match perfeito por macro

export interface MatchInput {
  readonly target: MacroTarget;
  readonly restrictions: ReadonlyArray<string>;
  readonly mealsPerDay: number | null;
  readonly templates: ReadonlyArray<TemplateMeta>;
}

export function matchTemplates(input: MatchInput): MatchResult[] {
  const { target, restrictions, mealsPerDay, templates } = input;
  const results = templates.map((t) =>
    scoreTemplate(t, target, restrictions, mealsPerDay),
  );
  return results.sort((a, b) => b.score - a.score);
}

function scoreTemplate(
  t: TemplateMeta,
  target: MacroTarget,
  restrictions: ReadonlyArray<string>,
  mealsPerDay: number | null,
): MatchResult {
  const reasons: string[] = [];

  // --- kcal score (0-40) ---
  const kcalScore = scoreKcal(t, target, reasons);

  // --- macros score (0-40) ---
  const macroScore = scoreMacros(t, target, reasons);

  // --- constraints score (0-20) ---
  const constraintScore = scoreConstraints(t, restrictions, reasons);

  // --- meals per day (soft penalty in reasons only) ---
  if (
    mealsPerDay !== null &&
    t.mealsPerDay !== null &&
    t.mealsPerDay !== mealsPerDay
  ) {
    reasons.push(
      `Refeições/dia diferentes (template: ${t.mealsPerDay}, alvo: ${mealsPerDay})`,
    );
  }

  const score = Math.round(kcalScore + macroScore + constraintScore);

  return {
    templateId: t.id,
    name: t.name,
    score,
    autoSelectable: score >= AUTO_SELECT_THRESHOLD,
    breakdown: {
      kcal: Math.round(kcalScore),
      macros: Math.round(macroScore),
      constraints: Math.round(constraintScore),
    },
    reasons,
  };
}

function scoreKcal(
  t: TemplateMeta,
  target: MacroTarget,
  reasons: string[],
): number {
  if (t.kcalTarget === null) {
    reasons.push("Template sem kcal_target — score de kcal = 0");
    return 0;
  }

  // Se template tem range, considera match pleno dentro do range.
  if (t.kcalRangeMin !== null && t.kcalRangeMax !== null) {
    if (target.kcal >= t.kcalRangeMin && target.kcal <= t.kcalRangeMax) {
      return KCAL_WEIGHT;
    }
  }

  const diffPct = Math.abs(t.kcalTarget - target.kcal) / target.kcal;
  if (diffPct <= KCAL_TOLERANCE_PCT) return KCAL_WEIGHT;

  // Decai linear até 30% de desvio (score = 0)
  const decayed = Math.max(
    0,
    1 - (diffPct - KCAL_TOLERANCE_PCT) / (0.3 - KCAL_TOLERANCE_PCT),
  );
  if (decayed < 1) {
    reasons.push(
      `Desvio de calorias: ${Math.round(diffPct * 100)}% (alvo ${target.kcal}, template ${t.kcalTarget})`,
    );
  }
  return KCAL_WEIGHT * decayed;
}

function scoreMacros(
  t: TemplateMeta,
  target: MacroTarget,
  reasons: string[],
): number {
  const pairs: Array<[string, number | null, number]> = [
    ["proteína", t.proteinGTarget, target.proteinG],
    ["carboidrato", t.carbGTarget, target.carbG],
    ["gordura", t.fatGTarget, target.fatG],
  ];

  let sum = 0;
  let counted = 0;

  for (const [label, tplVal, tgtVal] of pairs) {
    if (tplVal === null) continue;
    counted += 1;

    const diffPct = Math.abs(tplVal - tgtVal) / Math.max(1, tgtVal);
    let macroScore: number;
    if (diffPct <= MACRO_TOLERANCE_PCT) {
      macroScore = 1;
    } else {
      macroScore = Math.max(
        0,
        1 - (diffPct - MACRO_TOLERANCE_PCT) / (0.3 - MACRO_TOLERANCE_PCT),
      );
      reasons.push(
        `Desvio de ${label}: ${Math.round(diffPct * 100)}% (alvo ${tgtVal}g, template ${tplVal}g)`,
      );
    }
    sum += macroScore;
  }

  if (counted === 0) {
    reasons.push("Template sem macros declarados — score de macros = 0");
    return 0;
  }
  return (sum / counted) * MACROS_WEIGHT;
}

function scoreConstraints(
  t: TemplateMeta,
  restrictions: ReadonlyArray<string>,
  reasons: string[],
): number {
  if (restrictions.length === 0) return CONSTRAINTS_WEIGHT;

  const tplSet = new Set(t.constraintsTags.map((s) => s.toLowerCase()));
  const missing: string[] = [];
  for (const r of restrictions) {
    if (!tplSet.has(r.toLowerCase())) missing.push(r);
  }

  if (missing.length === 0) return CONSTRAINTS_WEIGHT;

  reasons.push(`Restrições não atendidas: ${missing.join(", ")}`);
  const ratio = 1 - missing.length / restrictions.length;
  return CONSTRAINTS_WEIGHT * ratio;
}
