import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(5).max(40),
  source: z.string().trim().max(60).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type LandingLead = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  source: string;
  notes: string | null;
  created_at: string;
};

export const createLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    // A-06: usa cliente anon (não service_role). A policy "anyone can insert leads"
    // controla via WITH CHECK (validação de tamanho de campos). RLS aplica.
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase env not configured");
    const anon = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await anon.from("landing_leads").insert({
      full_name: data.fullName,
      email: data.email,
      whatsapp: data.whatsapp,
      source: data.source ?? "landing_intro",
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

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

export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("landing_leads")
      .select("id, full_name, email, whatsapp, source, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as LandingLead[];
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("landing_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
