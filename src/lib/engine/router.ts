// Phase 3 — Roteador determinístico de templates.
//
// "Qual gaveta eu devo abrir primeiro?" — não "qual plano alimentar ideal?".
// Determinístico. Puro. Sem score, sem ranking, sem confidence.
//
// Regra (em ordem):
//   1) Restrição clínica prioritária → template da restrição. FIM.
//   2) Filtra templates pela família do objetivo (cut/bulk/maintain).
//   3) Dentro da família, escolhe o template com kcalTarget mais próximo do TDEE.
//   4) Sem família → retorna null (degradação elegante, invariante #9).
//
// O nutricionista ajusta o resto no editor. O roteador NÃO finge ser clínico.

import type { Goal, TemplateMeta } from "./types";

export type RouterPriority = "restriction" | "goal+kcal";

export interface RouterMatch {
  readonly templateKey: string;
  readonly templateName: string;
  readonly reason: string;
  readonly priority: RouterPriority;
}

export interface RouterInput {
  readonly tdeeKcal: number;
  readonly engineGoal: Goal;
  /** Tags clínicas do paciente vindas da anamnese aprovada. Normalizadas livremente. */
  readonly restrictions: ReadonlyArray<string>;
  readonly templates: ReadonlyArray<TemplateMeta>;
}

/**
 * Ordem fixa de prioridade. Pós-bariátrica e gestante mudam completamente a
 * estratégia alimentar; diabetes muda mais que gastrite; sem-glúten/lactose
 * são ajustes mais simples e ficam por último.
 */
const RESTRICTION_PRIORITY: ReadonlyArray<{ tag: string; templateKey: string }> = [
  { tag: "pos_bariatrica", templateKey: "bar-pos-bariatrica" },
  { tag: "gestante", templateKey: "ges-gestante" },
  { tag: "diabetes", templateKey: "cli-diabetes" },
  { tag: "gastrite", templateKey: "cli-gastrite" },
  { tag: "hipertensao", templateKey: "cli-hipertensao" },
  { tag: "fodmap", templateKey: "cli-fodmap" },
  { tag: "sem_gluten", templateKey: "cli-sem-gluten" },
  { tag: "sem_lactose", templateKey: "cli-sem-lactose" },
];

/** Normaliza tag: lowercase, sem acentos, separadores → underscore. */
function normalizeTag(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Tags de objetivo do template que pertencem a cada família do motor. */
function goalFamily(engineGoal: Goal): ReadonlyArray<string> {
  switch (engineGoal) {
    case "cut":
      return ["cut"];
    case "bulk":
      return ["bulk", "performance"];
    case "maintain":
      return ["maintain", "health"];
  }
}

export function routeTemplate(input: RouterInput): RouterMatch | null {
  const normalizedRestrictions = new Set(input.restrictions.map(normalizeTag));

  // ---- Prioridade 1: restrição clínica ----
  for (const { tag, templateKey } of RESTRICTION_PRIORITY) {
    if (!normalizedRestrictions.has(tag)) continue;
    const tpl = input.templates.find((t) => t.id === templateKey);
    if (!tpl) continue;
    return {
      templateKey: tpl.id,
      templateName: tpl.name,
      reason: `Restrição clínica detectada: ${tag.replace(/_/g, " ")}`,
      priority: "restriction",
    };
  }

  // ---- Prioridade 2: família por objetivo ----
  const family = new Set(goalFamily(input.engineGoal));
  const candidates = input.templates.filter(
    (t) => t.goalTag !== null && family.has(t.goalTag) && t.kcalTarget !== null,
  );
  if (candidates.length === 0) return null;

  // ---- Prioridade 3: kcal mais próxima ----
  let chosen = candidates[0];
  let bestDiff = Math.abs((chosen.kcalTarget ?? 0) - input.tdeeKcal);
  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs((candidates[i].kcalTarget ?? 0) - input.tdeeKcal);
    if (diff < bestDiff) {
      bestDiff = diff;
      chosen = candidates[i];
    }
  }

  return {
    templateKey: chosen.id,
    templateName: chosen.name,
    reason: `Objetivo ${input.engineGoal} · TDEE ${input.tdeeKcal} kcal → template ${chosen.kcalTarget} kcal`,
    priority: "goal+kcal",
  };
}
