// Diagnóstico clínico × protocolo aplicado.
//
// PURO. Zero IO. Zero React. Zero LLM (invariante #8).
//
// Compara o que o ClinicalContext + motores recomendam para o paciente
// com o que o protocolo aplicado entrega hoje. NÃO altera nada. NÃO sugere
// edição automática. Apenas informa o profissional do gap.
//
// Invariantes respeitados:
//  - Nunca bloqueia (#1, #9): se faltar dado clínico, retorna kind="deferred".
//  - Snapshot do protocolo permanece imutável — só lemos.
//  - Renderer burro: este módulo produz DTO; UI só formata.

import type { NutritionEnginesOutput } from "@/lib/clinical/run-nutrition-engines";

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

export type DeltaStatus = "ok" | "warn" | "off";

export interface MetricDiagnosis {
  readonly label: string;
  /** unidade ("kcal" | "g") — apenas para UI */
  readonly unit: "kcal" | "g";
  readonly clinicalTarget: number;
  readonly protocolDelivers: number;
  /** protocolo - alvo. Positivo = protocolo entrega a mais. */
  readonly deltaAbs: number;
  /** delta relativo ao alvo, em pontos percentuais (-100..+∞). */
  readonly deltaPct: number;
  readonly status: DeltaStatus;
}

export interface ProtocolSnapshotForDiagnosis {
  readonly dailyKcalTarget?: number;
  readonly macros?: { protein: number; carb: number; fat: number };
}

export type ProtocolDiagnosis =
  | {
      readonly kind: "ready";
      readonly metrics: ReadonlyArray<MetricDiagnosis>;
      readonly suggestions: ReadonlyArray<string>;
      readonly overallStatus: DeltaStatus;
    }
  | {
      readonly kind: "deferred";
      readonly reason: "missing_clinical_data" | "missing_protocol_targets";
      readonly missing?: ReadonlyArray<string>;
    };

// Limiares clínicos conservadores. Profissional decide; sistema só sinaliza.
const WARN_PCT = 5; // ±5% → atenção
const OFF_PCT = 15; // ±15% → fora da faixa

function classify(deltaPct: number): DeltaStatus {
  const abs = Math.abs(deltaPct);
  if (abs <= WARN_PCT) return "ok";
  if (abs <= OFF_PCT) return "warn";
  return "off";
}

function worst(a: DeltaStatus, b: DeltaStatus): DeltaStatus {
  const rank: Record<DeltaStatus, number> = { ok: 0, warn: 1, off: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function suggestion(metric: MetricDiagnosis): string | null {
  if (metric.status === "ok") return null;
  const dir = metric.deltaAbs < 0 ? "aumentar" : "reduzir";
  const absG = Math.abs(metric.deltaAbs);
  if (metric.unit === "kcal") {
    return `Considere ${dir} ~${absG} kcal no plano para alinhar com a meta clínica.`;
  }
  return `Considere ${dir} ~${absG} g de ${metric.label.toLowerCase()} para alinhar com a meta clínica.`;
}

export function diagnoseProtocolVsClinical(
  snapshot: ProtocolSnapshotForDiagnosis,
  engines: NutritionEnginesOutput | null,
): ProtocolDiagnosis {
  if (!engines) {
    return { kind: "deferred", reason: "missing_clinical_data" };
  }
  if (!snapshot.dailyKcalTarget || !snapshot.macros) {
    return { kind: "deferred", reason: "missing_protocol_targets" };
  }

  const protKcal = snapshot.dailyKcalTarget;
  const protProteinG = Math.round(
    (protKcal * snapshot.macros.protein) / 100 / KCAL_PER_G_PROTEIN,
  );
  const protCarbG = Math.round(
    (protKcal * snapshot.macros.carb) / 100 / KCAL_PER_G_CARB,
  );
  const protFatG = Math.round(
    (protKcal * snapshot.macros.fat) / 100 / KCAL_PER_G_FAT,
  );

  const t = engines.target;

  const metrics: MetricDiagnosis[] = [
    buildMetric("Calorias", "kcal", t.kcal, protKcal),
    buildMetric("Proteína", "g", t.proteinG, protProteinG),
    buildMetric("Carboidrato", "g", t.carbG, protCarbG),
    buildMetric("Gordura", "g", t.fatG, protFatG),
  ];

  const suggestions = metrics
    .map(suggestion)
    .filter((s): s is string => s !== null);

  const overallStatus = metrics.reduce<DeltaStatus>(
    (acc, m) => worst(acc, m.status),
    "ok",
  );

  return { kind: "ready", metrics, suggestions, overallStatus };
}

function buildMetric(
  label: string,
  unit: "kcal" | "g",
  clinicalTarget: number,
  protocolDelivers: number,
): MetricDiagnosis {
  const deltaAbs = protocolDelivers - clinicalTarget;
  const deltaPct =
    clinicalTarget > 0 ? (deltaAbs / clinicalTarget) * 100 : 0;
  return {
    label,
    unit,
    clinicalTarget,
    protocolDelivers,
    deltaAbs,
    deltaPct,
    status: classify(deltaPct),
  };
}
