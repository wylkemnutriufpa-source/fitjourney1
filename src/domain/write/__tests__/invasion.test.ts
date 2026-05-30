// Domain Write — Invasion Test
// Tentativas de bypass do domain layer batendo direto no banco.
// CADA tentativa DEVE falhar. Se alguma passar, o lockdown regrediu.
//
// Como rodar:
//   bunx vitest run src/domain/write/__tests__/invasion.test.ts
//
// Requisitos de env:
//   VITE_SUPABASE_URL  (ou SUPABASE_URL)
//   VITE_SUPABASE_PUBLISHABLE_KEY  (ou SUPABASE_PUBLISHABLE_KEY)
//
// Este teste NÃO usa service_role — propositalmente. O ponto é provar que
// nenhum role exposto ao cliente consegue escrever nas tabelas de identidade.

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

const RANDOM_UUID = "00000000-0000-0000-0000-000000000001";
const RANDOM_UUID_2 = "00000000-0000-0000-0000-000000000002";

d("Domain lockdown — invasion (anon client)", () => {
  const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it("anon INSERT nutritionists is rejected", async () => {
    const { error } = await anon.from("nutritionists").insert({
      auth_user_id: RANDOM_UUID,
      full_name: "Invasor",
      email: "invasor@example.com",
    });
    expect(error).not.toBeNull();
  });

  it("anon UPDATE nutritionists is rejected", async () => {
    const { error } = await anon
      .from("nutritionists")
      .update({ full_name: "Hacked" })
      .eq("auth_user_id", RANDOM_UUID);
    expect(error).not.toBeNull();
  });

  it("anon DELETE nutritionists is rejected", async () => {
    const { error } = await anon
      .from("nutritionists")
      .delete()
      .eq("auth_user_id", RANDOM_UUID);
    expect(error).not.toBeNull();
  });

  it("anon INSERT patients is rejected", async () => {
    const { error } = await anon.from("patients").insert({
      auth_user_id: RANDOM_UUID,
      full_name: "Paciente Invasor",
      email: "paciente@example.com",
    });
    expect(error).not.toBeNull();
  });

  it("anon INSERT referral_codes is rejected", async () => {
    const { error } = await anon.from("referral_codes").insert({
      nutritionist_id: RANDOM_UUID,
      code: "INVASOR-001",
    });
    expect(error).not.toBeNull();
  });

  it("anon UPDATE referral_codes is rejected", async () => {
    const { error } = await anon
      .from("referral_codes")
      .update({ status: "active" })
      .eq("code", "ANY");
    expect(error).not.toBeNull();
  });

  it("anon DELETE patients is rejected", async () => {
    const { error } = await anon
      .from("patients")
      .delete()
      .eq("auth_user_id", RANDOM_UUID);
    expect(error).not.toBeNull();
  });

  it("anon cannot execute cleanup_orphan_auth_user", async () => {
    const { error } = await anon.rpc("cleanup_orphan_auth_user" as never, {
      _auth_user_id: RANDOM_UUID_2,
    } as never);
    expect(error).not.toBeNull();
  });
});

d("Domain lockdown — invasion (authenticated client, no user gate)", () => {
  // Sem session real conseguimos provar o lockdown de GRANT.
  // Mesmo se um atacante forjasse uma session com auth.uid() arbitrário,
  // GRANT bloqueia antes de RLS para INSERT/UPDATE/DELETE.
  const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it("forged auth_user_id INSERT in nutritionists still rejected", async () => {
    const { error } = await anon.from("nutritionists").insert({
      auth_user_id: RANDOM_UUID,
      full_name: "Forjado",
      email: "forjado@example.com",
    });
    expect(error).not.toBeNull();
    // Mensagem de erro deve indicar permissão/policy — não 23505 (que seria
    // sinal de que o insert chegou a tocar a tabela com sucesso).
    expect(error?.code).not.toBe("23505");
  });
});
