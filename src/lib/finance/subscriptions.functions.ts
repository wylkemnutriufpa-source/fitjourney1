// Módulo Financeiro — administrativo, isolado do pipeline clínico.
// Patient App vê apenas a própria assinatura ativa (read-only).
// Nutricionista CRUD nos pacientes dele.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubscriptionPlanKind =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "custom";

export type SubscriptionStatus =
  | "active"
  | "paused"
  | "expired"
  | "cancelled";

export type SubscriptionPaymentMethod =
  | "pix"
  | "card"
  | "cash"
  | "transfer"
  | "boleto"
  | "other";

export interface Subscription {
  id: string;
  patientId: string;
  nutritionistId: string;
  planKind: SubscriptionPlanKind;
  priceCents: number;
  currency: string;
  startsAt: string; // YYYY-MM-DD
  endsAt: string | null;
  status: SubscriptionStatus;
  paymentMethod: SubscriptionPaymentMethod | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const PlanKindSchema = z.enum([
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "custom",
]);
const StatusSchema = z.enum(["active", "paused", "expired", "cancelled"]);
const MethodSchema = z.enum([
  "pix",
  "card",
  "cash",
  "transfer",
  "boleto",
  "other",
]);

type Row = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  plan_kind: SubscriptionPlanKind;
  price_cents: number;
  currency: string;
  starts_at: string;
  ends_at: string | null;
  status: SubscriptionStatus;
  payment_method: SubscriptionPaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(r: Row): Subscription {
  return {
    id: r.id,
    patientId: r.patient_id,
    nutritionistId: r.nutritionist_id,
    planKind: r.plan_kind,
    priceCents: r.price_cents,
    currency: r.currency,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    status: r.status,
    paymentMethod: r.payment_method,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ============================================================
// Patient — vê a própria assinatura ativa mais recente
// ============================================================

export const getMyActiveSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Subscription | null> => {
    const { supabase, userId } = context;

    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!patient) return null;

    const { data, error } = await supabase
      .from("patient_subscriptions")
      .select("*")
      .eq("patient_id", patient.id)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data as Row) : null;
  });

// ============================================================
// Nutritionist — CRUD
// ============================================================

const ListByPatientInput = z.object({
  patientId: z.string().uuid(),
});

export const listPatientSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListByPatientInput.parse(input))
  .handler(async ({ data, context }): Promise<Subscription[]> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("patient_subscriptions")
      .select("*")
      .eq("patient_id", data.patientId)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows as Row[]).map(fromRow);
  });

const CreateInput = z.object({
  patientId: z.string().uuid(),
  planKind: PlanKindSchema,
  priceCents: z.number().int().min(0).max(100_000_00),
  currency: z.string().length(3).default("BRL"),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  paymentMethod: MethodSchema.nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const createSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }): Promise<Subscription> => {
    const { supabase, userId } = context;

    // Resolve nutritionist_id pelo auth user
    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("NUTRITIONIST_NOT_FOUND");

    // Garante que o paciente pertence ao nutricionista (RLS já protege, mas explicito)
    const { data: pat, error: pErr } = await supabase
      .from("patients")
      .select("id, nutritionist_id")
      .eq("id", data.patientId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pat || pat.nutritionist_id !== nutri.id) {
      throw new Error("PATIENT_NOT_LINKED");
    }

    const { data: row, error } = await supabase
      .from("patient_subscriptions")
      .insert({
        patient_id: data.patientId,
        nutritionist_id: nutri.id,
        plan_kind: data.planKind,
        price_cents: data.priceCents,
        currency: data.currency,
        starts_at: data.startsAt,
        ends_at: data.endsAt ?? null,
        payment_method: data.paymentMethod ?? null,
        notes: data.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(row as Row);
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  planKind: PlanKindSchema.optional(),
  priceCents: z.number().int().min(0).max(100_000_00).optional(),
  startsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  status: StatusSchema.optional(),
  paymentMethod: MethodSchema.nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }): Promise<Subscription> => {
    const { supabase } = context;
    const patch: {
      plan_kind?: SubscriptionPlanKind;
      price_cents?: number;
      starts_at?: string;
      ends_at?: string | null;
      status?: SubscriptionStatus;
      payment_method?: SubscriptionPaymentMethod | null;
      notes?: string | null;
    } = {};
    if (data.planKind !== undefined) patch.plan_kind = data.planKind;
    if (data.priceCents !== undefined) patch.price_cents = data.priceCents;
    if (data.startsAt !== undefined) patch.starts_at = data.startsAt;
    if (data.endsAt !== undefined) patch.ends_at = data.endsAt;
    if (data.status !== undefined) patch.status = data.status;
    if (data.paymentMethod !== undefined) patch.payment_method = data.paymentMethod;
    if (data.notes !== undefined) patch.notes = data.notes;

    const { data: row, error } = await supabase
      .from("patient_subscriptions")
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(row as Row);
  });

const DeleteInput = z.object({ id: z.string().uuid() });

export const deleteSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("patient_subscriptions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Nutritionist — Dashboard Financeiro
// ============================================================

export interface FinanceOverview {
  activeCount: number;
  mrrCents: number; // Monthly Recurring Revenue
  arrCents: number; // Annual Recurring Revenue
  averageTicketCents: number;
  expiringIn30: Subscription[];
  expiredRecent: Subscription[];
  byPlanKind: Record<SubscriptionPlanKind, number>;
  all: Subscription[];
}

const PLAN_MONTHS: Record<SubscriptionPlanKind, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  custom: 1,
};

export const getFinanceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FinanceOverview> => {
    const { supabase, userId } = context;

    const { data: nutri, error: nErr } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nutri) throw new Error("NUTRITIONIST_NOT_FOUND");

    const { data: rows, error } = await supabase
      .from("patient_subscriptions")
      .select("*")
      .eq("nutritionist_id", nutri.id)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);

    const all = (rows as Row[]).map(fromRow);
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    const in30Iso = in30.toISOString().slice(0, 10);
    const ago30 = new Date(today);
    ago30.setDate(ago30.getDate() - 30);
    const ago30Iso = ago30.toISOString().slice(0, 10);

    const active = all.filter((s) => s.status === "active");
    let mrrCents = 0;
    for (const s of active) {
      const months = PLAN_MONTHS[s.planKind] || 1;
      mrrCents += Math.round(s.priceCents / months);
    }
    const arrCents = mrrCents * 12;
    const averageTicketCents =
      active.length > 0
        ? Math.round(
            active.reduce((acc, s) => acc + s.priceCents, 0) / active.length,
          )
        : 0;

    const expiringIn30 = active.filter(
      (s) => s.endsAt && s.endsAt >= todayIso && s.endsAt <= in30Iso,
    );
    const expiredRecent = all.filter(
      (s) =>
        (s.status === "expired" ||
          (s.endsAt && s.endsAt < todayIso && s.status === "active")) &&
        (s.endsAt ?? "") >= ago30Iso,
    );

    const byPlanKind: Record<SubscriptionPlanKind, number> = {
      monthly: 0,
      quarterly: 0,
      semiannual: 0,
      annual: 0,
      custom: 0,
    };
    for (const s of active) byPlanKind[s.planKind] += 1;

    return {
      activeCount: active.length,
      mrrCents,
      arrCents,
      averageTicketCents,
      expiringIn30,
      expiredRecent,
      byPlanKind,
      all,
    };
  });
