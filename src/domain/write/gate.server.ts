// Domain Write Layer — Enforcement Gate
// Server-only. Toda mutação de identidade DEVE passar por aqui.
//
// Responsabilidades:
//   1. Exigir autenticação (delegado a requireSupabaseAuth no caller).
//   2. Resolver estado de identidade (S1/S2/S3).
//   3. Validar estado permitido (assertState).
//   4. Validar role quando aplicável (assertRole).
//   5. Emitir auditEvent de gate (ok/rejected/failed).
//   6. Entregar ao handler: { data, identity, admin } — onde admin é o
//      cliente service_role (única forma de escrever após o lockdown
//      de GRANTs nas tabelas de identidade).
//
// Invariante: nenhum handler dentro de src/domain/write recebe acesso
// ao banco sem passar por este gate.

import type { Phase2Flow } from "@/lib/phase2/audit.server";
import { auditEvent } from "@/lib/phase2/audit.server";
import {
  assertRole,
  assertState,
  resolveIdentityState,
  type IdentityState,
  type ProfileRole,
  type ResolvedIdentity,
} from "@/lib/phase2/identity-state.server";
import { isPhase2Error } from "@/lib/phase2/errors";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface DomainGateConfig {
  flow: Phase2Flow;
  /** Estados que podem executar esta mutação. */
  allowedStates: IdentityState[];
  /** Se setado, exige S3 + role específica (sobrepõe allowedStates). */
  requiredRole?: ProfileRole;
}

export interface DomainGateContext<TData> {
  data: TData;
  identity: ResolvedIdentity;
  /** Cliente service_role. ÚNICA superfície de escrita pós-lockdown. */
  admin: typeof supabaseAdmin;
  userId: string;
}

/**
 * Envelopa um handler de createServerFn aplicando o gate de domínio.
 *
 * Uso esperado dentro de uma server fn já protegida por
 * `requireSupabaseAuth` (que fornece `context.supabase` + `context.userId`).
 */
export function withDomainGate<TData, TResult>(
  config: DomainGateConfig,
  handler: (ctx: DomainGateContext<TData>) => Promise<TResult>,
) {
  return async ({
    data,
    context,
  }: {
    data: TData;
    context: { supabase: unknown; userId: string; claims?: unknown };
  }): Promise<TResult> => {
    const { userId } = context;
    // Usa o client autenticado do caller só para resolver identidade
    // (lê profile via RLS do próprio user). Escrita NUNCA usa esse client.
    const authedSupabase = context.supabase as Parameters<
      typeof resolveIdentityState
    >[0];

    let identity: ResolvedIdentity;
    try {
      identity = await resolveIdentityState(authedSupabase, userId);
    } catch (e) {
      auditEvent({
        flow: config.flow,
        step: "gate.identity.resolve",
        outcome: "failed",
        userId,
        reason: "RESOLVE_ERROR",
        details: { message: e instanceof Error ? e.message : String(e) },
      });
      throw e;
    }

    try {
      if (config.requiredRole) {
        assertRole(identity, config.requiredRole);
      } else {
        assertState(identity, config.allowedStates);
      }
    } catch (e) {
      auditEvent({
        flow: config.flow,
        step: "gate.assert",
        outcome: "rejected",
        userId,
        state: identity.state,
        reason: isPhase2Error(e) ? e.code : "STATE_REJECTED",
      });
      throw e;
    }

    auditEvent({
      flow: config.flow,
      step: "gate.pass",
      outcome: "ok",
      userId,
      state: identity.state,
    });

    return handler({ data, identity, admin: supabaseAdmin, userId });
  };
}
