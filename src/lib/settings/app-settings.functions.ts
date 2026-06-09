// Configurações globais do app (chave Pix, WhatsApp, planos de checkout).
// Leitura: qualquer authenticated. Escrita: admin.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type CheckoutPlan = {
  id: string;
  label: string;
  /** Código Pix copia-e-cola (BR Code / EMV). */
  pixCode: string;
  /** QR code como data URL (image/png base64). Opcional. */
  qrCodeDataUrl: string | null;
  /** Valor sugerido em reais (string para preservar formato), opcional. */
  amount?: string | null;
};

export type AppSettings = {
  pixKey: string;
  pixKeyType: string;
  whatsappNumber: string;
  checkoutPlans: CheckoutPlan[];
};

const DEFAULTS: AppSettings = {
  pixKey: "91980124814",
  pixKeyType: "celular",
  whatsappNumber: "5591980124814",
  checkoutPlans: [],
};

const CheckoutPlanSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  pixCode: z.string().max(4000).default(""),
  qrCodeDataUrl: z
    .string()
    .max(2_000_000) // ~2MB data URL
    .nullable()
    .default(null),
  amount: z.string().max(20).nullable().optional(),
});

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppSettings> => {
    const { supabase } = context as { supabase: any };
    const { data } = await supabase
      .from("app_settings")
      .select("pix_key, pix_key_type, whatsapp_number, checkout_plans")
      .eq("singleton", true)
      .maybeSingle();
    if (!data) return DEFAULTS;
    const plansRaw = Array.isArray(data.checkout_plans) ? data.checkout_plans : [];
    const checkoutPlans: CheckoutPlan[] = plansRaw
      .map((p: any) => {
        const parsed = CheckoutPlanSchema.safeParse(p);
        return parsed.success ? parsed.data : null;
      })
      .filter(Boolean) as CheckoutPlan[];
    return {
      pixKey: data.pix_key ?? DEFAULTS.pixKey,
      pixKeyType: data.pix_key_type ?? DEFAULTS.pixKeyType,
      whatsappNumber: data.whatsapp_number ?? DEFAULTS.whatsappNumber,
      checkoutPlans,
    };
  });

const UpdateSchema = z.object({
  pixKey: z.string().min(3).max(120),
  pixKeyType: z.enum(["celular", "cpf", "cnpj", "email", "aleatoria"]),
  whatsappNumber: z
    .string()
    .min(8)
    .max(20)
    .regex(/^\d+$/, "Somente dígitos com DDI+DDD, ex: 5591980124814"),
  checkoutPlans: z.array(CheckoutPlanSchema).max(20).default([]),
});

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSchema.parse(input))
  .handler(async ({ data, context }): Promise<AppSettings> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: updated, error } = await supabase
      .from("app_settings")
      .update({
        pix_key: data.pixKey,
        pix_key_type: data.pixKeyType,
        whatsapp_number: data.whatsappNumber,
        checkout_plans: data.checkoutPlans,
        updated_by: userId,
      })
      .eq("singleton", true)
      .select("pix_key, pix_key_type, whatsapp_number, checkout_plans")
      .single();
    if (error) throw new Error(error.message);
    return {
      pixKey: updated.pix_key,
      pixKeyType: updated.pix_key_type,
      whatsappNumber: updated.whatsapp_number,
      checkoutPlans: (updated.checkout_plans as CheckoutPlan[]) ?? [],
    };
  });
