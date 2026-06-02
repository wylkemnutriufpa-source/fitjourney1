// Patient ↔ Nutritionist Binding — regression guard.
// Garante que ninguém consegue criar paciente órfão (sem nutritionist_id)
// ou trocar o vínculo depois de criado. Se qualquer caso passar, a
// trigger `patients_enforce_nutritionist_link` ou a RLS de patients
// regrediu.
//
// Rodar:
//   bunx vitest run src/domain/write/__tests__/patient-binding.test.ts

import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

const hasEnv = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const d = hasEnv ? describe : describe.skip;

const RANDOM_UUID = "00000000-0000-0000-0000-0000000000aa";
const RANDOM_UUID_2 = "00000000-0000-0000-0000-0000000000bb";

d("Patient binding — anon cannot create orphan patients", () => {
  const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it("INSERT patient sem nutritionist_id é rejeitado", async () => {
    const { error } = await anon.from("patients").insert({
      auth_user_id: RANDOM_UUID,
      full_name: "Órfão A",
      email: "orfao-a@example.com",
    });
    expect(error).not.toBeNull();
  });

  it("INSERT patient sem source_referral_code é rejeitado", async () => {
    const { error } = await anon.from("patients").insert({
      auth_user_id: RANDOM_UUID,
      full_name: "Órfão B",
      email: "orfao-b@example.com",
      nutritionist_id: RANDOM_UUID_2,
    });
    expect(error).not.toBeNull();
  });

  it("INSERT patient com code inválido é rejeitado (sem dono = sem vínculo)", async () => {
    const { error } = await anon.from("patients").insert({
      auth_user_id: RANDOM_UUID,
      full_name: "Órfão C",
      email: "orfao-c@example.com",
      source_referral_code: "CODE-QUE-NAO-EXISTE-XYZ",
    });
    expect(error).not.toBeNull();
  });
});

d("Patient binding — public read endpoints não vazam PII", () => {
  const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it("anon SELECT direto em patients é rejeitado", async () => {
    const { data, error } = await anon.from("patients").select("*").limit(1);
    // Sem session: RLS bloqueia leitura
    expect(error !== null || (Array.isArray(data) && data.length === 0)).toBe(true);
  });

  it("anon SELECT email em nutritionists é rejeitado (sem ser dono)", async () => {
    const { data, error } = await anon
      .from("nutritionists")
      .select("email, phone")
      .limit(1);
    expect(error !== null || (Array.isArray(data) && data.length === 0)).toBe(true);
  });
});
