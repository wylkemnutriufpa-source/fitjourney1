// Sprint 2 — Pré-plano automático ao aprovar anamnese.
//
// Esta função é chamada DENTRO de reviewAnamnesis quando decision='approved'.
// É um helper server-side puro que recebe o supabase client autenticado
// (RLS-aware) e tenta criar um draft de plano sugerido. NUNCA bloqueia a
// aprovação — qualquer erro é tratado pelo caller e ignorado.
//
// Ajustes aprovados pelo usuário sobre a proposta original:
//
//   1. Salva Top 3 do matcher em snapshot.meta.matcher (auditoria + futuro
//      sistema de aprendizado "matcher sugeriu A vs nutri trocou para B").
//   2. NÃO depende exclusivamente de autoSelectable (threshold 80).
//      Threshold real:
//        score >= 80  → cria draft, confidence='high'
//        score 65-79  → cria draft, confidence='medium'
//        score < 65   → não cria
//   3. Idempotente: se já existe QUALQUER draft para o paciente,
//      não sobrescreve. Devolve { skipped: 'existing_draft' } para o caller
//      decidir o que fazer (no MVP: nada — a próxima aprovação não recria,
//      o nutri precisa lidar com o draft existente primeiro).
//   4. Registra score, confidence, alternatives e razões no snapshot.meta
//      (imutável após published_at via trigger).

import { templates as SYSTEM_TEMPLATES, type DietTemplate } from "@/lib/template-data";
import { toPlannerTemplate } from "@/lib/meal-planner";
import { matchTemplates } from "@/lib/engine/matcher";
import type { TemplateMeta, Goal } from "@/lib/engine/types";
import { buildClinicalContext } from "@/lib/clinical/context";
import { runNutritionEngines } from "@/lib/clinical/run-nutrition-engines";
import {
  CanonicalAnamnesisSchema,
  type CanonicalAnamnesis,
} from "@/lib/anamnesis/canonical.schema";
import type { ApprovedAnamnesisInput } from "@/lib/clinical/resolve-goal";
import type { WeightReading } from "@/lib/clinical/resolve-weight";
import { ENGINE_VERSION } from "@/lib/engine/version";

export type DraftAutoPlanOutcome =
  | { kind: "created"; planId: string; score: number; confidence: "high" | "medium"; selectedTemplateKey: string }
  | { kind: "skipped"; reason: "existing_draft" | "no_clinical_context" | "low_score" | "no_templates"; detail?: string }
  | { kind: "error"; message: string };

const MIN_SCORE = 65;
const HIGH_CONFIDENCE = 80;
const KCAL_RANGE_PCT = 0.15;

type Sb = { from: (t: string) => any };

/**
 * Gera draft auto-sugerido a partir do estado clínico atual do paciente.
 * Idempotente. Nunca lança — devolve outcome estruturado para o caller logar.
 */
export async function generateDraftPlanFromApproval(
  supabase: Sb,
  patientId: string,
  nutritionistId: string,
): Promise<DraftAutoPlanOutcome> {
  try {
    // ---- 1) Idempotência: qualquer draft existente bloqueia (auto ou manual).
    const { data: existingDrafts, error: dErr } = await supabase
      .from("plans")
      .select("id")
      .eq("patient_id", patientId)
      .eq("status", "draft")
      .limit(1);
    if (dErr) return { kind: "error", message: dErr.message };
    if (existingDrafts && existingDrafts.length > 0) {
      return { kind: "skipped", reason: "existing_draft" };
    }

    // ---- 2) ClinicalContext + motores.
    const ctx = await loadCtx(supabase, patientId);
    if (!ctx.calculable) {
      return {
        kind: "skipped",
        reason: "no_clinical_context",
        detail: `missing=${ctx.missingForCalc.join(",")}`,
      };
    }
    const engineOut = runNutritionEngines(ctx);
    if (!engineOut) return { kind: "skipped", reason: "no_clinical_context" };

    // ---- 3) Restrições do paciente (anamnese aprovada mais recente).
    const restrictions = await loadRestrictions(supabase, patientId);

    // ---- 4) Matcher sobre os 20 templates do sistema.
    const templateMetas = SYSTEM_TEMPLATES.map(toTemplateMeta);
    if (templateMetas.length === 0) {
      return { kind: "skipped", reason: "no_templates" };
    }
    const ranked = matchTemplates({
      target: engineOut.target,
      restrictions,
      mealsPerDay: null,
      templates: templateMetas,
    });
    const top1 = ranked[0];
    if (!top1 || top1.score < MIN_SCORE) {
      return { kind: "skipped", reason: "low_score", detail: `top=${top1?.score ?? 0}` };
    }
    const confidence: "high" | "medium" = top1.score >= HIGH_CONFIDENCE ? "high" : "medium";
    const top3 = ranked.slice(0, 3);

    // ---- 5) Materializa snapshot do template escolhido + meta de auditoria.
    const chosen = SYSTEM_TEMPLATES.find((t) => t.id === top1.templateId);
    if (!chosen) {
      return { kind: "error", message: `template ${top1.templateId} not found in system catalog` };
    }
    const planner = toPlannerTemplate(chosen);
    const generatedAt = new Date().toISOString();

    const snapshot = {
      ...planner,
      // Auditoria do matcher — vive em meta para não conflitar com clinicalAudit
      // (que só é anexado em publicação, não em draft).
      meta: {
        autoSuggested: true,
        generatedAt,
        engineVersion: ENGINE_VERSION,
        engineTarget: engineOut.target,
        engineGoal: engineOut.engineGoal,
        clinicalGoalKind: engineOut.clinicalGoalKind,
        matcher: {
          selected: top1.templateId,
          score: top1.score,
          confidence,
          reasons: top1.reasons,
          alternatives: top3.map((r) => ({
            template: r.templateId,
            name: r.name,
            score: r.score,
            breakdown: r.breakdown,
          })),
        },
      },
    };

    // ---- 6) Insere draft. Snapshot NÃO é congelado até published_at.
    const { data: inserted, error: iErr } = await supabase
      .from("plans")
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        schema_version: 3,
        status: "draft",
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        source_template_key: top1.templateId,
      })
      .select("id")
      .single();
    if (iErr || !inserted) {
      return { kind: "error", message: iErr?.message ?? "insert failed" };
    }
    return {
      kind: "created",
      planId: inserted.id,
      score: top1.score,
      confidence,
      selectedTemplateKey: top1.templateId,
    };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// Helpers internos.
