import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PatientSearchHit = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

/**
 * Busca leve de pacientes do nutricionista logado por nome / email / telefone.
 * Sem joins. Limite duro para não vazar listas inteiras no modal.
 */
export const searchMyPatients = createServerFn({ method: "POST" })
  .inputValidator((input: { q: string }) => ({
    q: String(input?.q ?? "").trim().slice(0, 80),
  }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<PatientSearchHit[]> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const q = data.q;
    if (q.length < 2) return [];

    const { data: nutri } = await supabase
      .from("nutritionists")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!nutri) return [];

    // Escapa wildcards do PostgREST ilike
    const safe = q.replace(/[%_]/g, (m) => `\\${m}`);
    const pattern = `%${safe}%`;

    const { data: rows, error } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, is_active")
      .eq("nutritionist_id", nutri.id)
      .or(
        `full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`,
      )
      .order("is_active", { ascending: false })
      .order("full_name", { ascending: true })
      .limit(12);
    if (error) throw new Error(error.message);
    return (rows ?? []) as PatientSearchHit[];
  });
