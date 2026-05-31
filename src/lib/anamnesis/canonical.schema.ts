// CanonicalAnamnesis — modelo clínico único.
// Toda captura de anamnese (manual ou online) converge para este shape.
// Motores consomem APENAS este shape. Adapters normalizam UI → canonical.
//
// schema_version = 3
//   v2 → v3: adiciona attachments, clinicalTags, riskFlags, sportProfile,
//   nutritionProfile, completionScore, catalogVersion. ConditionSchema ganha
//   observedAt/updatedAt. Schema V2 segue legível pelo parser legado.

import { z } from "zod";

export const CANONICAL_ANAMNESIS_SCHEMA_VERSION = 3 as const;

// ---------- Enums ----------
export const SexSchema = z.enum(["male", "female"]);
export const GoalSchema = z.enum([
  "cut",
  "maintain",
  "bulk",
  "performance",
  "health",
]);
export const ActivityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "high",
  "extreme",
]);

// ---------- Domínios clínicos ----------
const BasicsSchema = z.object({
  sex: SexSchema,
  ageYears: z.number().int().min(1).max(120),
  weightKg: z.number().min(20).max(400),
  heightCm: z.number().min(80).max(260),
  goal: GoalSchema,
  activity: ActivityLevelSchema,
});

const ConditionSchema = z.object({
  code: z.string().min(1).max(64),
  diagnosedAt: z.string().max(32).optional(),
  symptoms: z.array(z.string().max(128)).max(20).optional(),
  inTreatment: z.boolean().optional(),
  observedAt: z.string().max(32).optional(),
  updatedAt: z.string().max(32).optional(),
  notes: z.string().max(500).optional(),
});

const DigestiveSchema = z
  .object({ conditions: z.array(ConditionSchema).max(20).default([]) })
  .default({ conditions: [] });

const MetabolicSchema = z
  .object({ conditions: z.array(ConditionSchema).max(20).default([]) })
  .default({ conditions: [] });

const CardiovascularSchema = z
  .object({ conditions: z.array(ConditionSchema).max(20).default([]) })
  .default({ conditions: [] });

const MedicationSchema = z.object({
  name: z.string().min(1).max(120),
  dose: z.string().max(64).optional(),
  frequency: z.string().max(64).optional(),
  continuous: z.boolean().default(false),
});

const LabResultSchema = z.object({
  code: z.enum([
    "glycemia",
    "hba1c",
    "hdl",
    "ldl",
    "triglycerides",
    "tsh",
    "t4",
    "vitamin_d",
    "ferritin",
  ]),
  value: z.number().min(0).max(10000),
  unit: z.string().max(16).optional(),
  measuredAt: z.string().max(32).optional(),
});

const SleepSchema = z
  .object({
    hours: z.number().min(0).max(24).optional(),
    quality: z.enum(["poor", "fair", "good"]).optional(),
    awakenings: z.number().int().min(0).max(20).optional(),
    snoring: z.boolean().optional(),
    apnea: z.boolean().optional(),
    wakesTired: z.boolean().optional(),
  })
  .default({});

const ActivityItemSchema = z.object({
  modality: z.string().min(1).max(64),
  frequencyPerWeek: z.number().int().min(0).max(21),
  weeklyVolumeMinutes: z.number().int().min(0).max(10000).optional(),
  notes: z.string().max(300).optional(),
});

const PhysicalActivitySchema = z
  .object({ items: z.array(ActivityItemSchema).max(10).default([]) })
  .default({ items: [] });

// Preparação para upload futuro de exames — sem UI nesta fase.
const AttachmentSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(["exam_pdf", "exam_image", "report", "other"]),
  url: z.string().url(),
  label: z.string().max(120).optional(),
  uploadedAt: z.string().max(32),
});

// Perfis derivados — preenchidos hoje vazios; consumidos por IA futura.
const SportProfileSchema = z
  .object({
    primaryModality: z.string().max(64).optional(),
    weeklyHours: z.number().min(0).max(60).optional(),
    competitive: z.boolean().optional(),
  })
  .nullable()
  .default(null);

const NutritionProfileSchema = z
  .object({
    restrictions: z.array(z.string().max(64)).max(30).default([]),
    preferences: z.array(z.string().max(64)).max(30).default([]),
  })
  .nullable()
  .default(null);

// ---------- Root ----------
export const CanonicalAnamnesisSchema = z.object({
  schemaVersion: z.literal(CANONICAL_ANAMNESIS_SCHEMA_VERSION),
  catalogVersion: z.string().min(1).max(64),
  origin: z.enum(["manual", "online", "migrated"]),
  basics: BasicsSchema,
  digestive: DigestiveSchema,
  metabolic: MetabolicSchema,
  cardiovascular: CardiovascularSchema,
  medications: z.array(MedicationSchema).max(50).default([]),
  labs: z.array(LabResultSchema).max(100).default([]),
  sleep: SleepSchema,
  physicalActivity: PhysicalActivitySchema,
  attachments: z.array(AttachmentSchema).max(50).default([]),
  clinicalTags: z.array(z.string().max(64)).max(100).default([]),
  riskFlags: z.array(z.string().max(64)).max(50).default([]),
  sportProfile: SportProfileSchema,
  nutritionProfile: NutritionProfileSchema,
  completionScore: z.number().int().min(0).max(100).default(0),
  notes: z.string().max(2000).optional(),
});

export type CanonicalAnamnesis = z.infer<typeof CanonicalAnamnesisSchema>;
export type CanonicalBasics = z.infer<typeof BasicsSchema>;
export type CanonicalCondition = z.infer<typeof ConditionSchema>;

// Envelope persistido em public.anamneses.data (jsonb).
// Mantém payload cru ao lado do canônico para auditoria / reversibilidade.
export const AnamnesisDataEnvelopeSchema = z.object({
  canonical: CanonicalAnamnesisSchema,
  raw: z.unknown().optional(), // respostas brutas do runner
});
export type AnamnesisDataEnvelope = z.infer<typeof AnamnesisDataEnvelopeSchema>;
