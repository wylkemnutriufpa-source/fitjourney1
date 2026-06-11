// PURO. Adapta CanonicalAnamnesis (verdade clínica) para o shape QuizAnswers
// consumido pelo motor de diagnóstico. Sem IO, sem React.
//
// Princípio: campo ausente => default neutro (não dispara gatilho falso).
// Mapeamento por substring/keyword para tolerar variações de slug do catálogo.

import type { CanonicalAnamnesis } from "@/lib/anamnesis/canonical.schema";
import type { QuizAnswers, Sexo } from "./engine";

const CONDITION_MAP: Array<{ slug: string; matches: string[] }> = [
  { slug: "diabetes", matches: ["diabetes", "t2dm", "t1dm", "dm2", "dm1"] },
  { slug: "hipertensao", matches: ["hyperten", "hiperten", "htn", "pressao_alta"] },
  { slug: "sop", matches: ["pcos", "sop", "ovary"] },
  { slug: "tireoide", matches: ["thyroid", "hashimoto", "hipo_tire", "hyper_thyr", "tireoid"] },
  { slug: "gastrite_refluxo", matches: ["gerd", "reflux", "gastrit", "refluxo"] },
  { slug: "intestino", matches: ["ibs", "sii", "constipa", "intestin", "bloat", "inchac"] },
  { slug: "compulsao", matches: ["binge", "compulsa", "compulsao"] },
];

const COMPLAINT_MAP: Array<{ slug: string; matches: string[] }> = [
  { slug: "cansaco", matches: ["fatigue", "low_energy", "cansaco", "cansa", "energia_baixa"] },
  { slug: "inchaco", matches: ["bloat", "inchac", "inchaco"] },
  { slug: "compulsao", matches: ["binge", "compulsa"] },
];

function matchSlug(
  haystack: string[],
  map: Array<{ slug: string; matches: string[] }>,
): string[] {
  const found = new Set<string>();
  const lower = haystack.map((s) => s.toLowerCase());
  for (const { slug, matches } of map) {
    if (lower.some((h) => matches.some((m) => h.includes(m)))) {
      found.add(slug);
    }
  }
  return Array.from(found);
}

function mapGoal(goal: CanonicalAnamnesis["basics"]["goal"]): string {
  switch (goal) {
    case "cut":
      return "emagrecer";
    case "bulk":
    case "performance":
      return "ganhar_massa";
    case "maintain":
    case "health":
    default:
      return "energia";
  }
}

function mapActivity(
  a: CanonicalAnamnesis["basics"]["activity"],
): QuizAnswers["atividadeFisica"] {
  if (a === "sedentary") return "sedentario";
  if (a === "light") return "leve";
  if (a === "high" || a === "extreme") return "intenso";
  return "moderado";
}

function mapSleep(hours: number | undefined): QuizAnswers["sono"] {
  if (hours == null) return "7a8h";
  if (hours < 6) return "menos_6h";
  if (hours < 7) return "6a7h";
  if (hours <= 8) return "7a8h";
  return "mais_8h";
}

function mapSex(s: CanonicalAnamnesis["basics"]["sex"]): Sexo {
  return s === "female" ? "feminino" : "masculino";
}

export function adaptAnamnesisToQuiz(
  canonical: CanonicalAnamnesis,
  patientName: string,
): QuizAnswers {
  const b = canonical.basics;

  // Coleta todos os códigos de condição declarados.
  const conditionCodes: string[] = [
    ...canonical.digestive.conditions.map((c) => c.code),
    ...canonical.metabolic.conditions.map((c) => c.code),
    ...canonical.cardiovascular.conditions.map((c) => c.code),
  ];
  const condicoes = matchSlug([...conditionCodes, ...canonical.clinicalTags], CONDITION_MAP);

  // Queixas vêm de clinicalTags + symptoms de cada condição.
  const symptomBag: string[] = [
    ...canonical.clinicalTags,
    ...canonical.digestive.conditions.flatMap((c) => c.symptoms ?? []),
    ...canonical.metabolic.conditions.flatMap((c) => c.symptoms ?? []),
    ...canonical.cardiovascular.conditions.flatMap((c) => c.symptoms ?? []),
  ];
  if (canonical.sleep.wakesTired) symptomBag.push("fatigue");
  const queixas = matchSlug(symptomBag, COMPLAINT_MAP);

  return {
    nome: patientName || "",
    idade: b.ageYears,
    sexo: mapSex(b.sex),
    peso: b.weightKg,
    altura: b.heightCm,
    objetivo: mapGoal(b.goal),
    // Defaults neutros — campos não capturados no canonical não disparam gatilhos.
    refeicoesPorDia: "3a4",
    aguaPorDia: "2l",
    atividadeFisica: mapActivity(b.activity),
    sono: mapSleep(canonical.sleep.hours),
    condicoes,
    queixas,
  };
}

// RNG determinístico (mulberry32) seedado por string. Mesmo input → mesmo output.
export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
