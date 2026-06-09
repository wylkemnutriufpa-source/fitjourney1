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

export interface PhaseMacros {
  readonly protein: number; // % do total
  readonly carb: number;
  readonly fat: number;
}

export interface PhaseTea {
  readonly time?: string;
  readonly name: string;
  readonly benefits?: string;
  readonly quantity?: string;
  readonly ingredients?: ReadonlyArray<string>;
  readonly preparation?: string;
  readonly timesPerDay?: string;
  readonly notes?: string;
}

export interface PhaseMealItemSubstitution {
  readonly foodKey: string;
  readonly name: string;
  readonly quantityG: number;
  readonly householdMeasure: string;
  readonly kcal: number;
}

export interface PhaseMealItem {
  readonly foodKey: string;
  readonly name: string;
  readonly quantityG: number;
  readonly householdMeasure: string;
  readonly kcal: number;
  readonly imageSlug?: string;
  readonly ingredients?: ReadonlyArray<string>;
  readonly preparation?: string;
  readonly usage?: string;
  readonly substitutions?: ReadonlyArray<PhaseMealItemSubstitution>;
}

export interface PhaseMeal {
  readonly id: string;
  readonly name: string;
  readonly time: string;
  readonly totalKcal: number;
  readonly items: ReadonlyArray<PhaseMealItem>;
}

export interface PhaseSpecialFeature {
  readonly name: string;
  readonly description?: string;
  readonly recipe?: string;
  readonly usage?: string;
  readonly benefits?: string;
  readonly notes?: string;
}

export interface ProtocolPhase {
  readonly id: number;
  readonly name: string;
  readonly durationWeeks: number;
  readonly description: string;
  readonly dailyKcalTarget?: number;
  readonly macros?: PhaseMacros;
  readonly meals?: ReadonlyArray<PhaseMeal>;
  readonly teaSchedule?: ReadonlyArray<PhaseTea>;
  readonly specialFeature?: PhaseSpecialFeature;
  readonly recommendations: {
    readonly waterMl: number;
    readonly sleepHours: number;
    readonly teaRoutine: ReadonlyArray<string>;
    readonly strategies: ReadonlyArray<string>;
  };
}

export interface MethodologyPillar {
  readonly title: string;
  readonly summary: string;
  readonly examples?: ReadonlyArray<string>;
}

export interface MethodologyRule {
  readonly name: string;
  readonly description: string;
}

export interface ModuleMethodology {
  readonly title: string;
  readonly subtitle?: string;
  readonly pillars: ReadonlyArray<MethodologyPillar>;
  readonly behavioralRules: ReadonlyArray<MethodologyRule>;
  readonly disclaimer?: string;
}

