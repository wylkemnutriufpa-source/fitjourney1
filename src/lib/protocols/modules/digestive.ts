// Módulos digestivos / intestinais — Lote 2 do roll-out de cardápios.
// Jejum Intermitente · Anticonstipação · Antiinchaço · Antiparasitário.
//
// Regras invioláveis (ver skill fitjourney-template-rules):
//   - Substituição sempre dentro do mesmo scaleGroup (proteína↔proteína etc.)
//   - Porções clínicas reais (sem exorbitância)
//   - Combinações práticas e fáceis
//   - Imagem do almoço/jantar = proteína; café/lanche = carbo base
//
// Determinístico. Sem IO. Sem IA.

import type { ProtocolModule } from "../catalog";

// ---------------------------------------------------------------------------
// JEJUM INTERMITENTE
// ---------------------------------------------------------------------------

export const JEJUM_INTERMITENTE_MODULE: ProtocolModule = {
  id: "jejum-intermitente",
  name: "Módulo Jejum Intermitente",
  tagline: "Janelas 16/8 e 14/10 — autofagia, sensibilidade à insulina e foco.",
  methodology: {
    title: "Metodologia Jejum Intermitente — Janela Inteligente",
    subtitle:
      "Concentrar a ingestão em uma janela reduzida potencializa autofagia, melhora sensibilidade à insulina e estabiliza apetite — sem restrição calórica agressiva.",
    pillars: [
      { title: "1. Janela alimentar definida", summary: "Iniciar em 12/12, evoluir para 14/10 e 16/8 conforme adaptação.", examples: ["12/12: 8h–20h", "14/10: 10h–20h", "16/8: 12h–20h"] },
      { title: "2. Quebra inteligente do jejum", summary: "Romper com proteína + gordura boa, nunca com carboidrato simples.", examples: ["Ovos + abacate", "Iogurte natural + castanhas", "Frango desfiado + azeite"] },
      { title: "3. Hidratação durante o jejum", summary: "Água, chás e café sem açúcar liberados — sustentam saciedade.", examples: ["2,5–3 L de água", "Chá verde, hibisco", "Café puro"] },
      { title: "4. Refeições densas e simples", summary: "Na janela: 2–3 refeições completas, evitando beliscar.", examples: ["Brunch + jantar", "Almoço + lanche + jantar"] },
    ],
    behavioralRules: [
      { name: "Regra da quebra proteica", description: "Primeira refeição da janela sempre tem ≥25 g de proteína." },
      { name: "Regra zero caloria no jejum", description: "Nada que tenha calorias durante o jejum — nem leite no café." },
      { name: "Regra do sono", description: "Última refeição até 3h antes de dormir para não atrapalhar autofagia." },
    ],
    disclaimer: "Contraindicado em gestantes, lactantes, transtornos alimentares ativos, diabéticos insulinodependentes sem acompanhamento médico.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Adaptação 14/10",
      durationWeeks: 2,
      description: "Janela inicial das 10h às 20h. Foco em estabilizar fome e adaptar metabolismo.",
      dailyKcalTarget: 1600,
      macros: { protein: 35, carb: 35, fat: 30 },
      recommendations: { waterMl: 2500, sleepHours: 8, teaRoutine: ["Chá verde 10h", "Hibisco 16h"], strategies: ["Café puro liberado durante jejum", "Quebrar com proteína", "Sem beliscar fora da janela"] },
      meals: [
        {
          id: "quebra_jejum", name: "Quebra de Jejum (10h)", time: "10:00", totalKcal: 420,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos no azeite", quantityG: 150, householdMeasure: "3 unidades", kcal: 240, substitutions: [
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 120, householdMeasure: "6 colheres de sopa", kcal: 200 },
              { foodKey: "atum", name: "Atum em água", quantityG: 100, householdMeasure: "1 lata pequena", kcal: 150 },
              { foodKey: "whey", name: "Whey protein isolado", quantityG: 30, householdMeasure: "1 scoop", kcal: 120 },
            ]},
            { foodKey: "abacate", name: "Abacate amassado", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 130, substitutions: [
              { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 20, householdMeasure: "4 unidades", kcal: 130 },
              { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 15, householdMeasure: "1 colher de sopa", kcal: 130 },
            ]},
            { foodKey: "pao-integral", name: "Pão integral artesanal", quantityG: 30, householdMeasure: "1 fatia", kcal: 80, substitutions: [
              { foodKey: "tapioca", name: "Tapioca fininha", quantityG: 30, householdMeasure: "1 disco pequeno", kcal: 75 },
              { foodKey: "aveia", name: "Aveia em flocos", quantityG: 25, householdMeasure: "2,5 colheres de sopa", kcal: 90 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:30", totalKcal: 600,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho moído", quantityG: 130, householdMeasure: "1 porção", kcal: 240 },
              { foodKey: "ovo", name: "Ovos mexidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres de sopa", kcal: 137, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 150, householdMeasure: "1 unidade média", kcal: 130 },
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 110, householdMeasure: "4 colheres de sopa", kcal: 135 },
              { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 90, householdMeasure: "1 pedaço médio", kcal: 130 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 65, substitutions: [
              { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 80, householdMeasure: "1 concha", kcal: 75 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 80, householdMeasure: "1 concha", kcal: 95 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "legumes", name: "Legumes refogados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80 },
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 220,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte natural integral", quantityG: 170, householdMeasure: "1 pote", kcal: 130, substitutions: [
              { foodKey: "cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
              { foodKey: "kefir", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
            ]},
            { foodKey: "castanha", name: "Castanhas mistas", quantityG: 15, householdMeasure: "1 punhado pequeno", kcal: 90, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
              { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "4 unidades", kcal: 95 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar (fecha janela)", time: "19:30", totalKcal: 480,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 posta média", kcal: 270, substitutions: [
              { foodKey: "frango-grelhado", name: "Sobrecoxa sem pele", quantityG: 130, householdMeasure: "1 unidade", kcal: 220 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 240 },
              { foodKey: "ovo", name: "Omelete com legumes", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 120, householdMeasure: "1 unidade pequena", kcal: 105, substitutions: [
              { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 200, householdMeasure: "1 xícara", kcal: 80 },
              { foodKey: "inhame", name: "Inhame cozido", quantityG: 100, householdMeasure: "1 pedaço", kcal: 100 },
            ]},
            { foodKey: "legumes", name: "Mix de legumes no azeite", quantityG: 200, householdMeasure: "2 xícaras", kcal: 105, substitutions: [
              { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90 },
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Consolidação 16/8",
      durationWeeks: 4,
      description: "Janela 12h–20h. Duas refeições principais + 1 lanche. Foco em densidade nutricional.",
      dailyKcalTarget: 1500,
      macros: { protein: 35, carb: 30, fat: 35 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Chá verde 10h", "Hibisco 17h"], strategies: ["Janela 12h–20h", "Café puro durante jejum", "Última refeição até 20h"] },
      meals: [
        {
          id: "quebra_jejum", name: "Quebra de Jejum (12h)", time: "12:00", totalKcal: 620,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "ovo", name: "Ovos mexidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 240 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 150, householdMeasure: "1 unidade média", kcal: 130, substitutions: [
              { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 137 },
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 110, householdMeasure: "4 colheres", kcal: 135 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "legumes", name: "Legumes refogados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80 },
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
            { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80, substitutions: [
              { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 10, householdMeasure: "1 colher de sobremesa", kcal: 90 },
              { foodKey: "castanha", name: "Castanhas mistas", quantityG: 15, householdMeasure: "1 punhado", kcal: 90 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:00", totalKcal: 280,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 130, substitutions: [
              { foodKey: "cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
              { foodKey: "kefir", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
            ]},
            { foodKey: "fruta-vermelha", name: "Mix de frutas vermelhas", quantityG: 100, householdMeasure: "1 xícara", kcal: 60, substitutions: [
              { foodKey: "maca", name: "Maçã", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
              { foodKey: "pera", name: "Pera", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
            ]},
            { foodKey: "castanha", name: "Castanhas mistas", quantityG: 15, householdMeasure: "1 punhado pequeno", kcal: 90, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar (fecha janela 20h)", time: "19:30", totalKcal: 600,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 150, householdMeasure: "1 posta grande", kcal: 310, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 248 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 150, householdMeasure: "1 bife", kcal: 275 },
              { foodKey: "ovo", name: "Omelete recheada", quantityG: 200, householdMeasure: "4 ovos", kcal: 312 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 120, householdMeasure: "1 unidade pequena", kcal: 105, substitutions: [
              { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 90, householdMeasure: "1 pedaço", kcal: 130 },
              { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 250, householdMeasure: "1 xícara grande", kcal: 100 },
            ]},
            { foodKey: "legumes", name: "Legumes salteados no azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 130, substitutions: [
              { foodKey: "salada-verde", name: "Salada verde robusta", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 110 },
              { foodKey: "brocolis", name: "Brócolis e couve-flor", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 90 },
            ]},
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTICONSTIPAÇÃO
// ---------------------------------------------------------------------------

export const ANTICONSTIPACAO_MODULE: ProtocolModule = {
  id: "anticonstipacao",
  name: "Módulo Anticonstipação",
  tagline: "Fibras, hidratação e probióticos — trânsito intestinal regular em 14 dias.",
  methodology: {
    title: "Metodologia Anticonstipação — Tripé Fibra+Água+Movimento",
    subtitle:
      "Constipação responde a três alavancas: fibra solúvel + insolúvel, hidratação real (35 ml/kg) e estímulos pró-cinéticos (probióticos, magnésio, atividade).",
    pillars: [
      { title: "1. Fibra estratégica 25–35 g/dia", summary: "Mix de solúvel (aveia, chia, frutas) e insolúvel (folhosos, casca de frutas).", examples: ["Aveia + chia no café", "Mamão com semente de linhaça", "Folhosos no almoço e jantar"] },
      { title: "2. Hidratação real", summary: "35 ml/kg/dia — fibra sem água piora constipação.", examples: ["Água gelada ao acordar", "Garrafa de 1L sempre à vista"] },
      { title: "3. Probióticos diários", summary: "Kefir, iogurte natural, kombucha — repovoam microbiota.", examples: ["1 copo de kefir/dia", "170g iogurte natural", "Chucrute como acompanhamento"] },
      { title: "4. Magnésio noturno", summary: "Sementes, folhosos verde-escuros e cacau favorecem peristalse.", examples: ["1 colher de chia hidratada", "Couve refogada", "Cacau 70% à noite"] },
    ],
    behavioralRules: [
      { name: "Regra da água em jejum", description: "300–500 ml de água morna logo ao acordar — estimula reflexo gastrocólico." },
      { name: "Regra da chia hidratada", description: "Deixar 1 colher de chia em 100 ml de água por 10 min antes de consumir." },
      { name: "Regra do tempo no banheiro", description: "Mesmo horário todo dia após café — treina o intestino." },
    ],
    disclaimer: "Se sangramento, dor abdominal intensa ou perda de peso, encaminhar para investigação médica antes do protocolo nutricional.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Reativação Intestinal",
      durationWeeks: 2,
      description: "Fibras crescentes + hidratação + probiótico diário. Meta: evacuar pelo menos 1x/dia.",
      dailyKcalTarget: 1700,
      macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Água morna em jejum", "Chá de sene 1x na semana se preciso"], strategies: ["Chia hidratada todo dia", "Probiótico fermentado diário", "Caminhada após refeições"] },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 420,
          items: [
            { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150, substitutions: [
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
              { foodKey: "tapioca", name: "Tapioca integral", quantityG: 60, householdMeasure: "1 disco médio", kcal: 145 },
              { foodKey: "granola", name: "Granola integral", quantityG: 40, householdMeasure: "4 colheres", kcal: 160 },
            ]},
            { foodKey: "chia", name: "Chia hidratada", quantityG: 12, householdMeasure: "1 colher de sopa", kcal: 60, substitutions: [
              { foodKey: "linhaca", name: "Linhaça moída", quantityG: 12, householdMeasure: "1 colher de sopa", kcal: 65 },
              { foodKey: "psyllium", name: "Psyllium", quantityG: 8, householdMeasure: "1 colher de sobremesa", kcal: 25 },
            ]},
            { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia grande", kcal: 80, substitutions: [
              { foodKey: "ameixa", name: "Ameixas pretas", quantityG: 60, householdMeasure: "3 unidades", kcal: 75 },
              { foodKey: "kiwi", name: "Kiwi", quantityG: 150, householdMeasure: "2 unidades", kcal: 90 },
            ]},
            { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 170, householdMeasure: "1 pote", kcal: 130, substitutions: [
              { foodKey: "kefir", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
              { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 150,
          items: [
            { foodKey: "ameixa", name: "Ameixas pretas hidratadas", quantityG: 60, householdMeasure: "3 unidades", kcal: 75, substitutions: [
              { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
              { foodKey: "pera", name: "Pera com casca", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
            ]},
            { foodKey: "castanha", name: "Castanhas", quantityG: 15, householdMeasure: "1 punhado pequeno", kcal: 90, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
              { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "4 unidades", kcal: 95 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 580,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 120, householdMeasure: "1 bife", kcal: 220 },
              { foodKey: "ovo", name: "Ovos mexidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 137, substitutions: [
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 110, householdMeasure: "4 colheres", kcal: 135 },
              { foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 150, householdMeasure: "1 média", kcal: 130 },
            ]},
            { foodKey: "feijao", name: "Feijão (rico em fibra)", quantityG: 130, householdMeasure: "1 concha cheia", kcal: 105, substitutions: [
              { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 130, householdMeasure: "1 concha", kcal: 125 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 130, householdMeasure: "1 concha", kcal: 155 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde robusta + azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 120, substitutions: [
              { foodKey: "couve", name: "Couve refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 95 },
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 200,
          items: [
            { foodKey: "kiwi", name: "Kiwi (pró-cinético)", quantityG: 150, householdMeasure: "2 unidades", kcal: 90, substitutions: [
              { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
              { foodKey: "ameixa", name: "Ameixas hidratadas", quantityG: 60, householdMeasure: "3 unidades", kcal: 75 },
            ]},
            { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 170, householdMeasure: "1 pote", kcal: 110, substitutions: [
              { foodKey: "kefir", name: "Kefir", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
              { foodKey: "cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 480,
          items: [
            { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180, substitutions: [
              { foodKey: "frango-grelhado", name: "Sobrecoxa sem pele", quantityG: 130, householdMeasure: "1 unidade", kcal: 220 },
              { foodKey: "ovo", name: "Omelete com legumes", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 150, householdMeasure: "1 média", kcal: 130, substitutions: [
              { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 200, householdMeasure: "1 xícara", kcal: 80 },
              { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 90, householdMeasure: "1 pedaço", kcal: 130 },
            ]},
            { foodKey: "couve", name: "Couve refogada no azeite", quantityG: 200, householdMeasure: "2 xícaras", kcal: 110, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
              { foodKey: "espinafre", name: "Espinafre refogado", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90 },
            ]},
            { foodKey: "linhaca", name: "Linhaça moída sobre o prato", quantityG: 10, householdMeasure: "1 colher de sobremesa", kcal: 55, substitutions: [
              { foodKey: "chia", name: "Chia hidratada", quantityG: 10, householdMeasure: "1 colher de sobremesa", kcal: 50 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Manutenção do Trânsito",
      durationWeeks: 4,
      description: "Hábito consolidado. Fibras mantidas, hidratação reforçada, kefir diário.",
      dailyKcalTarget: 1800,
      macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Água morna em jejum"], strategies: ["Kefir diário", "Caminhada 30 min", "Folhosos verde-escuros 2x/dia"] },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 450,
          items: [
            { foodKey: "aveia", name: "Mingau de aveia + canela", quantityG: 50, householdMeasure: "5 colheres de sopa", kcal: 190, substitutions: [
              { foodKey: "tapioca", name: "Tapioca com queijo", quantityG: 60, householdMeasure: "1 disco médio", kcal: 145 },
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 60, householdMeasure: "2 fatias grandes", kcal: 170 },
            ]},
            { foodKey: "chia", name: "Chia hidratada", quantityG: 12, householdMeasure: "1 colher de sopa", kcal: 60, substitutions: [
              { foodKey: "linhaca", name: "Linhaça moída", quantityG: 12, householdMeasure: "1 colher de sopa", kcal: 65 },
            ]},
            { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia grande", kcal: 80, substitutions: [
              { foodKey: "kiwi", name: "Kiwi", quantityG: 150, householdMeasure: "2 unidades", kcal: 90 },
              { foodKey: "abacaxi", name: "Abacaxi", quantityG: 150, householdMeasure: "1 fatia", kcal: 75 },
            ]},
            { foodKey: "kefir", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120, substitutions: [
              { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 170, householdMeasure: "1 pote", kcal: 110 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 620,
          items: [
            { foodKey: "patinho", name: "Patinho desfiado", quantityG: 130, householdMeasure: "1 porção", kcal: 240, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 248 },
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 120, householdMeasure: "6 colheres", kcal: 165, substitutions: [
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 130, householdMeasure: "5 colheres", kcal: 160 },
            ]},
            { foodKey: "lentilha", name: "Lentilha (alta fibra)", quantityG: 130, householdMeasure: "1 concha", kcal: 125, substitutions: [
              { foodKey: "feijao", name: "Feijão", quantityG: 130, householdMeasure: "1 concha", kcal: 105 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 130, householdMeasure: "1 concha", kcal: 155 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 120, substitutions: [
              { foodKey: "couve", name: "Couve refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 95 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 500,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 posta", kcal: 270, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 248 },
              { foodKey: "ovo", name: "Omelete com legumes", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 150, householdMeasure: "1 média", kcal: 130, substitutions: [
              { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 200, householdMeasure: "1 xícara", kcal: 80 },
            ]},
            { foodKey: "couve", name: "Couve + brócolis no azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 130, substitutions: [
              { foodKey: "espinafre", name: "Espinafre refogado", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 110 },
            ]},
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTIINCHAÇO
// ---------------------------------------------------------------------------

export const ANTIINCHACO_MODULE: ProtocolModule = {
  id: "antiinchaco",
  name: "Módulo Antiinchaço",
  tagline: "Sódio controlado, potássio e diuréticos naturais — desincha em 7 dias.",
  methodology: {
    title: "Metodologia Antiinchaço — Eixo Sódio/Potássio + Microbiota",
    subtitle:
      "Retenção e inchaço respondem a três alavancas: reduzir sódio oculto, elevar potássio (frutas/legumes) e desinflamar a microbiota com chás e probióticos.",
    pillars: [
      { title: "1. Sódio controlado", summary: "Eliminar ultraprocessados, embutidos e temperos prontos. Sal só no preparo.", examples: ["Sem cubo de caldo", "Sem embutidos", "Sem refrigerante / sucos de caixinha"] },
      { title: "2. Potássio alto", summary: "Banana, abacate, coco, melancia, batata-doce — equilibram fluido extracelular.", examples: ["1 banana/dia", "Água de coco no pós-treino", "Melancia como sobremesa"] },
      { title: "3. Diuréticos naturais", summary: "Hibisco, cavalinha, dente-de-leão e chá verde estimulam função renal.", examples: ["Chá de hibisco gelado", "Chá verde manhã/tarde"] },
      { title: "4. Anti-fermentativos pontuais", summary: "Reduzir crucíferos, leguminosas pesadas e laticínios à noite na fase aguda.", examples: ["Brócolis só no almoço", "Feijão no almoço, não no jantar"] },
    ],
    behavioralRules: [
      { name: "Regra do rótulo", description: "Se tiver mais de 400 mg de sódio por porção, fora." },
      { name: "Regra da água com limão", description: "1 copo de água morna com limão em jejum — drenagem suave." },
      { name: "Regra do jantar leve", description: "Jantar até 19h30 com proteína magra + legumes cozidos." },
    ],
    disclaimer: "Hipertensos em uso de diurético devem ajustar potássio com acompanhamento médico.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Desincha (7 dias)",
      durationWeeks: 1,
      description: "Sódio mínimo, alta hidratação, chás drenantes, fim dos ultraprocessados.",
      dailyKcalTarget: 1500,
      macros: { protein: 30, carb: 45, fat: 25 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Hibisco gelado pós-almoço", "Chá verde 10h e 16h", "Cavalinha 1x/dia"], strategies: ["Zero ultraprocessado", "Limão em jejum", "Caminhada leve 30 min"] },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 350,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos sem sal", quantityG: 100, householdMeasure: "2 unidades", kcal: 160, substitutions: [
              { foodKey: "frango-desfiado", name: "Frango desfiado caseiro", quantityG: 80, householdMeasure: "4 colheres", kcal: 100 },
              { foodKey: "whey", name: "Whey protein", quantityG: 25, householdMeasure: "1 scoop", kcal: 100 },
            ]},
            { foodKey: "tapioca", name: "Tapioca fininha", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 100, substitutions: [
              { foodKey: "aveia", name: "Aveia em flocos", quantityG: 30, householdMeasure: "3 colheres", kcal: 110 },
              { foodKey: "pao-integral", name: "Pão integral caseiro", quantityG: 40, householdMeasure: "1 fatia grossa", kcal: 110 },
            ]},
            { foodKey: "melancia", name: "Melancia (rica em potássio)", quantityG: 200, householdMeasure: "1 fatia", kcal: 60, substitutions: [
              { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
              { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 130,
          items: [
            { foodKey: "agua-coco", name: "Água de coco natural", quantityG: 200, householdMeasure: "1 copo", kcal: 40, substitutions: [
              { foodKey: "cha-hibisco", name: "Chá de hibisco gelado", quantityG: 250, householdMeasure: "1 copo", kcal: 5 },
            ]},
            { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89, substitutions: [
              { foodKey: "maca", name: "Maçã", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
              { foodKey: "pera", name: "Pera", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 540,
          items: [
            { foodKey: "peixe-grelhado", name: "Tilápia grelhada (pouco sal)", quantityG: 150, householdMeasure: "1 filé", kcal: 180, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 120, householdMeasure: "1 bife", kcal: 220 },
            ]},
            { foodKey: "arroz-branco", name: "Arroz branco (menos fermentativo)", quantityG: 100, householdMeasure: "5 colheres", kcal: 130, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 150, householdMeasure: "1 média", kcal: 130 },
              { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 90, householdMeasure: "1 pedaço", kcal: 130 },
            ]},
            { foodKey: "feijao", name: "Feijão (porção controlada)", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 65, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 80, householdMeasure: "1 concha", kcal: 75 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + limão + azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 120, substitutions: [
              { foodKey: "abobrinha", name: "Abobrinha refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
              { foodKey: "pepino", name: "Pepino com limão", quantityG: 200, householdMeasure: "1 unidade", kcal: 30 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 180,
          items: [
            { foodKey: "abacaxi", name: "Abacaxi (bromelina)", quantityG: 150, householdMeasure: "1 fatia", kcal: 75, substitutions: [
              { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
              { foodKey: "melancia", name: "Melancia", quantityG: 200, householdMeasure: "1 fatia", kcal: 60 },
            ]},
            { foodKey: "iogurte-natural", name: "Iogurte natural desnatado", quantityG: 170, householdMeasure: "1 pote", kcal: 100, substitutions: [
              { foodKey: "cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar (leve)", time: "19:30", totalKcal: 380,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé pequeno", kcal: 215, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
              { foodKey: "ovo", name: "Omelete simples", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "abobrinha", name: "Abobrinha grelhada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60, substitutions: [
              { foodKey: "berinjela", name: "Berinjela grelhada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
              { foodKey: "chuchu", name: "Chuchu cozido", quantityG: 200, householdMeasure: "2 xícaras", kcal: 50 },
            ]},
            { foodKey: "pepino", name: "Salada de pepino e tomate", quantityG: 200, householdMeasure: "1 prato", kcal: 50, substitutions: [
              { foodKey: "salada-verde", name: "Salada verde leve", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Manutenção sem inchaço",
      durationWeeks: 3,
      description: "Reintroduz crucíferos e leguminosas mantendo sódio baixo e drenantes diários.",
      dailyKcalTarget: 1700,
      macros: { protein: 30, carb: 45, fat: 25 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Hibisco gelado", "Chá verde 16h"], strategies: ["Sódio baixo permanente", "Potássio diário", "Caminhada após jantar"] },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 400,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160, substitutions: [
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres", kcal: 100 },
            ]},
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "1 disco médio", kcal: 145 },
              { foodKey: "aveia", name: "Aveia", quantityG: 40, householdMeasure: "4 colheres", kcal: 150 },
            ]},
            { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia", kcal: 80, substitutions: [
              { foodKey: "melancia", name: "Melancia", quantityG: 200, householdMeasure: "1 fatia", kcal: 60 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 580,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 240 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 137, substitutions: [
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 110, householdMeasure: "4 colheres", kcal: 135 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + limão", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 115, substitutions: [
              { foodKey: "abobrinha", name: "Abobrinha grelhada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar leve", time: "19:30", totalKcal: 420,
          items: [
            { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
              { foodKey: "ovo", name: "Omelete simples", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 200, householdMeasure: "1 xícara", kcal: 80, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 120, householdMeasure: "1 pequena", kcal: 105 },
            ]},
            { foodKey: "abobrinha", name: "Mix abobrinha + berinjela", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 80, substitutions: [
              { foodKey: "salada-verde", name: "Salada verde leve", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 115 },
            ]},
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTIPARASITÁRIO
// ---------------------------------------------------------------------------

export const ANTIPARASITARIO_MODULE: ProtocolModule = {
  id: "antiparasitario",
  name: "Módulo Antiparasitário",
  tagline: "Alimentos vermífugos naturais e suporte intestinal por 30 dias.",
  methodology: {
    title: "Metodologia Antiparasitário — Eliminar + Repovoar",
    subtitle:
      "Combina alimentos com ação vermífuga reconhecida (alho, semente de abóbora, coco, mamão verde) com repovoamento de microbiota saudável (probióticos, prebióticos).",
    pillars: [
      { title: "1. Vermífugos alimentares", summary: "Semente de abóbora, alho cru, coco e mamão atuam sobre parasitas comuns.", examples: ["1 colher de semente de abóbora em jejum", "1 dente de alho cru no almoço", "30 g de coco fresco"] },
      { title: "2. Acidificação intestinal", summary: "Vinagre de maçã, limão e kombucha criam ambiente desfavorável aos parasitas.", examples: ["1 colher de vinagre de maçã antes do almoço", "Limão na água"] },
      { title: "3. Repovoamento microbiano", summary: "Probióticos e prebióticos sustentam barreira intestinal após eliminação.", examples: ["Kefir diário", "Iogurte natural", "Banana verde, alho-poró"] },
      { title: "4. Anti-açúcar estrito", summary: "Parasitas se alimentam de açúcar — corte total na fase 1.", examples: ["Sem açúcar refinado", "Sem mel", "Sem suco de fruta concentrado"] },
    ],
    behavioralRules: [
      { name: "Regra das sementes em jejum", description: "1 colher de sopa de semente de abóbora crua + 1 copo de água em jejum, por 14 dias." },
      { name: "Regra do alho cru", description: "1 dente de alho amassado, descansado por 10 min, adicionado cru no almoço." },
      { name: "Regra zero açúcar", description: "Sem nenhuma fonte de açúcar refinado nos primeiros 14 dias." },
    ],
    disclaimer: "Protocolo nutricional adjuvante. Confirmação parasitológica e tratamento medicamentoso, quando indicados, são responsabilidade médica.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Eliminação (14 dias)",
      durationWeeks: 2,
      description: "Vermífugos alimentares diários + zero açúcar + acidificação.",
      dailyKcalTarget: 1600,
      macros: { protein: 30, carb: 40, fat: 30 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Chá de cravo + canela 1x/dia", "Chá de hortelã pós-refeição"], strategies: ["Sementes de abóbora em jejum", "Alho cru no almoço", "Zero açúcar"] },
      meals: [
        {
          id: "jejum", name: "Em jejum", time: "06:30", totalKcal: 80,
          items: [
            { foodKey: "semente-abobora", name: "Sementes de abóbora cruas", quantityG: 15, householdMeasure: "1 colher de sopa", kcal: 80, substitutions: [
              { foodKey: "semente-girassol", name: "Sementes de girassol", quantityG: 15, householdMeasure: "1 colher de sopa", kcal: 85 },
            ]},
          ],
        },
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 360,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160, substitutions: [
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres", kcal: 100 },
            ]},
            { foodKey: "tapioca", name: "Tapioca com coco fresco", quantityG: 50, householdMeasure: "1 disco médio", kcal: 130, substitutions: [
              { foodKey: "aveia", name: "Aveia em flocos", quantityG: 35, householdMeasure: "3,5 colheres", kcal: 130 },
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
            ]},
            { foodKey: "coco-fresco", name: "Coco fresco", quantityG: 30, householdMeasure: "2 colheres", kcal: 105, substitutions: [
              { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80 },
              { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 15, householdMeasure: "3 unidades", kcal: 100 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 130,
          items: [
            { foodKey: "mamao-verde", name: "Mamão papaia (sementes opcionais)", quantityG: 200, householdMeasure: "1 fatia", kcal: 80, substitutions: [
              { foodKey: "abacaxi", name: "Abacaxi", quantityG: 150, householdMeasure: "1 fatia", kcal: 75 },
            ]},
            { foodKey: "castanha", name: "Castanhas-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço (com alho cru)", time: "13:00", totalKcal: 560,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado com alho cru", quantityG: 150, householdMeasure: "1 filé", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia com alho", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 240 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 137, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 média", kcal: 130 },
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 110, householdMeasure: "4 colheres", kcal: 135 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 65, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 80, householdMeasure: "1 concha", kcal: 75 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + vinagre de maçã", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 110, substitutions: [
              { foodKey: "couve", name: "Couve refogada com alho", quantityG: 200, householdMeasure: "2 xícaras", kcal: 95 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 180,
          items: [
            { foodKey: "kefir", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120, substitutions: [
              { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 170, householdMeasure: "1 pote", kcal: 110 },
            ]},
            { foodKey: "maca", name: "Maçã com casca", quantityG: 150, householdMeasure: "1 unidade", kcal: 80, substitutions: [
              { foodKey: "pera", name: "Pera com casca", quantityG: 150, householdMeasure: "1 unidade", kcal: 85 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 460,
          items: [
            { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
              { foodKey: "ovo", name: "Omelete com cúrcuma", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 150, householdMeasure: "1 média", kcal: 130, substitutions: [
              { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 200, householdMeasure: "1 xícara", kcal: 80 },
            ]},
            { foodKey: "brocolis", name: "Brócolis no vapor + alho", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70, substitutions: [
              { foodKey: "couve", name: "Couve refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 95 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Repovoamento (14 dias)",
      durationWeeks: 2,
      description: "Reintroduz fontes prebióticas + probióticos diários. Mantém alho e coco. Açúcar continua restrito.",
      dailyKcalTarget: 1700,
      macros: { protein: 28, carb: 45, fat: 27 },
      recommendations: { waterMl: 3000, sleepHours: 8, teaRoutine: ["Hortelã pós-refeição", "Chá verde 16h"], strategies: ["Kefir + iogurte diários", "Banana verde / alho-poró", "Açúcar mantém restrito"] },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 420,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160, substitutions: [
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres", kcal: 100 },
            ]},
            { foodKey: "aveia", name: "Aveia com banana verde amassada", quantityG: 40, householdMeasure: "4 colheres", kcal: 150, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "1 disco médio", kcal: 145 },
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
            ]},
            { foodKey: "kefir", name: "Kefir natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120, substitutions: [
              { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 170, householdMeasure: "1 pote", kcal: 110 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 600,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado com alho", quantityG: 150, householdMeasure: "1 filé", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 posta", kcal: 270 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 240 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 137, substitutions: [
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 110, householdMeasure: "4 colheres", kcal: 135 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde + azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 120, substitutions: [
              { foodKey: "couve", name: "Couve refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 95 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 480,
          items: [
            { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
              { foodKey: "ovo", name: "Omelete recheada", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 150, householdMeasure: "1 média", kcal: 130, substitutions: [
              { foodKey: "abobora", name: "Abóbora cabotiá", quantityG: 200, householdMeasure: "1 xícara", kcal: 80 },
            ]},
            { foodKey: "brocolis", name: "Brócolis + couve no azeite", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 110, substitutions: [
              { foodKey: "salada-verde", name: "Salada verde robusta", quantityG: 250, householdMeasure: "2,5 xícaras", kcal: 115 },
            ]},
          ],
        },
      ],
    },
  ],
};
