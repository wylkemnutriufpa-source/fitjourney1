// Configurações globais do app (chave Pix, WhatsApp para comprovante).
// Leitura: qualquer authenticated. Escrita: admin.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AppSettings = {
  pixKey: string;
  pixKeyType: string;
  whatsappNumber: string;
};

const DEFAULTS: AppSettings = {
  pixKey: "91980124814",
  pixKeyType: "celular",
  whatsappNumber: "5591980124814",
};

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppSettings> => {
    const { supabase } = context as { supabase: any };
    const { data } = await supabase
      .from("app_settings")
      .select("pix_key, pix_key_type, whatsapp_number")
      .eq("singleton", true)
      .maybeSingle();
    if (!data) return DEFAULTS;
    return {
      pixKey: data.pix_key ?? DEFAULTS.pixKey,
      pixKeyType: data.pix_key_type ?? DEFAULTS.pixKeyType,
      whatsappNumber: data.whatsapp_number ?? DEFAULTS.whatsappNumber,
    };
  });

const UpdateSchema = z.object({
  pixKey: z.string().min(3).max(120),
  pixKeyType: z.enum(["celular", "cpf", "cnpj", "email", "aleatoria"]),
  whatsappNumber: z.string().min(8).max(20).regex(/^\d+$/, "Somente dígitos com DDI+DDD, ex: 5591980124814"),
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
        updated_by: userId,
      })
      .eq("singleton", true)
      .select("pix_key, pix_key_type, whatsapp_number")
      .single();
    if (error) throw new Error(error.message);
    return {
      pixKey: updated.pix_key,
      pixKeyType: updated.pix_key_type,
      whatsappNumber: updated.whatsapp_number,
    };
  });
