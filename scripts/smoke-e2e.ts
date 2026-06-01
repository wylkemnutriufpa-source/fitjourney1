/**
 * FitJourney 2.0 — Smoke E2E (B2)
 *
 * Valida pipeline soberano contra o banco real:
 *   1. Cria nutri smoke (auth.users + nutritionists)
 *   2. Cria paciente smoke (auth.users + patients vinculado ao nutri)
 *   3. Cria anamnese V2 draft → aprova (testa trigger anamneses_approved_immutable)
 *   4. Tenta UPDATE em anamnese aprovada → DEVE falhar
 *   5. Insere plano com snapshot V3 mínimo válido (status=draft)
 *   6. Publica plano (status=published) → testa trigger plans_stamp_published_at
 *   7. Tenta UPDATE no snapshot publicado → DEVE falhar (plans_snapshot_immutable)
 *   8. Lê plano como paciente (cliente anon com sessão) → testa RLS
 *   9. Cleanup completo (a menos que --keep)
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/smoke-e2e.ts
 *   bun run scripts/smoke-e2e.ts --keep   # mantém dados pra inspeção manual
 *
 * NÃO toca templates, planos publicados existentes, nem qualquer dado real.
 * Tudo criado é marcado com source_legacy_id='smoke-e2e-<timestamp>'.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------- Config ----------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const KEEP = process.argv.includes("--keep");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error(
    "❌ Faltam env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_ANON_KEY)",
  );
  process.exit(1);
}

const STAMP = Date.now();
const TAG = `smoke-e2e-${STAMP}`;
const NUTRI_EMAIL = `smoke-nutri-${STAMP}@fitjourney.local`;
const PATIENT_EMAIL = `smoke-patient-${STAMP}@fitjourney.local`;
const PASSWORD = "SmokeE2E@2026";

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- Helpers ----------

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function expectThrow(label: string, fn: () => Promise<unknown>) {
  try {
    const r = await fn();
    const err = (r as any)?.error;
    if (err) {
      pass++;
      console.log(`  ✅ ${label} (bloqueado: ${err.message})`);
      return;
    }
    fail++;
    failures.push(`${label} — NÃO foi bloqueado, deveria ter falhado`);
    console.log(`  ❌ ${label} — NÃO foi bloqueado`);
  } catch (e: any) {
    pass++;
    console.log(`  ✅ ${label} (throw: ${e?.message ?? e})`);
  }
}

// ---------- Snapshot V3 mínimo válido ----------

function buildMinimalSnapshot(): Record<string, unknown> {
  return {
    id: `smoke-plan-${STAMP}`,
    name: "Smoke E2E Plan",
    kcal: 2000,
    meals: [
      {
        id: "m1",
        time: "08:00",
        label: "Café da manhã",
        main: {
          id: "opt1",
          title: "Aveia com banana",
          imageKey: "aveia-banana",
          items: [
            {
              id: "i1",
              foodKey: "aveia-flocos",
              name: "Aveia em flocos",
              qty: 40,
              unit: "g",
              kcal: 156,
              scaleGroup: "cereal",
            },
            {
              id: "i2",
              foodKey: "banana-nanica",
              name: "Banana nanica",
              qty: 100,
              unit: "g",
              kcal: 89,
              scaleGroup: "fruit",
            },
          ],
        },
        equivalents: [],
      },
    ],
  };
}

// ---------- IDs criados (para cleanup) ----------

const created = {
  nutriAuthId: "" as string,
  nutriId: "" as string,
  patientAuthId: "" as string,
  patientId: "" as string,
  anamneseId: "" as string,
  planId: "" as string,
};

// ---------- Run ----------

async function run() {
  console.log(`\n🔥 Smoke E2E — tag=${TAG}\n`);

  // 1. Cria nutri (auth + row)
  console.log("1) Criando nutri smoke...");
  const { data: nutriAuth, error: nutriAuthErr } =
    await admin.auth.admin.createUser({
      email: NUTRI_EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
  check("auth.users (nutri) criado", !nutriAuthErr && !!nutriAuth.user, nutriAuthErr?.message);
  if (!nutriAuth.user) throw new Error("nutri auth fail");
  created.nutriAuthId = nutriAuth.user.id;

  const { data: nutri, error: nutriErr } = await admin
    .from("nutritionists")
    .insert({
      auth_user_id: created.nutriAuthId,
      full_name: `Smoke Nutri ${STAMP}`,
      email: NUTRI_EMAIL,
    })
    .select("id")
    .single();
  check("nutritionists row criada", !nutriErr && !!nutri, nutriErr?.message);
  if (!nutri) throw new Error("nutri row fail");
  created.nutriId = nutri.id;

  // 2. Cria paciente vinculado
  console.log("\n2) Criando paciente smoke...");
  const { data: patAuth, error: patAuthErr } =
    await admin.auth.admin.createUser({
      email: PATIENT_EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
  check("auth.users (patient) criado", !patAuthErr && !!patAuth.user, patAuthErr?.message);
  if (!patAuth.user) throw new Error("patient auth fail");
  created.patientAuthId = patAuth.user.id;

  const { data: patient, error: patErr } = await admin
    .from("patients")
    .insert({
      auth_user_id: created.patientAuthId,
      nutritionist_id: created.nutriId,
      full_name: `Smoke Patient ${STAMP}`,
      email: PATIENT_EMAIL,
      birth_date: "1990-01-01",
      source_legacy_id: TAG,
    })
    .select("id")
    .single();
  check("patients row criada", !patErr && !!patient, patErr?.message);
  if (!patient) throw new Error("patient row fail");
  created.patientId = patient.id;

  // 3. Cria anamnese draft → aprova
  console.log("\n3) Anamnese V2 draft → approved...");
  const { data: anam, error: anamErr } = await admin
    .from("anamneses")
    .insert({
      patient_id: created.patientId,
      nutritionist_id: created.nutriId,
      data: {
        schema_version: 2,
        demographics: { sex: "male", age_years: 30, height_cm: 178 },
        anthro: { weight_kg: 75 },
        lifestyle: { activity: "moderate" },
        goal: { kind: "performance" },
      },
      review_status: "draft",
      status: "draft",
    })
    .select("id")
    .single();
  check("anamnese draft criada", !anamErr && !!anam, anamErr?.message);
  if (!anam) throw new Error("anamnese insert fail");
  created.anamneseId = anam.id;

  const { error: approveErr } = await admin
    .from("anamneses")
    .update({ review_status: "approved", approved_by: created.nutriAuthId })
    .eq("id", created.anamneseId);
  check("anamnese aprovada", !approveErr, approveErr?.message);

  // 4. UPDATE em anamnese aprovada deve falhar (trigger)
  console.log("\n4) Imutabilidade de anamnese aprovada...");
  await expectThrow("UPDATE em anamnese approved bloqueado", () =>
    admin
      .from("anamneses")
      .update({ review_notes: "tentativa de mutação" })
      .eq("id", created.anamneseId),
  );

  // 5. Cria plano draft com snapshot V3
  console.log("\n5) Criando plano draft...");
  const snapshot = buildMinimalSnapshot();
  const { data: plan, error: planErr } = await admin
    .from("plans")
    .insert({
      patient_id: created.patientId,
      nutritionist_id: created.nutriId,
      snapshot,
      status: "draft",
    })
    .select("id, published_at")
    .single();
  check("plan draft criado", !planErr && !!plan, planErr?.message);
  if (!plan) throw new Error("plan insert fail");
  created.planId = plan.id;
  check("plan draft sem published_at", plan.published_at === null);

  // 6. Publica → trigger carimba published_at
  console.log("\n6) Publicando plano...");
  const { data: pub, error: pubErr } = await admin
    .from("plans")
    .update({ status: "published" })
    .eq("id", created.planId)
    .select("status, published_at")
    .single();
  check("plan published OK", !pubErr && pub?.status === "published", pubErr?.message);
  check("published_at carimbado pelo trigger", !!pub?.published_at);

  // 7. UPDATE em snapshot publicado deve falhar
  console.log("\n7) Imutabilidade de snapshot publicado...");
  await expectThrow("UPDATE snapshot bloqueado", () =>
    admin
      .from("plans")
      .update({ snapshot: { ...snapshot, name: "tentativa" } })
      .eq("id", created.planId),
  );
  await expectThrow("UPDATE patient_id bloqueado", () =>
    admin
      .from("plans")
      .update({ patient_id: created.nutriAuthId })
      .eq("id", created.planId),
  );

  // 8. RLS — paciente lê plano publicado
  console.log("\n8) RLS — paciente lê próprio plano publicado...");
  const patClient = createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await patClient.auth.signInWithPassword({
    email: PATIENT_EMAIL,
    password: PASSWORD,
  });
  check("paciente signIn OK", !signInErr, signInErr?.message);

  const { data: readPlans, error: readErr } = await patClient
    .from("plans")
    .select("id, status, snapshot")
    .eq("patient_id", created.patientId);
  check(
    "paciente vê 1 plano publicado",
    !readErr && readPlans?.length === 1 && readPlans[0].status === "published",
    readErr?.message ?? `count=${readPlans?.length}`,
  );

  // Patient não vê plano de outro paciente (sanity de RLS):
  const { data: otherPlans } = await patClient.from("plans").select("id").neq("patient_id", created.patientId);
  check("paciente não vê planos alheios", (otherPlans?.length ?? 0) === 0);

  // Patient não pode escrever em plans:
  await expectThrow("paciente INSERT em plans bloqueado por RLS", () =>
    patClient.from("plans").insert({
      patient_id: created.patientId,
      nutritionist_id: created.nutriId,
      snapshot: { x: 1 },
      status: "draft",
    }),
  );

  await patClient.auth.signOut();

  // 9. Cleanup
  if (KEEP) {
    console.log("\n9) --keep ativado, NÃO limpando. IDs:");
    console.log(created);
  } else {
    console.log("\n9) Cleanup...");
    await admin.from("plans").delete().eq("id", created.planId);
    // anamnese aprovada não tem DELETE policy via client, mas service_role bypassa RLS;
    // a tabela tampouco tem trigger bloqueando DELETE — só UPDATE.
    await admin.from("anamneses").delete().eq("id", created.anamneseId);
    await admin.from("patients").delete().eq("id", created.patientId);
    await admin.from("nutritionists").delete().eq("id", created.nutriId);
    await admin.auth.admin.deleteUser(created.patientAuthId);
    await admin.auth.admin.deleteUser(created.nutriAuthId);
    console.log("  ✅ cleanup OK");
  }

  // Resultado
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  PASS: ${pass}   FAIL: ${fail}`);
  if (fail > 0) {
    console.log(`\n  Falhas:`);
    for (const f of failures) console.log(`   - ${f}`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch(async (e) => {
  console.error("\n💥 Erro fatal:", e);
  // Tenta cleanup mesmo em erro
  if (!KEEP) {
    try {
      if (created.planId) await admin.from("plans").delete().eq("id", created.planId);
      if (created.anamneseId) await admin.from("anamneses").delete().eq("id", created.anamneseId);
      if (created.patientId) await admin.from("patients").delete().eq("id", created.patientId);
      if (created.nutriId) await admin.from("nutritionists").delete().eq("id", created.nutriId);
      if (created.patientAuthId) await admin.auth.admin.deleteUser(created.patientAuthId);
      if (created.nutriAuthId) await admin.auth.admin.deleteUser(created.nutriAuthId);
      console.log("🧹 cleanup pós-erro OK");
    } catch (ce) {
      console.error("⚠️  cleanup falhou:", ce);
    }
  }
  process.exit(1);
});
