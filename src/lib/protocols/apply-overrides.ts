// Merge puro: catálogo hardcoded + overrides do admin.
// Append-only nesta Fase 1. Nada é sobrescrito.
//
// Determinístico. Sem IO.

import type {
  ProtocolPhase,
  ProtocolModule,
  PhaseTea,
} from "./catalog";
import type { GoldenTip } from "./golden-tips";
import type {
  ProtocolOverrideRow,
  ProtocolOverridePayload,
} from "./overrides-types";

/** Indexa overrides por chave (moduleId/phaseId). */
export interface OverridesIndex {
  /** Override do protocolo inteiro (module=null, phase=null). */
  readonly protocol: ProtocolOverridePayload;
  /** Map "moduleId::phaseId" → payload da fase. */
  readonly phases: ReadonlyMap<string, ProtocolOverridePayload>;
  /** Map "moduleId::-1" → payload do módulo inteiro (reservado). */
  readonly modules: ReadonlyMap<string, ProtocolOverridePayload>;
}

const EMPTY: ProtocolOverridePayload = Object.freeze({});

export function indexOverrides(rows: ReadonlyArray<ProtocolOverrideRow>): OverridesIndex {
  let protocolPayload: ProtocolOverridePayload = EMPTY;
  const phases = new Map<string, ProtocolOverridePayload>();
  const modules = new Map<string, ProtocolOverridePayload>();
  for (const r of rows) {
    if (r.moduleId === null && r.phaseId === null) {
      protocolPayload = r.payload ?? EMPTY;
    } else if (r.moduleId !== null && r.phaseId !== null) {
      phases.set(`${r.moduleId}::${r.phaseId}`, r.payload ?? EMPTY);
    } else if (r.moduleId !== null && r.phaseId === null) {
      modules.set(r.moduleId, r.payload ?? EMPTY);
    }
  }
  return { protocol: protocolPayload, phases, modules };
}

/** Golden tips merged (hardcoded + protocol-level override). */
export function mergeGoldenTips(
  base: ReadonlyArray<GoldenTip>,
  idx: OverridesIndex,
): ReadonlyArray<GoldenTip> {
  const extra = idx.protocol.goldenTips ?? [];
  if (extra.length === 0) return base;
  return [...base, ...extra];
}

/** Aplica overrides de fase em cima de uma ProtocolPhase. */
export function mergePhase(
  phase: ProtocolPhase,
  moduleId: string,
  idx: OverridesIndex,
): ProtocolPhase {
  const key = `${moduleId}::${phase.id}`;
  const pl = idx.phases.get(key);
  const mod = idx.modules.get(moduleId);
  if (!pl && !mod) return phase;

  const extraTeas: ReadonlyArray<PhaseTea> = [
    ...(mod?.teas ?? []),
    ...(pl?.teas ?? []),
  ];
  const extraStrategies: ReadonlyArray<string> = [
    ...(mod?.strategies ?? []),
    ...(pl?.strategies ?? []),
  ];

  const teaSchedule = extraTeas.length > 0
    ? [...(phase.teaSchedule ?? []), ...extraTeas]
    : phase.teaSchedule;

  const strategies = extraStrategies.length > 0
    ? [...(phase.recommendations.strategies ?? []), ...extraStrategies]
    : phase.recommendations.strategies;

  return {
    ...phase,
    teaSchedule,
    recommendations: {
      ...phase.recommendations,
      strategies,
    },
  };
}

/** Aplica overrides em um módulo inteiro (todas as fases + metodologia). */
export function mergeModule(
  mod: ProtocolModule,
  idx: OverridesIndex,
): ProtocolModule {
  const modPayload = idx.modules.get(mod.id) ?? EMPTY;

  // Mescla metodologia
  let methodology = mod.methodology;
  const extraPillars = modPayload.pillars ?? [];
  const extraRules = modPayload.rules ?? [];
  if (methodology && (extraPillars.length > 0 || extraRules.length > 0)) {
    methodology = {
      ...methodology,
      pillars: [...methodology.pillars, ...extraPillars],
      behavioralRules: [...methodology.behavioralRules, ...extraRules],
    };
  }

  // Mescla cada fase
  const phases = mod.phases.map((p) => mergePhase(p, mod.id, idx));

  return { ...mod, methodology, phases };
}

/** Mescla fase de um snapshot ativo (paciente). Aceita phase "shape lite". */
export function mergeSnapshotPhase<T extends {
  id: number;
  teaSchedule?: ReadonlyArray<{ name: string; time?: string; benefits?: string }>;
  recommendations: { strategies?: ReadonlyArray<string>; teaRoutine?: ReadonlyArray<string> } & Record<string, unknown>;
}>(
  phase: T,
  moduleId: string,
  idx: OverridesIndex,
): T {
  const key = `${moduleId}::${phase.id}`;
  const pl = idx.phases.get(key);
  const mod = idx.modules.get(moduleId);
  if (!pl && !mod) return phase;

  const extraTeas = [...(mod?.teas ?? []), ...(pl?.teas ?? [])];
  const extraStrategies = [...(mod?.strategies ?? []), ...(pl?.strategies ?? [])];

  const teaSchedule = extraTeas.length > 0
    ? [...(phase.teaSchedule ?? []), ...extraTeas]
    : phase.teaSchedule;

  const strategies = extraStrategies.length > 0
    ? [...(phase.recommendations.strategies ?? []), ...extraStrategies]
    : phase.recommendations.strategies;

  return {
    ...phase,
    teaSchedule,
    recommendations: {
      ...phase.recommendations,
      strategies,
    },
  };
}
