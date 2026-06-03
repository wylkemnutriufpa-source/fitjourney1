// Plans — server fns para listar pacientes do nutri logado e publicar plano.
// Snapshot é congelado no momento do insert (V3). RLS do banco protege tudo.
//
// PIPELINE DE PUBLICAÇÃO (A1+A2):
//   1. Carrega ClinicalContext server-side (peso por recência + anamnese
//      aprovada mais recente).
//   2. Bloqueia se ctx.calculable === false (CLINICAL_CONTEXT_INCOMPLETE).
//   3. Roda motores nutricionais (TMB+TDEE+Macros) a partir do contexto.
//   4. Deriva totais diários do snapshot e roda clinical-gate.
//   5. Bloqueia se gate.blockers.length > 0 (CLINICAL_GATE_BLOCKED).
//   6. Anexa snapshot.clinicalAudit (contexto+motor+warnings+versões)
//      antes de persistir. Snapshot fica imutável após published_at.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateSnapshot, type ClinicalAudit } from "./snapshot.schema";
import { buildClinicalContext, type ClinicalContext } from "@/lib/clinical/context";
import type { ApprovedAnamnesisInput } from "@/lib/clinical/resolve-goal";
import type { WeightReading } from "@/lib/clinical/resolve-weight";
import {
  CanonicalAnamnesisSchema,
  type CanonicalAnamnesis,
} from "@/lib/anamnesis/canonical.schema";
import { runNutritionEngines } from "@/lib/clinical/run-nutrition-engines";
import { validatePlan, type DailyTotals, type FoodOccurrence } from "@/lib/engine/clinical-gate";
import { ENGINE_VERSION, GATE_VERSION } from "@/lib/engine/version";

export type AnamnesisStatusLite =
  | "approved"
  | "submitted"
  | "needs_changes"
  | "draft"
  | "none";

export type PatientLite = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  anamnesisStatus: AnamnesisStatusLite;
  anamnesisUpdatedAt: string | null;
};

export const listMyPatientsForPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatientLite[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) return [];

    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, created_at")
      .eq("nutritionist_id", nutri.id)
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);

    const patients = data ?? [];
    if (patients.length === 0) return [];

    const patientIds = patients.map((p: any) => p.id);
    const { data: anamneses, error: aErr } = await supabase
      .from("anamneses")
      .select("patient_id, review_status, updated_at, approved_at")
      .in("patient_id", patientIds)
      .order("updated_at", { ascending: false });
    if (aErr) throw new Error(aErr.message);

    // Anamnese mais relevante por paciente: aprovada vence; senão a mais recente.
    const byPatient = new Map<string, { status: AnamnesisStatusLite; updatedAt: string }>();
    for (const a of anamneses ?? []) {
      const status = (a.review_status ?? "draft") as AnamnesisStatusLite;
      const updatedAt = a.approved_at ?? a.updated_at;
      const existing = byPatient.get(a.patient_id);
      if (!existing) {
        byPatient.set(a.patient_id, { status, updatedAt });
      } else if (existing.status !== "approved" && status === "approved") {
        byPatient.set(a.patient_id, { status, updatedAt });
      }
    }

    return patients.map((p: any) => {
      const info = byPatient.get(p.id);
      return {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        phone: p.phone ?? null,
        createdAt: p.created_at,
        anamnesisStatus: info?.status ?? "none",
        anamnesisUpdatedAt: info?.updatedAt ?? null,
      };
    });
  });

const PublishInput = z.object({
  patientId: z.string().uuid(),
  snapshot: z.record(z.any()), // PlannerTemplate serializável
  sourceTemplateId: z.string().uuid().optional(),
  /**
   * Slug do template do sistema usado como base (ex: "esp-hipertrofia").
   * Complementa `sourceTemplateId` (UUID, apenas templates salvos pelo nutri).
   * Permite rastrear adesão/abandono por template do sistema.
   */
  sourceTemplateKey: z.string().min(1).max(120).optional(),
  /**
   * Quando true, permite publicar mesmo sem ClinicalContext calculável
   * (paciente sem anamnese aprovada). Motor + gate clínico são pulados;
   * snapshot é salvo como está com flag `publishedWithoutClinicalContext`.
   */
  overrideMissingClinical: z.boolean().optional(),
});

export type PublishPlanResult = {
  id: string;
  publishedAt: string;
};

