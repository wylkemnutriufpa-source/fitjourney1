// Catálogo IFJ — guarda-chuva > Módulos > Fases.
// Fonte de verdade pura. Sem IO. Sem IA. Determinístico.
// Estrutura proposta pelo time clínico; cardápio detalhado virá em etapa
// posterior — por enquanto cada fase carrega metadados e recomendações base.

export interface IFJPhase {
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

export interface IFJModule {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly phases: ReadonlyArray<IFJPhase>;
}

export const IFJ_PROTOCOL = {
  id: "ifj",
  name: "Protocolo IFJ",
  tagline: "Inteligência FitJourney — guarda-chuva dos módulos clínicos.",
  modules: [
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
  ],
} as const satisfies {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly modules: ReadonlyArray<IFJModule>;
};

export function findIFJModule(moduleId: string): IFJModule | null {
  return IFJ_PROTOCOL.modules.find((m) => m.id === moduleId) ?? null;
}
