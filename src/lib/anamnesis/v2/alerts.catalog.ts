// Clinical Alerts catalog — mapeamento determinístico de flags → exibição.
// Renderização burra: este arquivo é a ÚNICA fonte de label/severity para o paciente.
// Flag desconhecida cai em fallback silencioso (não quebra UI).

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertDescriptor {
  label: string;
  severity: AlertSeverity;
  hint?: string;
}

// Tags clínicas (clinical_flags / canonical.clinicalTags)
const CLINICAL_TAGS: Record<string, AlertDescriptor> = {
  diabetes: { label: "Diabetes", severity: "warning" },
  diabetes_type1: { label: "Diabetes tipo 1", severity: "critical" },
  diabetes_type2: { label: "Diabetes tipo 2", severity: "warning" },
  pre_diabetes: { label: "Pré-diabetes", severity: "info" },
  hypothyroidism: { label: "Hipotireoidismo", severity: "info" },
  hyperthyroidism: { label: "Hipertireoidismo", severity: "warning" },
  sop: { label: "SOP", severity: "info" },
  insulin_resistance: { label: "Resistência à insulina", severity: "info" },
  hypertension: { label: "Hipertensão", severity: "warning" },
  high_cholesterol: { label: "Colesterol alto", severity: "info" },
  high_triglycerides: { label: "Triglicerídeos altos", severity: "info" },
  gastritis: { label: "Gastrite", severity: "info" },
  reflux: { label: "Refluxo", severity: "info" },
  ibs: { label: "Síndrome do intestino irritável", severity: "info" },
  constipation: { label: "Constipação", severity: "info" },
  pregnancy: { label: "Gestante", severity: "warning" },
  sleep_apnea: { label: "Apneia do sono", severity: "info" },
  high_training_volume: { label: "Volume de treino alto", severity: "info" },
};

// Risk flags (canonical.riskFlags)
const RISK_FLAGS: Record<string, AlertDescriptor> = {
  uncontrolled_hypertension: {
    label: "Hipertensão não controlada",
    severity: "critical",
    hint: "Sem medicação contínua relatada. Confirme com seu nutricionista.",
  },
  uncontrolled_diabetes: {
    label: "Diabetes sem medicação relatada",
    severity: "critical",
    hint: "Confirme com seu nutricionista.",
  },
  pregnancy_care_required: {
    label: "Acompanhamento gestacional necessário",
    severity: "warning",
  },
  sleep_apnea_followup: {
    label: "Apneia do sono — requer acompanhamento",
    severity: "warning",
  },
};

export function describeFlag(
  flag: string,
  kind: "clinical" | "risk",
): AlertDescriptor | null {
  const dict = kind === "clinical" ? CLINICAL_TAGS : RISK_FLAGS;
  return dict[flag] ?? null;
}

export function describeAllAlerts(input: {
  clinicalFlags: readonly string[];
  riskFlags: readonly string[];
}): Array<AlertDescriptor & { code: string; kind: "clinical" | "risk" }> {
  const seen = new Set<string>();
  const out: Array<AlertDescriptor & { code: string; kind: "clinical" | "risk" }> = [];

  for (const f of input.riskFlags) {
    if (seen.has(`risk:${f}`)) continue;
    seen.add(`risk:${f}`);
    const d = describeFlag(f, "risk");
    if (d) out.push({ ...d, code: f, kind: "risk" });
  }
  for (const f of input.clinicalFlags) {
    if (seen.has(`clinical:${f}`)) continue;
    seen.add(`clinical:${f}`);
    const d = describeFlag(f, "clinical");
    if (d) out.push({ ...d, code: f, kind: "clinical" });
  }

  // ordena: critical → warning → info
  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