export const publishPlanToPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PublishInput.parse(input))
  .handler(async ({ data, context }): Promise<PublishPlanResult> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    // Confirma que o paciente pertence ao nutri (RLS faria isso, mas
    // erro explícito é melhor UX que 403 genérico).
    const { data: pat, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pat) throw new Error("Paciente não pertence a você.");

    // ---- 1) ClinicalContext server-side (verdade clínica) ----
    const ctx = await loadClinicalContext(supabase, data.patientId);

    // ---- 2) Caso especial: paciente sem dados clínicos suficientes.
    // Sem `overrideMissingClinical`, mantém comportamento original (bloqueia).
    // Com override=true, pula motor + gate e salva snapshot como está,
    // marcando auditoria com publishedWithoutClinicalContext.
    if (!ctx.calculable) {
      if (!data.overrideMissingClinical) {
        throw new Error(
          `CLINICAL_CONTEXT_INCOMPLETE: missing=[${ctx.missingForCalc.join(",")}]`,
        );
      }

      const { snapshot: snapOnly, review: reviewOnly } = validateSnapshot(data.snapshot);
      const publishedAtOverride = new Date().toISOString();
      // Snapshot de auditoria sem ClinicalContext (fora do schema estrito).
      // Cast via unknown — invariante #9 não se aplica aqui pois o nutri
      // confirmou explicitamente a publicação sem anamnese aprovada.
      const clinicalAuditOverride = {
        clinicalContextSnapshot: {
          currentWeight: null,
          currentGoal: null,
          demographics: {
            sex: ctx.demographics.sex,
            ageYears: ctx.demographics.ageYears,
            heightCm: ctx.demographics.heightCm,
            activity: ctx.demographics.activity,
            sourceAnamnesisId: ctx.demographics.sourceAnamnesisId,
          },
          calculable: false,
        },
        engineOutput: null,
        gateWarnings: [],
        engineVersion: ENGINE_VERSION,
        gateVersion: GATE_VERSION,
        publishedAt: publishedAtOverride,
        publishedWithoutClinicalContext: true,
        missingForCalc: ctx.missingForCalc,
      } as unknown as ClinicalAudit;

      const snapshotOverride = {
        ...snapOnly,
        clinical_review: reviewOnly,
        clinicalAudit: clinicalAuditOverride,
      };

      const insertRowOverride: Record<string, any> = {
        patient_id: data.patientId,
        nutritionist_id: nutri.id,
        schema_version: 3,
        status: "published",
        snapshot: snapshotOverride,
      };
      if (data.sourceTemplateId) insertRowOverride.source_template_id = data.sourceTemplateId;

      const { data: planOv, error: errOv } = await supabase
        .from("plans")
        .insert(insertRowOverride)
        .select("id, published_at")
        .single();
      if (errOv) throw new Error(errOv.message);
      return { id: planOv.id, publishedAt: planOv.published_at };
    }

    // ---- 3) Motor determinístico (TMB+TDEE+Macros) ----
    const engineOut = runNutritionEngines(ctx);
    if (!engineOut) {
      // Defesa: ctx.calculable === true ⇒ engineOut nunca é null.
      throw new Error("CLINICAL_CONTEXT_INCOMPLETE: engines returned null");
    }

    // ---- 4) Estrutura do snapshot (warn-only) ----
    const { snapshot, review } = validateSnapshot(data.snapshot);

    // ---- 5) Gate clínico — bloqueia APENAS em blockers (severity=error).
    // Warnings (monotonia, etc.) NÃO impedem publicação — entram em
    // snapshot.clinicalAudit.gateWarnings.
    const dailyTotals = deriveDailyTotalsFromSnapshot(snapshot);
    const foodOccurrences = deriveFoodOccurrencesFromSnapshot(snapshot);
    const gate = validatePlan({
      weightKg: ctx.currentWeight!.weightKg,
      tdee: engineOut.tdee,
      target: engineOut.target,
      dailyTotals,
      foodOccurrences,
    });
    if (gate.blockers.length > 0) {
      throw new Error(
        `CLINICAL_GATE_BLOCKED: ${gate.blockers.map((b) => b.code).join(",")}`,
      );
    }

    // ---- 6) Auditoria clínica imutável anexada ao snapshot ----
    const publishedAt = new Date().toISOString();
    const clinicalAudit: ClinicalAudit = {
      clinicalContextSnapshot: {
        currentWeight: ctx.currentWeight
          ? {
              weightKg: ctx.currentWeight.weightKg,
              observedAt: ctx.currentWeight.measuredAt,
              source: ctx.currentWeight.source,
              sourceId: ctx.currentWeight.sourceId,
            }
          : null,
        currentGoal: ctx.currentGoal
          ? {
              kind: ctx.currentGoal.kind,
              sourceAnamnesisId: ctx.currentGoal.sourceAnamnesisId,
            }
          : null,
        demographics: {
          sex: ctx.demographics.sex,
          ageYears: ctx.demographics.ageYears,
          heightCm: ctx.demographics.heightCm,
          activity: ctx.demographics.activity,
          sourceAnamnesisId: ctx.demographics.sourceAnamnesisId,
        },
        calculable: true,
      },
      engineOutput: {
        tmb: engineOut.tmb,
        tdee: engineOut.tdee,
        target: engineOut.target,
        clinicalGoalKind: engineOut.clinicalGoalKind,
        engineGoal: engineOut.engineGoal,
      },
      gateWarnings: gate.warnings.map((w) => ({
        code: w.code,
        message: w.message,
      })),
      engineVersion: ENGINE_VERSION,
      gateVersion: GATE_VERSION,
      publishedAt,
    };

    const snapshotWithAudit = {
      ...snapshot,
      clinical_review: review,
      clinicalAudit,
    };

    const insertRow: Record<string, any> = {
      patient_id: data.patientId,
      nutritionist_id: nutri.id,
      schema_version: 3,
      status: "published",
      snapshot: snapshotWithAudit,
    };
    if (data.sourceTemplateId) insertRow.source_template_id = data.sourceTemplateId;

    const { data: plan, error } = await supabase
      .from("plans")
      .insert(insertRow)
      .select("id, published_at")
      .single();
    if (error) throw new Error(error.message);

    return { id: plan.id, publishedAt: plan.published_at };
  });

