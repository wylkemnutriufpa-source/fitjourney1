// Módulos cérebro / inflamação — Lote 4 do roll-out de cardápios.
// Anti-Ansiedade · Anti-Enxaqueca · Anti-inflamatório · Anemia.
//
// Regras invioláveis (skill fitjourney-template-rules):
//   - Substituição sempre dentro do mesmo scaleGroup
//   - Porções clínicas reais e práticas
//   - Combinações fáceis (a "dieta fácil" é o diferencial)
//
// Determinístico. Sem IO. Sem IA.

import type { ProtocolModule } from "../catalog";

// ---------------------------------------------------------------------------
// ANTI-ANSIEDADE
// ---------------------------------------------------------------------------

export const ANTI_ANSIEDADE_MODULE: ProtocolModule = {
  id: "anti-ansiedade",
  name: "Módulo Anti-Ansiedade",
  tagline: "Triptofano, magnésio, ômega-3 — eixo intestino-cérebro.",
  methodology: {
    title: "Metodologia Anti-Ansiedade — Eixo Intestino-Cérebro",
    subtitle:
      "Estabilizar glicemia, fornecer precursores de serotonina/GABA e nutrir a microbiota — reduzindo picos de cortisol e impulsividade alimentar.",
    pillars: [
      { title: "1. Triptofano + carboidrato lento", summary: "Triptofano só atravessa a BHE com insulina leve — combinar proteína magra + carbo integral.", examples: ["Frango + arroz integral", "Ovo + aveia", "Iogurte + banana"] },
      { title: "2. Magnésio diário (300–400 mg)", summary: "Cofator de 300+ enzimas; deficiência aumenta excitabilidade neuronal.", examples: ["Espinafre, abacate, cacau 70%+", "Castanha-do-pará, amêndoas", "Feijão preto, grão-de-bico"] },
      { title: "3. Ômega-3 EPA/DHA", summary: "Anti-inflamatório central; EPA tem efeito ansiolítico documentado.", examples: ["Sardinha, salmão, atum", "Linhaça moída, chia", "Nozes"] },
      { title: "4. Microbiota equilibrada", summary: "90% da serotonina é intestinal — probióticos + prebióticos diariamente.", examples: ["Iogurte natural, kefir", "Banana verde, aveia", "Alho, cebola, alho-poró"] },
      { title: "5. Zero estimulantes vespertinos", summary: "Cafeína após 14h aumenta cortisol noturno e fragmenta sono REM.", examples: ["Café apenas até 14h", "Chá-preto/verde só manhã", "Sem energéticos"] },
    ],
    behavioralRules: [
      { name: "Regra das 3 refeições ancoradas", description: "Café, almoço e jantar com proteína — evita hipoglicemia e crise de ansiedade alimentar." },
      { name: "Regra do magnésio noturno", description: "Última refeição inclui fonte de magnésio (banana, castanha, cacau) para suporte ao sono." },
      { name: "Regra do zero açúcar refinado", description: "Picos e quedas glicêmicas mimetizam crise de pânico — sacarose substituída por fruta inteira." },
    ],
    disclaimer:
      "Coadjuvante. Não substitui psicoterapia, medicação ou acompanhamento psiquiátrico. Comunicar nutricionista se houver uso de IMAO (restrição de tiramina).",
  },
  phases: [
    {
      id: 1, name: "Fase 1 — Estabilização (4 semanas)", durationWeeks: 4,
      description: "Cortar estimulantes, regular glicemia e nutrir microbiota.",
      dailyKcalTarget: 1900, macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: {
        waterMl: 2800, sleepHours: 8,
        teaRoutine: ["Camomila 21h", "Melissa 16h", "Maracujá após jantar", "NÃO usar chá-verde/preto/mate após 14h"],
        strategies: ["Café só até 14h", "Última refeição 2h antes de dormir", "Magnésio na ceia", "Exposição solar 15 min/dia"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 420, items: [
          { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
            { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
            { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 60, householdMeasure: "2 fatias", kcal: 145 },
          ]},
          { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150, substitutions: [
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
            { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos pequenos", kcal: 145 },
          ]},
          { foodKey: "banana", name: "Banana prata", quantityG: 100, householdMeasure: "1 unidade", kcal: 89, substitutions: [
            { foodKey: "maca", name: "Maçã", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
            { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
          ]},
        ]},
        { id: "lanche-m", name: "Lanche da Manhã (10h)", time: "10:00", totalKcal: 200, items: [
          { foodKey: "iogurte-natural", name: "Iogurte natural integral", quantityG: 200, householdMeasure: "1 copo", kcal: 120, substitutions: [
            { foodKey: "queijo-cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
          ]},
          { foodKey: "castanha-para", name: "Castanha-do-pará", quantityG: 15, householdMeasure: "2 unidades", kcal: 100, substitutions: [
            { foodKey: "amendoas", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
            { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "3 unidades", kcal: 100 },
          ]},
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 600, items: [
          { foodKey: "salmao", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 270, substitutions: [
            { foodKey: "sardinha", name: "Sardinha grelhada", quantityG: 130, householdMeasure: "2 unidades", kcal: 270 },
            { foodKey: "frango-peito", name: "Peito de frango grelhado", quantityG: 140, householdMeasure: "1 filé", kcal: 230 },
          ]},
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres de sopa", kcal: 125, substitutions: [
            { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 100, householdMeasure: "4 colheres", kcal: 120 },
            { foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 120, householdMeasure: "1 unidade média", kcal: 105 },
          ]},
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60, substitutions: [
            { foodKey: "lentilha", name: "Lentilha", quantityG: 80, householdMeasure: "1 concha", kcal: 95 },
            { foodKey: "grao-de-bico", name: "Grão-de-bico", quantityG: 80, householdMeasure: "1 concha", kcal: 110 },
          ]},
          { foodKey: "espinafre", name: "Salada de espinafre + tomate", quantityG: 150, householdMeasure: "1 prato", kcal: 50 },
          { foodKey: "abacate", name: "Abacate fatiado", quantityG: 50, householdMeasure: "2 colheres", kcal: 80, substitutions: [
            { foodKey: "azeite", name: "Azeite extra-virgem", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90 },
          ]},
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 220, items: [
          { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105, substitutions: [
            { foodKey: "queijo-cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
          ]},
          { foodKey: "cacau-70", name: "Cacau 70% em lascas", quantityG: 15, householdMeasure: "1 colher de sopa", kcal: 85, substitutions: [
            { foodKey: "amendoas", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
          ]},
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 500, items: [
          { foodKey: "frango-peito", name: "Peito de frango grelhado", quantityG: 120, householdMeasure: "1 filé", kcal: 200, substitutions: [
            { foodKey: "atum", name: "Atum em água", quantityG: 130, householdMeasure: "1 lata drenada", kcal: 170 },
            { foodKey: "ovo", name: "Ovos cozidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 230 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130, substitutions: [
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          ]},
          { foodKey: "legumes-mix", name: "Legumes refogados (abobrinha, cenoura, brócolis)", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite extra-virgem", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90 },
        ]},
        { id: "ceia", name: "Ceia (22h)", time: "22:00", totalKcal: 160, items: [
          { foodKey: "leite-desnatado", name: "Leite morno", quantityG: 200, householdMeasure: "1 copo", kcal: 70, substitutions: [
            { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 100 },
          ]},
          { foodKey: "banana", name: "Banana com canela", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
        ]},
      ],
    },
    {
      id: 2, name: "Fase 2 — Manutenção (contínua)", durationWeeks: 12,
      description: "Variar fontes de ômega-3 e probióticos; permitir 1 café da tarde livre.",
      dailyKcalTarget: 2000, macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: {
        waterMl: 2800, sleepHours: 8,
        teaRoutine: ["Camomila 21h", "Melissa quando necessário", "Café liberado até 14h"],
        strategies: ["1 quadrado de chocolate 70% liberado/dia", "Peixe gordo 3x/semana", "Caminhada 30 min/dia"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 430, items: [
          { foodKey: "ovo", name: "Omelete de espinafre", quantityG: 100, householdMeasure: "2 ovos", kcal: 170, substitutions: [
            { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 60, householdMeasure: "2 fatias", kcal: 145 },
          ]},
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140, substitutions: [
            { foodKey: "aveia", name: "Aveia", quantityG: 40, householdMeasure: "4 colheres", kcal: 150 },
          ]},
          { foodKey: "abacate", name: "Abacate amassado", quantityG: 50, householdMeasure: "2 colheres", kcal: 80 },
          { foodKey: "mamao", name: "Mamão", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 620, items: [
          { foodKey: "sardinha", name: "Sardinha grelhada (ômega-3)", quantityG: 130, householdMeasure: "2 unidades", kcal: 270, substitutions: [
            { foodKey: "salmao", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 270 },
            { foodKey: "frango-peito", name: "Peito de frango", quantityG: 140, householdMeasure: "1 filé", kcal: 230 },
          ]},
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60 },
          { foodKey: "salada-folhas", name: "Salada de folhas verdes", quantityG: 150, householdMeasure: "1 prato", kcal: 40 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 230, items: [
          { foodKey: "iogurte-grego", name: "Iogurte grego com cacau", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
          { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "3 unidades", kcal: 100 },
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 520, items: [
          { foodKey: "frango-peito", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
          { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres", kcal: 120 },
          { foodKey: "brocolis", name: "Brócolis refogado", quantityG: 200, householdMeasure: "2 conchas", kcal: 70 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "ceia", name: "Ceia (22h)", time: "22:00", totalKcal: 170, items: [
          { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 100 },
          { foodKey: "banana", name: "Banana", quantityG: 80, householdMeasure: "1 pequena", kcal: 70 },
        ]},
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTI-ENXAQUECA
// ---------------------------------------------------------------------------

export const ANTI_ENXAQUECA_MODULE: ProtocolModule = {
  id: "anti-enxaqueca",
  name: "Módulo Anti-Enxaqueca",
  tagline: "Exclusão de gatilhos + magnésio, riboflavina e CoQ10.",
  methodology: {
    title: "Metodologia Anti-Enxaqueca — Exclusão + Reforço",
    subtitle:
      "Eliminar gatilhos clássicos (tiramina, glutamato, nitratos, álcool) e reforçar nutrientes neuroprotetores (Mg, B2, CoQ10, ômega-3).",
    pillars: [
      { title: "1. Exclusão de tiramina e histamina", summary: "Queijos envelhecidos, embutidos, vinho tinto, defumados e conservas disparam vasodilatação.", examples: ["Sem queijo amarelo curado", "Sem salame, presunto cru, bacon", "Sem vinho/cerveja", "Sem shoyu, missô, fermentados"] },
      { title: "2. Exclusão de glutamato e nitritos", summary: "Aditivos comuns em embutidos, caldos prontos e fast-food.", examples: ["Sem cubo de caldo", "Sem salgadinho industrializado", "Sem enlatado com MSG"] },
      { title: "3. Magnésio + riboflavina (B2)", summary: "Deficiência subclínica é comum em pacientes com enxaqueca.", examples: ["Espinafre, abacate, banana", "Castanhas, sementes", "Ovo, leite, fígado (B2)"] },
      { title: "4. CoQ10 e ômega-3", summary: "Reduzem frequência das crises em estudos clínicos.", examples: ["Sardinha, salmão", "Carne magra", "Linhaça moída"] },
      { title: "5. Glicemia estável + hidratação", summary: "Jejum prolongado e desidratação são gatilhos #1.", examples: ["Não passar 4h sem comer", "2,5–3 L de água/dia", "Carboidrato em toda refeição"] },
    ],
    behavioralRules: [
      { name: "Regra do diário alimentar", description: "Anotar alimentos consumidos nas 24h antes de toda crise — identificar gatilho pessoal." },
      { name: "Regra do não-jejum", description: "Café da manhã obrigatório em até 1h após acordar; sem pular refeições." },
      { name: "Regra dos 3 cafés", description: "Limite máximo de 200 mg de cafeína/dia, sempre no mesmo horário (rebote é gatilho)." },
    ],
    disclaimer:
      "Coadjuvante ao tratamento neurológico. Alguns gatilhos são individuais — manter diário alimentar por 60 dias para mapeamento personalizado.",
  },
  phases: [
    {
      id: 1, name: "Fase 1 — Eliminação (4 semanas)", durationWeeks: 4,
      description: "Exclusão total de gatilhos clássicos + reforço de Mg/B2/ômega-3.",
      dailyKcalTarget: 1900, macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: {
        waterMl: 3000, sleepHours: 8,
        teaRoutine: ["Gengibre 09h (anti-náusea)", "Camomila 21h", "NÃO usar chá-preto, mate, hibisco em excesso"],
        strategies: ["Diário alimentar diário", "Sem pular refeições", "Cafeína fixa 1 dose/dia", "Dormir e acordar no mesmo horário"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 400, items: [
          { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
            { foodKey: "queijo-minas", name: "Queijo minas frescal (NÃO curado)", quantityG: 60, householdMeasure: "2 fatias", kcal: 145 },
            { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres", kcal: 130 },
          ]},
          { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres", kcal: 150, substitutions: [
            { foodKey: "pao-integral", name: "Pão integral (sem aditivos)", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
            { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos", kcal: 145 },
          ]},
          { foodKey: "maca", name: "Maçã", quantityG: 150, householdMeasure: "1 unidade", kcal: 80, substitutions: [
            { foodKey: "pera", name: "Pera", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
          ]},
        ]},
        { id: "lanche-m", name: "Lanche da Manhã (10h)", time: "10:00", totalKcal: 180, items: [
          { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
          { foodKey: "amendoas", name: "Amêndoas (sem sal)", quantityG: 15, householdMeasure: "10 unidades", kcal: 90, substitutions: [
            { foodKey: "castanha-para", name: "Castanha-do-pará", quantityG: 15, householdMeasure: "2 unidades", kcal: 100 },
          ]},
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 600, items: [
          { foodKey: "frango-peito", name: "Peito de frango grelhado (sem tempero pronto)", quantityG: 140, householdMeasure: "1 filé", kcal: 230, substitutions: [
            { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
            { foodKey: "tilapia", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
          ]},
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125, substitutions: [
            { foodKey: "batata-doce", name: "Batata-doce", quantityG: 120, householdMeasure: "1 unidade", kcal: 105 },
            { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres", kcal: 120 },
          ]},
          { foodKey: "feijao-carioca", name: "Feijão carioca", quantityG: 80, householdMeasure: "1 concha", kcal: 75, substitutions: [
            { foodKey: "lentilha", name: "Lentilha", quantityG: 80, householdMeasure: "1 concha", kcal: 95 },
          ]},
          { foodKey: "salada-folhas", name: "Salada verde fresca (sem queijo curado)", quantityG: 150, householdMeasure: "1 prato", kcal: 40 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 200, items: [
          { foodKey: "iogurte-natural", name: "Iogurte natural integral", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
          { foodKey: "banana", name: "Banana", quantityG: 80, householdMeasure: "1 pequena", kcal: 70 },
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 500, items: [
          { foodKey: "salmao", name: "Salmão grelhado (ômega-3)", quantityG: 130, householdMeasure: "1 filé", kcal: 270, substitutions: [
            { foodKey: "sardinha", name: "Sardinha grelhada", quantityG: 130, householdMeasure: "2 unidades", kcal: 270 },
            { foodKey: "frango-peito", name: "Peito de frango", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 120, householdMeasure: "1 unidade", kcal: 105 },
          { foodKey: "legumes-mix", name: "Abobrinha + cenoura refogadas", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
    {
      id: 2, name: "Fase 2 — Reintrodução Monitorada (8 semanas)", durationWeeks: 8,
      description: "Reintroduzir 1 alimento suspeito a cada 5 dias e avaliar resposta. Manter base anti-inflamatória.",
      dailyKcalTarget: 2000, macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: {
        waterMl: 3000, sleepHours: 8,
        teaRoutine: ["Camomila 21h", "Gengibre antes de viagens"],
        strategies: ["1 alimento novo a cada 5 dias", "Anotar resposta em 24–48h", "Manter exclusão se houver crise"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 420, items: [
          { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156 },
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
          { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres", kcal: 80 },
          { foodKey: "maca", name: "Maçã", quantityG: 100, householdMeasure: "1 pequena", kcal: 55 },
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 620, items: [
          { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 220 },
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60 },
          { foodKey: "salada-folhas", name: "Salada verde", quantityG: 150, householdMeasure: "1 prato", kcal: 40 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 220, items: [
          { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
          { foodKey: "amendoas", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 520, items: [
          { foodKey: "tilapia", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130 },
          { foodKey: "brocolis", name: "Brócolis refogado", quantityG: 200, householdMeasure: "2 conchas", kcal: 70 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTI-INFLAMATÓRIO
// ---------------------------------------------------------------------------

export const ANTI_INFLAMATORIO_MODULE: ProtocolModule = {
  id: "anti-inflamatorio",
  name: "Módulo Anti-inflamatório",
  tagline: "Ômega-3, polifenóis e exclusão de pró-inflamatórios.",
  methodology: {
    title: "Metodologia Anti-inflamatória — Dieta Mediterrânea Adaptada",
    subtitle:
      "Reduzir PCR, citocinas inflamatórias e estresse oxidativo através de ômega-3, polifenóis, fibras e exclusão de pró-inflamatórios.",
    pillars: [
      { title: "1. Ômega-3 EPA/DHA diário", summary: "Razão ômega-6:ômega-3 abaixo de 4:1 é o alvo.", examples: ["Sardinha, salmão, atum 3x/sem", "Linhaça moída, chia", "Nozes"] },
      { title: "2. Polifenóis e antioxidantes", summary: "Frutas vermelhas, cúrcuma, azeite, chá verde — neutralizam radicais livres.", examples: ["Mirtilo, morango, amora", "Cúrcuma + pimenta-preta", "Azeite extra-virgem", "Chá verde"] },
      { title: "3. Fibras solúveis e fermentáveis", summary: "Alimentam microbiota produtora de butirato (anti-inflamatório intestinal).", examples: ["Aveia, banana verde", "Cebola, alho, alho-poró", "Maçã com casca"] },
      { title: "4. Zero ultraprocessados", summary: "Gorduras trans, açúcar refinado e emulsificantes ativam NF-kB.", examples: ["Sem refrigerante, biscoito recheado", "Sem margarina, salgadinho", "Sem embutido"] },
      { title: "5. Exclusão de pró-inflamatórios", summary: "Carne vermelha processada, óleos vegetais refinados em excesso, álcool.", examples: ["Sem bacon, salsicha, salame", "Sem óleo de soja/milho frito", "Álcool 1x/sem máximo"] },
    ],
    behavioralRules: [
      { name: "Regra do prato colorido", description: "Pelo menos 3 cores diferentes de vegetais/frutas em cada refeição principal." },
      { name: "Regra da gordura boa", description: "Toda refeição com fonte de gordura insaturada (azeite, abacate, oleaginosas, peixe)." },
      { name: "Regra da cúrcuma diária", description: "1 colher de chá de cúrcuma + pitada de pimenta-preta em pelo menos 1 refeição." },
    ],
    disclaimer:
      "Reduz marcadores inflamatórios em 4–8 semanas. Não substitui medicação para doenças autoimunes ou cardiovasculares. Monitorar PCR-us a cada 3 meses.",
  },
  phases: [
    {
      id: 1, name: "Fase 1 — Limpeza (4 semanas)", durationWeeks: 4,
      description: "Exclusão total de ultraprocessados e introdução intensa de ômega-3 e polifenóis.",
      dailyKcalTarget: 1900, macros: { protein: 25, carb: 45, fat: 30 },
      recommendations: {
        waterMl: 3000, sleepHours: 8,
        teaRoutine: ["Chá verde 10h", "Cúrcuma + gengibre 16h", "Camomila 21h"],
        strategies: ["Cúrcuma diária", "Peixe gordo 3x/sem", "Frutas vermelhas diárias", "Caminhada 30 min"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 420, items: [
          { foodKey: "aveia", name: "Mingau de aveia com chia", quantityG: 50, householdMeasure: "5 colheres", kcal: 190, substitutions: [
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
          ]},
          { foodKey: "morango", name: "Morangos + mirtilos", quantityG: 150, householdMeasure: "1 xícara", kcal: 60, substitutions: [
            { foodKey: "amora", name: "Amoras", quantityG: 150, householdMeasure: "1 xícara", kcal: 65 },
            { foodKey: "maca", name: "Maçã com casca", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
          ]},
          { foodKey: "nozes", name: "Nozes (ômega-3)", quantityG: 20, householdMeasure: "4 unidades", kcal: 130, substitutions: [
            { foodKey: "amendoas", name: "Amêndoas", quantityG: 20, householdMeasure: "12 unidades", kcal: 120 },
            { foodKey: "castanha-para", name: "Castanha-do-pará", quantityG: 15, householdMeasure: "2 unidades", kcal: 100 },
          ]},
        ]},
        { id: "lanche-m", name: "Lanche da Manhã (10h)", time: "10:00", totalKcal: 180, items: [
          { foodKey: "iogurte-natural", name: "Iogurte natural integral", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
          { foodKey: "linhaca", name: "Linhaça moída", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 55, substitutions: [
            { foodKey: "chia", name: "Chia", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 50 },
          ]},
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 620, items: [
          { foodKey: "salmao", name: "Salmão grelhado com cúrcuma", quantityG: 130, householdMeasure: "1 filé", kcal: 270, substitutions: [
            { foodKey: "sardinha", name: "Sardinha grelhada", quantityG: 130, householdMeasure: "2 unidades", kcal: 270 },
            { foodKey: "frango-peito", name: "Frango grelhado", quantityG: 140, householdMeasure: "1 filé", kcal: 230 },
          ]},
          { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres", kcal: 120, substitutions: [
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
            { foodKey: "batata-doce", name: "Batata-doce", quantityG: 120, householdMeasure: "1 unidade", kcal: 105 },
          ]},
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60 },
          { foodKey: "salada-folhas", name: "Salada colorida (folhas + tomate + cenoura)", quantityG: 200, householdMeasure: "1 prato grande", kcal: 60 },
          { foodKey: "azeite", name: "Azeite extra-virgem", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 200, items: [
          { foodKey: "abacate", name: "Abacate amassado com limão", quantityG: 80, householdMeasure: "1/4 unidade", kcal: 130 },
          { foodKey: "biscoito-arroz", name: "Biscoito de arroz integral", quantityG: 20, householdMeasure: "2 unidades", kcal: 80, substitutions: [
            { foodKey: "pao-integral", name: "Pão integral torrado", quantityG: 25, householdMeasure: "1 fatia", kcal: 70 },
          ]},
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 500, items: [
          { foodKey: "atum", name: "Atum em água", quantityG: 130, householdMeasure: "1 lata drenada", kcal: 170, substitutions: [
            { foodKey: "frango-peito", name: "Peito de frango grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
            { foodKey: "tilapia", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130 },
          { foodKey: "brocolis", name: "Brócolis + abobrinha refogados no azeite", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
    {
      id: 2, name: "Fase 2 — Manutenção (contínua)", durationWeeks: 12,
      description: "Padrão mediterrâneo permanente; 1 refeição livre/semana liberada (sem ultraprocessado).",
      dailyKcalTarget: 2000, macros: { protein: 25, carb: 45, fat: 30 },
      recommendations: {
        waterMl: 3000, sleepHours: 8,
        teaRoutine: ["Chá verde 10h", "Cúrcuma 16h"],
        strategies: ["Peixe gordo 3x/sem", "Azeite cru em toda refeição", "Vinho tinto opcional 1 taça/sem"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 430, items: [
          { foodKey: "aveia", name: "Aveia com chia e frutas vermelhas", quantityG: 50, householdMeasure: "5 colheres", kcal: 190 },
          { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
          { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "3 unidades", kcal: 100 },
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 630, items: [
          { foodKey: "sardinha", name: "Sardinha + cúrcuma", quantityG: 130, householdMeasure: "2 unidades", kcal: 270 },
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60 },
          { foodKey: "salada-folhas", name: "Salada mediterrânea", quantityG: 200, householdMeasure: "1 prato", kcal: 70 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 220, items: [
          { foodKey: "abacate", name: "Abacate", quantityG: 80, householdMeasure: "1/4 unidade", kcal: 130 },
          { foodKey: "biscoito-arroz", name: "Biscoito de arroz", quantityG: 20, householdMeasure: "2 unidades", kcal: 80 },
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 520, items: [
          { foodKey: "salmao", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 270 },
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130 },
          { foodKey: "legumes-mix", name: "Legumes assados", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANEMIA
// ---------------------------------------------------------------------------

export const ANEMIA_MODULE: ProtocolModule = {
  id: "anemia",
  name: "Módulo Anemia",
  tagline: "Ferro heme, vitamina C e B12 — recuperação hematológica.",
  methodology: {
    title: "Metodologia Anemia — Recuperação Hematológica",
    subtitle:
      "Repor ferro heme (alta absorção), vitamina C (potencializadora), B12 e folato — afastando inibidores (cálcio, taninos) das refeições principais.",
    pillars: [
      { title: "1. Ferro heme nas 2 refeições principais", summary: "Carnes vermelhas magras, fígado, frango e peixe — absorção 25–30%.", examples: ["Patinho, alcatra magra", "Fígado bovino 1x/sem", "Frango, sardinha, atum"] },
      { title: "2. Vitamina C SEMPRE junto ao ferro", summary: "Triplica absorção do ferro não-heme; consumir na mesma refeição.", examples: ["Suco de laranja, limão", "Acerola, kiwi", "Pimentão cru, tomate"] },
      { title: "3. B12 e folato", summary: "Indispensáveis para maturação das hemácias.", examples: ["Ovos, carne, fígado (B12)", "Folhas verde-escuras (folato)", "Feijão preto, lentilha"] },
      { title: "4. Afastar inibidores", summary: "Cálcio, café, chá-preto/verde e mate reduzem absorção em até 60%.", examples: ["Leite/queijo 2h longe das refeições principais", "Café e chá só 1h depois da refeição"] },
      { title: "5. Ferro não-heme bem combinado", summary: "Feijão, lentilha, espinafre só absorvem com vitamina C.", examples: ["Feijão + suco de laranja", "Lentilha + tomate", "Espinafre + limão"] },
    ],
    behavioralRules: [
      { name: "Regra da combinação", description: "Toda refeição com ferro vem com fonte de vitamina C — sem exceção." },
      { name: "Regra do afastamento", description: "Café, chá, leite e queijo NUNCA junto com almoço/jantar — esperar 1–2h." },
      { name: "Regra do ferro animal", description: "Mínimo 5 refeições/semana com proteína animal vermelha ou fígado." },
    ],
    disclaimer:
      "Coadjuvante. Anemia ferropriva confirmada precisa de suplementação prescrita (sulfato ferroso/ferro quelado) — alimentação reforça, não substitui. Reavaliar hemograma e ferritina em 60 dias.",
  },
  phases: [
    {
      id: 1, name: "Fase 1 — Reposição Intensiva (8 semanas)", durationWeeks: 8,
      description: "Ferro heme em quase todas refeições; vitamina C combinada; inibidores afastados.",
      dailyKcalTarget: 2000, macros: { protein: 30, carb: 45, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 8,
        teaRoutine: ["Chá de hortelã 16h (livre de tanino)", "NÃO usar chá-preto, mate, chá-verde junto às refeições"],
        strategies: ["Fígado 1x/semana", "Suco de laranja com almoço", "Café/leite só 2h depois", "Suplementação prescrita"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 430, items: [
          { foodKey: "ovo", name: "Ovos mexidos (B12)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234, substitutions: [
            { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 60, householdMeasure: "2 fatias", kcal: 145 },
          ]},
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140, substitutions: [
            { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos", kcal: 145 },
          ]},
          { foodKey: "laranja", name: "Suco de laranja natural (vit C)", quantityG: 200, householdMeasure: "1 copo", kcal: 90, substitutions: [
            { foodKey: "acerola", name: "Suco de acerola", quantityG: 200, householdMeasure: "1 copo", kcal: 60 },
            { foodKey: "kiwi", name: "Kiwi", quantityG: 150, householdMeasure: "2 unidades", kcal: 90 },
          ]},
        ]},
        { id: "lanche-m", name: "Lanche da Manhã (10h)", time: "10:00", totalKcal: 180, items: [
          { foodKey: "frango-desfiado", name: "Wrap de frango desfiado", quantityG: 100, householdMeasure: "1 wrap pequeno", kcal: 180, substitutions: [
            { foodKey: "atum", name: "Atum em água com pão integral", quantityG: 100, householdMeasure: "1 sanduíche", kcal: 175 },
          ]},
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 680, items: [
          { foodKey: "patinho", name: "Patinho grelhado (ferro heme)", quantityG: 150, householdMeasure: "1 bife grande", kcal: 255, substitutions: [
            { foodKey: "figado", name: "Fígado bovino acebolado (1x/sem)", quantityG: 130, householdMeasure: "1 bife", kcal: 230 },
            { foodKey: "alcatra", name: "Alcatra magra", quantityG: 150, householdMeasure: "1 bife", kcal: 255 },
          ]},
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 120, householdMeasure: "5 colheres", kcal: 150 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 100, householdMeasure: "1 concha cheia", kcal: 75, substitutions: [
            { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha cheia", kcal: 120 },
          ]},
          { foodKey: "salada-folhas", name: "Salada de espinafre + tomate + limão", quantityG: 200, householdMeasure: "1 prato", kcal: 60 },
          { foodKey: "laranja", name: "1 laranja após refeição (vit C)", quantityG: 130, householdMeasure: "1 unidade", kcal: 60 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 200, items: [
          { foodKey: "iogurte-grego", name: "Iogurte grego natural (longe das refeições com ferro)", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
          { foodKey: "morango", name: "Morangos", quantityG: 100, householdMeasure: "8 unidades", kcal: 40 },
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 560, items: [
          { foodKey: "frango-peito", name: "Peito de frango grelhado", quantityG: 150, householdMeasure: "1 filé grande", kcal: 245, substitutions: [
            { foodKey: "sardinha", name: "Sardinha grelhada", quantityG: 130, householdMeasure: "2 unidades", kcal: 270 },
            { foodKey: "atum", name: "Atum em água", quantityG: 130, householdMeasure: "1 lata", kcal: 170 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130 },
          { foodKey: "pimentao", name: "Pimentão vermelho refogado + brócolis (vit C)", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
    {
      id: 2, name: "Fase 2 — Manutenção pós-recuperação (contínua)", durationWeeks: 12,
      description: "Após hemograma normalizado: manter ferro animal 4–5x/sem + vitamina C combinada.",
      dailyKcalTarget: 2000, macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 8,
        teaRoutine: ["Chá de hortelã livre", "Café/chá só 1h depois das refeições"],
        strategies: ["Carne vermelha 3x/sem", "Fígado 1x/mês", "Reavaliar ferritina a cada 3 meses"],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 420, items: [
          { foodKey: "ovo", name: "Ovos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156 },
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
          { foodKey: "laranja", name: "Suco de laranja", quantityG: 200, householdMeasure: "1 copo", kcal: 90 },
        ]},
        { id: "almoco", name: "Almoço (13h)", time: "13:00", totalKcal: 640, items: [
          { foodKey: "alcatra", name: "Alcatra grelhada", quantityG: 150, householdMeasure: "1 bife", kcal: 255 },
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 100, householdMeasure: "1 concha", kcal: 75 },
          { foodKey: "salada-folhas", name: "Espinafre + tomate + limão", quantityG: 200, householdMeasure: "1 prato", kcal: 60 },
          { foodKey: "laranja", name: "Laranja sobremesa", quantityG: 130, householdMeasure: "1 unidade", kcal: 60 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 200, items: [
          { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
          { foodKey: "kiwi", name: "Kiwi", quantityG: 75, householdMeasure: "1 unidade", kcal: 45 },
        ]},
        { id: "jantar", name: "Jantar (20h)", time: "20:00", totalKcal: 540, items: [
          { foodKey: "frango-peito", name: "Frango grelhado", quantityG: 140, householdMeasure: "1 filé", kcal: 230 },
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130 },
          { foodKey: "pimentao", name: "Pimentão + brócolis refogados", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
  ],
};
