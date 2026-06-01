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
  snapshot: any;
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

// ---------------------------------------------------------------------------
// NUTRI VIEW — leitura dos planos de um paciente seu.
// RLS "nutri rw own plans" já garante ownership (nutritionist_id == nutri.id).
// O servidor reforça `nutritionist_id` no filtro para erro previsível.
// ---------------------------------------------------------------------------

export type PatientPlanSummary = {
  id: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
  schemaVersion: number;
};

export type PatientPlanFull = PatientPlanSummary & {
  snapshot: Record<string, unknown>;
};

import { z } from "zod";

const PatientIdInput = z.object({ patientId: z.string().uuid() });

export const listPatientPlansForNutri = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PatientIdInput.parse(input))
  .handler(
    async ({ data, context }): Promise<{
      active: PatientPlanFull | null;
      history: PatientPlanSummary[];
    }> => {
      const { supabase, userId } = context as {
        supabase: any;
        userId: string;
      };

      const { data: nutri, error: nErr } = await supabase
        .from("nutritionists")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (nErr) throw new Error(nErr.message);
      if (!nutri) throw new Error("Perfil de nutricionista não encontrado.");

      const { data: rows, error } = await supabase
        .from("plans")
        .select("id, status, snapshot, published_at, created_at, schema_version")
        .eq("patient_id", data.patientId)
        .eq("nutritionist_id", nutri.id)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);

      const all = rows ?? [];
      const publishedRows = all.filter(
        (r: any) => r.status === "published" && r.published_at,
      );
      const activeRow = publishedRows[0] ?? null;

      const active: PatientPlanFull | null = activeRow
        ? {
            id: activeRow.id,
            status: "published",
            publishedAt: activeRow.published_at,
            createdAt: activeRow.created_at,
            schemaVersion: activeRow.schema_version,
            snapshot: activeRow.snapshot ?? {},
          }
        : null;

      // Histórico = publicados anteriores (não inclui o vigente).
      const history: PatientPlanSummary[] = publishedRows
        .slice(1)
        .map((r: any) => ({
          id: r.id,
          status: "published",
          publishedAt: r.published_at,
          createdAt: r.created_at,
          schemaVersion: r.schema_version,
        }));

      return { active, history };
    },
  );

