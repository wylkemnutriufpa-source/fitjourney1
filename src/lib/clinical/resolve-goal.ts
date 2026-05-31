// Phase 3 — Clinical foundation
// resolveGoal: deriva a Meta Clínica do paciente a partir do HISTÓRICO de
// anamneses aprovadas.
//
// INVARIANTES:
// 1. Meta NÃO é coluna em `patients`. NÃO é campo mutável. NÃO é cache.
// 2. Meta é derivada da anamnese aprovada MAIS RECENTE (approved_at DESC).
// 3. Mudança de meta = nova anamnese aprovada. Auditoria sai grátis.
// 4. Sem fallback silencioso: sem anamnese aprovada → current = null.
// 5. PURA. Zero IO.

import type { CanonicalAnamnesis } from "@/lib/anamnesis/canonical.schema";

export type GoalKind = "cut" | "maintain" | "bulk" | "performance" | "health";

export interface ClinicalGoal {
  readonly kind: GoalKind;
  readonly sourceAnamnesisId: string;
  readonly decidedAt: string; // approved_at ISO
}

export interface ResolvedGoal {
  readonly current: ClinicalGoal | null;
  readonly history: ReadonlyArray<ClinicalGoal>; // desc por decidedAt
}

export interface ApprovedAnamnesisInput {
  readonly id: string;
  readonly approvedAt: string;
  readonly canonical: Pick<CanonicalAnamnesis, "basics">;
}

export function resolveGoal(
  approvedAnamneses: ReadonlyArray<ApprovedAnamnesisInput>,
): ResolvedGoal {
  const sorted = [...approvedAnamneses]
    .filter(
      (a) =>
        typeof a.approvedAt === "string" &&
        a.approvedAt.length > 0 &&
        a.canonical?.basics?.goal != null,
    )
    .sort((a, b) => Date.parse(b.approvedAt) - Date.parse(a.approvedAt));

  const history: ClinicalGoal[] = sorted.map((a) => ({
    kind: a.canonical.basics.goal as GoalKind,
    sourceAnamnesisId: a.id,
    decidedAt: a.approvedAt,
  }));

  return { current: history[0] ?? null, history };
}
