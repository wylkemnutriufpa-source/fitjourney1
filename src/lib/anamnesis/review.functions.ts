// Server fns do workflow clínico:
// - getMyLatestAnamnesisSummary: Patient App. SEMPRE versão APROVADA.
// - submitPatientAnamnesisUpdate: paciente re-submete (cria nova versão, status submitted).
// - listAnamnesesForNutritionist: queue do nutri (filtros por status).
// - getAnamnesisForReview: detalhe de uma anamnese para revisão.
// - reviewAnamnesis: aprova ou pede ajustes. Máquina de estado validada.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadCatalog } from "@/lib/anamnesis/v2/catalog/loader";
import { toCanonical } from "@/lib/anamnesis/v2/to-canonical";
import type { Answers } from "@/lib/anamnesis/v2/catalog/types";
import { generateDraftPlanFromApproval } from "@/lib/plans/draft-auto-plan";

// ---------------- getMyLatestAnamnesisSummary ----------------
// Paciente. SEMPRE retorna a última versão APROVADA. Nunca submitted/draft.
// Sem PII clínica granular — só metadados + flags + score.

export const getMyLatestAnamnesisSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return null;

    const { data: latest } = await supabase
      .from("anamneses")
      .select("id, version, review_status, clinical_flags, completion_score, submitted_at, approved_at, data")
      .eq("patient_id", patient.id)
      .eq("review_status", "approved")
      .order("approved_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) return null;

    // riskFlags vivem no JSONB canonical
    const canonical =
      latest.data && typeof latest.data === "object" && "canonical" in latest.data
        ? (latest.data as { canonical?: { riskFlags?: string[] } }).canonical
        : undefined;

    return {
      id: latest.id as string,
      version: latest.version as number,
      reviewStatus: latest.review_status as string,
      clinicalFlags: (latest.clinical_flags as string[] | null) ?? [],
      riskFlags: canonical?.riskFlags ?? [],
      completionScore: latest.completion_score as number | null,
      submittedAt: latest.submitted_at as string | null,
      approvedAt: latest.approved_at as string | null,
    };
  });

// ---------------- submitPatientAnamnesisUpdate ----------------
// Paciente atualiza a anamnese pós-onboarding. Cria NOVA versão (submitted).
// Não altera onboarding_completed_at (já preenchido).

const UpdateInput = z.object({
  answers: z
    .record(z.string().min(1).max(128), z.unknown())
    .refine((r) => Object.keys(r).length <= 500, "Too many answers"),
});

export const submitPatientAnamnesisUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id, nutritionist_id, onboarding_completed_at")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");
    if (!patient.onboarding_completed_at) {
      throw new Error("ONBOARDING_NOT_COMPLETED");
    }

    const catalog = loadCatalog();
    const canonical = toCanonical({
      catalog,
      answers: data.answers as Answers,
      origin: "online",
    });

    const { data: prev } = await supabaseAdmin
      .from("anamneses")
      .select("id, version")
      .eq("patient_id", patient.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (prev?.version ?? 0) + 1;

    const { data: created, error: aErr } = await supabaseAdmin
      .from("anamneses")
      .insert({
        patient_id: patient.id,
        nutritionist_id: patient.nutritionist_id,
        schema_version: 3,
        data: JSON.parse(JSON.stringify({ canonical, raw: data.answers })),
        origin: "online",
        status: "submitted",
        review_status: "submitted",
        submitted_at: new Date().toISOString(),
        version: nextVersion,
        supersedes_id: prev?.id ?? null,
        created_by: null,
        catalog_version: catalog.version,
        completion_score: canonical.completionScore,
        clinical_flags: canonical.clinicalTags,
      })
      .select("id")
      .single();
    if (aErr || !created) {
      throw new Error(aErr?.message ?? "ANAMNESIS_INSERT_FAILED");
    }
    return { ok: true, anamnesisId: created.id, version: nextVersion };
  });

// ---------------- listAnamnesesForNutritionist ----------------

// ---------------- getMyPendingAnamnesesCount ----------------
// Safe para qualquer role. Pacientes / sem nutri vinculado → 0.
// Usado pelo sidebar do nutricionista para o badge da fila.

export const getMyPendingAnamnesesCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return { pendingCount: 0 };
    const { count } = await supabase
      .from("anamneses")
      .select("id", { count: "exact", head: true })
      .eq("nutritionist_id", nutri.id)
      .eq("review_status", "submitted");
    return { pendingCount: count ?? 0 };
  });

