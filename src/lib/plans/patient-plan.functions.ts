// Patient App — leitura do plano ativo do paciente autenticado.
//
// Fonte única: public.plans (snapshot V3). Sem mock. Sem cálculo. Sem
// inferência. RLS já garante que paciente só lê o próprio plano publicado
// (policy "patient reads own published plans"), mas filtramos por
// auth_user_id no servidor para erro previsível e clareza.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ActivePlanDTO = {
  id: string;
  publishedAt: string;
  schemaVersion: number;
  snapshot: Record<string, unknown>;
} | null;

export const getMyActivePlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActivePlanDTO> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    // 1) Resolve patient id pelo auth user. RLS aplica "patient reads self".
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) return null; // usuário autenticado mas sem perfil de paciente

    // 2) Último plano publicado do paciente. RLS exige status='published'
    //    e ownership; o servidor reforça os mesmos filtros.
    const { data: plan, error } = await supabase
      .from("plans")
      .select("id, schema_version, snapshot, published_at")
      .eq("patient_id", patient.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!plan) return null;

    return {
      id: plan.id,
      publishedAt: plan.published_at,
      schemaVersion: plan.schema_version,
      snapshot: plan.snapshot ?? {},
    };
  });
