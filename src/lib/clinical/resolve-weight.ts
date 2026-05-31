// Phase 3 — Clinical foundation
// resolveCurrentWeight: fonte ÚNICA do peso clínico atual de um paciente.
//
// INVARIANTES (NÃO QUEBRAR — ver discussão arquitetural):
// 1. Recência absoluta: a leitura mais recente (maior measured_at) ganha.
// 2. Sem janelas de validade por fonte. Sem "peso da AF expira em 90d".
// 3. Sem fallback silencioso: se não há nenhuma leitura, current = null.
//    Os motores entram em modo degradado EXPLÍCITO, nunca chutam.
// 4. Tiebreaker (mesmo timestamp) é puramente técnico, nunca clínico:
//    physical_assessment > feedback > anamnesis.
// 5. Todos os motores (tdee, macros, clinical-gate) e gráficos
//    devem consumir esta função. Uma única verdade.
//
// Esta função é PURA. Zero IO. Zero Supabase. Zero React.

export type WeightSource = "anamnesis" | "physical_assessment" | "feedback";

export interface WeightReading {
  readonly source: WeightSource;
  readonly weightKg: number;
  readonly measuredAt: string; // ISO timestamp
  readonly sourceId: string; // id da row de origem (anamnese/feedback/AF)
}

export interface ResolvedWeight {
  readonly current: WeightReading | null;
  readonly history: ReadonlyArray<WeightReading>; // desc por measuredAt
}

const TIEBREAKER_RANK: Readonly<Record<WeightSource, number>> = {
  physical_assessment: 3,
  feedback: 2,
  anamnesis: 1,
};

export function resolveCurrentWeight(
  readings: ReadonlyArray<WeightReading>,
): ResolvedWeight {
  const valid = readings.filter(
    (r) =>
      Number.isFinite(r.weightKg) &&
      r.weightKg > 0 &&
      typeof r.measuredAt === "string" &&
      r.measuredAt.length > 0,
  );

  const sorted = [...valid].sort((a, b) => {
    const ta = Date.parse(a.measuredAt);
    const tb = Date.parse(b.measuredAt);
    if (tb !== ta) return tb - ta;
    // tiebreaker técnico
    return TIEBREAKER_RANK[b.source] - TIEBREAKER_RANK[a.source];
  });

  return {
    current: sorted[0] ?? null,
    history: sorted,
  };
}
