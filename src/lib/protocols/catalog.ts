// Catálogo único dos Protocolos FitJourney.
// Fonte de verdade compartilhada entre:
//   - a página /protocolos (lista)
//   - a página /protocolos/$protocolId (abertura premium)
//   - o motor de sugestão (suggest.ts) que cruza com a anamnese aprovada
//
// Cada protocolo declara:
//   - TRIGGERS clínicos (anyClinicalTag / anyRiskFlag / anyGoal) → suggest.ts
//   - MODULES com FASES (estrutura premium uniforme) → UI de abertura
//
// Determinístico. Sem IA. Sem IO.

import type { GoalKind } from "@/lib/clinical/resolve-goal";

export interface ProtocolTriggers {
  readonly anyClinicalTag?: ReadonlyArray<string>;
  readonly anyRiskFlag?: ReadonlyArray<string>;
  readonly anyGoal?: ReadonlyArray<GoalKind>;
}

export interface ProtocolPhase {
  readonly id: number;
  readonly name: string;
  readonly durationWeeks: number;
  readonly description: string;
  readonly dailyKcalTarget?: number;
  readonly recommendations: {
    readonly waterMl: number;
    readonly sleepHours: number;
    readonly teaRoutine: ReadonlyArray<string>;
    readonly strategies: ReadonlyArray<string>;
  };
}

export interface ProtocolModule {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly phases: ReadonlyArray<ProtocolPhase>;
}

export type ProtocolIcon =
  | "Timer" | "Wheat" | "Droplets" | "Repeat" | "Brain" | "Activity" | "Bug"
  | "HeartPulse" | "Scissors" | "Flame" | "Wind" | "Gem" | "Leaf" | "Baby"
  | "TrendingDown" | "Droplet" | "CircleDot" | "Sparkles";

export interface ProtocolDescriptor {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly icon: ProtocolIcon;
  readonly exclusive?: boolean;
  readonly triggers: ProtocolTriggers;
  /** Quando omitido, o sistema gera um módulo padrão de 2 fases. */
  readonly modules?: ReadonlyArray<ProtocolModule>;
}

// ---------------------------------------------------------------------------
// Módulos premium do IFJ — definidos inline (antes ficavam em ifj-catalog.ts)
// ---------------------------------------------------------------------------

