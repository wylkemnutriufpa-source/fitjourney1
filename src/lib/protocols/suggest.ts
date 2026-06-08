// Motor de sugestão de Protocolos FitJourney.
// PURO. Sem IO. Determinístico. Consome apenas dados já presentes na anamnese
// aprovada (clinicalTags + riskFlags) e a meta clínica resolvida.
//
// Invariante: anamnese aprovada é a única fonte clínica. Draft/submitted
// nunca alimentam o motor.

import type { GoalKind } from "@/lib/clinical/resolve-goal";
import {
  PROTOCOL_CATALOG,
  type ProtocolDescriptor,
} from "./catalog";

export interface SuggestInput {
  readonly clinicalFlags: ReadonlyArray<string>;
  readonly riskFlags: ReadonlyArray<string>;
  readonly currentGoal: GoalKind | null;
}

export interface ProtocolSuggestion {
  readonly protocol: ProtocolDescriptor;
  /** Tags/flags que dispararam a sugestão. Auditável. */
  readonly matchedReasons: ReadonlyArray<string>;
  /** Quanto maior, mais forte a indicação (qtd de matches únicos). */
  readonly score: number;
}

export function suggestProtocols(input: SuggestInput): ProtocolSuggestion[] {
  const clinical = new Set(input.clinicalFlags);
  const risk = new Set(input.riskFlags);
  const goal = input.currentGoal;

  const out: ProtocolSuggestion[] = [];

  for (const p of PROTOCOL_CATALOG) {
    const reasons = new Set<string>();

    for (const t of p.triggers.anyClinicalTag ?? []) {
      if (clinical.has(t)) reasons.add(`tag:${t}`);
    }
    for (const f of p.triggers.anyRiskFlag ?? []) {
      if (risk.has(f)) reasons.add(`risk:${f}`);
    }
    if (goal && p.triggers.anyGoal?.includes(goal)) {
      reasons.add(`goal:${goal}`);
    }

    if (reasons.size === 0) continue;
    out.push({
      protocol: p,
      matchedReasons: Array.from(reasons).sort(),
      score: reasons.size,
    });
  }

  // ordena por score desc, exclusivo (IFJ) tem leve preferência em empate
  return out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.protocol.exclusive && !b.protocol.exclusive) return -1;
    if (!a.protocol.exclusive && b.protocol.exclusive) return 1;
    return a.protocol.name.localeCompare(b.protocol.name);
  });
}