// ---------------------------------------------------------------------------
// Helpers internos — loadClinicalContext + derivações do snapshot.
// ---------------------------------------------------------------------------

/**
 * Carrega ClinicalContext do paciente usando o supabase autenticado do nutri.
 * Mesma lógica de `context.functions.ts#getClinicalContext`, replicada aqui
 * para evitar dependência cruzada server-fn → server-fn.
 */
async function loadClinicalContext(
  supabase: any,
  patientId: string,
): Promise<ClinicalContext> {
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

function extractCanonical(raw: unknown): CanonicalAnamnesis | null {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as { canonical?: unknown };
  const parsed = CanonicalAnamnesisSchema.safeParse(envelope.canonical);
  return parsed.success ? parsed.data : null;
}

/**
 * Deriva totais diários do snapshot. Snapshot V3 atual representa UM dia
 * (lista única de refeições). Macros por item ainda não fazem parte do
 * schema, portanto somamos APENAS kcal — regras do gate baseadas em
 * proteína/macros operam com 0 (não disparam falso positivo nem
 * bloqueiam). Quando o snapshot evoluir para carregar macros por item,
 * basta enriquecer aqui.
 */
export function deriveDailyTotalsFromSnapshot(
  snapshot: Record<string, unknown>,
): DailyTotals[] {
  const meals: any[] = Array.isArray((snapshot as any).meals)
    ? ((snapshot as any).meals as any[])
    : [];
  if (meals.length === 0) return [];

  let kcal = 0;
  let proteinG = 0;
  let carbG = 0;
  let fatG = 0;
  for (const m of meals) {
    const items: any[] = Array.isArray(m?.main?.items) ? m.main.items : [];
    for (const it of items) {
      if (Number.isFinite(it?.kcal)) kcal += Number(it.kcal);
      if (Number.isFinite(it?.proteinG)) proteinG += Number(it.proteinG);
      if (Number.isFinite(it?.carbG)) carbG += Number(it.carbG);
      if (Number.isFinite(it?.fatG)) fatG += Number(it.fatG);
    }
  }
  return [{ dayLabel: "dia", kcal, proteinG, carbG, fatG }];
}

export function deriveFoodOccurrencesFromSnapshot(
  snapshot: Record<string, unknown>,
): FoodOccurrence[] {
  const meals: any[] = Array.isArray((snapshot as any).meals)
    ? ((snapshot as any).meals as any[])
    : [];
  const counter = new Map<string, { displayName: string; count: number }>();
  for (const m of meals) {
    const items: any[] = Array.isArray(m?.main?.items) ? m.main.items : [];
    for (const it of items) {
      const key = typeof it?.foodKey === "string" ? it.foodKey : null;
      if (!key) continue;
      const cur = counter.get(key) ?? {
        displayName: typeof it?.name === "string" ? it.name : key,
        count: 0,
      };
      cur.count += 1;
      counter.set(key, cur);
    }
  }
  return Array.from(counter, ([foodKey, v]) => ({
    foodKey,
    displayName: v.displayName,
    weeklyCount: v.count,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Lista planos publicados de um paciente (visão do nutri).
// ─────────────────────────────────────────────────────────────────
export type PublishedPlanLite = {
  id: string;
  publishedAt: string;
  schemaVersion: number;
  sourceTemplateId: string | null;
};

export const listPublishedPlansForPatient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patientId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<PublishedPlanLite[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    // confere que o paciente pertence ao nutri logado
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return [];

    const { data: rows, error } = await supabase
      .from("plans")
      .select("id, published_at, schema_version, source_template_id")
      .eq("patient_id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r: any) => ({
      id: r.id,
      publishedAt: r.published_at,
      schemaVersion: r.schema_version,
      sourceTemplateId: r.source_template_id,
    }));
  });
