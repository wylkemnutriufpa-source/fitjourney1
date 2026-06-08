// Catálogo único dos Protocolos FitJourney.
// Fonte de verdade compartilhada entre a página /protocolos e o motor de
// sugestão (suggest.ts) que cruza com a anamnese aprovada.
//
// Cada protocolo declara TRIGGERS clínicos: clinicalTags / riskFlags / metas
// que, se presentes na anamnese aprovada do paciente, fazem o sistema sugerir
// esse protocolo ao profissional. Determinístico, sem IA.

import type { GoalKind } from "@/lib/clinical/resolve-goal";

export interface ProtocolTriggers {
  /** Qualquer destas clinical tags na anamnese aprovada → sugere. */
  readonly anyClinicalTag?: ReadonlyArray<string>;
  /** Qualquer destas risk flags na anamnese aprovada → sugere. */
  readonly anyRiskFlag?: ReadonlyArray<string>;
  /** Qualquer destas metas clínicas atuais → sugere. */
  readonly anyGoal?: ReadonlyArray<GoalKind>;
}

export interface ProtocolDescriptor {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  /** Nome de ícone do lucide-react. Resolução fica no consumidor. */
  readonly icon:
    | "Timer"
    | "Wheat"
    | "Droplets"
    | "Repeat"
    | "Brain"
    | "Activity"
    | "Bug"
    | "HeartPulse"
    | "Scissors"
    | "Flame"
    | "Wind"
    | "Gem"
    | "Leaf"
    | "Baby"
    | "TrendingDown"
    | "Droplet"
    | "CircleDot"
    | "Sparkles";
  /** Exclusivo (cadeado reforçado) — caso do IFJ. */
  readonly exclusive?: boolean;
  readonly triggers: ProtocolTriggers;
}

export const PROTOCOL_CATALOG: ReadonlyArray<ProtocolDescriptor> = [
  {
    id: "jejum-intermitente",
    name: "Jejum Intermitente",
    tagline: "Janelas 16/8 · 14/10 · OMAD — editável como template.",
    icon: "Timer",
    triggers: {
      anyClinicalTag: ["insulin_resistance", "pre_diabetes", "high_appetite"],
      anyGoal: ["cut"],
    },
  },
  {
    id: "low-carb",
    name: "Protocolo Low Carb",
    tagline: "Redução estratégica de carboidratos — saciedade e perda de gordura.",
    icon: "Wheat",
    triggers: {
      anyClinicalTag: [
        "insulin_resistance",
        "pre_diabetes",
        "diabetes_type2",
        "sop",
        "high_triglycerides",
      ],
      anyGoal: ["cut"],
    },
  },
  {
    id: "agua",
    name: "Protocolo da Água",
    tagline: "Hidratação calculada por peso/atividade com lembretes diários.",
    icon: "Droplets",
    triggers: {
      anyClinicalTag: ["low_hydration", "constipation", "high_training_volume"],
    },
  },
  {
    id: "ciclo-carbo",
    name: "Protocolo Ciclo de Carboidratos",
    tagline: "Dias high/low/no carb — performance e composição corporal.",
    icon: "Repeat",
    triggers: {
      anyClinicalTag: ["high_training_volume"],
      anyGoal: ["performance", "bulk"],
    },
  },
  {
    id: "anti-ansiedade",
    name: "Protocolo Anti-Ansiedade",
    tagline: "Triptofano, magnésio, ômega-3 — eixo intestino-cérebro.",
    icon: "Brain",
    triggers: { anyClinicalTag: ["anxiety"] },
  },
  {
    id: "anti-enxaqueca",
    name: "Protocolo Anti-Enxaqueca",
    tagline: "Exclusão de gatilhos + magnésio, riboflavina e CoQ10.",
    icon: "Activity",
    triggers: { anyClinicalTag: ["migraine"] },
  },
  {
    id: "antiparasitario",
    name: "Protocolo Antiparasitário",
    tagline: "Alimentos vermífugos naturais e suporte intestinal.",
    icon: "Bug",
    triggers: { anyClinicalTag: ["parasitosis_suspected"] },
  },
  {
    id: "anticelulite",
    name: "Protocolo Anticelulite",
    tagline: "Drenagem, anti-inflamatórios e suporte ao colágeno.",
    icon: "HeartPulse",
    triggers: { anyClinicalTag: ["cellulite_concern", "bloating"] },
  },
  {
    id: "antiqueda",
    name: "Protocolo Antiqueda de Cabelo",
    tagline: "Ferro, zinco, biotina e proteína — saúde capilar.",
    icon: "Scissors",
    triggers: { anyClinicalTag: ["hair_loss", "anemia"] },
  },
  {
    id: "anti-inflamatorio",
    name: "Protocolo Anti-inflamatório",
    tagline: "Ômega-3, polifenóis e exclusão de pró-inflamatórios.",
    icon: "Flame",
    triggers: {
      anyClinicalTag: [
        "chronic_inflammation",
        "high_cholesterol",
        "high_triglycerides",
      ],
    },
  },
  {
    id: "antiinchaco",
    name: "Protocolo Antiinchaço",
    tagline: "Sódio controlado, potássio e diuréticos naturais.",
    icon: "Wind",
    triggers: { anyClinicalTag: ["bloating", "hypertension"] },
  },
  {
    id: "beleza",
    name: "Protocolo da Beleza",
    tagline: "Unhas, cabelo e pele — colágeno, silício e antioxidantes.",
    icon: "Gem",
    triggers: { anyClinicalTag: ["beauty_concern"] },
  },
  {
    id: "anticonstipacao",
    name: "Protocolo Anticonstipação",
    tagline: "Fibras, hidratação e probióticos — trânsito intestinal regular.",
    icon: "Leaf",
    triggers: { anyClinicalTag: ["constipation", "ibs"] },
  },
  {
    id: "pre-natal",
    name: "Protocolo Pré-Natal",
    tagline: "Ácido fólico, ferro, ômega-3 — nutrição materno-fetal.",
    icon: "Baby",
    triggers: {
      anyClinicalTag: ["pregnancy"],
      anyRiskFlag: ["pregnancy_care_required"],
    },
  },
  {
    id: "resistencia-insulina",
    name: "Protocolo Resistência à Insulina",
    tagline: "Baixo índice glicêmico, cromo e fracionamento estratégico.",
    icon: "TrendingDown",
    triggers: {
      anyClinicalTag: ["insulin_resistance", "pre_diabetes", "sop"],
    },
  },
  {
    id: "anemia",
    name: "Protocolo Anemia",
    tagline: "Ferro heme, vitamina C e B12 — recuperação hematológica.",
    icon: "Droplet",
    triggers: { anyClinicalTag: ["anemia"] },
  },
  {
    id: "sop",
    name: "Protocolo SOP",
    tagline: "Inositol, baixo carbo e anti-inflamatórios — equilíbrio hormonal.",
    icon: "CircleDot",
    triggers: { anyClinicalTag: ["sop", "insulin_resistance"] },
  },
  {
    id: "ifj",
    name: "Protocolo IFJ — Inteligência FitJourney",
    tagline: "Cardápio focado em emagrecimento com análogos GLP-1.",
    icon: "Sparkles",
    exclusive: true,
    triggers: {
      anyClinicalTag: [
        "high_appetite",
        "insulin_resistance",
        "pre_diabetes",
        "diabetes_type2",
      ],
      anyGoal: ["cut"],
    },
  },
];

export function findProtocolById(id: string): ProtocolDescriptor | null {
  return PROTOCOL_CATALOG.find((p) => p.id === id) ?? null;
}
