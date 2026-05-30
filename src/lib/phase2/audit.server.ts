// Phase 2 — Structured audit logger
// Console-only nesta fase. Sem persistência.
// Objetivo: tornar todo evento de identidade observável e determinístico.
//
// Invariante: nenhuma transição S1→S2→S3 pode ocorrer sem audit event.
// Falhas silenciosas são proibidas.

export type Phase2Flow =
  | "signupNutritionist"
  | "createNutritionistProfile";

export type Phase2Outcome =
  | "ok"
  | "rejected"      // entrada inválida ou estado não permitido (esperado)
  | "race_lost"    // perdeu corrida em UNIQUE / atomicidade
  | "failed";       // erro inesperado (bug, infra, provider)

export interface Phase2AuditEvent {
  ts: string;                       // ISO timestamp
  flow: Phase2Flow;
  step: string;                     // ex: "auth.signUp", "profile.insert"
  outcome: Phase2Outcome;
  userId?: string | null;           // pode ser null em pré-auth
  state?: "S1" | "S2" | "S3" | null;
  reason?: string;                  // código curto: EMAIL_NOT_CONFIRMED, UNIQUE_VIOLATION, ...
  details?: Record<string, unknown>;
}

/**
 * Emite um evento estruturado de auditoria Fase 2.
 * Apenas console nesta fase. Persistência entra em Fase 3.
 */
export function auditEvent(event: Omit<Phase2AuditEvent, "ts">): void {
  const payload: Phase2AuditEvent = {
    ts: new Date().toISOString(),
    ...event,
  };

  const tag = `[phase2-audit] ${payload.flow}.${payload.step} :: ${payload.outcome}`;

  if (payload.outcome === "failed") {
    console.error(tag, payload);
    return;
  }
  if (payload.outcome === "rejected" || payload.outcome === "race_lost") {
    console.warn(tag, payload);
    return;
  }
  console.log(tag, payload);
}
