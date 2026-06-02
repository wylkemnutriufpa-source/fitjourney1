// Server fns do onboarding do paciente.
// Fluxo: recordConsent → submitInitialAnamnesis → marca patients.onboarding_*.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadCatalog } from "@/lib/anamnesis/v2/catalog/loader";
import { toCanonical } from "@/lib/anamnesis/v2/to-canonical";
import type { Answers } from "@/lib/anamnesis/v2/catalog/types";

export const PATIENT_ONBOARDING_VERSION = 1 as const;
export const CONSENT_VERSION = "lgpd-v1.2026-05" as const;

// ---------- recordConsent ----------
const ConsentInput = z.object({
  consentTypes: z.array(z.enum(["lgpd", "clinical_data"])).min(1).max(2),
});

export const recordPatientConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConsentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");

    const rows = data.consentTypes.map((t) => ({
      patient_id: patient.id,
      consent_version: CONSENT_VERSION,
      consent_type: t,
    }));
    const { error } = await supabase.from("patient_consents").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, patientId: patient.id };
  });

// ---------- submitInitialAnamnesis ----------
const SubmitInput = z.object({
  answers: z.record(z.string().min(1).max(128), z.unknown()).refine(
    (r) => Object.keys(r).length <= 500,
    "Too many answers",
  ),
});

export const submitInitialAnamnesis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1) localiza paciente do user
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id, nutritionist_id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");

    // 2) gera canonical
    const catalog = loadCatalog();
    const canonical = toCanonical({
      catalog,
      answers: data.answers as Answers,
      origin: "online",
    });

    // 3a) limpa quaisquer rascunhos pendentes deste paciente (autosave)
    await supabaseAdmin
      .from("anamneses")
      .delete()
      .eq("patient_id", patient.id)
      .eq("review_status", "draft");

    // 3b) calcula próxima version (considerando submetidas/aprovadas)
    const { data: prev } = await supabaseAdmin
      .from("anamneses")
      .select("id, version")
      .eq("patient_id", patient.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (prev?.version ?? 0) + 1;

    // 4) insere anamnese (review_status = submitted)
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


    // 5) vincula consents recentes a essa anamnese (se ainda sem anamnesis_id)
    await supabaseAdmin
      .from("patient_consents")
      .update({ anamnesis_id: created.id })
      .eq("patient_id", patient.id)
      .is("anamnesis_id", null);

    // 6) marca onboarding completo
    const { error: upErr } = await supabaseAdmin
      .from("patients")
      .update({
        onboarding_version: PATIENT_ONBOARDING_VERSION,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", patient.id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, anamnesisId: created.id, version: nextVersion };
  });

// ---------- getPatientOnboardingStatus ----------
export const getPatientOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: patient } = await supabase
      .from("patients")
      .select("id, onboarding_version, onboarding_completed_at")
      .eq("auth_user_id", userId)
      .maybeSingle();
    return {
      patientId: patient?.id ?? null,
      onboardingVersion: patient?.onboarding_version ?? null,
      completedAt: patient?.onboarding_completed_at ?? null,
      currentVersion: PATIENT_ONBOARDING_VERSION,
    };
  });