// ---------------------------------------------------------------------------

function toTemplateMeta(t: DietTemplate): TemplateMeta {
  const kcal = t.kcal ?? null;
  const range = kcal != null ? Math.round(kcal * KCAL_RANGE_PCT) : 0;
  // O engine Goal aceita apenas cut|bulk|maintain. "performance" e "health"
  // já foram considerados pelo mapeamento ClinicalGoalKind→EngineGoal; aqui
  // projetamos os tags do template para o mesmo vocabulário.
  const goalTag = projectGoalTag(t.goalTag);
  return {
    id: t.id,
    name: t.name,
    kcalTarget: kcal,
    kcalRangeMin: kcal != null ? kcal - range : null,
    kcalRangeMax: kcal != null ? kcal + range : null,
    proteinGTarget: t.proteinGTarget ?? null,
    carbGTarget: t.carbGTarget ?? null,
    fatGTarget: t.fatGTarget ?? null,
    mealsPerDay: Array.isArray(t.meals) ? t.meals.length : null,
    constraintsTags: Array.isArray(t.tags) ? t.tags : [],
    goalTag,
  };
}

function projectGoalTag(tag: DietTemplate["goalTag"]): Goal | null {
  if (!tag) return null;
  if (tag === "performance") return "bulk";
  if (tag === "health") return "maintain";
  return tag;
}

async function loadCtx(supabase: Sb, patientId: string) {
  const [anamnesesRes, feedbacksRes] = await Promise.all([
    supabase
      .from("anamneses")
      .select("id, approved_at, data")
      .eq("patient_id", patientId)
      .eq("review_status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false }),
    supabase
      .from("patient_feedbacks")
      .select("id, created_at, weight_kg")
      .eq("patient_id", patientId)
      .not("weight_kg", "is", null)
      .order("created_at", { ascending: false }),
  ]);
  if (anamnesesRes.error) throw new Error(anamnesesRes.error.message);
  if (feedbacksRes.error) throw new Error(feedbacksRes.error.message);

  const approvedAnamneses: ApprovedAnamnesisInput[] = [];
  for (const row of anamnesesRes.data ?? []) {
    if (!row.approved_at) continue;
    const canonical = extractCanonical(row.data);
    if (!canonical) continue;
    approvedAnamneses.push({
      id: row.id,
      approvedAt: row.approved_at,
      canonical: { basics: canonical.basics },
    });
  }
  const weightReadings: WeightReading[] = [];
  for (const f of feedbacksRes.data ?? []) {
    if (f.weight_kg == null) continue;
    weightReadings.push({
      source: "feedback",
      weightKg: Number(f.weight_kg),
      measuredAt: f.created_at,
      sourceId: f.id,
    });
  }
  for (const a of approvedAnamneses) {
    const w = a.canonical.basics?.weightKg;
    if (typeof w === "number" && w > 0) {
      weightReadings.push({
        source: "anamnesis",
        weightKg: w,
        measuredAt: a.approvedAt,
        sourceId: a.id,
      });
    }
  }
  return buildClinicalContext({ patientId, weightReadings, approvedAnamneses });
}

async function loadRestrictions(supabase: Sb, patientId: string): Promise<string[]> {
  const { data } = await supabase
    .from("anamneses")
    .select("data")
    .eq("patient_id", patientId)
    .eq("review_status", "approved")
    .not("approved_at", "is", null)
    .order("approved_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const canonical = extractCanonical(data?.data);
  return canonical?.nutritionProfile?.restrictions ?? [];
}

function extractCanonical(raw: unknown): CanonicalAnamnesis | null {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as { canonical?: unknown };
  const parsed = CanonicalAnamnesisSchema.safeParse(envelope.canonical);
  return parsed.success ? parsed.data : null;
}
