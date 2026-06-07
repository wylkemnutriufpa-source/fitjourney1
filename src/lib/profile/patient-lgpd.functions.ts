// LGPD — server fns read-only para o paciente.
// - exportMyPatientData: retorna JSON com tudo que o paciente pode acessar
//   (perfil, anamneses, planos publicados, feedbacks, avaliações físicas,
//   consents, assinaturas). RLS garante isolamento.
// - getMyConsents: lista histórico de consentimentos.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PatientConsentRow {
  id: string;
  consentType: string;
  consentVersion: string;
  acceptedAt: string;
  anamnesisId: string | null;
}

export const getMyConsents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatientConsentRow[]> => {
    const { supabase, userId } = context;
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!patient) return [];

    const { data, error } = await supabase
      .from("patient_consents")
      .select("id, consent_type, consent_version, accepted_at, anamnesis_id")
      .eq("patient_id", patient.id)
      .order("accepted_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((r) => ({
      id: r.id,
      consentType: r.consent_type,
      consentVersion: r.consent_version,
      acceptedAt: r.accepted_at,
      anamnesisId: r.anamnesis_id ?? null,
    }));
  });

export const exportMyPatientData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) throw new Error("PATIENT_NOT_FOUND");

    const [anamneses, plans, feedbacks, assessments, consents, subscriptions] =
      await Promise.all([
        supabase.from("anamneses").select("*").eq("patient_id", patient.id),
        supabase.from("plans").select("*").eq("patient_id", patient.id),
        supabase.from("patient_feedbacks").select("*").eq("patient_id", patient.id),
        supabase.from("physical_assessments").select("*").eq("patient_id", patient.id),
        supabase
          .from("patient_consents")
          .select("id, consent_type, consent_version, accepted_at, anamnesis_id, user_agent")
          .eq("patient_id", patient.id),
        supabase.from("patient_subscriptions").select("*").eq("patient_id", patient.id),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      patient,
      anamneses: anamneses.data ?? [],
      plans: plans.data ?? [],
      feedbacks: feedbacks.data ?? [],
      physicalAssessments: assessments.data ?? [],
      consents: consents.data ?? [],
      subscriptions: subscriptions.data ?? [],
    };
  });
