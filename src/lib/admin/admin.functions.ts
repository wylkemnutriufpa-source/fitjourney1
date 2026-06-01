/**
 * Admin server functions — gestão de profissionais e visão consolidada de pacientes.
 * Gate: somente usuários com role 'admin' (user_roles).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

export type NutriPlanTier = "basic" | "pro";

export type AdminNutritionistRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  crn: string | null;
  created_at: string;
  patients_count: number;
  subscription: {
    id: string;
    plan_tier: NutriPlanTier;
    monthly_price_cents: number;
    currency: string;
    status: "active" | "paused" | "expired" | "cancelled";
    payment_method: string | null;
    starts_at: string;
    ends_at: string | null;
    notes: string | null;
  } | null;
};

export const listProfessionals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminNutritionistRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: nutris, error } = await supabase
      .from("nutritionists")
      .select("id, full_name, email, phone, crn, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (nutris ?? []).map((n) => n.id);
    if (ids.length === 0) return [];

    const [{ data: subs }, { data: pats }] = await Promise.all([
      supabase
        .from("nutritionist_subscriptions")
        .select("id, nutritionist_id, plan_tier, monthly_price_cents, currency, status, payment_method, starts_at, ends_at, notes")
        .in("nutritionist_id", ids),
      supabase
        .from("patients")
        .select("nutritionist_id")
        .in("nutritionist_id", ids),
    ]);

    const subByNutri = new Map<string, any>();
    for (const s of subs ?? []) {
      // prefer active sub, else any
      const prev = subByNutri.get(s.nutritionist_id);
      if (!prev || s.status === "active") subByNutri.set(s.nutritionist_id, s);
    }
    const countByNutri = new Map<string, number>();
    for (const p of pats ?? []) {
      if (!p.nutritionist_id) continue;
      countByNutri.set(p.nutritionist_id, (countByNutri.get(p.nutritionist_id) ?? 0) + 1);
    }

    return (nutris ?? []).map((n) => {
      const s = subByNutri.get(n.id);
      return {
        ...n,
        patients_count: countByNutri.get(n.id) ?? 0,
        subscription: s
          ? {
              id: s.id,
              plan_tier: (s.plan_tier ?? "basic") as NutriPlanTier,
              monthly_price_cents: s.monthly_price_cents,
              currency: s.currency,
              status: s.status,
              payment_method: s.payment_method,
              starts_at: s.starts_at,
              ends_at: s.ends_at,
              notes: s.notes,
            }
          : null,
      };
    });
  });

const UpsertSubInput = z.object({
  nutritionist_id: z.string().uuid(),
  plan_tier: z.enum(["basic", "pro"]).default("basic"),
  monthly_price_cents: z.number().int().min(0).max(100_000_00),
  status: z.enum(["active", "paused", "expired", "cancelled"]).default("active"),
  payment_method: z
    .enum(["pix", "card", "cash", "transfer", "boleto", "other"])
    .nullable()
    .optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const upsertProfessionalSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSubInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: existing } = await supabase
      .from("nutritionist_subscriptions")
      .select("id")
      .eq("nutritionist_id", data.nutritionist_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload: any = {
      nutritionist_id: data.nutritionist_id,
      plan_tier: data.plan_tier,
      monthly_price_cents: data.monthly_price_cents,
      status: data.status,
      payment_method: data.payment_method ?? null,
      notes: data.notes ?? null,
    };
    if (data.starts_at) payload.starts_at = data.starts_at;
    if (data.ends_at !== undefined) payload.ends_at = data.ends_at;

    if (existing) {
      const { error } = await supabase
        .from("nutritionist_subscriptions")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id, updated: true };
    }
    const { data: ins, error } = await supabase
      .from("nutritionist_subscriptions")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id, updated: false };
  });

export type AdminPatientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  nutritionist_id: string | null;
  nutritionist_name: string | null;
  source_legacy_id: string | null;
};

export const listAllPatients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPatientRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: patients, error } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, created_at, nutritionist_id, source_legacy_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const nutriIds = Array.from(
      new Set((patients ?? []).map((p) => p.nutritionist_id).filter(Boolean) as string[]),
    );
    const nameByNutri = new Map<string, string>();
    if (nutriIds.length > 0) {
      const { data: nutris } = await supabase
        .from("nutritionists")
        .select("id, full_name")
        .in("id", nutriIds);
      for (const n of nutris ?? []) nameByNutri.set(n.id, n.full_name);
    }

    return (patients ?? []).map((p) => ({
      ...p,
      nutritionist_name: p.nutritionist_id ? nameByNutri.get(p.nutritionist_id) ?? null : null,
    }));
  });
