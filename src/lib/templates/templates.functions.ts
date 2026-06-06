// Templates — server fns CRUD para "Meus Templates" do nutricionista logado.
// Substitui a antiga store em localStorage (my-templates-store.ts).
// RLS "nutri rw own templates" garante isolamento multi-tenant.
//
// Modelo de persistência:
//   - Coluna `name`   ← top-level (busca/listagem)
//   - Coluna `content` (jsonb) ← PlannerTemplate completo + metadados
//     (basedOn, finalidade, observacoes, savedAt). O `id` antigo do
//     PlannerTemplate é descartado; o id soberano passa a ser o uuid da row.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  normalizeStoredPlannerTemplate,
  type PlannerFoodItem,
  type PlannerTemplate,
} from "@/lib/meal-planner";
import { SMART_TEMPLATE_SEEDS, seedToPlannerTemplate } from "@/lib/templates/smart-seeds";
import { recalcMaterializedEquivalents } from "@/components/meal-editor/recalc";
import { tacoCatalog } from "@/lib/substitutions/taco-catalog";

export type StoredTemplate = PlannerTemplate & {
  basedOn: string;
  savedAt: string;
  finalidade?: string;
  observacoes?: string;
};

type DbRow = {
  id: string;
  name: string;
  content: unknown;
  updated_at: string;
};

function rowToTemplate(row: DbRow): StoredTemplate | null {
  const normalized = normalizeStoredPlannerTemplate(row.content);
  if (!normalized) return null;
  const c = (row.content ?? {}) as Record<string, unknown>;
  return {
    ...normalized,
    id: row.id, // id soberano = uuid da row
    name: row.name || normalized.name,
    basedOn: typeof c.basedOn === "string" ? c.basedOn : row.id,
    savedAt:
      typeof c.savedAt === "string" ? c.savedAt : row.updated_at,
    finalidade: typeof c.finalidade === "string" ? c.finalidade : undefined,
    observacoes:
      typeof c.observacoes === "string" ? c.observacoes : undefined,
  };
}

async function resolveNutritionistId(
  supabase: any,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("nutritionists")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nutricionista não encontrado para este usuário.");
  return data.id as string;
}

export const listMyTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StoredTemplate[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const nutriId = await resolveNutritionistId(supabase, userId).catch(
      () => null,
    );
    if (!nutriId) return [];

    const { data, error } = await supabase
      .from("templates")
      .select("id, name, content, updated_at")
      .eq("nutritionist_id", nutriId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    return ((data ?? []) as DbRow[])
      .map(rowToTemplate)
      .filter((t): t is StoredTemplate => t !== null);
  });

const SaveInput = z.object({
  id: z.string().uuid().optional(), // presente em edição
  name: z.string().min(1).max(255),
  basedOn: z.string().min(1).max(255),
  finalidade: z.string().max(2000).optional(),
  observacoes: z.string().max(5000).optional(),
  // PlannerTemplate completo — validado por normalizeStoredPlannerTemplate
  template: z.unknown(),
});

export const saveMyTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveInput.parse(input))
  .handler(async ({ data, context }): Promise<StoredTemplate> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const nutriId = await resolveNutritionistId(supabase, userId);

    const normalized = normalizeStoredPlannerTemplate(data.template);
    if (!normalized) throw new Error("Template inválido.");

    const savedAt = new Date().toISOString();
    const contentJson = {
      ...normalized,
      name: data.name,
      basedOn: data.basedOn,
      savedAt,
      finalidade: data.finalidade,
      observacoes: data.observacoes,
    };

    if (data.id) {
      const { data: row, error } = await supabase
        .from("templates")
        .update({
          name: data.name,
          content: contentJson,
          updated_at: savedAt,
        })
        .eq("id", data.id)
        .eq("nutritionist_id", nutriId)
        .select("id, name, content, updated_at")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Template não encontrado ou sem permissão.");
      const mapped = rowToTemplate(row as DbRow);
      if (!mapped) throw new Error("Falha ao serializar template.");
      return mapped;
    }

    const { data: row, error } = await supabase
      .from("templates")
      .insert({
        nutritionist_id: nutriId,
        name: data.name,
        content: contentJson,
      })
      .select("id, name, content, updated_at")
      .single();
    if (error) throw new Error(error.message);
    const mapped = rowToTemplate(row as DbRow);
    if (!mapped) throw new Error("Falha ao serializar template.");
    return mapped;
  });

const DeleteInput = z.object({ id: z.string().uuid() });

export const deleteMyTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const nutriId = await resolveNutritionistId(supabase, userId);

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", data.id)
      .eq("nutritionist_id", nutriId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
