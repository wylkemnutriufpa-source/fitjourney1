// Plans — server fns para listar pacientes do nutri logado e publicar plano.
// Snapshot é congelado no momento do insert (V3). RLS do banco protege tudo.
//
// PIPELINE DE PUBLICAÇÃO (Regra Canônica #1: "Sistema sugere, nutri decide"):
//   1. Carrega ClinicalContext server-side (peso por recência + anamnese
//      aprovada mais recente).
//   2. Se ctx.calculable === false → segue sem motores; snapshot é publicado
//      assim mesmo. Anexa clinicalAudit.degraded para auditoria.
//      NUNCA bloqueia por contexto incompleto.
//   3. Quando calculable, roda motores nutricionais (TMB+TDEE+Macros).
//   4. Deriva totais diários do snapshot e roda clinical-gate.
//   5. Gate produz APENAS warnings (gate.blockers === [] sempre). NUNCA
//      bloqueia publicação por motivo clínico — decisão é do nutricionista.
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
import { generateDraftPlanFromApproval } from "@/lib/plans/draft-auto-plan";
import { applyActiveProtocolPhase } from "@/lib/protocols/active-write";
import { PROTOCOL_CATALOG } from "@/lib/protocols/catalog";

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
  isActive: boolean;
  anamnesisStatus: AnamnesisStatusLite;
  anamnesisUpdatedAt: string | null;
  planStatus: "delivered" | "pending";
  latestPublishedPlanAt: string | null;
  autoDraft: {
    planId: string;
    templateKey: string | null;
    templateName: string | null;
    reason: string | null;
  } | null;
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
      .select("id, full_name, email, phone, is_active, created_at")
      .eq("nutritionist_id", nutri.id)
      .order("full_name", { ascending: true })
      .limit(500); // teto defensivo — paginação cursor-based pendente
    if (error) throw new Error(error.message);

    const patients = data ?? [];
    if (patients.length === 0) return [];

    const patientIds = patients.map((p: any) => p.id);
    const { data: anamneses, error: aErr } = await supabase
      .from("anamneses")
      .select("patient_id, review_status, updated_at, approved_at")
      .in("patient_id", patientIds)
      .order("updated_at", { ascending: false })
      .limit(2000); // ~4 anamneses por paciente em média
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

    // Drafts auto-sugeridos por paciente (Sprint 2.5). 1 query batch.
    const { data: drafts } = await supabase
      .from("plans")
      .select("id, patient_id, source_template_key, snapshot, updated_at")
      .in("patient_id", patientIds)
      .eq("status", "draft")
      .order("updated_at", { ascending: false });
    const autoByPatient = new Map<string, PatientLite["autoDraft"]>();
    for (const d of drafts ?? []) {
      if (autoByPatient.has(d.patient_id)) continue;
      const snap = (d.snapshot ?? {}) as any;
      const meta = snap.meta;
      const autoSuggested = meta?.autoSuggested === true || snap.autoSuggested === true;
      if (!autoSuggested && !d.source_template_key) continue;
      const router = meta.router ?? meta.matcher ?? {};
      autoByPatient.set(d.patient_id, {
        planId: d.id,
        templateKey: (d.source_template_key as string | null) ?? null,
        templateName: typeof snap.name === "string" ? snap.name : null,
        reason: typeof router.reason === "string" ? router.reason : null,
      });
    }

    const { data: publishedPlans } = await supabase
      .from("plans")
      .select("patient_id, published_at")
      .in("patient_id", patientIds)
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    const publishedByPatient = new Map<string, string>();
    for (const plan of publishedPlans ?? []) {
      if (!publishedByPatient.has(plan.patient_id)) {
        publishedByPatient.set(plan.patient_id, plan.published_at as string);
      }
    }

    // Protocolo ativo também conta como "tem plano" — aplicar protocolo entrega
    // um plano clínico ao paciente (mesmo objetivo: alimentação prescrita).
    const { data: activeProtocols } = await supabase
      .from("patient_active_protocols")
      .select("patient_id, started_at")
      .in("patient_id", patientIds)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    const activeProtoByPatient = new Map<string, string>();
    for (const ap of activeProtocols ?? []) {
      if (!activeProtoByPatient.has(ap.patient_id)) {
        activeProtoByPatient.set(ap.patient_id, ap.started_at as string);
      }
    }

    return patients.map((p: any) => {
      const info = byPatient.get(p.id);
      const publishedAt = publishedByPatient.get(p.id) ?? null;
      const protoAt = activeProtoByPatient.get(p.id) ?? null;
      const hasPlan = Boolean(publishedAt || protoAt);
      return {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        phone: p.phone ?? null,
        createdAt: p.created_at,
        isActive: p.is_active ?? true,
        anamnesisStatus: info?.status ?? "none",
        anamnesisUpdatedAt: info?.updatedAt ?? null,
        planStatus: hasPlan ? "delivered" : "pending",
        latestPublishedPlanAt: publishedAt ?? protoAt,
        autoDraft: autoByPatient.get(p.id) ?? null,
      };
    });
  });


