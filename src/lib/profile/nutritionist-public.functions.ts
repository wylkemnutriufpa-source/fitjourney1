// Public read APIs for nutritionist landing pages and slug-based invite links.
// Usa supabaseAdmin (service_role) com SELECT explícito de colunas seguras —
// NÃO expõe email/phone/auth_user_id. RLS da tabela permanece restrita
// (sem policy aberta TO anon).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createAvatarSignedUrl } from "@/lib/profile/avatar-storage";

const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, "Slug inválido");

const CodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(4)
  .max(32)
  .regex(/^[A-Z0-9]+$/, "Código inválido");

export interface PublicNutritionistProfile {
  id: string;
  slug: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  specialty: string | null;
  crn: string | null;
  publicBio: string | null;
  publicHeadline: string | null;
}

/** Landing pública /n/{slug} — read-only, sem PII sensível. */
export const getNutritionistPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: SlugSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicNutritionistProfile | null> => {
    const { data: row, error } = await supabaseAdmin
      .from("nutritionists")
      .select(
        "id, slug, full_name, display_name, avatar_url, specialty, crn, public_bio, public_headline",
      )
      .ilike("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || !row.slug) return null;
    return {
      id: row.id,
      slug: row.slug,
      fullName: row.full_name,
      displayName: row.display_name,
      avatarUrl: await createAvatarSignedUrl(supabaseAdmin, row.avatar_url),
      specialty: row.specialty,
      crn: row.crn,
      publicBio: row.public_bio,
      publicHeadline: row.public_headline,
    };
  });

export interface ResolvedInvite {
  slug: string;
  code: string;
  nutritionistName: string;
}

/**
 * Resolve um convite pelo slug (e opcionalmente valida o code).
 * Usado pelas rotas /c/{slug} e /c/{slug}/{code} para redirecionar
 * ao /signup/patient?code=X canônico.
 */
export const resolveInviteBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ slug: SlugSchema, code: CodeSchema.optional() })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ResolvedInvite | null> => {
    const { data: nutri, error: nutriErr } = await supabaseAdmin
      .from("nutritionists")
      .select("id, slug, full_name, display_name")
      .ilike("slug", data.slug)
      .maybeSingle();
    if (nutriErr) throw new Error(nutriErr.message);
    if (!nutri || !nutri.slug) return null;

    let code = data.code ?? null;
    if (code) {
      // Valida que o code pertence a este nutri e está utilizável.
      const { data: ref, error: refErr } = await supabaseAdmin
        .from("referral_codes")
        .select("code, status, expires_at")
        .eq("code", code)
        .eq("nutritionist_id", nutri.id)
        .maybeSingle();
      if (refErr) throw new Error(refErr.message);
      if (!ref) return null;
      if (ref.status !== "active" && ref.status !== "consumed") return null;
      if (ref.expires_at && new Date(ref.expires_at) < new Date()) return null;
    } else {
      // Sem code explícito: pega o ativo mais recente do nutri.
      const { data: ref, error: refErr } = await supabaseAdmin
        .from("referral_codes")
        .select("code")
        .eq("nutritionist_id", nutri.id)
        .in("status", ["active", "consumed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (refErr) throw new Error(refErr.message);
      if (!ref) return null;
      code = ref.code;
    }

    return {
      slug: nutri.slug,
      code: code!,
      nutritionistName: nutri.display_name?.trim() || nutri.full_name,
    };
  });
