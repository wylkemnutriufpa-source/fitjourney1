// Phase 3 — Clinical foundation
// buildClinicalTimeline: camada lógica que UNIFICA eventos clínicos do paciente.
//
// INVARIANTES:
// 1. Camada LÓGICA. NÃO cria tabela, schema, persistência ou cache.
// 2. Read-only. Zero inferência. Zero normalização. Zero recálculo.
// 3. Não substitui `anamneses`, `patient_feedbacks`, `plans` como fonte de verdade
//    — apenas projeta esses dados num eixo temporal único.
// 4. Eventos derivados em runtime (ex.: weight_change, goal_change) NÃO são
//    persistidos. Cada consumidor calcula se precisar.
// 5. Ordenação: occurredAt DESC. Tiebreaker técnico por type (estável).
//
// PURA. Zero IO. Zero Supabase. Zero React.

export type ClinicalEventType =
  | "anamnesis_submitted"
  | "anamnesis_approved"
  | "feedback_submitted"
  | "plan_published"
  | "physical_assessment_recorded"; // futuro

export type ClinicalEventSource =
  | "anamneses"
  | "patient_feedbacks"
  | "plans"
  | "physical_assessments";

export interface ClinicalEvent {
  readonly id: string; // estável: `${source}:${sourceId}:${type}`
  readonly type: ClinicalEventType;
  readonly occurredAt: string; // ISO
  readonly patientId: string;
  readonly source: ClinicalEventSource;
  readonly sourceId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface TimelineAnamnesisRow {
  readonly id: string;
  readonly patient_id: string;
  readonly review_status: string;
  readonly submitted_at: string | null;
  readonly approved_at: string | null;
  readonly version: number;
}

export interface TimelineFeedbackRow {
  readonly id: string;
  readonly patient_id: string;
  readonly created_at: string;
  readonly weight_kg: number | null;
  readonly adherence_rating: string | null;
  readonly result_rating: string | null;
}

export interface TimelinePlanRow {
  readonly id: string;
  readonly patient_id: string;
  readonly published_at: string | null;
  readonly status: string;
  readonly schema_version: number;
}

export interface TimelineInput {
  readonly anamneses: ReadonlyArray<TimelineAnamnesisRow>;
  readonly feedbacks: ReadonlyArray<TimelineFeedbackRow>;
  readonly plans: ReadonlyArray<TimelinePlanRow>;
}

const TYPE_RANK: Readonly<Record<ClinicalEventType, number>> = {
  plan_published: 5,
  anamnesis_approved: 4,
  physical_assessment_recorded: 3,
  feedback_submitted: 2,
  anamnesis_submitted: 1,
};

export function buildClinicalTimeline(
  input: TimelineInput,
): ReadonlyArray<ClinicalEvent> {
  const events: ClinicalEvent[] = [];

  for (const a of input.anamneses) {
    if (a.submitted_at) {
      events.push({
        id: `anamneses:${a.id}:anamnesis_submitted`,
        type: "anamnesis_submitted",
        occurredAt: a.submitted_at,
        patientId: a.patient_id,
        source: "anamneses",
        sourceId: a.id,
        payload: { version: a.version, reviewStatus: a.review_status },
      });
    }
    if (a.approved_at && a.review_status === "approved") {
      events.push({
        id: `anamneses:${a.id}:anamnesis_approved`,
        type: "anamnesis_approved",
        occurredAt: a.approved_at,
        patientId: a.patient_id,
        source: "anamneses",
        sourceId: a.id,
        payload: { version: a.version },
      });
    }
  }

  for (const f of input.feedbacks) {
    events.push({
      id: `patient_feedbacks:${f.id}:feedback_submitted`,
      type: "feedback_submitted",
      occurredAt: f.created_at,
      patientId: f.patient_id,
      source: "patient_feedbacks",
      sourceId: f.id,
      payload: {
        weightKg: f.weight_kg,
        adherenceRating: f.adherence_rating,
        resultRating: f.result_rating,
      },
    });
  }

  for (const p of input.plans) {
    if (p.published_at && p.status === "published") {
      events.push({
        id: `plans:${p.id}:plan_published`,
        type: "plan_published",
        occurredAt: p.published_at,
        patientId: p.patient_id,
        source: "plans",
        sourceId: p.id,
        payload: { schemaVersion: p.schema_version },
      });
    }
  }

  events.sort((a, b) => {
    const ta = Date.parse(a.occurredAt);
    const tb = Date.parse(b.occurredAt);
    if (tb !== ta) return tb - ta;
    return TYPE_RANK[b.type] - TYPE_RANK[a.type];
  });

  return events;
}