const EnsureDraftInput = z.object({
  patientId: z.string().uuid(),
});

export type EnsureDraftPlanResult = {
  planId: string;
  created: boolean;
  templateKey: string | null;
  reason: string | null;
};

export const ensureDraftPlanForPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EnsureDraftInput.parse(input))
  .handler(async ({ context, data }): Promise<EnsureDraftPlanResult> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("Paciente não pertence a você.");

    const readLatestDraft = async () => {
      const { data: rows, error } = await supabase
        .from("plans")
        .select("id, source_template_key, snapshot, updated_at")
        .eq("patient_id", data.patientId)
        .eq("nutritionist_id", nutri.id)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);
      return rows?.[0] ?? null;
    };

    const existing = await readLatestDraft();
    if (existing) {
      const snap = (existing.snapshot ?? {}) as any;
      const router = snap.meta?.router ?? snap.meta?.matcher ?? {};
      return {
        planId: existing.id,
        created: false,
        templateKey: (existing.source_template_key as string | null) ?? null,
        reason: typeof router.reason === "string" ? router.reason : null,
      };
    }

    const { data: approved, error: aErr } = await supabase
      .from("anamneses")
      .select("id")
      .eq("patient_id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .eq("review_status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false })
      .limit(1);
    if (aErr) throw new Error(aErr.message);
    if (!approved?.length) {
      // Rule #3: Operações que nunca podem ser bloqueadas.
      // Se não há anamnese, gera um draft vazio para o nutri começar a trabalhar.
      // O sistema alerta na publicação, mas não impede a criação.
      const { data: newPlan, error: insErr } = await supabase
        .from("plans")
        .insert({
          patient_id: data.patientId,
          nutritionist_id: nutri.id,
          status: "draft",
          schema_version: 3,
          snapshot: {
            name: "Plano Inicial",
            kcal: 0,
            meals: [],
            meta: { createdWithoutAnamnesis: true }
          }
        })
        .select("id")
        .single();
      
      if (insErr) throw new Error(insErr.message);
      
      return {
        planId: newPlan.id,
        created: true,
        templateKey: null,
        reason: "anamnesis_missing_manual_start"
      };
    }

    const outcome = await generateDraftPlanFromApproval(
      supabase as never,
      data.patientId,
      nutri.id,
    );

    if (outcome.kind === "created") {
      return {
        planId: outcome.planId,
        created: true,
        templateKey: outcome.selectedTemplateKey,
        reason: outcome.reason,
      };
    }

    if (outcome.kind === "skipped" && outcome.reason === "existing_draft") {
      const draft = await readLatestDraft();
      if (draft) {
        return {
          planId: draft.id,
          created: false,
          templateKey: (draft.source_template_key as string | null) ?? null,
          reason: null,
        };
      }
    }

    if (outcome.kind === "skipped" && outcome.reason === "no_clinical_context") {
      // Rule #3: Não bloqueia. Cria draft manual se o auto-draft falhar por falta de dados.
      const { data: manualPlan, error: manualErr } = await supabase
        .from("plans")
        .insert({
          patient_id: data.patientId,
          nutritionist_id: nutri.id,
          status: "draft",
          schema_version: 3,
          snapshot: {
            name: "Plano Alimentar",
            kcal: 0,
            meals: [],
            meta: { autoSuggested: false, fallbackFromAutoDraft: true }
          }
        })
        .select("id")
        .single();
        
      if (manualErr) throw new Error(manualErr.message);
      
      return {
        planId: manualPlan.id,
        created: true,
        templateKey: null,
        reason: "fallback_to_manual"
      };
    }

    throw new Error(
      outcome.kind === "error"
        ? outcome.message
        : "Não foi possível gerar o pré-plano para este paciente.",
    );
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
  protocolMeta: z.object({
    protocolId: z.string().min(1).max(64),
    moduleId: z.string().min(1).max(64),
    phaseId: z.number().int().min(1).max(50),
  }).optional(),
  /**
   * Quando true, permite publicar mesmo sem ClinicalContext calculável
   * (paciente sem anamnese aprovada). Motor + gate clínico são pulados;
   * snapshot é salvo como está com flag `publishedWithoutClinicalContext`.
   */
  overrideMissingClinical: z.boolean().optional(),
});