// ---------------- listAnamnesesForNutritionist ----------------

const ListInput = z.object({
  status: z.enum(["submitted", "needs_changes", "approved", "all"]).default("submitted"),
});

export const listAnamnesesForNutritionist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) throw new Error("NUTRITIONIST_NOT_FOUND");

    let q = supabase
      .from("anamneses")
      .select(
        "id, patient_id, version, review_status, completion_score, clinical_flags, submitted_at, updated_at, approved_at",
      )
      .eq("nutritionist_id", nutri.id)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (data.status !== "all") {
      q = q.eq("review_status", data.status);
    }

    const { data: rowsRaw, error } = await q;
    if (error) throw new Error(error.message);

    // Dedup: para registros 'submitted', mantém apenas a maior version por
    // paciente (evita duplicatas na fila quando paciente fez double-submit).
    const submittedByPatient = new Map<string, typeof rowsRaw[number]>();
    const others: typeof rowsRaw = [];
    for (const r of rowsRaw ?? []) {
      if (r.review_status === "submitted") {
        const prev = submittedByPatient.get(r.patient_id as string);
        if (!prev || (r.version as number) > (prev.version as number)) {
          submittedByPatient.set(r.patient_id as string, r);
        }
      } else {
        others.push(r);
      }
    }
    const rows = [...submittedByPatient.values(), ...others].sort((a, b) =>
      (b.updated_at as string).localeCompare(a.updated_at as string),
    );

    // pendingCount: conta pacientes distintos com submitted (não rows)
    const { data: pendingRows } = await supabase
      .from("anamneses")
      .select("patient_id")
      .eq("nutritionist_id", nutri.id)
      .eq("review_status", "submitted");
    const pendingCount = new Set((pendingRows ?? []).map((r) => r.patient_id)).size;

    // joina nomes de pacientes em batch
    const patientIds = Array.from(new Set((rows ?? []).map((r) => r.patient_id)));
    const { data: patients } = patientIds.length
      ? await supabase
          .from("patients")
          .select("id, full_name, email")
          .in("id", patientIds)
      : { data: [] as Array<{ id: string; full_name: string; email: string }> };
    const pmap = new Map((patients ?? []).map((p) => [p.id, p]));

    return {
      pendingCount: pendingCount ?? 0,
      items: (rows ?? []).map((r) => ({
        id: r.id as string,
        patientId: r.patient_id as string,
        patientName: pmap.get(r.patient_id as string)?.full_name ?? "—",
        patientEmail: pmap.get(r.patient_id as string)?.email ?? "",
        version: r.version as number,
        reviewStatus: r.review_status as string,
        completionScore: r.completion_score as number | null,
        clinicalFlags: (r.clinical_flags as string[] | null) ?? [],
        submittedAt: r.submitted_at as string | null,
        updatedAt: r.updated_at as string,
        approvedAt: r.approved_at as string | null,
      })),
    };
  });

// ---------------- getAnamnesisForReview ----------------

const DetailInput = z.object({ anamnesisId: z.string().uuid() });

export const getAnamnesisForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DetailInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("anamneses")
      .select(
        "id, patient_id, nutritionist_id, version, review_status, review_notes, completion_score, clinical_flags, submitted_at, updated_at, approved_at, supersedes_id, catalog_version, data",
      )
      .eq("id", data.anamnesisId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("ANAMNESIS_NOT_FOUND");

    const { data: patient } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, birth_date")
      .eq("id", row.patient_id)
      .maybeSingle();

    const json = (row.data ?? {}) as {
      canonical?: { riskFlags?: string[] };
      raw?: unknown;
    };

    // rawAnswers e canonical são serializados como JSON string para evitar
    // SerializationError no boundary de createServerFn (RPC só aceita JSON-safe).
    const rawAnswersJson = JSON.stringify(json.raw ?? {});
    const canonicalJson = JSON.stringify(json.canonical ?? null);

    return {
      id: row.id as string,
      version: row.version as number,
      reviewStatus: row.review_status as string,
      reviewNotes: (row.review_notes as string | null) ?? "",
      completionScore: row.completion_score as number | null,
      clinicalFlags: (row.clinical_flags as string[] | null) ?? [],
      riskFlags: json.canonical?.riskFlags ?? [],
      catalogVersion: row.catalog_version as string | null,
      supersedesId: row.supersedes_id as string | null,
      submittedAt: row.submitted_at as string | null,
      updatedAt: row.updated_at as string,
      approvedAt: row.approved_at as string | null,
      patient: patient
        ? {
            id: patient.id as string,
            fullName: patient.full_name as string,
            email: patient.email as string,
            phone: (patient.phone as string | null) ?? null,
            birthDate: (patient.birth_date as string | null) ?? null,
          }
        : null,
      rawAnswersJson,
      canonicalJson,
    };
  });

