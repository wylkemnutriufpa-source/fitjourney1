// Adapter: respostas do runner → CanonicalAnamnesis v3.
// Aqui (e SÓ aqui) derivamos clinical_flags e completion_score.
// Motores consomem o canonical, nunca os answers brutos.

import {
  CANONICAL_ANAMNESIS_SCHEMA_VERSION,
  type CanonicalAnamnesis,
} from "../canonical.schema";
import type { Answers, CatalogManifest, Question } from "./catalog/types";
import { getVisibleQuestions, isAnswered } from "./runner";

export interface ToCanonicalInput {
  catalog: CatalogManifest;
  answers: Answers;
  origin: "manual" | "online" | "migrated";
}

export function toCanonical(input: ToCanonicalInput): CanonicalAnamnesis {
  const { catalog, answers, origin } = input;

  const basics = {
    sex: pickEnum(answers["basics.sex"], ["male", "female"] as const, "male"),
    ageYears: pickNumber(answers["basics.ageYears"], 30),
    weightKg: pickNumber(answers["basics.weightKg"], 70),
    heightCm: pickNumber(answers["basics.heightCm"], 170),
    goal: pickEnum(
      answers["basics.goal"],
      ["cut", "maintain", "bulk", "performance", "health"] as const,
      "health",
    ),
    activity: pickEnum(
      answers["basics.activity"],
      ["sedentary", "light", "moderate", "high", "extreme"] as const,
      "moderate",
    ),
  };

  const digestive = {
    conditions: collectConditions(answers, [
      { code: "gastritis", presence: "digestive.gastritis", diagnosedAt: "digestive.gastritis.diagnosedAt", inTreatment: "digestive.gastritis.inTreatment", symptoms: "digestive.gastritis.symptoms" },
      { code: "reflux", presence: "digestive.reflux" },
      { code: "ibs", presence: "digestive.ibs" },
      { code: "constipation", presence: "digestive.constipation" },
    ]),
  };

  const metabolic = {
    conditions: collectMetabolic(answers),
  };

  const cardiovascular = {
    conditions: collectConditions(answers, [
      { code: "hypertension", presence: "cardio.hypertension" },
      { code: "high_cholesterol", presence: "cardio.cholesterol" },
      { code: "high_triglycerides", presence: "cardio.triglycerides" },
    ]),
  };

  const medications =
    answers["meds.continuous"] === true && typeof answers["meds.list"] === "string"
      ? parseMedicationsText(String(answers["meds.list"]))
      : [];

  const sleep = {
    hours: typeof answers["sleep.hours"] === "number" ? (answers["sleep.hours"] as number) : undefined,
    wakesTired: answers["sleep.wakesTired"] === true ? true : answers["sleep.wakesTired"] === false ? false : undefined,
    awakenings: answers["sleep.awakenings"] === true ? 1 : answers["sleep.awakenings"] === false ? 0 : undefined,
    snoring: typeof answers["sleep.snoring"] === "boolean" ? (answers["sleep.snoring"] as boolean) : undefined,
    apnea: typeof answers["sleep.apnea"] === "boolean" ? (answers["sleep.apnea"] as boolean) : undefined,
  };

  const physicalActivity = {
    items:
      answers["activity.practices"] === true
        ? [
            {
              modality: String(answers["activity.modality"] ?? "outro"),
              frequencyPerWeek: pickNumber(answers["activity.frequencyPerWeek"], 0),
              weeklyVolumeMinutes:
                typeof answers["activity.weeklyVolumeMinutes"] === "number"
                  ? (answers["activity.weeklyVolumeMinutes"] as number)
                  : undefined,
            },
          ]
        : [],
  };

  const clinicalTags = deriveClinicalTags(catalog, answers);
  const riskFlags = deriveRiskFlags(answers, clinicalTags, medications.length > 0);
  const completionScore = computeCompletionScore(catalog, answers);

  const canonical: CanonicalAnamnesis = {
    schemaVersion: CANONICAL_ANAMNESIS_SCHEMA_VERSION,
    catalogVersion: catalog.version,
    origin,
    basics,
    digestive,
    metabolic,
    cardiovascular,
    medications,
    labs: [],
    sleep,
    physicalActivity,
    attachments: [],
    clinicalTags,
    riskFlags,
    sportProfile:
      answers["activity.practices"] === true
        ? {
            primaryModality: String(answers["activity.modality"] ?? "outro"),
            weeklyHours:
              typeof answers["activity.weeklyVolumeMinutes"] === "number"
                ? Math.round((answers["activity.weeklyVolumeMinutes"] as number) / 60 * 10) / 10
                : undefined,
          }
        : null,
    nutritionProfile: null,
    completionScore,
  };

  return canonical;
}

// ---------- Helpers ----------

function pickNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

