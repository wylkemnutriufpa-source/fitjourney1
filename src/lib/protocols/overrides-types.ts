// Tipos do payload de overrides editáveis pelo admin.
// Camada informativa por cima do catálogo hardcoded — NÃO substitui o snapshot
// imutável de refeições do paciente. Só adiciona/remove conteúdo textual.
//
// Determinístico. Sem IO.

import type { GoldenTip } from "./golden-tips";
import type {
  PhaseTea,
  MethodologyPillar,
  MethodologyRule,
} from "./catalog";

/**
 * Payload aplicado por escopo:
 *  - protocolo inteiro  (module_id=null, phase_id=null)  → `goldenTips`
 *  - fase específica    (module_id=X,    phase_id=Y)     → tips/teas/strategies/pillars/rules
 *
 * Todos os campos são opcionais. Quando presentes, são APENDADOS após o
 * conteúdo hardcoded — nunca sobrescrevem. (Remoção fica para Fase 2.)
 */
export interface ProtocolOverridePayload {
  readonly name?: string;
  readonly goldenTips?: ReadonlyArray<GoldenTip>;
  readonly tips?: ReadonlyArray<GoldenTip>;
  readonly teas?: ReadonlyArray<PhaseTea>;
  readonly strategies?: ReadonlyArray<string>;
  readonly pillars?: ReadonlyArray<MethodologyPillar>;
  readonly rules?: ReadonlyArray<MethodologyRule>;
}

export interface ProtocolOverrideRow {
  readonly id: string;
  readonly protocolId: string;
  readonly moduleId: string | null;
  readonly phaseId: number | null;
  readonly payload: ProtocolOverridePayload;
  readonly updatedAt: string;
}

/** Chave canônica para indexar overrides em memória. */
export function overrideKey(
  moduleId: string | null,
  phaseId: number | null,
): string {
  return `${moduleId ?? ""}::${phaseId ?? -1}`;
}

export function emptyPayload(): ProtocolOverridePayload {
  return {};
}
