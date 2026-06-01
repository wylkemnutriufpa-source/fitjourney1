// Snapshot V3 — contrato estrutural do plano publicado.
//
// Princípio soberano: o profissional manda. Este schema NUNCA bloqueia
// publicação. Ele apenas valida estrutura e devolve uma lista de warnings
// que vão para `clinical_review` dentro do próprio snapshot — auditoria,
// não censura.
//
// Use `validateSnapshot(input)` no servidor antes de inserir em
// public.plans. O retorno é { snapshot, review } onde:
//   - snapshot: dado original (intocado, sem reescrita / sem recálculo)
//   - review: { structural_warnings, clinical_warnings, validated_at }
//
// O servidor incorpora `review` em snapshot.clinical_review e persiste.
// Renderers do Patient App / PDF leem snapshot como fonte única e podem
// (opcionalmente) exibir clinical_review como aviso ao paciente/nutri.

import { z } from "zod";

// ---------- Schemas estruturais (passthrough — não normalizam) ----------

const PlannerFoodItemSchema = z
  .object({
    id: z.string().min(1),
    foodKey: z.string().min(1),
    name: z.string().min(1),
    qty: z.number().nonnegative(),
    unit: z.string().min(1),
    kcal: z.number().nonnegative(),
    scaleGroup: z.string().min(1),
  })
  .passthrough();

const PlannerMealOptionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    imageKey: z.string().min(1),
    items: z.array(PlannerFoodItemSchema).min(1),
    recipe: z.string().optional(),
  })
  .passthrough();

const PlannerMealSchema = z
  .object({
    id: z.string().min(1),
    time: z.string().min(1),
    label: z.string().min(1),
    main: PlannerMealOptionSchema,
    equivalents: z.array(PlannerMealOptionSchema),
    heroKey: z.string().optional(),
  })
  .passthrough();

// ---------- Auditoria clínica anexada ao snapshot ----------
//
// Bloco OPCIONAL no schema (planos antigos não têm). Quando presente,
// representa o estado clínico que alimentou os motores no momento da
// publicação. É imutável (snapshot inteiro é imutável após published_at)
// e responde por:
//   - "qual peso foi usado?"
//   - "qual goal?"
//   - "qual motor e qual gate?"
//   - "quais warnings o gate emitiu (sem bloquear)?"

export const ClinicalAuditSchema = z
  .object({
    clinicalContextSnapshot: z.object({
      currentWeight: z
        .object({
          weightKg: z.number(),
          observedAt: z.string(),
          source: z.enum(["anamnesis", "feedback", "physical_assessment"]),
          sourceId: z.string(),
        })
        .nullable(),
      currentGoal: z
        .object({
          kind: z.string(),
          sourceAnamnesisId: z.string(),
        })
        .nullable(),
      demographics: z.object({
        sex: z.string().nullable(),
        ageYears: z.number().nullable(),
        heightCm: z.number().nullable(),
        activity: z.string().nullable(),
        sourceAnamnesisId: z.string().nullable(),
      }),
      // Snapshot publicado: sempre calculável (publish bloqueia se false).
      calculable: z.literal(true),
    }),
    engineOutput: z.object({
      tmb: z.number(),
      tdee: z.number(),
      target: z.object({
        kcal: z.number(),
        proteinG: z.number(),
        carbG: z.number(),
        fatG: z.number(),
      }),
      clinicalGoalKind: z.string(),
      engineGoal: z.string(),
    }),
    gateWarnings: z.array(
      z.object({
        code: z.string(),
        message: z.string(),
      }),
    ),
    engineVersion: z.string(),
    gateVersion: z.string(),
    publishedAt: z.string(),
  })
  .passthrough();

export type ClinicalAudit = z.infer<typeof ClinicalAuditSchema>;

export const SnapshotV3Schema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kcal: z.number().nonnegative(),
    meals: z.array(PlannerMealSchema).min(1),
    clinicalAudit: ClinicalAuditSchema.optional(),
  })
  .passthrough();

export type SnapshotV3 = z.infer<typeof SnapshotV3Schema>;

// ---------- Tipo da revisão clínica anexada ao snapshot ----------

export type ClinicalReview = {
  schema_version: 3;
  validated_at: string; // ISO
  structural_warnings: string[]; // problemas de forma (não bloqueiam)
  clinical_warnings: string[]; // problemas clínicos (não bloqueiam)
};

// ---------- Função pública: validateSnapshot ----------

export function validateSnapshot(input: unknown): {
  snapshot: Record<string, unknown>;
  review: ClinicalReview;
} {
  const structural_warnings: string[] = [];
  const clinical_warnings: string[] = [];

  // 1) Estrutura — warn-only. Profissional pode publicar mesmo assim.
  const parsed = SnapshotV3Schema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "(raiz)";
      structural_warnings.push(`${path}: ${issue.message}`);
    }
  }

  // 2) Sanidade clínica leve — também warn-only.
  // Lê o input de forma defensiva (já que pode falhar em estrutura).
  const snap = (input ?? {}) as Record<string, any>;
  const meals: any[] = Array.isArray(snap.meals) ? snap.meals : [];
  if (meals.length === 0) {
    clinical_warnings.push("Plano publicado sem nenhuma refeição.");
  }
  meals.forEach((m, idx) => {
    const main = m?.main;
    const items: any[] = Array.isArray(main?.items) ? main.items : [];
    if (items.length === 0) {
      clinical_warnings.push(
        `Refeição #${idx + 1} (${m?.label ?? "?"}) sem itens na opção principal.`,
      );
    }
    const kcal = items.reduce(
      (s, it) => s + (Number.isFinite(it?.kcal) ? Number(it.kcal) : 0),
      0,
    );
    if (kcal === 0 && items.length > 0) {
      clinical_warnings.push(
        `Refeição #${idx + 1} (${m?.label ?? "?"}) tem itens mas soma 0 kcal.`,
      );
    }
  });

  const kcalTotal = Number(snap.kcal);
  if (Number.isFinite(kcalTotal) && kcalTotal > 0 && kcalTotal < 800) {
    clinical_warnings.push(
      `Meta calórica total muito baixa (${kcalTotal} kcal). Confirme se é proposital.`,
    );
  }
  if (Number.isFinite(kcalTotal) && kcalTotal > 6000) {
    clinical_warnings.push(
      `Meta calórica total muito alta (${kcalTotal} kcal). Confirme se é proposital.`,
    );
  }

  const review: ClinicalReview = {
    schema_version: 3,
    validated_at: new Date().toISOString(),
    structural_warnings,
    clinical_warnings,
  };

  // Snapshot devolvido é o INPUT original. Servidor não reescreve.
  return { snapshot: snap, review };
}
