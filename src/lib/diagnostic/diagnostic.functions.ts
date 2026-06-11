import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type TriggerDTO = {
  id: string;
  slug: string;
  nome: string;
  prioridade: number;
  ativo: boolean;
  frases: string[];
  dicas: string[];
};

const anonSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(5).max(40),
  answers: z.record(z.string(), z.any()),
  diagnosis: z.record(z.string(), z.any()),
  imc: z.number().nullable().optional(),
  pesoIdeal: z.number().nullable().optional(),
  diferencaKg: z.number().nullable().optional(),
  triggersAcionados: z.array(z.string()).default([]),
});

async function anonClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Público ─────────────────────────────────────────────
export const listActiveTriggers = createServerFn({ method: "GET" })
  .handler(async (): Promise<TriggerDTO[]> => {
    const anon = await anonClient();
    const { data, error } = await anon
      .from("diagnostic_triggers")
      .select("id, slug, nome, prioridade, ativo, frases, dicas")
      .eq("ativo", true)
      .order("prioridade", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      ...r,
      frases: Array.isArray(r.frases) ? r.frases : [], dicas: Array.isArray(r.dicas) ? r.dicas : [],
    }));
  });

export const submitDiagnosticResponse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => anonSchema.parse(d))
  .handler(async ({ data }) => {
    // Persistência é best-effort: lead duplicado ou erro de RLS NUNCA bloqueia
    // a exibição do diagnóstico para o usuário. Falhas são logadas e seguimos.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let leadId: string | null = null;
    try {
      // 1. Procura lead existente (por email). limit(1) evita erro com duplicatas.
      const { data: existing } = await supabaseAdmin
        .from("landing_leads")
        .select("id")
        .eq("email", data.email)
        .order("created_at", { ascending: false })
        .limit(1);
      if (existing && existing[0]?.id) {
        leadId = existing[0].id;
      } else {
        const { data: inserted } = await supabaseAdmin
          .from("landing_leads")
          .insert({
            full_name: data.fullName,
            email: data.email,
            whatsapp: data.whatsapp,
            source: "diagnostico_pacientes",
          })
          .select("id")
          .single();
        leadId = inserted?.id ?? null;
      }
    } catch (e) {
      console.warn("[diagnostic] lead upsert silently ignored:", e);
    }

    // 2. Salva resposta do diagnóstico (best-effort também)
    try {
      await supabaseAdmin.from("diagnostic_responses").insert({
        lead_id: leadId,
        full_name: data.fullName,
        email: data.email,
        whatsapp: data.whatsapp,
        answers: data.answers,
        diagnosis: data.diagnosis,
        imc: data.imc ?? null,
        peso_ideal: data.pesoIdeal ?? null,
        diferenca_kg: data.diferencaKg ?? null,
        triggers_acionados: data.triggersAcionados,
      });
    } catch (e) {
      console.warn("[diagnostic] response insert silently ignored:", e);
    }

    return { ok: true as const, leadId };
  });

// ─── Admin ───────────────────────────────────────────────
async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const adminListTriggers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TriggerDTO[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("diagnostic_triggers")
      .select("id, slug, nome, prioridade, ativo, frases, dicas")
      .order("prioridade", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      ...r,
      frases: Array.isArray(r.frases) ? r.frases : [], dicas: Array.isArray(r.dicas) ? r.dicas : [],
    }));
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/, "use apenas minúsculas, números e _"),
  nome: z.string().trim().min(2).max(120),
  prioridade: z.number().int().min(0).max(100),
  ativo: z.boolean(),
  frases: z.array(z.string().trim().min(3).max(500)).min(1).max(10),
  dicas: z.array(z.string().trim().min(3).max(800)).max(10).default([]),
});

export const adminUpsertTrigger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      slug: data.slug,
      nome: data.nome,
      prioridade: data.prioridade,
      ativo: data.ativo,
      frases: data.frases,
      dicas: data.dicas ?? [],
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("diagnostic_triggers")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("diagnostic_triggers")
        .insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const adminDeleteTrigger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("diagnostic_triggers")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
