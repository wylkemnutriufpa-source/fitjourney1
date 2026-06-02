// Nutritionist self profile — read, upsert, referral code.
// Soberania: o profissional edita seus próprios dados.
// Escrita usa supabaseAdmin (service_role) — alinhado ao lockdown da Fase 2.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createAvatarSignedUrl, getAvatarStoragePath, isAvatarStorageReference } from "@/lib/profile/avatar-storage";

export interface MyNutritionistProfile {
  id: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
  crn: string | null;
  specialty: string | null;
  phone: string | null;
  slug: string | null;
  publicBio: string | null;
  publicHeadline: string | null;
}

export const getMyNutritionistProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyNutritionistProfile | null> => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("nutritionists")
      .select(
        "id, full_name, display_name, avatar_url, email, crn, specialty, phone, slug, public_bio, public_headline",
      )
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id,
      fullName: data.full_name,
      displayName: data.display_name,
      avatarUrl: await createAvatarSignedUrl(supabaseAdmin, data.avatar_url),
      email: data.email,
      crn: data.crn,
      specialty: data.specialty,
      phone: data.phone,
      slug: data.slug ?? null,
      publicBio: data.public_bio ?? null,
      publicHeadline: data.public_headline ?? null,
    };
  });

const UpdateInput = z.object({
  fullName: z.string().trim().min(1).max(255),
  displayName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  avatarUrl: z
    .string()
    .trim()
    .max(1024)
    .refine(isAvatarStorageReference, "Avatar inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  crn: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9\-\/\. ]*$/, "CRN inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z.string().trim().email().max(255),
  specialty: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+()\-\s]*$/, "Telefone inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(40)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/,
      "Slug deve ter 3-40 caracteres: letras minúsculas, números e hífen",
    )
    .optional()
    .or(z.literal("").transform(() => undefined)),
  publicBio: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  publicHeadline: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const updateMyNutritionistProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }): Promise<MyNutritionistProfile> => {
    const { userId } = context;

    const { data: upserted, error } = await supabaseAdmin
      .from("nutritionists")
      .upsert(
        {
          auth_user_id: userId,
          full_name: data.fullName,
          display_name: data.displayName ?? null,
          avatar_url: data.avatarUrl ? getAvatarStoragePath(data.avatarUrl) : null,
          crn: data.crn ?? null,
          email: data.email,
          specialty: data.specialty ?? null,
          phone: data.phone ?? null,
          slug: data.slug ?? null,
          public_bio: data.publicBio ?? null,
          public_headline: data.publicHeadline ?? null,
        },
        { onConflict: "auth_user_id" }
      )
      .select(
        "id, full_name, display_name, avatar_url, email, crn, specialty, phone, slug, public_bio, public_headline",
      )
      .single();
    if (error) {
      // 23505 = unique_violation (slug duplicado)
      const code = (error as { code?: string }).code;
      if (code === "23505") {
        throw new Error("Este endereço (slug) já está em uso. Escolha outro.");
      }
      throw new Error(`Failed to save profile: ${error.message}`);
    }
    return {
      id: upserted.id,
      fullName: upserted.full_name,
      displayName: upserted.display_name,
      avatarUrl: await createAvatarSignedUrl(supabaseAdmin, upserted.avatar_url),
      email: upserted.email,
      crn: upserted.crn,
      specialty: upserted.specialty,
      phone: upserted.phone,
      slug: upserted.slug ?? null,
      publicBio: upserted.public_bio ?? null,
      publicHeadline: upserted.public_headline ?? null,
    };
  });


// Gera (ou recupera) um código de convite ativo do nutricionista logado.
// Usado para gerar a URL pública que o paciente usa no cadastro.
export interface MyReferralCode {
  code: string;
  createdAt: string;
}

function generateCode(): string {
  // 8 chars, alfanumérico maiúsculo, sem caracteres ambíguos.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const getOrCreateMyReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyReferralCode | null> => {
    const { userId } = context;

    // Garante que existe um nutritionist row para este auth user.
    const { data: nutri, error: nutriErr } = await supabaseAdmin
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (nutriErr) throw new Error(nutriErr.message);
    if (!nutri) return null;

    // Tenta reaproveitar o código único existente. "consumed" virou legado:
    // o convite online identifica o nutricionista e pode cadastrar vários pacientes.
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("referral_codes")
      .select("code, created_at")
      .eq("nutritionist_id", nutri.id)
      .in("status", ["active", "consumed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingErr) throw new Error(existingErr.message);
    if (existing) {
      return { code: existing.code, createdAt: existing.created_at };
    }

    // Cria um novo código.
    let lastErr: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data: created, error: insertErr } = await supabaseAdmin
        .from("referral_codes")
        .insert({
          code,
          nutritionist_id: nutri.id,
          status: "active",
        })
        .select("code, created_at")
        .single();
      if (!insertErr && created) {
        return { code: created.code, createdAt: created.created_at };
      }
      lastErr = insertErr?.message ?? "unknown";
    }
    throw new Error(`Failed to create referral code: ${lastErr}`);
  });