type ProtocolApplyMeta = z.infer<typeof PublishInput>["protocolMeta"];

function protocolMetaFromSourceKey(sourceTemplateKey?: string): ProtocolApplyMeta {
  if (!sourceTemplateKey?.startsWith("protocol-")) return undefined;
  for (const protocol of PROTOCOL_CATALOG) {
    const prefix = `protocol-${protocol.id}-`;
    if (!sourceTemplateKey.startsWith(prefix)) continue;
    const rest = sourceTemplateKey.slice(prefix.length);
    for (const mod of protocol.modules ?? []) {
      const modulePrefix = `${mod.id}-`;
      if (!rest.startsWith(modulePrefix)) continue;
      const phaseId = Number(rest.slice(modulePrefix.length));
      if (Number.isInteger(phaseId) && mod.phases.some((p) => p.id === phaseId)) {
        return { protocolId: protocol.id, moduleId: mod.id, phaseId };
      }
    }
  }
  return undefined;
}

async function syncActiveProtocolFromPlan(
  supabase: any,
  input: { patientId: string; nutritionistId: string; protocolMeta?: ProtocolApplyMeta; sourceTemplateKey?: string },
) {
  const protocolMeta = input.protocolMeta ?? protocolMetaFromSourceKey(input.sourceTemplateKey);
  if (!protocolMeta) return;
  await applyActiveProtocolPhase(supabase, {
    patientId: input.patientId,
    nutritionistId: input.nutritionistId,
    protocolId: protocolMeta.protocolId,
    moduleId: protocolMeta.moduleId,
    phaseId: protocolMeta.phaseId,
  });
}

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
      // Rule #1: Nunca bloqueia. Se dados clínicos faltam, publica sem motor.
      // O sistema registra na auditoria que foi publicado sem contexto clínico.
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
      if (data.sourceTemplateKey) insertRowOverride.source_template_key = data.sourceTemplateKey;

      const { data: planOv, error: errOv } = await supabase
        .from("plans")
        .insert(insertRowOverride)
        .select("id, published_at")
        .single();
      if (errOv) throw new Error(errOv.message);
      await syncActiveProtocolFromPlan(supabase, {
        patientId: data.patientId,
        nutritionistId: nutri.id,
        protocolMeta: data.protocolMeta,
        sourceTemplateKey: data.sourceTemplateKey,
      });
      return { id: planOv.id, publishedAt: planOv.published_at };
    }

    // ---- 3) Motor determinístico (TMB+TDEE+Macros) ----
    const engineOut = runNutritionEngines(ctx);
    if (!engineOut) {
      console.error("Clinical audit: engines returned null for calculable context");
    }

    // ---- 4) Estrutura do snapshot (warn-only) ----
    const { snapshot, review } = validateSnapshot(data.snapshot);

    // ---- 5) Gate clínico — alertas apenas (nunca bloqueia).
    // Todos os issues entram em snapshot.clinicalAudit.gateWarnings para auditoria
    // clínica e decisão documentada do nutricionista. Severidade "error" ou
    // "warning" afeta apenas display; publicação NUNCA é impedida por gate.
    // Filosofia: "sistema sugere, nutricionista decide."
    const dailyTotals = deriveDailyTotalsFromSnapshot(snapshot);
    const foodOccurrences = deriveFoodOccurrencesFromSnapshot(snapshot);
    const gate = validatePlan({
      weightKg: ctx.currentWeight?.weightKg ?? 0,
      tdee: engineOut?.tdee ?? 0,
      target: engineOut?.target ?? { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
      dailyTotals,
      foodOccurrences,
    });
    // Note: gate.blockers will now be empty since all clinical rules are warnings.
    // This is intentional: gate serves as audit trail, not gatekeeper.

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
      engineOutput: engineOut ? {
        tmb: engineOut.tmb,
        tdee: engineOut.tdee,
        target: engineOut.target,
        clinicalGoalKind: engineOut.clinicalGoalKind,
        engineGoal: engineOut.engineGoal,
      } : null,
      gateWarnings: gate.issues.map((w) => ({
        code: w.code,
        severity: w.severity,
        message: w.message,
        details: w.details,
        suggestedAction: w.suggestedAction,
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
    if (data.sourceTemplateKey) insertRow.source_template_key = data.sourceTemplateKey;

    const { data: plan, error } = await supabase
      .from("plans")
      .insert(insertRow)
      .select("id, published_at")
      .single();
    if (error) throw new Error(error.message);
    await syncActiveProtocolFromPlan(supabase, {
      patientId: data.patientId,
      nutritionistId: nutri.id,
      protocolMeta: data.protocolMeta,
      sourceTemplateKey: data.sourceTemplateKey,
    });

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
  const [anamnesesRes, feedbacksRes, paRes] = await Promise.all([
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
    supabase
      .from("physical_assessments")
      .select("id, assessed_at, weight_kg")
      .eq("patient_id", patientId)
      .not("weight_kg", "is", null)
      .order("assessed_at", { ascending: false }),
  ]);
  if (anamnesesRes.error) throw new Error(anamnesesRes.error.message);
  if (feedbacksRes.error) throw new Error(feedbacksRes.error.message);
  if (paRes.error) throw new Error(paRes.error.message);

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
  for (const pa of paRes.data ?? []) {
    if (pa.weight_kg == null) continue;
    weightReadings.push({
      source: "physical_assessment",
      weightKg: Number(pa.weight_kg),
      measuredAt: pa.assessed_at,
      sourceId: pa.id,
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

// ─────────────────────────────────────────────────────────────────
// Último plano do paciente (qualquer status) — atalho rápido p/ editor.
// Usado no card "Plano alimentar" do perfil do paciente.
// ─────────────────────────────────────────────────────────────────
export type LatestPlanSummary = {
  id: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  updatedAt: string;
  title: string | null;
} | null;

export const getLatestPlanForPatient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patientId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<LatestPlanSummary> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return null;

    const { data: row, error } = await supabase
      .from("plans")
      .select("id, status, published_at, updated_at, snapshot")
      .eq("patient_id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const title = (row.snapshot && typeof row.snapshot === "object"
      ? (row.snapshot.title ?? row.snapshot.name ?? null)
      : null) as string | null;
    return {
      id: row.id,
      status: row.status,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      title,
    };
  });

// ─────────────────────────────────────────────────────────────────
// Sprint 3 — Draft editável end-to-end.
// getDraftPlanForEdit → carrega snapshot do draft para abrir no editor.
// updateDraftPlan     → salva edições no snapshot (UPDATE, status='draft').
// publishDraftPlan    → roda pipeline clínico e promove draft → published.
// ─────────────────────────────────────────────────────────────────

export type DraftPlanForEdit = {
  id: string;
  patientId: string;
  patientName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
  sourceTemplateKey: string | null;
  updatedAt: string;
};

export const getDraftPlanForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ planId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<DraftPlanForEdit | null> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return null;

    const { data: plan, error } = await supabase
      .from("plans")
      .select("id, patient_id, snapshot, source_template_key, updated_at, status")
      .eq("id", data.planId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!plan || plan.status !== "draft") return null;

    const { data: pat } = await supabase
      .from("patients")
      .select("full_name")
      .eq("id", plan.patient_id)
      .maybeSingle();

    return {
      id: plan.id,
      patientId: plan.patient_id,
      patientName: pat?.full_name ?? "",
      snapshot: plan.snapshot ?? {},
      sourceTemplateKey: plan.source_template_key ?? null,
      updatedAt: plan.updated_at,
    };
  });

const UpdateDraftInput = z.object({
  planId: z.string().uuid(),
  snapshot: z.record(z.any()),
});

export const updateDraftPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateDraftInput.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    const { error } = await supabase
      .from("plans")
      .update({
        snapshot: JSON.parse(JSON.stringify(data.snapshot)),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.planId)
      .eq("nutritionist_id", nutri.id)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PublishDraftInput = z.object({
  planId: z.string().uuid(),
  snapshot: z.record(z.any()),
  overrideMissingClinical: z.boolean().optional(),
});

export const publishDraftPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PublishDraftInput.parse(d))
  .handler(async ({ context, data }): Promise<PublishPlanResult> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    // Confere draft + ownership.
    const { data: draft, error: dErr } = await supabase
      .from("plans")
      .select("id, patient_id, status, source_template_key")
      .eq("id", data.planId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!draft) throw new Error("Pré-plano não encontrado.");
    if (draft.status !== "draft") {
      throw new Error("Este plano já foi publicado.");
    }
    const draftSourceTemplateKey: string | undefined = draft.source_template_key ?? undefined;

    // ---- Pipeline clínico (mesma lógica de publishPlanToPatient) ----
    const ctx = await loadClinicalContext(supabase, draft.patient_id);
    const publishedAt = new Date().toISOString();

    if (!ctx.calculable) {
      // Rule #1: Nunca bloqueia.
      const { snapshot: snapOnly, review: reviewOnly } = validateSnapshot(
        data.snapshot,
      );
      const auditOverride = {
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
        publishedAt,
        publishedWithoutClinicalContext: true,
        missingForCalc: ctx.missingForCalc,
      } as unknown as ClinicalAudit;

      const finalSnapshot = {
        ...snapOnly,
        clinical_review: reviewOnly,
        clinicalAudit: auditOverride,
      };
      const { data: updated, error: uErr } = await supabase
        .from("plans")
        .update({
          status: "published",
          snapshot: finalSnapshot,
        })
        .eq("id", data.planId)
        .eq("nutritionist_id", nutri.id)
        .eq("status", "draft")
        .select("id, published_at")
        .single();
      if (uErr) throw new Error(uErr.message);
      await syncActiveProtocolFromPlan(supabase, {
        patientId: draft.patient_id,
        nutritionistId: nutri.id,
        sourceTemplateKey: draftSourceTemplateKey,
      });
      return { id: updated.id, publishedAt: updated.published_at };
    }

    const engineOut = runNutritionEngines(ctx);
    if (!engineOut) {
      console.error("Clinical audit (draft promotion): engines returned null for calculable context");
    }

    const { snapshot, review } = validateSnapshot(data.snapshot);
    const dailyTotals = deriveDailyTotalsFromSnapshot(snapshot);
    const foodOccurrences = deriveFoodOccurrencesFromSnapshot(snapshot);
    const gate = validatePlan({
      weightKg: ctx.currentWeight?.weightKg ?? 0,
      tdee: engineOut?.tdee ?? 0,
      target: engineOut?.target ?? { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
      dailyTotals,
      foodOccurrences,
    });

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
      engineOutput: engineOut ? {
        tmb: engineOut.tmb,
        tdee: engineOut.tdee,
        target: engineOut.target,
        clinicalGoalKind: engineOut.clinicalGoalKind,
        engineGoal: engineOut.engineGoal,
      } : null,
      gateWarnings: gate.issues.map((w) => ({
        code: w.code,
        severity: w.severity as "error" | "warning",
        message: w.message,
        details: w.details,
        suggestedAction: w.suggestedAction,
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

    const { data: updated, error: uErr } = await supabase
      .from("plans")
      .update({
        status: "published",
        snapshot: snapshotWithAudit,
      })
      .eq("id", data.planId)
      .eq("nutritionist_id", nutri.id)
      .eq("status", "draft")
      .select("id, published_at")
      .single();
    if (uErr) throw new Error(uErr.message);
    await syncActiveProtocolFromPlan(supabase, {
      patientId: draft.patient_id,
      nutritionistId: nutri.id,
      sourceTemplateKey: draftSourceTemplateKey,
    });
    return { id: updated.id, publishedAt: updated.published_at };
  });

// ─────────────────────────────────────────────────────────────────
// saveEditedPlan — edição direta de plano publicado.
//
// PRINCÍPIO: para o nutricionista existe APENAS "Plano do paciente".
// Ele abre, edita, salva. Internamente, cada save INSERE uma nova linha
// status='published'. As linhas anteriores permanecem como histórico
// técnico (invisível na UI), preservando a invariante de imutabilidade
// do snapshot — nunca damos UPDATE em snapshot publicado.
//
// A query patient/nutri sempre retorna o publicado mais recente, então
// "current = MAX(published_at)" é a regra. Auditoria registra
// `manualEdit:true` + `supersedesPlanId` para lineage.
// ─────────────────────────────────────────────────────────────────

const SaveEditedPlanInput = z.object({
  patientId: z.string().uuid(),
  snapshot: z.record(z.any()),
});

export const saveEditedPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveEditedPlanInput.parse(d))
  .handler(async ({ context, data }): Promise<PublishPlanResult> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

    // Confirma ownership do paciente.
    const { data: pat, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pat) throw new Error("Paciente não pertence a você.");

    // Carrega plano publicado vigente (para herdar audit + template).
    const { data: prev, error: prevErr } = await supabase
      .from("plans")
      .select("id, snapshot, source_template_id, source_template_key")
      .eq("patient_id", data.patientId)
      .eq("nutritionist_id", nutri.id)
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prevErr) throw new Error(prevErr.message);
    if (!prev) {
      throw new Error(
        "Nenhum plano publicado encontrado para editar. Publique um plano a partir de um template primeiro.",
      );
    }

    const prevSnap = (prev.snapshot ?? {}) as Record<string, any>;
    const prevAudit = (prevSnap.clinicalAudit ?? null) as
      | Record<string, any>
      | null;

    // Estrutura: warn-only.
    const { snapshot, review } = validateSnapshot(data.snapshot);

    // Auditoria: preserva audit clínico original (alvo do motor permanece
    // como referência) e adiciona marca de edição manual + lineage.
    const editedAt = new Date().toISOString();
    const mergedAudit = prevAudit
      ? {
          ...prevAudit,
          manualEdit: true,
          manualEditAt: editedAt,
          supersedesPlanId: prev.id,
        }
      : {
          manualEdit: true,
          manualEditAt: editedAt,
          supersedesPlanId: prev.id,
          engineVersion: ENGINE_VERSION,
          gateVersion: GATE_VERSION,
          publishedAt: editedAt,
        };

    const finalSnapshot = {
      ...snapshot,
      clinical_review: review,
      clinicalAudit: mergedAudit,
    };

    const insertRow: Record<string, any> = {
      patient_id: data.patientId,
      nutritionist_id: nutri.id,
      schema_version: 3,
      status: "published",
      snapshot: finalSnapshot,
    };
    if (prev.source_template_id)
      insertRow.source_template_id = prev.source_template_id;
    if (prev.source_template_key)
      insertRow.source_template_key = prev.source_template_key;

    const { data: inserted, error: iErr } = await supabase
      .from("plans")
      .insert(insertRow)
      .select("id, published_at")
      .single();
    if (iErr) throw new Error(iErr.message);

    return { id: inserted.id, publishedAt: inserted.published_at };
  });
