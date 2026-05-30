// Plans — server fns para listar pacientes do nutri logado e publicar plano.
// Snapshot é congelado no momento do insert (V3). RLS do banco protege tudo.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateSnapshot } from "./snapshot.schema";

export type PatientLite = {
  id: string;
  fullName: string;
  email: string;
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
      .select("id, full_name, email")
      .eq("nutritionist_id", nutri.id)
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);

    return (data ?? []).map((p: any) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
    }));
  });

const PublishInput = z.object({
  patientId: z.string().uuid(),
  snapshot: z.record(z.any()), // PlannerTemplate serializável
  sourceTemplateId: z.string().uuid().optional(),
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

    // Gate clínico server-side: VALIDA mas NÃO bloqueia.
    // O profissional é a fonte da verdade clínica. O servidor só anota
    // warnings em snapshot.clinical_review como auditoria. Publicação
    // sempre passa, mesmo com avisos.
    const { snapshot, review } = validateSnapshot(data.snapshot);
    const snapshotWithReview = { ...snapshot, clinical_review: review };

    const insertRow: Record<string, any> = {
      patient_id: data.patientId,
      nutritionist_id: nutri.id,
      schema_version: 3,
      status: "published",
      snapshot: snapshotWithReview,
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
