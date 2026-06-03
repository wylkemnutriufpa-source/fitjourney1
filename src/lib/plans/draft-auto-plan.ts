// Sprint 2.5 — Pré-plano automático via ROTEADOR determinístico.
//
// Substitui o matcher de score por um roteador puro de 3 prioridades:
//   1) Restrição clínica prioritária → template da restrição.
//   2) Caso contrário → família por objetivo (cut/bulk/maintain).
//   3) Dentro da família → kcal mais próxima do TDEE.
//
// Sem score, sem ranking, sem top-3, sem confidence.
// O nutricionista ajusta o resto no editor.
//
// Esta função é chamada DENTRO de reviewAnamnesis quando decision='approved'.
// Helper server-side puro que recebe o supabase client autenticado (RLS-aware)
// e tenta criar um draft de plano sugerido. NUNCA bloqueia a aprovação —
// qualquer erro é tratado pelo caller e ignorado.
//
// Idempotência: se já existe QUALQUER draft para o paciente, não cria outro.

import { templates as SYSTEM_TEMPLATES, type DietTemplate } from "@/lib/template-data";
import { toPlannerTemplate } from "@/lib/meal-planner";
import { routeTemplate } from "@/lib/engine/router";
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
  | {
      kind: "created";
      planId: string;
      selectedTemplateKey: string;
      reason: string;
    }
  | {
      kind: "skipped";
      reason:
        | "existing_draft"
        | "no_clinical_context"
        | "no_template_for_goal"
        | "no_templates";
      detail?: string;
    }
  | { kind: "error"; message: string };

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
    // ---- 1) Idempotência ----
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

    // ---- 2) ClinicalContext + motores ----
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

    // ---- 3) Restrições clínicas do paciente ----
    const restrictions = await loadRestrictions(supabase, patientId);

    // ---- 4) Roteador ----
    const templateMetas = SYSTEM_TEMPLATES.map(toTemplateMeta);
    if (templateMetas.length === 0) {
      return { kind: "skipped", reason: "no_templates" };
    }
    const match = routeTemplate({
      tdeeKcal: engineOut.tdee,
      engineGoal: engineOut.engineGoal,
      restrictions,
      templates: templateMetas,
    });
    if (!match) {
      return {
        kind: "skipped",
        reason: "no_template_for_goal",
        detail: `goal=${engineOut.engineGoal}`,
      };
    }

    // ---- 5) Materializa snapshot do template escolhido ----
    const chosen = SYSTEM_TEMPLATES.find((t) => t.id === match.templateKey);
    if (!chosen) {
      return {
        kind: "error",
        message: `template ${match.templateKey} not found in system catalog`,
      };
    }
    const planner = toPlannerTemplate(chosen);
    const generatedAt = new Date().toISOString();

    const snapshot = {
      ...planner,
      meta: {
        autoSuggested: true,
        generatedAt,
        engineVersion: ENGINE_VERSION,
        engineTarget: engineOut.target,
        engineGoal: engineOut.engineGoal,
        clinicalGoalKind: engineOut.clinicalGoalKind,
        router: {
          selected: match.templateKey,
          reason: match.reason,
          priority: match.priority,
        },
      },
    };

    // ---- 6) Insere draft ----
    const { data: inserted, error: iErr } = await supabase
      .from("plans")
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        schema_version: 3,
        status: "draft",
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        source_template_key: match.templateKey,
      })
      .select("id")
      .single();
    if (iErr || !inserted) {
      return { kind: "error", message: iErr?.message ?? "insert failed" };
    }
    return {
      kind: "created",
      planId: inserted.id,
      selectedTemplateKey: match.templateKey,
      reason: match.reason,
    };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTemplateMeta(t: DietTemplate): TemplateMeta {
  const kcal = t.kcal ?? null;
  const goalTag = projectGoalTag(t.goalTag);
  return {
    id: t.id,
    name: t.name,
    kcalTarget: kcal,
    kcalRangeMin: null,
    kcalRangeMax: null,
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

async function loadRestrictions(
  supabase: Sb,
  patientId: string,
): Promise<string[]> {
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
  // União: restrições explícitas + clinicalTags + riskFlags. Tudo passa pelo
  // normalizador do roteador.
  const out = new Set<string>();
  for (const r of canonical?.nutritionProfile?.restrictions ?? []) out.add(r);
  for (const t of canonical?.clinicalTags ?? []) out.add(t);
  for (const f of canonical?.riskFlags ?? []) out.add(f);
  return Array.from(out);
}

function extractCanonical(raw: unknown): CanonicalAnamnesis | null {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as { canonical?: unknown };
  const parsed = CanonicalAnamnesisSchema.safeParse(envelope.canonical);
  return parsed.success ? parsed.data : null;
}
