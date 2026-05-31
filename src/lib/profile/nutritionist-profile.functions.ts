// Nutritionist self profile — read & update.
// Soberania: o profissional edita seus próprios dados (full_name, crn, email).
// Escrita usa supabaseAdmin (service_role) — alinhado ao lockdown da Fase 2
// onde o role authenticated não tem mais UPDATE direto em public.nutritionists.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface MyNutritionistProfile {
  id: string;
  fullName: string;
  email: string;
  crn: string | null;
}

export const getMyNutritionistProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyNutritionistProfile | null> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("nutritionists")
      .select("id, full_name, email, crn")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      crn: data.crn,
    };
  });

const UpdateInput = z.object({
  fullName: z.string().trim().min(1).max(255),
  crn: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9\-\/\. ]*$/, "CRN inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z.string().trim().email().max(255),
});

export const updateMyNutritionistProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }): Promise<MyNutritionistProfile> => {
    const { userId } = context;
    const { data: updated, error } = await supabaseAdmin
      .from("nutritionists")
      .update({
        full_name: data.fullName,
        crn: data.crn ?? null,
        email: data.email,
      })
      .eq("auth_user_id", userId)
      .select("id, full_name, email, crn")
      .single();
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return {
      id: updated.id,
      fullName: updated.full_name,
      email: updated.email,
      crn: updated.crn,
    };
  });
