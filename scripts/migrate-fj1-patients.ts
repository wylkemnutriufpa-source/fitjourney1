/**
 * FitJourney — Migração FJ1 → FJ2 (B4)
 *
 * Lê /tmp/fj1-patients.json (export do banco antigo), resolve nutricionista por
 * email (case-insensitive) e cria auth.users + patients no FJ2.0.
 *
 * Idempotente via source_legacy_id (índice único parcial em patients).
 *
 * Regras:
 *  - Senha padrão: FitJourney@2026
 *  - app_metadata: { needs_password_change: true, source: 'fj1-migration', legacy_id }
 *  - Skip silencioso quando nutri ausente / email vazio / conta de teste
 *  - Skip quando source_legacy_id já existe (rerun seguro)
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/migrate-fj1-patients.ts            # dry-run
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/migrate-fj1-patients.ts --execute  # grava
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EXECUTE = process.argv.includes("--execute");
const INPUT_PATH = process.env.FJ1_EXPORT ?? "/tmp/fj1-patients.json";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Faltam SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEFAULT_PASSWORD = "FitJourney@2026";

const TEST_DOMAINS = [
  "@example.com",
  "@fitjourney.com",
  "@fitjourney.com.br",
];
const TEST_LOCAL_PARTS = [
  "tester_",
  "test_",
  "agent-",
  "validador",
  "testnutri",
  "nutri-e2e",
];

function isTestEmail(email: string): boolean {
  const e = email.toLowerCase().trim();
  if (TEST_DOMAINS.some((d) => e.endsWith(d))) return true;
  const local = e.split("@")[0] ?? "";
  if (TEST_LOCAL_PARTS.some((p) => local.startsWith(p))) return true;
  return false;
}

interface Fj1Patient {
  legacy_id: string;
  email: string;
  full_name: string;
  nutritionist_email: string;
  created_at: string;
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function loadNutriMap(): Promise<Map<string, string>> {
  // email lowercase → nutritionists.id
  const { data, error } = await admin.from("nutritionists").select("id, email");
  if (error) throw error;
  const map = new Map<string, string>();
  for (const n of data ?? []) {
    map.set(String(n.email).toLowerCase().trim(), n.id as string);
  }
  return map;
}

async function loadExistingLegacyIds(): Promise<Set<string>> {
  const set = new Set<string>();
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await admin
      .from("patients")
      .select("source_legacy_id")
      .not("source_legacy_id", "is", null)
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row.source_legacy_id) set.add(String(row.source_legacy_id));
    }
    if (data.length < page) break;
    from += page;
  }
  return set;
}

interface Report {
  total: number;
  inserted: number;
  skippedAlready: number;
  skippedNoNutri: number;
  skippedTest: number;
  skippedEmpty: number;
  failed: Array<{ legacy_id: string; email: string; reason: string }>;
}

async function main() {
  const raw = readFileSync(INPUT_PATH, "utf-8");
  const all: Fj1Patient[] = JSON.parse(raw);

  console.log(`\n🚚 Migração FJ1 → FJ2  (${EXECUTE ? "EXECUTE" : "DRY-RUN"})`);
  console.log(`   Fonte: ${INPUT_PATH}  (${all.length} registros)\n`);

  const nutriMap = await loadNutriMap();
  console.log(`📇 Nutricionistas em FJ2.0: ${nutriMap.size}`);
  for (const [email] of nutriMap) console.log(`   • ${email}`);

  const existing = await loadExistingLegacyIds();
  console.log(`\n🗂  Pacientes já migrados (source_legacy_id != null): ${existing.size}\n`);

  const rep: Report = {
    total: all.length,
    inserted: 0,
    skippedAlready: 0,
    skippedNoNutri: 0,
    skippedTest: 0,
    skippedEmpty: 0,
    failed: [],
  };

  const toProcess: Array<{ p: Fj1Patient; nutriId: string }> = [];

  for (const p of all) {
    if (existing.has(p.legacy_id)) {
      rep.skippedAlready++;
      continue;
    }
    if (!p.email?.trim() || !p.nutritionist_email?.trim()) {
      rep.skippedEmpty++;
      continue;
    }
    if (isTestEmail(p.email) || isTestEmail(p.nutritionist_email)) {
      rep.skippedTest++;
      continue;
    }
    const nutriId = nutriMap.get(p.nutritionist_email.toLowerCase().trim());
    if (!nutriId) {
      rep.skippedNoNutri++;
      continue;
    }
    toProcess.push({ p, nutriId });
  }

  console.log(`📋 Plano:`);
  console.log(`   Migrar agora:           ${toProcess.length}`);
  console.log(`   Skip (já migrado):      ${rep.skippedAlready}`);
  console.log(`   Skip (email vazio):     ${rep.skippedEmpty}`);
  console.log(`   Skip (conta de teste):  ${rep.skippedTest}`);
  console.log(`   Skip (nutri ausente):   ${rep.skippedNoNutri}`);

  if (!EXECUTE) {
    console.log(`\n💡 Dry-run apenas. Rode com --execute para gravar.\n`);
    return;
  }

  console.log(`\n🚀 Executando...\n`);
  let i = 0;
  for (const { p, nutriId } of toProcess) {
    i++;
    let authId: string | null = null;
    try {
      const { data: au, error: aerr } = await admin.auth.admin.createUser({
        email: p.email.trim(),
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: p.full_name },
        app_metadata: {
          needs_password_change: true,
          source: "fj1-migration",
          legacy_id: p.legacy_id,
        },
      });
      if (aerr || !au.user) throw new Error(`auth.createUser: ${aerr?.message ?? "no user"}`);
      authId = au.user.id;

      const { error: perr } = await admin.from("patients").insert({
        auth_user_id: authId,
        nutritionist_id: nutriId,
        email: p.email.trim(),
        full_name: p.full_name,
        source_legacy_id: p.legacy_id,
      });
      if (perr) throw new Error(`patients.insert: ${perr.message}`);

      rep.inserted++;
      if (i % 25 === 0) console.log(`   ✓ ${i}/${toProcess.length}  (${p.email})`);
    } catch (e: any) {
      const reason = e?.message ?? String(e);
      rep.failed.push({ legacy_id: p.legacy_id, email: p.email, reason });
      console.log(`   ✗ ${p.email}: ${reason}`);
      // Rollback do auth.users se o insert em patients falhou
      if (authId) {
        try {
          await admin.auth.admin.deleteUser(authId);
        } catch {
          // silenciar — não vale a pena complicar
        }
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✅ inserted:         ${rep.inserted}`);
  console.log(`  ⏭  skip (já):        ${rep.skippedAlready}`);
  console.log(`  ⏭  skip (vazio):     ${rep.skippedEmpty}`);
  console.log(`  ⏭  skip (teste):     ${rep.skippedTest}`);
  console.log(`  ⏭  skip (sem nutri): ${rep.skippedNoNutri}`);
  console.log(`  ❌ falhas:           ${rep.failed.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (rep.failed.length > 0) {
    console.log(`Falhas detalhadas:`);
    for (const f of rep.failed) console.log(`  - ${f.email} (${f.legacy_id}): ${f.reason}`);
  }
}

main().catch((e) => {
  console.error("\n💥 Erro fatal:", e);
  process.exit(1);
});
