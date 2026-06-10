// Server fns para overrides de protocolos.
// - listProtocolOverrides: leitura aberta a qualquer usuário autenticado
//   (paciente precisa ver dicas novas que o admin adicionou).
// - saveProtocolOverride / deleteProtocolOverride: somente admin.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  ProtocolOverrideRow,
  ProtocolOverridePayload,
} from "./overrides-types";

const ListInput = z.object({
  protocolId: z.string().min(1).max(64),
});

const PayloadSchema: z.ZodType<ProtocolOverridePayload> = z.object({
  goldenTips: z
    .array(
      z.object({
        emoji: z.string(),
        title: z.string(),
        objective: z.string(),
        howTo: z.array(z.string()),
        benefit: z.string().optional(),
      }),
    )
    .optional(),
  tips: z
    .array(
      z.object({
        emoji: z.string(),
        title: z.string(),
        objective: z.string(),
        howTo: z.array(z.string()),
        benefit: z.string().optional(),
      }),
    )
    .optional(),
  teas: z
    .array(
      z.object({
        name: z.string(),
        time: z.string().optional(),
        quantity: z.string().optional(),
        ingredients: z.array(z.string()).optional(),
        preparation: z.string().optional(),
        timesPerDay: z.string().optional(),
        benefits: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  strategies: z.array(z.string()).optional(),
  pillars: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        examples: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  rules: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
});

const SaveInput = z.object({
  protocolId: z.string().min(1).max(64),
  moduleId: z.string().min(1).max(64).nullable(),
  phaseId: z.number().int().min(1).max(50).nullable(),
  payload: PayloadSchema,
});

const DeleteInput = z.object({
  protocolId: z.string().min(1).max(64),
  moduleId: z.string().min(1).max(64).nullable(),
  phaseId: z.number().int().min(1).max(50).nullable(),
});

type Row = {
  id: string;
  protocol_id: string;
  module_id: string | null;
  phase_id: number | null;
  payload: ProtocolOverridePayload;
  updated_at: string;
};

function toRow(r: Row): ProtocolOverrideRow {
  return {
    id: r.id,
    protocolId: r.protocol_id,
    moduleId: r.module_id,
    phaseId: r.phase_id,
    payload: r.payload ?? {},
    updatedAt: r.updated_at,
  };
}

/** Leitura: qualquer usuário autenticado. */
export const listProtocolOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("protocol_overrides")
      .select("id, protocol_id, module_id, phase_id, payload, updated_at")
      .eq("protocol_id", data.protocolId);
    if (error) throw new Error(error.message);
    return { overrides: (rows ?? []).map((r) => toRow(r as Row)) };
  });

/** Lista TODOS os overrides — usado pelo card do paciente em /meu-plano/protocolos. */
export const listAllProtocolOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("protocol_overrides")
      .select("id, protocol_id, module_id, phase_id, payload, updated_at");
    if (error) throw new Error(error.message);
    return { overrides: (rows ?? []).map((r) => toRow(r as Row)) };
  });

/** Escrita: somente admin. Upsert pelo escopo (protocol_id, module_id, phase_id). */
export const saveProtocolOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin required");

    // Upsert manual pelo escopo (protocol_id, module_id, phase_id).
    const sel = supabase
      .from("protocol_overrides")
      .select("id")
      .eq("protocol_id", data.protocolId);
    const sel2 = data.moduleId === null ? sel.is("module_id", null) : sel.eq("module_id", data.moduleId);
    const sel3 = data.phaseId === null ? sel2.is("phase_id", null) : sel2.eq("phase_id", data.phaseId);
    const { data: existing, error: selErr } = await sel3.maybeSingle();
    if (selErr) throw new Error(selErr.message);

    // JSONB no Supabase tipa como Json; nosso payload é JSON-serializable.
    const payloadJson = JSON.parse(JSON.stringify(data.payload)) as never;


    if (existing?.id) {
      const { error } = await supabase
        .from("protocol_overrides")
        .update({ payload: payloadJson, updated_by: userId })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: existing.id };
    }

    const { data: ins, error } = await supabase
      .from("protocol_overrides")
      .insert({
        protocol_id: data.protocolId,
        module_id: data.moduleId,
        phase_id: data.phaseId,
        payload: payloadJson,
        updated_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins.id };
  });


export const deleteProtocolOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin required");

    const q = supabase
      .from("protocol_overrides")
      .delete()
      .eq("protocol_id", data.protocolId);
    const q2 = data.moduleId === null ? q.is("module_id", null) : q.eq("module_id", data.moduleId);
    const q3 = data.phaseId === null ? q2.is("phase_id", null) : q2.eq("phase_id", data.phaseId);
    const { error } = await q3;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