// ---------------- reviewAnamnesis ----------------
// Máquina de estado: submitted | needs_changes  → approved | needs_changes
// approved é terminal (trigger no DB também bloqueia).

const ReviewInput = z.object({
  anamnesisId: z.string().uuid(),
  decision: z.enum(["approved", "needs_changes"]),
  notes: z.string().max(4000).optional().nullable(),
});

const ALLOWED_TRANSITIONS: Record<string, ReadonlyArray<"approved" | "needs_changes">> = {
  submitted: ["approved", "needs_changes"],
  needs_changes: ["approved", "needs_changes"],
};

export const reviewAnamnesis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // valida que nutri é dono via RLS (select) antes de tentar update
    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) throw new Error("NUTRITIONIST_NOT_FOUND");

    const { data: current, error: cErr } = await supabase
      .from("anamneses")
      .select("id, review_status, nutritionist_id, patient_id")
      .eq("id", data.anamnesisId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!current) throw new Error("ANAMNESIS_NOT_FOUND");
    if (current.nutritionist_id !== nutri.id) {
      throw new Error("FORBIDDEN");
    }

    const allowed = ALLOWED_TRANSITIONS[current.review_status as string];
    if (!allowed || !allowed.includes(data.decision)) {
      throw new Error(
        `INVALID_TRANSITION: ${current.review_status} → ${data.decision}`,
      );
    }

    const nowIso = new Date().toISOString();
    const basePatch = {
      review_status: data.decision,
      reviewed_at: nowIso,
      review_notes: data.notes ?? null,
    };
    const patch =
      data.decision === "approved"
        ? { ...basePatch, approved_by: nutri.id, approved_at: nowIso }
        : basePatch;

    const { error: upErr } = await supabase
      .from("anamneses")
      .update(patch)
      .eq("id", data.anamnesisId);
    if (upErr) throw new Error(upErr.message);

    // Sprint 2 — pós-aprovação: tenta gerar pré-plano automaticamente.
    // NUNCA bloqueia a aprovação; qualquer erro fica em log e a resposta
    // ao nutri continua sendo "approved" puro.
    let draftOutcome: Awaited<ReturnType<typeof generateDraftPlanFromApproval>> | null = null;
    if (data.decision === "approved") {
      try {
        draftOutcome = await generateDraftPlanFromApproval(
          supabase as never,
          current.patient_id as string,
          nutri.id,
        );
        if (draftOutcome.kind === "error") {
          console.error("[reviewAnamnesis] draft auto-plan error:", draftOutcome.message);
        } else {
          console.info("[reviewAnamnesis] draft auto-plan:", draftOutcome);
        }
      } catch (e) {
        console.error("[reviewAnamnesis] draft auto-plan threw:", e);
      }
    }

    return { ok: true, newStatus: data.decision, draft: draftOutcome };
  });

// ---------------- getMyApprovedAnamnesisFull ----------------
// Paciente lê as próprias respostas da última anamnese APROVADA.
// Mesmo shape de rawAnswersJson de getAnamnesisForReview — para reuso
// direto do componente AnamnesisAnswersView no Patient App.
// RLS: policy "patient reads own anamnese" garante o escopo.

export const getMyApprovedAnamnesisFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return null;

    const { data: row, error } = await supabase
      .from("anamneses")
      .select("id, version, review_status, approved_at, submitted_at, catalog_version, data")
      .eq("patient_id", patient.id)
      .eq("review_status", "approved")
      .order("approved_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    const json = (row.data ?? {}) as { raw?: unknown };
    return {
      id: row.id as string,
      version: row.version as number,
      approvedAt: (row.approved_at as string | null) ?? null,
      submittedAt: (row.submitted_at as string | null) ?? null,
      catalogVersion: (row.catalog_version as string | null) ?? null,
      rawAnswersJson: JSON.stringify(json.raw ?? {}),
    };
  });