export interface ProtocolModule {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly phases: ReadonlyArray<ProtocolPhase>;
  readonly methodology?: ModuleMethodology;
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
    methodology: {
      title: "Metodologia GLP-1 Natural",
      subtitle:
        "Cinco pilares e quatro regras comportamentais que maximizam saciedade, reduzem impulsos alimentares, melhoram a resposta glicêmica e aumentam a adesão.",
      pillars: [
        {
          title: "1. Pré-carga de saciedade",
          summary:
            "Antes das refeições principais, criar distensão gástrica e reduzir a ingestão espontânea.",
          examples: [
            "300–500 ml de água 10 min antes",
            "5–10 g de psyllium diluído",
            "Salada crua de entrada",
            "Caldo de legumes morno",
          ],
        },
        {
          title: "2. Proteína primeiro",
          summary:
            "Regra simples: a primeira garfada é proteína. Estabiliza glicemia e antecipa a saciedade.",
          examples: ["Ovos", "Frango", "Peixe", "Iogurte grego", "Carne magra"],
        },
        {
          title: "3. Fibra estratégica",
          summary:
            "Não apenas comer mais fibra — criar momentos específicos no dia para cada tipo.",
          examples: [
            "Manhã: chia",
            "Almoço: feijão",
            "Lanche: fruta inteira",
            "Jantar: vegetais volumosos",
          ],
        },
        {
          title: "4. Velocidade glicêmica",
          summary:
            "Sequência alimentar dentro do prato: vegetais → proteína → carboidrato. Menos pico de glicose, menos fome pós-refeição.",
        },
        {
          title: "5. Ambiente anti-fome",
          summary:
            "Itens permanentes à mão para sustentar adesão entre as refeições.",
          examples: [
            "Água gelada",
            "Café sem açúcar",
            "Chás",
            "Gelatina sem açúcar",
            "Vegetais crocantes",
          ],
        },
      ],
      behavioralRules: [
        {
          name: "Regra dos 20 minutos",
          description:
            "Esperar 20 minutos antes de repetir uma refeição — tempo para os sinais de saciedade chegarem.",
        },
        {
          name: "Regra da proteína âncora",
          description:
            "Toda refeição deve ter uma fonte proteica dominante.",
        },
        {
          name: "Regra dos 50%",
          description:
            "Metade do prato precisa ser legumes, verduras ou vegetais.",
        },
        {
          name: "Regra da fome real",
          description:
            "Escala de 0–10: comer entre 3 e 7. Evitar comer em 0 (fome extrema) ou 10 (estufamento).",
        },
      ],
      disclaimer:
        "Indicador clínico-comportamental de potencial de saciedade da dieta. Não é substituto de medicamento GLP-1.",
    },
    phases: [
      {
        id: 1,
        name: "Fase 1 — Ativação de Saciedade",
        durationWeeks: 2,
        description:
          "Foco inicial em estimular a produção natural de GLP-1 e criar hábitos de alta saciedade.",
        dailyKcalTarget: 1550,
        macros: { protein: 40, carb: 35, fat: 25 },
        specialFeature: {
          name: "Tempero da Saciedade Fit GLP",
          description:
            "Mistura especial anti-inflamatória e estimulante natural de GLP-1, exclusiva do protocolo Fit GLP.",
          recipe:
            "1 colher de chá de cúrcuma + ½ colher de chá de gengibre em pó + ½ colher de chá de canela Ceylon + pitada de pimenta preta (opcional: raspa de limão).",
          usage:
            "Adicionar 1 colher de chá da mistura em pelo menos 2 refeições principais do dia (almoço e jantar).",
          benefits:
            "Aumenta saciedade, reduz inflamação e potencializa o efeito natural do GLP-1. A pimenta preta aumenta a absorção da cúrcuma.",
          notes:
            "Preparar a mistura para 1 semana e guardar em pote de vidro fechado, longe da luz.",
        },
        teaSchedule: [
          {
            time: "07:30",
            name: "Chá de gengibre + limão + cúrcuma",
            quantity: "1 xícara (200 ml)",
            ingredients: [
              "200 ml de água filtrada",
              "1 fatia fina de gengibre fresco (~3 g)",
              "½ colher de chá de cúrcuma em pó",
              "Suco de ½ limão",
              "Pitada de pimenta-do-reino preta",
            ],
            preparation:
              "Ferver a água com o gengibre e a cúrcuma por 5 minutos. Desligar, abafar por 3 minutos, coar, acrescentar o limão e a pimenta. Tomar morno e sem açúcar.",
            timesPerDay: "1x ao dia (em jejum)",
            benefits: "Anti-inflamatório e estimulante de GLP-1",
            notes: "Evitar se houver gastrite ativa.",
          },
          {
            time: "15:00",
            name: "Chá verde",
            quantity: "1 xícara (200 ml)",
            ingredients: [
              "200 ml de água filtrada",
              "1 colher de chá de chá verde a granel (ou 1 sachê)",
            ],
            preparation:
              "Aquecer a água até ~80°C (antes de ferver). Adicionar o chá, abafar por 3 minutos e coar. Tomar puro.",
            timesPerDay: "1x ao dia (meio da tarde)",
            benefits: "Melhora sensibilidade à insulina e termogênese leve",
            notes: "Não consumir após 17h para preservar o sono.",
          },
        ],
        meals: [
          {
            id: "cafe_manha",
            name: "Café da Manhã",
            time: "07:00",
            totalKcal: 380,
            items: [
              {
                foodKey: "ovo",
                name: "Ovo",
                quantityG: 100,
                householdMeasure: "2 unidades",
                kcal: 156,
                substitutions: [
                  { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa cheias", kcal: 95 },
                  { foodKey: "whey", name: "Whey Protein Isolado", quantityG: 25, householdMeasure: "1 scoop", kcal: 100 },
                  { foodKey: "iogurte-grego", name: "Iogurte Grego Natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
                ],
              },
              {
                foodKey: "aveia",
                name: "Aveia",
                quantityG: 40,
                householdMeasure: "4 colheres de sopa cheias",
                kcal: 150,
                substitutions: [
                  { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos médios", kcal: 145 },
                  { foodKey: "cuscuz", name: "Cuscuz", quantityG: 90, householdMeasure: "½ xícara", kcal: 140 },
                  { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
                ],
              },
              {
                foodKey: "maca",
                name: "Maçã com casca",
                quantityG: 150,
                householdMeasure: "1 unidade média",
                kcal: 80,
                substitutions: [
                  { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
                  { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia grande", kcal: 80 },
                ],
              },
            ],
          },
          {
            id: "lanche_manha",
            name: "Lanche da Manhã",
            time: "10:00",
            totalKcal: 220,
            items: [
              {
                foodKey: "iogurte-grego",
                name: "Iogurte Grego Natural",
                quantityG: 170,
                householdMeasure: "1 pote",
                kcal: 105,
                substitutions: [
                  { foodKey: "queijo-cottage", name: "Queijo Cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
                  { foodKey: "iogurte-natural", name: "Iogurte Natural Desnatado", quantityG: 200, householdMeasure: "1 copo", kcal: 100 },
                  { foodKey: "ricota", name: "Ricota fresca", quantityG: 80, householdMeasure: "2 fatias", kcal: 110 },
                ],
              },
              {
                foodKey: "castanha",
                name: "Castanha de Caju",
                quantityG: 15,
                householdMeasure: "8 unidades",
                kcal: 90,
                substitutions: [
                  { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "12 unidades", kcal: 90 },
                  { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "4 unidades", kcal: 95 },
                  { foodKey: "pasta-amendoim", name: "Pasta de amendoim integral", quantityG: 15, householdMeasure: "1 colher de sopa", kcal: 90 },
                ],
              },
            ],
          },
          {
            id: "almoco",
            name: "Almoço",
            time: "13:00",
            totalKcal: 520,
            items: [
              {
                foodKey: "frango-grelhado",
                name: "Frango grelhado",
                quantityG: 150,
                householdMeasure: "1 filé médio",
                kcal: 248,
                substitutions: [
                  { foodKey: "peixe-grelhado", name: "Filé de Tilápia grelhado", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
                  { foodKey: "patinho", name: "Patinho moído (magro)", quantityG: 130, householdMeasure: "1 porção", kcal: 240 },
                  { foodKey: "ovo", name: "Ovos mexidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
                ],
              },
              {
                foodKey: "arroz-integral",
                name: "Arroz integral",
                quantityG: 80,
                householdMeasure: "4 colheres de sopa",
                kcal: 110,
                substitutions: [
                  { foodKey: "batata-doce", name: "Batata doce cozida", quantityG: 130, householdMeasure: "1 unidade pequena", kcal: 110 },
                  { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 80, householdMeasure: "1 pedaço médio", kcal: 115 },
                  { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 90, householdMeasure: "3 colheres de sopa", kcal: 110 },
                ],
              },
              {
                foodKey: "feijao",
                name: "Feijão",
                quantityG: 100,
                householdMeasure: "1 concha",
                kcal: 80,
                substitutions: [
                  { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
                  { foodKey: "grao-de-bico", name: "Grão de bico cozido", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
                  { foodKey: "ervilha", name: "Ervilha cozida", quantityG: 100, householdMeasure: "1 concha", kcal: 85 },
                ],
              },
              {
                foodKey: "salada-verde",
                name: "Salada verde + azeite",
                quantityG: 200,
                householdMeasure: "2 xícaras",
                kcal: 82,
                substitutions: [
                  { foodKey: "legumes", name: "Legumes refogados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
                  { foodKey: "abobrinha", name: "Abobrinha refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
                ],
              },
            ],
          },
          {
            id: "lanche_tarde",
            name: "Lanche da Tarde",
            time: "16:00",
            totalKcal: 230,
            items: [
              {
                foodKey: "maca",
                name: "Maçã",
                quantityG: 150,
                householdMeasure: "1 unidade",
                kcal: 80,
                substitutions: [
                  { foodKey: "pera", name: "Pera", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
                  { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
                  { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia grande", kcal: 80 },
                ],
              },
              {
                foodKey: "queijo-minas",
                name: "Queijo Minas Frescal",
                quantityG: 50,
                householdMeasure: "2 fatias",
                kcal: 120,
                substitutions: [
                  { foodKey: "ricota", name: "Ricota fresca", quantityG: 80, householdMeasure: "2 fatias", kcal: 110 },
                  { foodKey: "queijo-cottage", name: "Queijo Cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
                  { foodKey: "ovo", name: "Ovo cozido", quantityG: 100, householdMeasure: "2 unidades", kcal: 156 },
                ],
              },
            ],
          },
          {
            id: "jantar",
            name: "Jantar",
            time: "19:30",
            totalKcal: 400,
            items: [
              {
                foodKey: "peixe-grelhado",
                name: "Filé de Tilápia grelhado",
                quantityG: 150,
                householdMeasure: "1 filé médio",
                kcal: 180,
                substitutions: [
                  { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 120, householdMeasure: "1 filé pequeno", kcal: 198 },
                  { foodKey: "salmao", name: "Salmão grelhado", quantityG: 120, householdMeasure: "1 posta pequena", kcal: 215 },
                  { foodKey: "atum", name: "Atum em água", quantityG: 130, householdMeasure: "1 lata drenada", kcal: 170 },
                ],
              },
              {
                foodKey: "legumes",
                name: "Legumes refogados",
                quantityG: 250,
                householdMeasure: "2 xícaras",
                kcal: 90,
                substitutions: [
                  { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 250, householdMeasure: "2 xícaras grandes", kcal: 90 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
                  { foodKey: "abobrinha", name: "Abobrinha grelhada", quantityG: 250, householdMeasure: "2 xícaras", kcal: 75 },
                ],
              },
              {
                foodKey: "abacate",
                name: "Abacate",
                quantityG: 60,
                householdMeasure: "¼ unidade",
                kcal: 100,
                substitutions: [
                  { foodKey: "azeite", name: "Azeite extra virgem", quantityG: 11, householdMeasure: "1 colher de sopa", kcal: 99 },
                  { foodKey: "castanha", name: "Castanha de Caju", quantityG: 17, householdMeasure: "9 unidades", kcal: 100 },
                  { foodKey: "amendoa", name: "Amêndoas", quantityG: 17, householdMeasure: "14 unidades", kcal: 100 },
                ],
              },
            ],
          },
        ],
        recommendations: {
          waterMl: 3500,
          sleepHours: 8,
          teaRoutine: ["Chá de gengibre + limão + cúrcuma (07:30)", "Chá verde (15:00)"],
          strategies: [
            "Ingerir proteína em todas as refeições",
            "15ml de vinagre de maçã diluído 10 min antes do almoço e jantar",
            "Alta ingestão de fibras solúveis",
          ],
        },
      },
      {
        id: 2,
        name: "Fase 2 — Consolidação + Suco Verde",
        durationWeeks: 2,
        description:
          "Consolidação da saciedade com introdução de suco verde diário e maior volume de vegetais.",
        dailyKcalTarget: 1600,
        macros: { protein: 38, carb: 37, fat: 25 },
        specialFeature: {
          name: "Tempero da Saciedade Fit GLP + Suco Verde",
          description:
            "Mistura especial anti-inflamatória mantida da Fase 1, agora com adição do Suco Verde Fit GLP no período da manhã.",
          recipe:
            "Tempero: 1 colher de chá de cúrcuma + ½ de gengibre + ½ de canela Ceylon + pitada de pimenta preta. Suco Verde: 1 folha de couve + ½ maçã verde + ½ pepino + suco de ½ limão + 200ml de água gelada.",
          usage:
            "Tempero em 2 refeições principais. Suco Verde 1x ao dia, no meio da manhã.",
          benefits:
            "Suporte hepático, hidratação, antioxidantes e potencialização do efeito GLP-1.",
        },
        teaSchedule: [
          {
            time: "07:30",
            name: "Chá de gengibre + cúrcuma + limão",
            quantity: "1 xícara (200 ml)",
            ingredients: [
              "200 ml de água filtrada",
              "1 fatia fina de gengibre fresco (~3 g)",
              "½ colher de chá de cúrcuma em pó",
              "Suco de ½ limão",
            ],
            preparation:
              "Ferver a água com o gengibre e a cúrcuma por 5 minutos. Abafar 3 min, coar, acrescentar o limão. Tomar morno.",
            timesPerDay: "1x ao dia (em jejum)",
            benefits: "Anti-inflamatório e estimulante de GLP-1",
          },
          {
            time: "20:00",
            name: "Chá de camomila + melissa",
            quantity: "1 xícara (200 ml)",
            ingredients: [
              "200 ml de água filtrada",
              "1 colher de chá de camomila seca (ou 1 sachê)",
              "1 colher de chá de melissa seca (ou 1 sachê)",
            ],
            preparation:
              "Aquecer a água sem ferver, desligar, adicionar as ervas, abafar por 5 minutos e coar. Tomar 30–60 min antes de dormir.",
            timesPerDay: "1x ao dia (à noite)",
            benefits: "Melhora qualidade do sono e reduz ansiedade",
          },
        ],
        meals: [
          {
            id: "cafe_manha",
            name: "Café da Manhã",
            time: "07:00",
            totalKcal: 390,
            items: [
              {
                foodKey: "ovo",
                name: "Ovo mexido",
                quantityG: 100,
                householdMeasure: "2 unidades",
                kcal: 156,
                substitutions: [
                  { foodKey: "queijo-cottage", name: "Queijo Cottage", quantityG: 150, householdMeasure: "5 colheres de sopa", kcal: 140 },
                  { foodKey: "iogurte-grego", name: "Iogurte Grego Natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
                  { foodKey: "whey", name: "Whey Protein Isolado", quantityG: 25, householdMeasure: "1 scoop", kcal: 100 },
                ],
              },
              {
                foodKey: "aveia",
                name: "Aveia em flocos",
                quantityG: 40,
                householdMeasure: "4 colheres de sopa",
                kcal: 150,
                substitutions: [
                  { foodKey: "granola", name: "Granola sem açúcar", quantityG: 35, householdMeasure: "3 colheres de sopa", kcal: 150 },
                  { foodKey: "tapioca", name: "Tapioca (goma)", quantityG: 60, householdMeasure: "2 discos médios", kcal: 145 },
                  { foodKey: "cuscuz", name: "Cuscuz de milho", quantityG: 90, householdMeasure: "½ xícara", kcal: 140 },
                ],
              },
              {
                foodKey: "frutas-vermelhas",
                name: "Frutas vermelhas",
                quantityG: 120,
                householdMeasure: "1 xícara",
                kcal: 80,
                substitutions: [
                  { foodKey: "morango", name: "Morangos frescos", quantityG: 150, householdMeasure: "1 xícara", kcal: 50 },
                  { foodKey: "mirtilo", name: "Mirtilo (blueberry)", quantityG: 120, householdMeasure: "1 xícara", kcal: 70 },
                  { foodKey: "amora", name: "Amoras frescas", quantityG: 120, householdMeasure: "1 xícara", kcal: 55 },
                ],
              },
            ],
          },
          {
            id: "suco_verde",
            name: "Suco Verde Fit GLP",
            time: "09:30",
            totalKcal: 90,
            items: [
              {
                foodKey: "suco-verde-fit",
                name: "Suco Verde Fit GLP",
                quantityG: 300,
                householdMeasure: "1 copo grande (300 ml)",
                kcal: 90,
                ingredients: [
                  "1 folha grande de couve manteiga (sem o talo)",
                  "½ maçã verde com casca",
                  "½ pepino japonês com casca",
                  "Suco de ½ limão",
                  "200 ml de água gelada (ou água de coco)",
                  "Gelo a gosto",
                  "Opcional: 1 cm de gengibre fresco / 5 folhas de hortelã",
                ],
                preparation:
                  "Lave bem a couve, a maçã e o pepino. Bata todos os ingredientes no liquidificador por 30–40 segundos até ficar homogêneo. Não coar (manter as fibras). Beber imediatamente, sem adoçar.",
                usage: "1x ao dia, no meio da manhã (cerca de 2h após o café). Consumir em até 15 min após o preparo.",
                substitutions: [
                  { foodKey: "agua-coco-limao", name: "Água de coco + limão", quantityG: 300, householdMeasure: "1 copo grande", kcal: 60 },
                  { foodKey: "cha-verde-limao", name: "Chá verde gelado + limão", quantityG: 300, householdMeasure: "1 copo grande", kcal: 5 },
                  { foodKey: "kefir-natural", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
                ],
              },
            ],
          },
          {
            id: "almoco",
            name: "Almoço",
            time: "12:30",
            totalKcal: 540,
            items: [
              {
                foodKey: "patinho-moido",
                name: "Patinho moído refogado",
                quantityG: 140,
                householdMeasure: "1 porção média",
                kcal: 260,
                substitutions: [
                  { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 248 },
                  { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
                  { foodKey: "tofu-grelhado", name: "Tofu grelhado", quantityG: 180, householdMeasure: "1 porção", kcal: 250 },
                ],
              },
              {
                foodKey: "quinoa",
                name: "Quinoa cozida",
                quantityG: 90,
                householdMeasure: "3 colheres de sopa",
                kcal: 110,
                substitutions: [
                  { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 110 },
                  { foodKey: "batata-doce", name: "Batata doce", quantityG: 130, householdMeasure: "1 unidade pequena", kcal: 110 },
                  { foodKey: "mandioquinha", name: "Mandioquinha cozida", quantityG: 130, householdMeasure: "1 porção", kcal: 115 },
                ],
              },
              {
                foodKey: "lentilha",
                name: "Lentilha",
                quantityG: 100,
                householdMeasure: "1 concha",
                kcal: 95,
                substitutions: [
                  { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha", kcal: 80 },
                  { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
                  { foodKey: "ervilha", name: "Ervilha cozida", quantityG: 100, householdMeasure: "1 concha", kcal: 85 },
                ],
              },
              {
                foodKey: "salada-colorida",
                name: "Salada colorida + azeite",
                quantityG: 250,
                householdMeasure: "2 xícaras grandes",
                kcal: 75,
                substitutions: [
                  { foodKey: "legumes", name: "Legumes refogados", quantityG: 250, householdMeasure: "2 xícaras", kcal: 90 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
                  { foodKey: "abobrinha", name: "Abobrinha grelhada", quantityG: 250, householdMeasure: "2 xícaras", kcal: 75 },
                ],
              },
            ],
          },
          {
            id: "lanche_tarde",
            name: "Lanche da Tarde",
            time: "16:00",
            totalKcal: 220,
            items: [
              {
                foodKey: "iogurte-natural",
                name: "Iogurte natural + chia",
                quantityG: 200,
                householdMeasure: "1 pote",
                kcal: 150,
                substitutions: [
                  { foodKey: "kefir-natural", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
                  { foodKey: "queijo-cottage", name: "Queijo Cottage", quantityG: 150, householdMeasure: "5 colheres de sopa", kcal: 140 },
                  { foodKey: "ricota", name: "Ricota fresca", quantityG: 100, householdMeasure: "2 fatias", kcal: 140 },
                ],
              },
              {
                foodKey: "amendoa",
                name: "Amêndoas",
                quantityG: 12,
                householdMeasure: "10 unidades",
                kcal: 70,
                substitutions: [
                  { foodKey: "castanha", name: "Castanha de caju", quantityG: 12, householdMeasure: "6 unidades", kcal: 70 },
                  { foodKey: "nozes", name: "Nozes", quantityG: 12, householdMeasure: "3 unidades", kcal: 80 },
                  { foodKey: "pasta-amendoim", name: "Pasta de amendoim", quantityG: 12, householdMeasure: "1 colher de chá", kcal: 70 },
                ],
              },
            ],
          },
          {
            id: "jantar",
            name: "Jantar",
            time: "19:30",
            totalKcal: 420,
            items: [
              {
                foodKey: "salmao",
                name: "Salmão grelhado",
                quantityG: 130,
                householdMeasure: "1 posta média",
                kcal: 230,
                substitutions: [
                  { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 160, householdMeasure: "1 filé médio", kcal: 190 },
                  { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé pequeno", kcal: 215 },
                  { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "1 omelete", kcal: 234 },
                ],
              },
              {
                foodKey: "legumes-assados",
                name: "Mix de legumes assados",
                quantityG: 250,
                householdMeasure: "2 xícaras",
                kcal: 110,
                substitutions: [
                  { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 250, householdMeasure: "2 xícaras grandes", kcal: 90 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
                  { foodKey: "couve-flor", name: "Couve-flor gratinada", quantityG: 250, householdMeasure: "2 xícaras", kcal: 120 },
                ],
              },
              {
                foodKey: "abacate",
                name: "Abacate",
                quantityG: 50,
                householdMeasure: "¼ unidade",
                kcal: 80,
                substitutions: [
                  { foodKey: "azeite", name: "Azeite extra virgem", quantityG: 9, householdMeasure: "1 colher de sobremesa", kcal: 80 },
                  { foodKey: "castanha", name: "Castanha de caju", quantityG: 14, householdMeasure: "7 unidades", kcal: 80 },
                  { foodKey: "amendoa", name: "Amêndoas", quantityG: 14, householdMeasure: "11 unidades", kcal: 80 },
                ],
              },
            ],
          },
        ],
        recommendations: {
          waterMl: 3800,
          sleepHours: 8,
          teaRoutine: [
            "Chá de gengibre + cúrcuma + limão (07:30)",
            "Chá de camomila + melissa (20:00)",
          ],
          strategies: [
            "Aumentar volume de vegetais nas refeições principais",
            "Manter ingestão de proteína em todas as refeições",
            "Incluir psyllium em uma refeição por dia",
            "Suco verde diário no meio da manhã",
          ],
        },
      },
      {
        id: 3,
        name: "Fase 3 — Adaptação Metabólica + Caldos",
        durationWeeks: 2,
        description:
          "Introdução de caldos nutritivos no jantar, ajuste metabólico e refeed estratégico de carboidratos.",
        dailyKcalTarget: 1700,
        macros: { protein: 35, carb: 40, fat: 25 },
        specialFeature: {
          name: "Caldo Proteico Fit GLP",
          description:
            "Caldo de ossos ou frango com legumes funcionais — rico em colágeno, eletrólitos e aminoácidos que favorecem saciedade noturna.",
          recipe:
            "1L de caldo de frango caseiro + cenoura, abobrinha, gengibre e cúrcuma. Cozinhar por 40 min em fogo baixo.",
          usage:
            "Servir 1 tigela no jantar, acompanhada de proteína magra. Tempero da Saciedade segue opcional em 1 refeição/dia.",
          benefits:
            "Hidratação, saciedade noturna prolongada, suporte intestinal e recuperação muscular.",
        },
        meals: [
          {
            id: "cafe_manha",
            name: "Café da Manhã",
            time: "07:00",
            totalKcal: 400,
            items: [
              {
                foodKey: "tapioca-recheada",
                name: "Tapioca recheada com ovo e queijo",
                quantityG: 130,
                householdMeasure: "1 unidade média",
                kcal: 280,
                substitutions: [
                  { foodKey: "pao-integral", name: "Pão integral + ovo + queijo", quantityG: 130, householdMeasure: "2 fatias", kcal: 280 },
                  { foodKey: "crepioca", name: "Crepioca com queijo", quantityG: 130, householdMeasure: "1 unidade", kcal: 270 },
                  { foodKey: "omelete-queijo", name: "Omelete com queijo branco", quantityG: 150, householdMeasure: "1 unidade", kcal: 280 },
                ],
              },
              {
                foodKey: "mamao",
                name: "Mamão papaia",
                quantityG: 200,
                householdMeasure: "1 fatia grande",
                kcal: 80,
                substitutions: [
                  { foodKey: "abacaxi", name: "Abacaxi", quantityG: 150, householdMeasure: "2 fatias", kcal: 75 },
                  { foodKey: "melao", name: "Melão", quantityG: 200, householdMeasure: "2 fatias", kcal: 70 },
                  { foodKey: "manga", name: "Manga", quantityG: 150, householdMeasure: "1 fatia", kcal: 90 },
                ],
              },
            ],
          },
          {
            id: "almoco",
            name: "Almoço (refeed estratégico)",
            time: "12:30",
            totalKcal: 600,
            items: [
              {
                foodKey: "frango-grelhado",
                name: "Frango grelhado",
                quantityG: 150,
                householdMeasure: "1 filé médio",
                kcal: 248,
                substitutions: [
                  { foodKey: "patinho", name: "Patinho grelhado", quantityG: 140, householdMeasure: "1 porção", kcal: 250 },
                  { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
                  { foodKey: "ovo", name: "Ovos (3 unidades)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
                ],
              },
              {
                foodKey: "batata-doce",
                name: "Batata doce assada",
                quantityG: 200,
                householdMeasure: "1 unidade grande",
                kcal: 170,
                substitutions: [
                  { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 120, householdMeasure: "6 colheres de sopa", kcal: 165 },
                  { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 120, householdMeasure: "1 pedaço médio", kcal: 170 },
                  { foodKey: "quinoa", name: "Quinoa", quantityG: 130, householdMeasure: "4 colheres de sopa", kcal: 160 },
                ],
              },
              {
                foodKey: "feijao",
                name: "Feijão",
                quantityG: 120,
                householdMeasure: "1 concha grande",
                kcal: 100,
                substitutions: [
                  { foodKey: "lentilha", name: "Lentilha", quantityG: 120, householdMeasure: "1 concha grande", kcal: 115 },
                  { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
                  { foodKey: "ervilha", name: "Ervilha", quantityG: 120, householdMeasure: "1 concha grande", kcal: 100 },
                ],
              },
              {
                foodKey: "salada-verde",
                name: "Salada verde + azeite",
                quantityG: 200,
                householdMeasure: "2 xícaras",
                kcal: 82,
                substitutions: [
                  { foodKey: "legumes", name: "Legumes refogados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
                  { foodKey: "abobrinha", name: "Abobrinha refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
                ],
              },
            ],
          },
          {
            id: "lanche_tarde",
            name: "Lanche da Tarde",
            time: "16:00",
            totalKcal: 280,
            items: [
              {
                foodKey: "shake-whey-fruta",
                name: "Shake de whey + banana",
                quantityG: 300,
                householdMeasure: "1 copo grande",
                kcal: 280,
                substitutions: [
                  { foodKey: "iogurte-natural", name: "Iogurte natural + aveia + fruta", quantityG: 250, householdMeasure: "1 pote", kcal: 280 },
                  { foodKey: "vitamina-leite", name: "Vitamina de leite + banana + aveia", quantityG: 300, householdMeasure: "1 copo grande", kcal: 290 },
                  { foodKey: "kefir-fruta", name: "Kefir + frutas vermelhas + chia", quantityG: 300, householdMeasure: "1 copo grande", kcal: 270 },
                ],
              },
            ],
          },
          {
            id: "jantar",
            name: "Jantar — Caldo Proteico",
            time: "19:30",
            totalKcal: 420,
            items: [
              {
                foodKey: "caldo-proteico",
                name: "Caldo de frango com legumes",
                quantityG: 400,
                householdMeasure: "1 tigela grande",
                kcal: 200,
                substitutions: [
                  { foodKey: "caldo-carne", name: "Caldo de carne com legumes", quantityG: 400, householdMeasure: "1 tigela grande", kcal: 210 },
                  { foodKey: "sopa-legumes", name: "Sopa de legumes com peito de frango", quantityG: 400, householdMeasure: "1 tigela grande", kcal: 220 },
                  { foodKey: "caldo-peixe", name: "Caldo de peixe com tubérculos", quantityG: 400, householdMeasure: "1 tigela grande", kcal: 200 },
                ],
              },
              {
                foodKey: "peixe-grelhado",
                name: "Filé de Tilápia grelhado",
                quantityG: 120,
                householdMeasure: "1 filé pequeno",
                kcal: 140,
                substitutions: [
                  { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 100, householdMeasure: "½ xícara", kcal: 165 },
                  { foodKey: "ovo", name: "Ovos cozidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156 },
                  { foodKey: "atum", name: "Atum em água", quantityG: 120, householdMeasure: "1 lata drenada", kcal: 155 },
                ],
              },
              {
                foodKey: "azeite",
                name: "Azeite extra virgem",
                quantityG: 9,
                householdMeasure: "1 colher de sobremesa",
                kcal: 80,
                substitutions: [
                  { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "¼ unidade", kcal: 80 },
                  { foodKey: "castanha", name: "Castanha de caju", quantityG: 14, householdMeasure: "7 unidades", kcal: 80 },
                  { foodKey: "amendoa", name: "Amêndoas", quantityG: 14, householdMeasure: "11 unidades", kcal: 80 },
                ],
              },
            ],
          },
        ],
        recommendations: {
          waterMl: 4000,
          sleepHours: 8,
          teaRoutine: [
            "Chá verde (15:00)",
            "Chá de hibisco gelado (16:30)",
          ],
          strategies: [
            "Introduzir refeed estratégico de carboidratos 1–2x/semana",
            "Caldo proteico no jantar para prolongar saciedade noturna",
            "Manter alta saciedade com proteína e fibras",
            "Observar resposta corporal ao ajuste calórico",
          ],
        },
      },
      {
        id: 4,
        name: "Fase 4 — Manutenção e Autonomia",
        durationWeeks: 2,
        description:
          "Transição para manutenção sustentável com flexibilidade alimentar e jejum leve opcional.",
        dailyKcalTarget: 1750,
        macros: { protein: 35, carb: 40, fat: 25 },
        specialFeature: {
          name: "Jejum Leve 12h + Tempero da Saciedade",
          description:
            "Janela alimentar de 12h (ex.: 08:00 às 20:00) para sustentar sensibilidade à insulina. Tempero da Saciedade como hábito permanente.",
          recipe:
            "Tempero: 1 colher de chá de cúrcuma + ½ de gengibre + ½ de canela Ceylon + pitada de pimenta preta.",
          usage:
            "Manter janela de 12h sem alimento sólido entre o jantar e o café da manhã. Tempero usado livremente nas refeições.",
          benefits:
            "Sensibilidade à insulina, autofagia leve e hábito anti-inflamatório consolidado.",
        },
        teaSchedule: [
          {
            time: "07:30",
            name: "Chá de gengibre + cúrcuma + limão",
            quantity: "1 xícara (200 ml)",
            ingredients: [
              "200 ml de água filtrada",
              "1 fatia fina de gengibre fresco (~3 g)",
              "½ colher de chá de cúrcuma em pó",
              "Suco de ½ limão",
            ],
            preparation:
              "Ferver a água com o gengibre e a cúrcuma por 5 minutos. Abafar 3 min, coar e acrescentar o limão. Tomar morno.",
            timesPerDay: "1x ao dia (em jejum)",
            benefits: "Hábito matinal de manutenção, anti-inflamatório leve",
          },
        ],
        meals: [
          {
            id: "cafe_manha",
            name: "Café da Manhã (quebra de jejum)",
            time: "08:00",
            totalKcal: 430,
            items: [
              {
                foodKey: "ovo",
                name: "Ovos mexidos",
                quantityG: 150,
                householdMeasure: "3 unidades",
                kcal: 234,
                substitutions: [
                  { foodKey: "omelete-queijo", name: "Omelete com queijo branco", quantityG: 150, householdMeasure: "1 omelete", kcal: 240 },
                  { foodKey: "queijo-cottage", name: "Queijo Cottage", quantityG: 200, householdMeasure: "6 colheres de sopa", kcal: 180 },
                  { foodKey: "iogurte-grego", name: "Iogurte Grego Natural", quantityG: 250, householdMeasure: "1 pote grande", kcal: 155 },
                ],
              },
              {
                foodKey: "pao-integral",
                name: "Pão integral",
                quantityG: 50,
                householdMeasure: "2 fatias",
                kcal: 140,
                substitutions: [
                  { foodKey: "tapioca", name: "Tapioca", quantityG: 80, householdMeasure: "1 unidade", kcal: 140 },
                  { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150 },
                  { foodKey: "batata-doce", name: "Batata doce", quantityG: 160, householdMeasure: "1 unidade média", kcal: 140 },
                ],
              },
              {
                foodKey: "abacate",
                name: "Abacate amassado",
                quantityG: 40,
                householdMeasure: "2 colheres de sopa",
                kcal: 60,
                substitutions: [
                  { foodKey: "azeite", name: "Azeite no pão", quantityG: 7, householdMeasure: "1 colher de chá", kcal: 60 },
                  { foodKey: "pasta-amendoim", name: "Pasta de amendoim", quantityG: 10, householdMeasure: "1 colher de chá cheia", kcal: 60 },
                  { foodKey: "manteiga-ghee", name: "Manteiga ghee", quantityG: 7, householdMeasure: "1 colher de chá", kcal: 60 },
                ],
              },
            ],
          },
          {
            id: "almoco",
            name: "Almoço",
            time: "12:30",
            totalKcal: 580,
            items: [
              {
                foodKey: "carne-vermelha",
                name: "Carne vermelha magra grelhada",
                quantityG: 150,
                householdMeasure: "1 bife médio",
                kcal: 280,
                substitutions: [
                  { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 170, householdMeasure: "1 filé grande", kcal: 280 },
                  { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 200, householdMeasure: "1 filé grande", kcal: 240 },
                  { foodKey: "tofu-grelhado", name: "Tofu grelhado", quantityG: 200, householdMeasure: "1 porção grande", kcal: 280 },
                ],
              },
              {
                foodKey: "arroz-integral",
                name: "Arroz integral",
                quantityG: 100,
                householdMeasure: "5 colheres de sopa",
                kcal: 140,
                substitutions: [
                  { foodKey: "quinoa", name: "Quinoa", quantityG: 110, householdMeasure: "4 colheres de sopa", kcal: 135 },
                  { foodKey: "batata-doce", name: "Batata doce", quantityG: 160, householdMeasure: "1 unidade média", kcal: 140 },
                  { foodKey: "macarrao-integral", name: "Macarrão integral", quantityG: 100, householdMeasure: "1 pegador", kcal: 150 },
                ],
              },
              {
                foodKey: "feijao",
                name: "Feijão",
                quantityG: 100,
                householdMeasure: "1 concha",
                kcal: 80,
                substitutions: [
                  { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
                  { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
                  { foodKey: "ervilha", name: "Ervilha", quantityG: 100, householdMeasure: "1 concha", kcal: 85 },
                ],
              },
              {
                foodKey: "salada-colorida",
                name: "Salada colorida + azeite",
                quantityG: 200,
                householdMeasure: "2 xícaras",
                kcal: 80,
                substitutions: [
                  { foodKey: "legumes-assados", name: "Legumes assados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 100 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
                  { foodKey: "abobrinha", name: "Abobrinha grelhada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
                ],
              },
            ],
          },
          {
            id: "lanche_tarde",
            name: "Lanche da Tarde",
            time: "16:30",
            totalKcal: 260,
            items: [
              {
                foodKey: "iogurte-granola",
                name: "Iogurte natural + granola + frutas",
                quantityG: 250,
                householdMeasure: "1 pote",
                kcal: 260,
                substitutions: [
                  { foodKey: "shake-whey-fruta", name: "Shake de whey + fruta", quantityG: 300, householdMeasure: "1 copo grande", kcal: 260 },
                  { foodKey: "vitamina-aveia", name: "Vitamina de banana com aveia", quantityG: 300, householdMeasure: "1 copo grande", kcal: 270 },
                  { foodKey: "pao-pasta", name: "Pão integral + pasta de amendoim", quantityG: 80, householdMeasure: "2 fatias", kcal: 260 },
                ],
              },
            ],
          },
          {
            id: "jantar",
            name: "Jantar (fechamento da janela)",
            time: "20:00",
            totalKcal: 420,
            items: [
              {
                foodKey: "frango-desfiado",
                name: "Frango desfiado refogado",
                quantityG: 140,
                householdMeasure: "1 xícara",
                kcal: 230,
                substitutions: [
                  { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 170, householdMeasure: "1 filé médio", kcal: 200 },
                  { foodKey: "carne-vermelha", name: "Carne magra grelhada", quantityG: 120, householdMeasure: "1 bife pequeno", kcal: 220 },
                  { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "1 omelete", kcal: 234 },
                ],
              },
              {
                foodKey: "legumes-assados",
                name: "Mix de legumes assados",
                quantityG: 250,
                householdMeasure: "2 xícaras",
                kcal: 110,
                substitutions: [
                  { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 250, householdMeasure: "2 xícaras grandes", kcal: 90 },
                  { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
                  { foodKey: "couve-flor", name: "Couve-flor gratinada", quantityG: 250, householdMeasure: "2 xícaras", kcal: 120 },
                ],
              },
              {
                foodKey: "azeite",
                name: "Azeite extra virgem",
                quantityG: 9,
                householdMeasure: "1 colher de sobremesa",
                kcal: 80,
                substitutions: [
                  { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "¼ unidade", kcal: 80 },
                  { foodKey: "castanha", name: "Castanha de caju", quantityG: 14, householdMeasure: "7 unidades", kcal: 80 },
                  { foodKey: "amendoa", name: "Amêndoas", quantityG: 14, householdMeasure: "11 unidades", kcal: 80 },
                ],
              },
            ],
          },
        ],
        recommendations: {
          waterMl: 4000,
          sleepHours: 8,
          teaRoutine: ["Chá de gengibre + cúrcuma + limão (07:30)"],
          strategies: [
            "Manter janela alimentar de 12h (08:00–20:00)",
            "Variedade alimentar com segurança",
            "Hábitos de saciedade consolidados",
            "Tempero da Saciedade como rotina permanente",
          ],
        },
      },
    ],
  },
  // -------------------------------------------------------------------------
  // Módulo Gastrite — Alívio, Proteção e Cicatrização da Mucosa Gástrica
  // -------------------------------------------------------------------------
  {
    id: "gastrite",
    name: "Gastrite",
    tagline: "Alívio, Proteção e Cicatrização da Mucosa Gástrica",
    methodology: {
      title: "Metodologia Gastrite — Proteção e Cicatrização",
      subtitle:
        "Reduzir inflamação, aliviar sintomas e promover cicatrização natural da mucosa gástrica através de refeições leves, frequentes e estratégicas.",
      pillars: [
        {
          title: "1. Fracionamento protetor",
          summary:
            "Refeições pequenas a cada 3 horas evitam jejum prolongado e excesso de produção ácida.",
          examples: [
            "5 a 6 refeições/dia",
            "Volume reduzido por refeição",
            "Mastigação lenta e completa",
          ],
        },
        {
          title: "2. Exclusão de irritantes",
          summary:
            "Remover os principais agressores da mucosa durante a fase aguda.",
          examples: [
            "Café, refrigerante, álcool",
            "Frituras e gorduras saturadas",
            "Pimenta, vinagre, frutas ácidas",
            "Embutidos, enlatados, ultraprocessados",
          ],
        },
        {
          title: "3. Alimentos cicatrizantes",
          summary:
            "Priorizar alimentos com efeito mucilaginoso e anti-inflamatório.",
          examples: [
            "Aveia, banana madura, maçã cozida",
            "Batata, mandioca, inhame",
            "Frango/peixe cozidos, ovos pochê",
            "Camomila, alcaçuz, hortelã",
          ],
        },
        {
          title: "4. Chá Protetor Gástrico",
          summary:
            "Mistura calmante e cicatrizante usada antes das principais refeições.",
        },
        {
          title: "5. Ambiente anti-recidiva",
          summary:
            "Hábitos e ambiente que mantêm a mucosa cicatrizada após a alta sintomática.",
          examples: [
            "Não deitar nas 2h pós-refeição",
            "Reduzir estresse e sono curto",
            "Hidratação fora das refeições",
          ],
        },
      ],
      behavioralRules: [
        { name: "Regra das 3 horas", description: "Nunca passar mais de 3 horas em jejum durante o dia." },
        { name: "Regra do prato morno", description: "Preferir preparações mornas — evitar extremos de temperatura." },
        { name: "Regra do líquido fora", description: "Beber líquidos 30 min antes ou 1h depois das refeições, não junto." },
        { name: "Regra da mastigação", description: "Mastigar cada garfada pelo menos 20 vezes antes de engolir." },
      ],
      disclaimer:
        "Protocolo nutricional de suporte. Não substitui IBP, antibioticoterapia para H. pylori ou avaliação endoscópica indicadas pelo médico.",
    },
    phases: [
      {
        id: 1,
        name: "Fase 1 — Alívio Agudo",
        durationWeeks: 2,
        description: "Foco em reduzir inflamação e irritação da mucosa. Refeições leves, mornas e frequentes.",
        dailyKcalTarget: 1600,
        macros: { protein: 30, carb: 50, fat: 20 },
        specialFeature: {
          name: "Chá Protetor Gástrico",
          description: "Mistura calmante e cicatrizante exclusiva do Módulo Gastrite.",
          recipe: "Camomila + Erva-doce + Alcaçuz + Hortelã (1 colher de chá de cada para 200 ml de água).",
          usage: "Tomar 1 xícara morna 20 minutos antes das principais refeições (café, almoço e jantar).",
          benefits: "Calma a mucosa, reduz a sensação de queimação e auxilia a cicatrização do epitélio gástrico.",
          notes: "Evitar adoçar. Não tomar gelado. Suspender alcaçuz se houver hipertensão.",
        },
        teaSchedule: [
          {
            time: "07:00",
            name: "Chá Protetor Gástrico",
            quantity: "1 xícara (200 ml)",
            ingredients: [
              "200 ml de água filtrada",
              "1 colher de chá de camomila",
              "1 colher de chá de erva-doce",
              "1 colher de chá de alcaçuz",
              "1 colher de chá de hortelã",
            ],
            preparation: "Ferver a água, desligar o fogo, adicionar as ervas e abafar por 5 minutos. Coar e tomar morno.",
            timesPerDay: "3x ao dia (20 min antes das refeições principais)",
            benefits: "Calmante e cicatrizante da mucosa gástrica",
            notes: "Suspender alcaçuz em caso de hipertensão.",
          },
        ],
        meals: [
          {
            id: "cafe_manha",
            name: "Café da Manhã",
            time: "07:00",
            totalKcal: 320,
            items: [
              {
                foodKey: "aveia",
                name: "Mingau de Aveia",
                quantityG: 40,
                householdMeasure: "4 colheres de sopa",
                kcal: 150,
                substitutions: [
                  { foodKey: "creme-de-arroz", name: "Creme de arroz", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150 },
                  { foodKey: "mingau-maizena", name: "Mingau de maisena", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 140 },
                  { foodKey: "tapioca", name: "Tapioca fina", quantityG: 50, householdMeasure: "1 disco médio", kcal: 130 },
                ],
              },
              {
                foodKey: "maca",
                name: "Maçã cozida",
                quantityG: 150,
                householdMeasure: "1 unidade",
                kcal: 80,
                substitutions: [
                  { foodKey: "pera-cozida", name: "Pera cozida", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
                  { foodKey: "banana", name: "Banana madura", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
                  { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia grande", kcal: 80 },
                ],
              },
              {
                foodKey: "banana",
                name: "Banana madura",
                quantityG: 100,
                householdMeasure: "1 unidade",
                kcal: 90,
                substitutions: [
                  { foodKey: "maca-cozida", name: "Maçã cozida", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
                  { foodKey: "pera", name: "Pera madura", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
                  { foodKey: "mamao", name: "Mamão papaia", quantityG: 150, householdMeasure: "1 fatia média", kcal: 60 },
                ],
              },
            ],
          },
        ],
        recommendations: {
          waterMl: 2500,
          sleepHours: 8,
          teaRoutine: ["Chá Protetor Gástrico — 20 min antes do café, almoço e jantar"],
          strategies: [
            "Refeições pequenas a cada 3 horas",
            "Evitar alimentos ácidos, picantes, fritos e cafeína",
            "Priorizar alimentos macios, mornos e de fácil digestão",
            "Beber líquidos fora das refeições",
            "Não deitar nas 2h após comer",
          ],
        },
      },
      {
        id: 2,
        name: "Fase 2 — Cicatrização",
        durationWeeks: 2,
        description: "Foco em cicatrização da mucosa com introdução gradual de nutrientes.",
        dailyKcalTarget: 1700,
        macros: { protein: 35, carb: 45, fat: 20 },
        recommendations: {
          waterMl: 2500,
          sleepHours: 8,
          teaRoutine: ["Chá Protetor Gástrico — 2x ao dia"],
          strategies: [
            "Ampliar fontes proteicas magras (frango, peixe, ovos)",
            "Introduzir legumes cozidos sem casca",
            "Manter exclusão de café, álcool e ultraprocessados",
            "Reforçar mastigação e fracionamento",
          ],
        },
      },
      {
        id: 3,
        name: "Fase 3 — Reintrodução",
        durationWeeks: 1,
        description: "Reintrodução gradual de alimentos com maior variedade, observando tolerância individual.",
        dailyKcalTarget: 1750,
        macros: { protein: 35, carb: 40, fat: 25 },
        recommendations: {
          waterMl: 2500,
          sleepHours: 8,
          teaRoutine: ["Chá Protetor Gástrico — 1x ao dia (jejum)"],
          strategies: [
            "Reintroduzir frutas cítricas em pequenas porções",
            "Testar tolerância a temperos suaves",
            "Manter refeições mornas e bem mastigadas",
            "Registrar sintomas após cada novo alimento",
          ],
        },
      },
      {
        id: 4,
        name: "Fase 4 — Manutenção",
        durationWeeks: 1,
        description: "Manutenção dos resultados e prevenção de recidivas com cardápio variado e equilibrado.",
        dailyKcalTarget: 1800,
        macros: { protein: 35, carb: 40, fat: 25 },
        recommendations: {
          waterMl: 2500,
          sleepHours: 8,
          teaRoutine: ["Chá Protetor Gástrico — manter como rotina semanal"],
          strategies: [
            "Cardápio variado mantendo fracionamento",
            "Evitar gatilhos individuais identificados",
            "Manter chá protetor como hábito de longo prazo",
            "Reforço de hábitos anti-recidiva (sono, estresse, postura)",
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
          durationWeeks: 2,
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