const IFJ_MODULES: ReadonlyArray<ProtocolModule> = [
  {
    id: "fit-glp",
    name: "Fit GLP",
    tagline: "Saciedade Natural e Controle de Apetite",
    phases: [
      {
        id: 1,
        name: "Fase 1 — Aceleração de Saciedade",
        durationWeeks: 3,
        description:
          "Estimula GLP-1 naturalmente, reduz apetite e prepara o eixo intestino-cérebro.",
        dailyKcalTarget: 1550,
        recommendations: {
          waterMl: 3500,
          sleepHours: 8,
          teaRoutine: ["Chá verde pela manhã", "Hibisco à tarde"],
          strategies: [
            "Proteína primeiro nas refeições",
            "Vinagre de maçã antes das principais refeições",
            "Fibras solúveis no café da manhã",
          ],
        },
      },
      {
        id: 2,
        name: "Fase 2 — Desinflamação e Ajuste Metabólico",
        durationWeeks: 4,
        description:
          "Reduz processo inflamatório de baixo grau e melhora sensibilidade à insulina.",
        dailyKcalTarget: 1500,
        recommendations: {
          waterMl: 3500,
          sleepHours: 8,
          teaRoutine: ["Cúrcuma com gengibre", "Camomila à noite"],
          strategies: [
            "Ômega-3 diário",
            "Janela alimentar de 12h",
            "Eliminar ultraprocessados",
          ],
        },
      },
      {
        id: 3,
        name: "Fase 3 — Recomposição Corporal",
        durationWeeks: 4,
        description:
          "Preserva massa magra e otimiza queima de gordura com ciclo proteico estratégico.",
        dailyKcalTarget: 1600,
        recommendations: {
          waterMl: 3500,
          sleepHours: 8,
          teaRoutine: ["Chá verde pré-treino", "Hortelã pós-treino"],
          strategies: [
            "1,8g proteína/kg de peso",
            "Treino de força 4x/semana",
            "Carboidrato cíclico no pós-treino",
          ],
        },
      },
      {
        id: 4,
        name: "Fase 4 — Manutenção e Autonomia",
        durationWeeks: 6,
        description:
          "Consolida hábitos e calibra novo set point metabólico do paciente.",
        dailyKcalTarget: 1750,
        recommendations: {
          waterMl: 3000,
          sleepHours: 8,
          teaRoutine: ["Chá da preferência do paciente"],
          strategies: [
            "Refeição livre 1x/semana planejada",
            "Monitoramento quinzenal de medidas",
            "Suplementação ajustada por exames",
          ],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

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
      anyClinicalTag: ["insulin_resistance", "pre_diabetes", "diabetes_type2", "sop", "high_triglycerides"],
      anyGoal: ["cut"],
    },
  },
  {
    id: "agua",
    name: "Protocolo da Água",
    tagline: "Hidratação calculada por peso/atividade com lembretes diários.",
    icon: "Droplets",
    triggers: { anyClinicalTag: ["low_hydration", "constipation", "high_training_volume"] },
  },
  {
    id: "ciclo-carbo",
    name: "Protocolo Ciclo de Carboidratos",
    tagline: "Dias high/low/no carb — performance e composição corporal.",
    icon: "Repeat",
    triggers: { anyClinicalTag: ["high_training_volume"], anyGoal: ["performance", "bulk"] },
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
    triggers: { anyClinicalTag: ["chronic_inflammation", "high_cholesterol", "high_triglycerides"] },
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
    triggers: { anyClinicalTag: ["pregnancy"], anyRiskFlag: ["pregnancy_care_required"] },
  },
  {
    id: "resistencia-insulina",
    name: "Protocolo Resistência à Insulina",
    tagline: "Baixo índice glicêmico, cromo e fracionamento estratégico.",
    icon: "TrendingDown",
    triggers: { anyClinicalTag: ["insulin_resistance", "pre_diabetes", "sop"] },
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
      anyClinicalTag: ["high_appetite", "insulin_resistance", "pre_diabetes", "diabetes_type2"],
      anyGoal: ["cut"],
    },
    modules: IFJ_MODULES,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function findProtocolById(id: string): ProtocolDescriptor | null {
  return PROTOCOL_CATALOG.find((p) => p.id === id) ?? null;
}

/**
 * Retorna os módulos do protocolo. Se o catálogo não definiu nenhum,
 * gera uma estrutura padrão de 1 módulo / 2 fases (Indução + Manutenção)
 * derivada do tagline. Estrutura uniforme para a UI de abertura.
 */
export function getProtocolModules(
  p: ProtocolDescriptor,
): ReadonlyArray<ProtocolModule> {
  if (p.modules && p.modules.length > 0) return p.modules;
  return defaultModules(p);
}

export function findProtocolPhase(
  protocolId: string,
  moduleId: string,
  phaseId: number,
): {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  phase: ProtocolPhase;
} | null {
  const protocol = findProtocolById(protocolId);
  if (!protocol) return null;
  const modules = getProtocolModules(protocol);
  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;
  const phase = module.phases.find((ph) => ph.id === phaseId);
  if (!phase) return null;
  return { protocol, module, phase };
}

function defaultModules(p: ProtocolDescriptor): ReadonlyArray<ProtocolModule> {
  return [
    {
      id: "default",
      name: p.name,
      tagline: p.tagline,
      phases: [
        {
          id: 1,
          name: "Fase 1 — Indução",
          durationWeeks: 2,
          description: `Início do ${p.name}: adaptação inicial e introdução das estratégias-chave.`,
          recommendations: {
            waterMl: 2500,
            sleepHours: 8,
            teaRoutine: [],
            strategies: [p.tagline],
          },
        },
        {
          id: 2,
          name: "Fase 2 — Manutenção",
          durationWeeks: 4,
          description: `Consolidação do ${p.name} e calibragem fina das recomendações.`,
          recommendations: {
            waterMl: 2500,
            sleepHours: 8,
            teaRoutine: [],
            strategies: ["Manter as estratégias da Fase 1", "Monitoramento semanal"],
          },
        },
      ],
    },
  ];
}
