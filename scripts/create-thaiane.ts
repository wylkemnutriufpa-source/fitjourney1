import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "thaiane.quelci@hotmail.com";
const FULL_NAME = "Thaiane Quelci Gomes da Cunha";
const PHONE = "94992982642";
const PASSWORD = "FitJourney@2026";

// 1) check if auth user exists
const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
let user = list.users.find(u => (u.email ?? "").toLowerCase() === EMAIL);

if (user) {
  console.log("auth user already exists:", user.id, user.email);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: FULL_NAME },
    app_metadata: { needs_password_change: true, source: "manual-nutri-create" },
  });
  if (error) throw error;
  user = data.user!;
  console.log("auth user CREATED:", user.id);
}

// 2) check nutritionist row
const { data: existingNutri } = await admin.from("nutritionists").select("id").eq("auth_user_id", user.id).maybeSingle();
let nutriId: string;
if (existingNutri) {
  nutriId = existingNutri.id;
  console.log("nutritionist row exists:", nutriId);
} else {
  const { data: nu, error: nerr } = await admin.from("nutritionists").insert({
    auth_user_id: user.id,
    email: EMAIL,
    full_name: FULL_NAME,
    phone: PHONE,
  }).select("id").single();
  if (nerr) throw nerr;
  nutriId = nu.id;
  console.log("nutritionist row CREATED:", nutriId);
}

// 3) if she had a patient row (legacy upgrade), detach safely — just report
const { data: legacyPatient } = await admin.from("patients").select("id, nutritionist_id").eq("auth_user_id", user.id).maybeSingle();
if (legacyPatient) {
  console.log("⚠️  legacy patient row present:", legacyPatient.id, "— manual review if needed");
} else {
  console.log("no legacy patient row.");
}

console.log("\n✅ Thaiane pronta. Rode migrate-fj1-patients.ts --execute para linkar os 7 pacientes.");