interface ConditionSpec {
  code: string;
  presence: string;
  diagnosedAt?: string;
  inTreatment?: string;
  symptoms?: string;
}

function collectConditions(answers: Answers, specs: ConditionSpec[]) {
  const now = new Date().toISOString();
  return specs
    .filter((s) => answers[s.presence] === true)
    .map((s) => ({
      code: s.code,
      diagnosedAt: s.diagnosedAt ? (answers[s.diagnosedAt] as string | undefined) : undefined,
      inTreatment: s.inTreatment ? (answers[s.inTreatment] as boolean | undefined) : undefined,
      symptoms: s.symptoms && Array.isArray(answers[s.symptoms])
        ? (answers[s.symptoms] as string[])
        : undefined,
      observedAt: now,
      updatedAt: now,
    }));
}

function collectMetabolic(answers: Answers) {
  const out: ReturnType<typeof collectConditions> = [];
  const now = new Date().toISOString();
  const diabetes = answers["metabolic.diabetes"];
  if (typeof diabetes === "string" && diabetes !== "none") {
    out.push({
      code: diabetes === "pre" ? "pre_diabetes" : diabetes === "type1" ? "diabetes_type1" : "diabetes_type2",
      observedAt: now,
      updatedAt: now,
    });
  }
  const thyroid = answers["metabolic.thyroid"];
  if (typeof thyroid === "string" && thyroid !== "none") {
    out.push({
      code: thyroid === "hypo" ? "hypothyroidism" : "hyperthyroidism",
      observedAt: now,
      updatedAt: now,
    });
  }
  if (answers["metabolic.sop"] === true) {
    out.push({ code: "sop", observedAt: now, updatedAt: now });
  }
  if (answers["metabolic.insulinResistance"] === true) {
    out.push({ code: "insulin_resistance", observedAt: now, updatedAt: now });
  }
  return out;
}

function parseMedicationsText(text: string) {
  return text
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 50)
    .map((line) => ({ name: line.slice(0, 120), continuous: true }));
}

// ---------- Derivações ----------

function deriveClinicalTags(catalog: CatalogManifest, answers: Answers): string[] {
  const tags = new Set<string>();
  for (const block of catalog.blocks) {
    for (const q of block.questions) {
      if (!q.clinicalTags || q.clinicalTags.length === 0) continue;
      const v = answers[q.id];
      if (v === true || (typeof v === "string" && v.length > 0 && v !== "none")) {
        q.clinicalTags.forEach((t) => tags.add(t));
      }
    }
  }
  // Tags compostas
  const diabetes = answers["metabolic.diabetes"];
  if (diabetes === "type1") tags.add("diabetes_type1");
  if (diabetes === "type2") tags.add("diabetes_type2");
  if (diabetes === "pre") tags.add("pre_diabetes");
  if (diabetes === "type1" || diabetes === "type2") tags.add("diabetes");

  const vol = answers["activity.weeklyVolumeMinutes"];
  if (typeof vol === "number" && vol >= 600) tags.add("high_training_volume");

  return Array.from(tags).sort();
}

function deriveRiskFlags(answers: Answers, tags: string[], hasMeds: boolean): string[] {
  const flags = new Set<string>();
  if (tags.includes("hypertension") && !hasMeds) flags.add("uncontrolled_hypertension");
  if (tags.includes("pregnancy")) flags.add("pregnancy_care_required");
  if (tags.includes("sleep_apnea")) flags.add("sleep_apnea_followup");
  const diabetes = answers["metabolic.diabetes"];
  if (diabetes === "type1" || diabetes === "type2") {
    if (!hasMeds) flags.add("uncontrolled_diabetes");
  }
  return Array.from(flags).sort();
}

function computeCompletionScore(catalog: CatalogManifest, answers: Answers): number {
  const visible = getVisibleQuestions(catalog, answers);
  if (visible.length === 0) return 0;
  const required = visible.filter((v) => v.question.required);
  const answeredRequired = required.filter((v) => isAnswered(v.question, answers));
  const baseRequired = required.length === 0
    ? 100
    : Math.round((answeredRequired.length / required.length) * 100);

  const optional = visible.filter((v) => !v.question.required);
  const answeredOptional = optional.filter((v) => isAnswered(v.question, answers));
  const optionalBonus = optional.length === 0
    ? 0
    : Math.round((answeredOptional.length / optional.length) * 20);

  // 80% peso das required + até 20 de bônus por opcionais
  const score = Math.round(baseRequired * 0.8) + optionalBonus;
  return Math.max(0, Math.min(100, score));
}

// Exporta também para uso em testes / debugging
export const __internal = {
  deriveClinicalTags,
  deriveRiskFlags,
  computeCompletionScore,
};

// Silencia "unused import Question" se TS strict reclamar.
export type _UsedQuestion = Question;
