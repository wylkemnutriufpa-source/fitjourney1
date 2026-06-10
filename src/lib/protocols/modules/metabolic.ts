// Módulos metabólicos — Lote 1 do roll-out de cardápios.
// Low Carb · Ciclo de Carboidratos · Resistência à Insulina · SOP.
//
// Regras invioláveis (ver skill fitjourney-template-rules):
//   - Substituição sempre dentro do mesmo scaleGroup (proteína↔proteína etc.)
//   - Porções clínicas reais (sem exorbitância)
//   - Combinações práticas e fáceis (café = carbo base + recheio simples)
//   - Imagem do almoço/jantar = proteína; imagem do café/lanche = carbo base
//
// Determinístico. Sem IO. Sem IA.

import type { ProtocolModule } from "../catalog";

// ---------------------------------------------------------------------------
// LOW CARB
// ---------------------------------------------------------------------------

export const LOW_CARB_MODULE: ProtocolModule = {
  id: "low-carb",
  name: "Módulo Low Carb",
  tagline: "Redução estratégica de carboidratos — saciedade e perda de gordura.",
  methodology: {
    title: "Metodologia Low Carb — Saciedade Bioquímica",
    subtitle:
      "Reduzir carboidratos simples e priorizar proteína + gordura boa para estabilizar glicemia, baixar insulina e aumentar saciedade.",
    pillars: [
      { title: "1. Carboidrato de qualidade", summary: "60–100 g/dia, preferindo raízes, frutas e folhosos.", examples: ["Batata-doce, mandioca, inhame", "Frutas vermelhas, maçã, pera", "Folhosos à vontade"] },
      { title: "2. Proteína em todas as refeições", summary: "20–35 g por refeição garante saciedade e preserva massa magra.", examples: ["Ovos, frango, peixe, carne magra", "Whey, iogurte natural, queijos magros"] },
      { title: "3. Gordura boa como combustível", summary: "Azeite, abacate e oleaginosas saciam e estabilizam glicemia.", examples: ["1 colher de azeite por refeição", "½ abacate ou 20 g de castanhas/dia"] },
      { title: "4. Zero ultraprocessado", summary: "Pães industrializados, refrigerantes, biscoitos e doces ficam fora.", examples: ["Substituir por pão integral artesanal ou tapioca", "Trocar refrigerante por água com limão"] },
    ],
    behavioralRules: [
      { name: "Regra dos 100g", description: "Não ultrapassar 100 g de carboidrato líquido por dia na Fase 1." },
      { name: "Regra da proteína primeiro", description: "Sempre começar a refeição pela proteína — reduz pico glicêmico." },
      { name: "Regra do prato pintado", description: "Metade do prato deve ser de folhosos e legumes não-amiláceos." },
    ],
    disclaimer: "Protocolo contraindicado em gestantes, lactantes e quadros renais avançados sem acompanhamento médico.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Indução (60 g de carbo/dia)",
      durationWeeks: 2,
      description: "Redução agressiva para destravar a queima de gordura. Foco em proteína, gordura boa e folhosos.",
      dailyKcalTarget: 1500,
      macros: { protein: 35, carb: 20, fat: 45 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 320,
          items: [
            {
              foodKey: "ovo", name: "Ovos mexidos no azeite", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "ovo-poche", name: "Ovos pochê", quantityG: 100, householdMeasure: "2 unidades", kcal: 155 },
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 100 },
                { foodKey: "atum", name: "Atum em água", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 90 },
              ],
            },
            {
              foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 40, householdMeasure: "1 fatia média", kcal: 100,
              substitutions: [
                { foodKey: "ricota", name: "Ricota fresca", quantityG: 50, householdMeasure: "1 fatia", kcal: 90 },
                { foodKey: "cottage", name: "Queijo cottage", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 90 },
              ],
            },
            {
              foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80,
              substitutions: [
                { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 15, householdMeasure: "3 unidades", kcal: 100 },
                { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 8, householdMeasure: "1 colher de chá", kcal: 70 },
              ],
            },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 150,
          items: [
            {
              foodKey: "iogurte-grego", name: "Iogurte natural integral", quantityG: 120, householdMeasure: "1 pote pequeno", kcal: 90,
              substitutions: [
                { foodKey: "iogurte-zero", name: "Iogurte natural zero", quantityG: 170, householdMeasure: "1 copo", kcal: 70 },
                { foodKey: "kefir", name: "Kefir natural", quantityG: 150, householdMeasure: "1 copo", kcal: 90 },
              ],
            },
            {
              foodKey: "castanha", name: "Mix de castanhas", quantityG: 15, householdMeasure: "1 punhado pequeno", kcal: 90,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
                { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80 },
              ],
            },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 480,
          items: [
            {
              foodKey: "frango-grelhado", name: "Filé de frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240,
              substitutions: [
                { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
                { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 160, householdMeasure: "1 filé", kcal: 200 },
                { foodKey: "ovo", name: "Ovos mexidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 240 },
              ],
            },
            {
              foodKey: "salada-verde", name: "Salada verde com pepino e tomate", quantityG: 150, householdMeasure: "1 prato de sobremesa", kcal: 40,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 120, householdMeasure: "1 escumadeira", kcal: 40 },
                { foodKey: "abobrinha-cozida", name: "Abobrinha refogada", quantityG: 120, householdMeasure: "1 escumadeira", kcal: 35 },
              ],
            },
            {
              foodKey: "azeite", name: "Azeite extravirgem", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 95 },
              ],
            },
            {
              foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 80, householdMeasure: "1 unidade pequena", kcal: 90,
              substitutions: [
                { foodKey: "mandioca-cozida", name: "Mandioca cozida", quantityG: 70, householdMeasure: "1 pedaço pequeno", kcal: 90 },
                { foodKey: "inhame-cozido", name: "Inhame cozido", quantityG: 70, householdMeasure: "1 pedaço pequeno", kcal: 90 },
              ],
            },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "16:00",
          totalKcal: 180,
          items: [
            {
              foodKey: "whey", name: "Whey protein", quantityG: 30, householdMeasure: "1 scoop", kcal: 120,
              substitutions: [
                { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 150, householdMeasure: "1 pote", kcal: 130 },
                { foodKey: "ovo", name: "Ovos cozidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 155 },
              ],
            },
            {
              foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60,
              substitutions: [
                { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65 },
              ],
            },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 380,
          items: [
            {
              foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 230,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
                { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "1 omelete", kcal: 240 },
              ],
            },
            {
              foodKey: "brocolis", name: "Brócolis no vapor com azeite", quantityG: 150, householdMeasure: "1 prato fundo", kcal: 60,
              substitutions: [
                { foodKey: "salada-verde", name: "Salada verde mista", quantityG: 150, householdMeasure: "1 prato de sobremesa", kcal: 40 },
                { foodKey: "abobrinha-cozida", name: "Abobrinha grelhada", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 45 },
              ],
            },
            {
              foodKey: "azeite", name: "Azeite extravirgem", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 95 },
              ],
            },
          ],
        },
      ],
      recommendations: {
        waterMl: 2500,
        sleepHours: 8,
        teaRoutine: ["Chá verde após o almoço", "Chá de hibisco à tarde"],
        strategies: ["Máximo 60 g de carbo/dia", "Proteína em todas as refeições", "Sem açúcar, sem farinha branca", "Folhosos à vontade"],
      },
    },
    {
      id: 2,
      name: "Fase 2 — Adaptação (100 g de carbo/dia)",
      durationWeeks: 4,
      description: "Reintrodução estratégica de carboidratos complexos para sustentar treino e qualidade de vida.",
      dailyKcalTarget: 1700,
      macros: { protein: 30, carb: 30, fat: 40 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 380,
          items: [
            {
              foodKey: "tapioca", name: "Tapioca fina", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 120,
              substitutions: [
                { foodKey: "pao", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 130 },
                { foodKey: "aveia", name: "Aveia em flocos", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 115 },
              ],
            },
            {
              foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 60, householdMeasure: "2 fatias", kcal: 150 },
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
              ],
            },
            {
              foodKey: "abacate", name: "Abacate", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 95,
              substitutions: [
                { foodKey: "azeite", name: "Azeite no preparo", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90 },
              ],
            },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 150,
          items: [
            {
              foodKey: "maca", name: "Maçã", quantityG: 130, householdMeasure: "1 unidade", kcal: 70,
              substitutions: [
                { foodKey: "pera", name: "Pera", quantityG: 130, householdMeasure: "1 unidade", kcal: 70 },
                { foodKey: "banana", name: "Banana", quantityG: 80, householdMeasure: "1 unidade pequena", kcal: 70 },
              ],
            },
            {
              foodKey: "castanha", name: "Castanha-do-pará", quantityG: 12, householdMeasure: "2 unidades", kcal: 80,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 12, householdMeasure: "8 unidades", kcal: 75 },
              ],
            },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 550,
          items: [
            {
              foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240,
              substitutions: [
                { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 160, householdMeasure: "1 filé", kcal: 200 },
              ],
            },
            {
              foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 95,
              substitutions: [
                { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 100 },
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 100, householdMeasure: "1 unidade pequena", kcal: 110 },
              ],
            },
            {
              foodKey: "feijao", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 80,
              substitutions: [
                { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 90 },
                { foodKey: "grao-de-bico", name: "Grão-de-bico cozido", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 100 },
              ],
            },
            {
              foodKey: "salada-verde", name: "Salada verde com azeite", quantityG: 150, householdMeasure: "1 prato de sobremesa", kcal: 90,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 150, householdMeasure: "1 escumadeira cheia", kcal: 70 },
                { foodKey: "legumes", name: "Mix de legumes refogados", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 85 },
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
              foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 150, householdMeasure: "1 pote", kcal: 130,
              substitutions: [
                { foodKey: "whey", name: "Whey protein com água", quantityG: 30, householdMeasure: "1 scoop", kcal: 120 },
              ],
            },
            {
              foodKey: "aveia", name: "Aveia em flocos", quantityG: 20, householdMeasure: "2 colheres de sopa", kcal: 75,
              substitutions: [
                { foodKey: "granola-light", name: "Granola sem açúcar", quantityG: 20, householdMeasure: "2 colheres de sopa", kcal: 80 },
              ],
            },
            {
              foodKey: "maca", name: "Maçã picada", quantityG: 80, householdMeasure: "½ unidade", kcal: 45,
              substitutions: [
                { foodKey: "morango", name: "Morangos", quantityG: 100, householdMeasure: "6 unidades", kcal: 35 },
              ],
            },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 400,
          items: [
            {
              foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 200,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ],
            },
            {
              foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 100, householdMeasure: "1 unidade pequena", kcal: 110,
              substitutions: [
                { foodKey: "mandioca-cozida", name: "Mandioca cozida", quantityG: 90, householdMeasure: "1 pedaço pequeno", kcal: 110 },
                { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 95 },
              ],
            },
            {
              foodKey: "legumes", name: "Legumes assados (abobrinha + cenoura)", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 90,
              substitutions: [
                { foodKey: "salada-verde", name: "Salada verde com azeite", quantityG: 150, householdMeasure: "1 prato de sobremesa", kcal: 90 },
              ],
            },
          ],
        },
      ],
      recommendations: {
        waterMl: 2500,
        sleepHours: 8,
        teaRoutine: ["Chá verde após o almoço"],
        strategies: ["Até 100 g de carbo/dia priorizando complexos", "Carbo concentrado no pós-treino", "Manter proteína em todas as refeições"],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// CICLO DE CARBOIDRATOS
// ---------------------------------------------------------------------------

export const CICLO_CARBO_MODULE: ProtocolModule = {
  id: "ciclo-carbo",
  name: "Módulo Ciclo de Carboidratos",
  tagline: "Dias high/low/no carb — performance e composição corporal.",
  methodology: {
    title: "Metodologia Ciclo de Carboidratos — Performance Estratégica",
    subtitle:
      "Alternar dias de alta, baixa e nenhuma ingestão de carboidrato conforme demanda do treino, otimizando performance e queima de gordura.",
    pillars: [
      { title: "1. High carb sincroniza com treino pesado", summary: "Dias de força/HIIT recebem 4–5 g de carbo/kg.", examples: ["Arroz, batata-doce, banana", "Concentrar carbo em pré/pós-treino"] },
      { title: "2. Low carb em dias leves", summary: "Cardio leve ou descanso ativo recebe 1,5–2 g de carbo/kg.", examples: ["Folhosos, frutas vermelhas", "Proteína e gordura como base"] },
      { title: "3. No carb em descanso total", summary: "Dias de off completo: <50 g de carbo total, base proteína + gordura.", examples: ["Ovos, frango, peixe, abacate, azeite"] },
      { title: "4. Proteína constante", summary: "1,8–2,2 g/kg de proteína em todos os dias, sem oscilar.", examples: ["Frango, peixe, carne magra, ovos, whey"] },
    ],
    behavioralRules: [
      { name: "Regra do timing", description: "Carbo do dia high concentrado em pré e pós-treino (2h antes e 1h depois)." },
      { name: "Regra dos 50g", description: "Dia no carb não passa de 50 g de carboidrato líquido total." },
      { name: "Regra da água", description: "Em dias low/no carb, aumentar água em +500 ml para compensar perda de glicogênio." },
    ],
  },
  phases: [
    {
      id: 1,
      name: "Dia High Carb (treino pesado)",
      durationWeeks: 1,
      description: "5 g de carbo/kg, concentrado em pré e pós-treino. Para dias de força, HIIT ou treino longo.",
      dailyKcalTarget: 2200,
      macros: { protein: 30, carb: 50, fat: 20 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:00",
          totalKcal: 480,
          items: [
            { foodKey: "aveia", name: "Aveia em flocos", quantityG: 60, householdMeasure: "6 colheres de sopa", kcal: 230,
              substitutions: [
                { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "1 disco médio", kcal: 170 },
                { foodKey: "pao", name: "Pão integral", quantityG: 60, householdMeasure: "2 fatias", kcal: 160 },
              ] },
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 60, householdMeasure: "2 fatias", kcal: 150 },
              ] },
            { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 90,
              substitutions: [
                { foodKey: "maca", name: "Maçã", quantityG: 130, householdMeasure: "1 unidade", kcal: 70 },
                { foodKey: "mamao", name: "Mamão", quantityG: 150, householdMeasure: "1 fatia média", kcal: 60 },
              ] },
          ],
        },
        {
          id: "pre_treino",
          name: "Pré-Treino",
          time: "10:00",
          totalKcal: 280,
          items: [
            { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 90,
              substitutions: [
                { foodKey: "tapioca", name: "Tapioca", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 120 },
              ] },
            { foodKey: "pao", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 130,
              substitutions: [
                { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150 },
              ] },
            { foodKey: "whey", name: "Whey protein", quantityG: 15, householdMeasure: "½ scoop", kcal: 60,
              substitutions: [
                { foodKey: "ovo", name: "Ovo cozido", quantityG: 50, householdMeasure: "1 unidade", kcal: 80 },
              ] },
          ],
        },
        {
          id: "almoco",
          name: "Almoço (pós-treino)",
          time: "13:00",
          totalKcal: 700,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 180, householdMeasure: "1 filé grande", kcal: 290,
              substitutions: [
                { foodKey: "patinho", name: "Patinho grelhado", quantityG: 150, householdMeasure: "1 bife grande", kcal: 250 },
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 180, householdMeasure: "1 filé grande", kcal: 230 },
              ] },
            { foodKey: "arroz-branco", name: "Arroz branco", quantityG: 150, householdMeasure: "6 colheres de sopa", kcal: 195,
              substitutions: [
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 200, householdMeasure: "1 unidade média", kcal: 220 },
                { foodKey: "macarrao", name: "Macarrão integral", quantityG: 80, householdMeasure: "2 conchas", kcal: 280 },
              ] },
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha média", kcal: 100,
              substitutions: [
                { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 100, householdMeasure: "1 concha", kcal: 115 },
              ] },
            { foodKey: "salada-verde", name: "Salada verde", quantityG: 100, householdMeasure: "1 prato sobremesa", kcal: 30,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 120, householdMeasure: "1 escumadeira", kcal: 40 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80 },
              ] },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "17:00",
          totalKcal: 280,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 150, householdMeasure: "1 pote", kcal: 130,
              substitutions: [
                { foodKey: "whey", name: "Whey com água", quantityG: 30, householdMeasure: "1 scoop", kcal: 120 },
              ] },
            { foodKey: "aveia", name: "Aveia em flocos", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 115,
              substitutions: [
                { foodKey: "granola-light", name: "Granola sem açúcar", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 120 },
              ] },
            { foodKey: "banana", name: "Banana", quantityG: 50, householdMeasure: "½ unidade", kcal: 45,
              substitutions: [
                { foodKey: "maca", name: "Maçã", quantityG: 80, householdMeasure: "½ unidade", kcal: 45 },
              ] },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:30",
          totalKcal: 460,
          items: [
            { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 200,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ] },
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 150, householdMeasure: "1 unidade média", kcal: 165,
              substitutions: [
                { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 120, householdMeasure: "5 colheres de sopa", kcal: 145 },
                { foodKey: "mandioca-cozida", name: "Mandioca cozida", quantityG: 130, householdMeasure: "1 pedaço médio", kcal: 160 },
              ] },
            { foodKey: "legumes", name: "Legumes assados", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 95,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 150, householdMeasure: "1 escumadeira cheia", kcal: 60 },
              ] },
          ],
        },
      ],
      recommendations: {
        waterMl: 3000,
        sleepHours: 8,
        teaRoutine: ["Café preto pré-treino se desejar"],
        strategies: ["Carbo em todas as refeições", "Pré e pós-treino com janela de 2h", "Hidratação reforçada por glicogênio"],
      },
    },
    {
      id: 2,
      name: "Dia Low Carb (treino leve ou descanso)",
      durationWeeks: 1,
      description: "1,5 g de carbo/kg. Base em proteína e gordura boa; carbo só em uma refeição.",
      dailyKcalTarget: 1700,
      macros: { protein: 35, carb: 25, fat: 40 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 330,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos no azeite", quantityG: 150, householdMeasure: "3 unidades", kcal: 240,
              substitutions: [
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 100, householdMeasure: "5 colheres de sopa", kcal: 165 },
              ] },
            { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80,
              substitutions: [
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 40, householdMeasure: "1 fatia", kcal: 100 },
              ] },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 140,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte natural integral", quantityG: 100, householdMeasure: "1 pote pequeno", kcal: 80,
              substitutions: [
                { foodKey: "kefir", name: "Kefir natural", quantityG: 150, householdMeasure: "1 copo", kcal: 90 },
              ] },
            { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60 },
              ] },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 520,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240,
              substitutions: [
                { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 160, householdMeasure: "1 filé", kcal: 200 },
              ] },
            { foodKey: "arroz-integral", name: "Arroz integral (porção pequena)", quantityG: 60, householdMeasure: "2 colheres de sopa", kcal: 75,
              substitutions: [
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 70, householdMeasure: "1 unidade pequena", kcal: 80 },
              ] },
            { foodKey: "salada-verde", name: "Salada verde grande", quantityG: 200, householdMeasure: "1 prato grande", kcal: 60,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 180, householdMeasure: "1 escumadeira cheia", kcal: 60 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 12, householdMeasure: "1 colher de sopa cheia", kcal: 110,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 95 },
              ] },
            { foodKey: "ovo", name: "Ovo cozido extra", quantityG: 50, householdMeasure: "1 unidade", kcal: 80,
              substitutions: [
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 30, householdMeasure: "1 fatia pequena", kcal: 75 },
              ] },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "16:30",
          totalKcal: 200,
          items: [
            { foodKey: "whey", name: "Whey com água", quantityG: 30, householdMeasure: "1 scoop", kcal: 120,
              substitutions: [
                { foodKey: "ovo", name: "Ovos cozidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160 },
              ] },
            { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80 },
              ] },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 380,
          items: [
            { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 160, householdMeasure: "1 filé", kcal: 220,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ] },
            { foodKey: "legumes", name: "Legumes refogados", quantityG: 200, householdMeasure: "1 escumadeira cheia", kcal: 90,
              substitutions: [
                { foodKey: "salada-verde", name: "Salada verde com azeite", quantityG: 200, householdMeasure: "1 prato grande", kcal: 90 },
                { foodKey: "brocolis", name: "Brócolis", quantityG: 180, householdMeasure: "1 escumadeira", kcal: 60 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 8, householdMeasure: "1 colher de chá cheia", kcal: 70,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80 },
              ] },
            ],
        },
      ],
      recommendations: {
        waterMl: 3000,
        sleepHours: 8,
        teaRoutine: ["Chá verde após almoço", "Chá de hibisco à tarde"],
        strategies: ["Carbo apenas no almoço", "Proteína em todas as refeições", "Reforçar gordura boa para saciedade"],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// RESISTÊNCIA À INSULINA
// ---------------------------------------------------------------------------

export const RESISTENCIA_INSULINA_MODULE: ProtocolModule = {
  id: "resistencia-insulina",
  name: "Módulo Resistência à Insulina",
  tagline: "Baixo índice glicêmico, cromo e fracionamento estratégico.",
  methodology: {
    title: "Metodologia Resistência à Insulina — Restaurar Sensibilidade",
    subtitle:
      "Reduzir picos glicêmicos, restaurar sensibilidade celular à insulina e baixar HOMA-IR através de baixo IG, fibras e timing alimentar.",
    pillars: [
      { title: "1. Baixo índice glicêmico", summary: "Carboidratos sempre complexos, integrais e acompanhados de fibras/proteína.", examples: ["Arroz integral, quinoa, aveia", "Batata-doce, mandioca", "Frutas com casca + proteína"] },
      { title: "2. Proteína primeiro", summary: "Começar a refeição pela proteína atenua o pico glicêmico em até 40%.", examples: ["Ovo, frango, peixe, whey antes do carbo"] },
      { title: "3. Vinagre e canela", summary: "Reduzem resposta glicêmica pós-prandial.", examples: ["1 colher de vinagre antes do almoço", "Canela na aveia e iogurte"] },
      { title: "4. Caminhada pós-refeição", summary: "10–15 min de caminhada após comer puxam glicose para o músculo.", examples: ["Substitui medicação leve em muitos casos"] },
    ],
    behavioralRules: [
      { name: "Regra do trio", description: "Toda refeição deve ter proteína + fibra + gordura boa." },
      { name: "Regra dos 15 min", description: "Caminhar 15 minutos após almoço e jantar." },
      { name: "Regra do sem doce sozinho", description: "Nunca consumir doce ou fruta isolada — sempre com proteína ou gordura." },
    ],
    disclaimer: "Não substitui metformina ou outros medicamentos prescritos. Acompanhamento médico obrigatório.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Estabilização Glicêmica",
      durationWeeks: 4,
      description: "Reduzir picos glicêmicos com baixo IG, fracionamento e combinações inteligentes.",
      dailyKcalTarget: 1600,
      macros: { protein: 30, carb: 40, fat: 30 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 360,
          items: [
            { foodKey: "aveia", name: "Aveia em flocos com canela", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 115,
              substitutions: [
                { foodKey: "tapioca", name: "Tapioca fina", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 120 },
                { foodKey: "pao", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 130 },
              ] },
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 60, householdMeasure: "2 fatias", kcal: 150 },
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
              ] },
            { foodKey: "morango", name: "Morangos", quantityG: 100, householdMeasure: "6 unidades", kcal: 35,
              substitutions: [
                { foodKey: "maca", name: "Maçã", quantityG: 80, householdMeasure: "½ unidade", kcal: 45 },
                { foodKey: "pera", name: "Pera", quantityG: 80, householdMeasure: "½ unidade", kcal: 45 },
              ] },
            { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 8, householdMeasure: "1 unidade", kcal: 55,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60 },
              ] },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 150,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte natural integral", quantityG: 130, householdMeasure: "1 pote pequeno", kcal: 100,
              substitutions: [
                { foodKey: "kefir", name: "Kefir natural", quantityG: 150, householdMeasure: "1 copo", kcal: 90 },
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 40, householdMeasure: "1 fatia", kcal: 100 },
              ] },
            { foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60,
              substitutions: [
                { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65 },
              ] },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 500,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240,
              substitutions: [
                { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 160, householdMeasure: "1 filé", kcal: 200 },
              ] },
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 95,
              substitutions: [
                { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 100 },
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 100, householdMeasure: "1 unidade pequena", kcal: 110 },
              ] },
            { foodKey: "feijao", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 80,
              substitutions: [
                { foodKey: "lentilha", name: "Lentilha", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 90 },
                { foodKey: "grao-de-bico", name: "Grão-de-bico", quantityG: 80, householdMeasure: "1 concha pequena", kcal: 100 },
              ] },
            { foodKey: "salada-verde", name: "Salada verde + vinagre", quantityG: 150, householdMeasure: "1 prato de sobremesa", kcal: 50,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 130, householdMeasure: "1 escumadeira", kcal: 45 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 5, householdMeasure: "1 colher de chá", kcal: 45,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 30, householdMeasure: "1 colher de sopa", kcal: 50 },
              ] },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "16:30",
          totalKcal: 220,
          items: [
            { foodKey: "maca", name: "Maçã com casca", quantityG: 130, householdMeasure: "1 unidade", kcal: 70,
              substitutions: [
                { foodKey: "pera", name: "Pera", quantityG: 130, householdMeasure: "1 unidade", kcal: 70 },
              ] },
            { foodKey: "whey", name: "Whey protein", quantityG: 30, householdMeasure: "1 scoop", kcal: 120,
              substitutions: [
                { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 150, householdMeasure: "1 pote", kcal: 130 },
                { foodKey: "ovo", name: "Ovos cozidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160 },
              ] },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 370,
          items: [
            { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 200,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ] },
            { foodKey: "legumes", name: "Legumes refogados (abobrinha + cenoura)", quantityG: 180, householdMeasure: "1 escumadeira cheia", kcal: 110,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 180, householdMeasure: "1 escumadeira", kcal: 70 },
                { foodKey: "salada-verde", name: "Salada verde com azeite", quantityG: 180, householdMeasure: "1 prato", kcal: 100 },
              ] },
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 80, householdMeasure: "1 unidade pequena", kcal: 90,
              substitutions: [
                { foodKey: "mandioca-cozida", name: "Mandioca cozida", quantityG: 70, householdMeasure: "1 pedaço pequeno", kcal: 90 },
              ] },
          ],
        },
      ],
      recommendations: {
        waterMl: 2500,
        sleepHours: 8,
        teaRoutine: ["Chá de canela em pau após almoço", "Chá verde à tarde"],
        strategies: ["Proteína primeiro em toda refeição", "Caminhar 15 min pós-almoço e pós-jantar", "1 colher de vinagre antes do almoço", "Canela na aveia e iogurte"],
      },
    },
    {
      id: 2,
      name: "Fase 2 — Manutenção da Sensibilidade",
      durationWeeks: 8,
      description: "Manutenção com flexibilidade controlada. Carbos complexos mantidos, proteína estável.",
      dailyKcalTarget: 1750,
      macros: { protein: 28, carb: 42, fat: 30 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 390,
          items: [
            { foodKey: "pao", name: "Pão integral", quantityG: 60, householdMeasure: "2 fatias", kcal: 160,
              substitutions: [
                { foodKey: "tapioca", name: "Tapioca", quantityG: 50, householdMeasure: "1 disco médio", kcal: 150 },
                { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150 },
              ] },
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 60, householdMeasure: "2 fatias", kcal: 150 },
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
              ] },
            { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80,
              substitutions: [
                { foodKey: "azeite", name: "Azeite", quantityG: 8, householdMeasure: "1 colher de chá", kcal: 70 },
              ] },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 170,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte natural", quantityG: 150, householdMeasure: "1 pote", kcal: 110,
              substitutions: [
                { foodKey: "kefir", name: "Kefir", quantityG: 150, householdMeasure: "1 copo", kcal: 90 },
              ] },
            { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60 },
              ] },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 560,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240,
              substitutions: [
                { foodKey: "patinho", name: "Patinho", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 160, householdMeasure: "1 filé", kcal: 200 },
              ] },
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres de sopa", kcal: 120,
              substitutions: [
                { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres de sopa", kcal: 125 },
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 unidade pequena", kcal: 145 },
              ] },
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha média", kcal: 100,
              substitutions: [
                { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 115 },
              ] },
            { foodKey: "salada-verde", name: "Salada verde", quantityG: 150, householdMeasure: "1 prato sobremesa", kcal: 50,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 130, householdMeasure: "1 escumadeira", kcal: 45 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 6, householdMeasure: "1 colher de chá cheia", kcal: 50,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 30, householdMeasure: "1 colher de sopa", kcal: 50 },
              ] },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "16:30",
          totalKcal: 240,
          items: [
            { foodKey: "tapioca", name: "Tapioca", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 120,
              substitutions: [
                { foodKey: "pao", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 130 },
              ] },
            { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 50, householdMeasure: "2 fatias finas", kcal: 120,
              substitutions: [
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 70, householdMeasure: "3 colheres de sopa", kcal: 115 },
                { foodKey: "ovo", name: "Ovo mexido", quantityG: 70, householdMeasure: "1 ½ unidade", kcal: 110 },
              ] },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 390,
          items: [
            { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 200,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ] },
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 100, householdMeasure: "1 unidade pequena", kcal: 110,
              substitutions: [
                { foodKey: "mandioca-cozida", name: "Mandioca cozida", quantityG: 90, householdMeasure: "1 pedaço pequeno", kcal: 110 },
              ] },
            { foodKey: "legumes", name: "Legumes assados", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 80,
              substitutions: [
                { foodKey: "salada-verde", name: "Salada verde com azeite", quantityG: 150, householdMeasure: "1 prato", kcal: 90 },
              ] },
          ],
        },
      ],
      recommendations: {
        waterMl: 2500,
        sleepHours: 8,
        teaRoutine: ["Chá verde após almoço"],
        strategies: ["Manter caminhada pós-refeição", "Carbo integral preferido", "Doce só com proteína/gordura"],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// SOP
// ---------------------------------------------------------------------------

export const SOP_MODULE: ProtocolModule = {
  id: "sop",
  name: "Módulo SOP",
  tagline: "Inositol, baixo carbo e anti-inflamatórios — equilíbrio hormonal.",
  methodology: {
    title: "Metodologia SOP — Equilíbrio Hormonal e Sensibilidade à Insulina",
    subtitle:
      "Reduzir hiperinsulinemia e inflamação para restabelecer ciclos menstruais, ovulação e composição corporal em pacientes com Síndrome dos Ovários Policísticos.",
    pillars: [
      { title: "1. Baixo IG e antiinflamatório", summary: "Carbos sempre integrais + ômega-3, cúrcuma e folhosos amargos.", examples: ["Aveia, quinoa, batata-doce", "Salmão, sardinha, chia", "Brócolis, rúcula, agrião"] },
      { title: "2. Proteína em todas as refeições", summary: "1,6 g/kg para preservar massa magra e atenuar fome.", examples: ["Ovo, frango, peixe, whey"] },
      { title: "3. Mio-inositol nutricional", summary: "Aveia, frutas cítricas e legumes são fontes naturais que somam ao suplemento.", examples: ["Aveia no café", "Laranja com proteína no lanche"] },
      { title: "4. Magnésio e zinco", summary: "Sementes de abóbora, castanha, cacau 70% e folhosos verde-escuros.", examples: ["1 colher de sementes/dia"] },
    ],
    behavioralRules: [
      { name: "Regra do açúcar zero", description: "Sem açúcar refinado e refrigerante (mesmo zero) — pioram inflamação." },
      { name: "Regra do trio anti-inflamatório", description: "Incluir ômega-3, folhoso amargo e gordura boa em pelo menos 2 refeições/dia." },
      { name: "Regra do treino de força", description: "Treino de força 3x/semana é tão importante quanto a dieta para sensibilidade insulínica." },
    ],
    disclaimer: "Suporte nutricional. Não substitui inositol, metformina, anticoncepcional ou outras condutas indicadas pelo ginecologista/endócrino.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Reequilíbrio Hormonal",
      durationWeeks: 8,
      description: "Baixo IG, antiinflamatório forte e fracionamento. Foco em reduzir insulina e marcadores inflamatórios.",
      dailyKcalTarget: 1500,
      macros: { protein: 32, carb: 35, fat: 33 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 340,
          items: [
            { foodKey: "aveia", name: "Aveia com canela e chia", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 115,
              substitutions: [
                { foodKey: "tapioca", name: "Tapioca fina", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 120 },
                { foodKey: "pao", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 130 },
              ] },
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 60, householdMeasure: "2 fatias", kcal: 150 },
              ] },
            { foodKey: "morango", name: "Morangos", quantityG: 100, householdMeasure: "6 unidades", kcal: 35,
              substitutions: [
                { foodKey: "maca", name: "Maçã", quantityG: 80, householdMeasure: "½ unidade", kcal: 45 },
              ] },
            { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 5, householdMeasure: "1 unidade", kcal: 30,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 8, householdMeasure: "5 unidades", kcal: 45 },
              ] },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 140,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte natural integral", quantityG: 120, householdMeasure: "1 pote pequeno", kcal: 90,
              substitutions: [
                { foodKey: "kefir", name: "Kefir natural", quantityG: 150, householdMeasure: "1 copo", kcal: 90 },
              ] },
            { foodKey: "amendoa", name: "Amêndoas", quantityG: 10, householdMeasure: "7 unidades", kcal: 60,
              substitutions: [
                { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65 },
              ] },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 510,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado (ômega-3)", quantityG: 130, householdMeasure: "1 filé médio", kcal: 230,
              substitutions: [
                { foodKey: "sardinha", name: "Sardinha grelhada", quantityG: 120, householdMeasure: "2 unidades", kcal: 200 },
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200 },
              ] },
            { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 100,
              substitutions: [
                { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "3 colheres de sopa", kcal: 95 },
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 100, householdMeasure: "1 unidade pequena", kcal: 110 },
              ] },
            { foodKey: "feijao", name: "Feijão preto", quantityG: 60, householdMeasure: "½ concha", kcal: 60,
              substitutions: [
                { foodKey: "lentilha", name: "Lentilha", quantityG: 60, householdMeasure: "½ concha", kcal: 70 },
                { foodKey: "grao-de-bico", name: "Grão-de-bico", quantityG: 60, householdMeasure: "½ concha", kcal: 75 },
              ] },
            { foodKey: "brocolis", name: "Brócolis + rúcula + cúrcuma", quantityG: 180, householdMeasure: "1 prato fundo", kcal: 75,
              substitutions: [
                { foodKey: "salada-verde", name: "Salada verde com folhosos amargos", quantityG: 180, householdMeasure: "1 prato", kcal: 60 },
              ] },
            { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 5, householdMeasure: "1 colher de chá", kcal: 45,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 30, householdMeasure: "1 colher de sopa", kcal: 50 },
              ] },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "16:30",
          totalKcal: 200,
          items: [
            { foodKey: "maca", name: "Maçã com casca", quantityG: 130, householdMeasure: "1 unidade", kcal: 70,
              substitutions: [
                { foodKey: "pera", name: "Pera", quantityG: 130, householdMeasure: "1 unidade", kcal: 70 },
                { foodKey: "morango", name: "Morangos", quantityG: 150, householdMeasure: "8 unidades", kcal: 50 },
              ] },
            { foodKey: "whey", name: "Whey protein", quantityG: 30, householdMeasure: "1 scoop", kcal: 120,
              substitutions: [
                { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 150, householdMeasure: "1 pote", kcal: 130 },
                { foodKey: "ovo", name: "Ovos cozidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160 },
              ] },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 310,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 200,
              substitutions: [
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 200 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ] },
            { foodKey: "legumes", name: "Abobrinha + cenoura refogadas", quantityG: 180, householdMeasure: "1 escumadeira cheia", kcal: 80,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 180, householdMeasure: "1 escumadeira", kcal: 70 },
                { foodKey: "salada-verde", name: "Salada verde", quantityG: 180, householdMeasure: "1 prato", kcal: 60 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 4, householdMeasure: "1 colher de chá rasa", kcal: 30,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 25, householdMeasure: "1 colher de sopa rasa", kcal: 40 },
              ] },
          ],
        },
      ],
      recommendations: {
        waterMl: 2500,
        sleepHours: 8,
        teaRoutine: ["Chá de canela após almoço", "Chá de hortelã + gengibre à noite"],
        strategies: ["Sem açúcar refinado e refrigerantes", "Ômega-3 em 2 refeições/dia", "Treino de força 3x/semana", "Caminhar 15 min pós-refeições"],
      },
    },
    {
      id: 2,
      name: "Fase 2 — Manutenção e Ciclo Regular",
      durationWeeks: 12,
      description: "Manutenção dos hábitos, reintrodução flexível de carboidratos e foco em consistência menstrual.",
      dailyKcalTarget: 1700,
      macros: { protein: 30, carb: 40, fat: 30 },
      meals: [
        {
          id: "cafe_manha",
          name: "Café da Manhã",
          time: "07:30",
          totalKcal: 390,
          items: [
            { foodKey: "tapioca", name: "Tapioca fina", quantityG: 50, householdMeasure: "1 disco médio", kcal: 150,
              substitutions: [
                { foodKey: "pao", name: "Pão integral", quantityG: 60, householdMeasure: "2 fatias", kcal: 160 },
                { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150 },
              ] },
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 160,
              substitutions: [
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
                { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 60, householdMeasure: "2 fatias", kcal: 150 },
              ] },
            { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80,
              substitutions: [
                { foodKey: "azeite", name: "Azeite", quantityG: 8, householdMeasure: "1 colher de chá", kcal: 70 },
              ] },
          ],
        },
        {
          id: "lanche_manha",
          name: "Lanche da Manhã",
          time: "10:30",
          totalKcal: 160,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 150, householdMeasure: "1 pote", kcal: 110,
              substitutions: [
                { foodKey: "kefir", name: "Kefir", quantityG: 150, householdMeasure: "1 copo", kcal: 90 },
              ] },
            { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 8, householdMeasure: "2 unidades pequenas", kcal: 50,
              substitutions: [
                { foodKey: "amendoa", name: "Amêndoas", quantityG: 8, householdMeasure: "5 unidades", kcal: 50 },
              ] },
          ],
        },
        {
          id: "almoco",
          name: "Almoço",
          time: "12:30",
          totalKcal: 550,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 230,
              substitutions: [
                { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240 },
                { foodKey: "patinho", name: "Patinho", quantityG: 130, householdMeasure: "1 bife médio", kcal: 220 },
              ] },
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres de sopa", kcal: 120,
              substitutions: [
                { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres de sopa", kcal: 125 },
                { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 unidade pequena", kcal: 145 },
              ] },
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha média", kcal: 100,
              substitutions: [
                { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 115 },
              ] },
            { foodKey: "salada-verde", name: "Salada verde + rúcula", quantityG: 150, householdMeasure: "1 prato sobremesa", kcal: 50,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 130, householdMeasure: "1 escumadeira", kcal: 45 },
              ] },
            { foodKey: "azeite", name: "Azeite", quantityG: 6, householdMeasure: "1 colher de chá cheia", kcal: 50,
              substitutions: [
                { foodKey: "abacate", name: "Abacate", quantityG: 30, householdMeasure: "1 colher de sopa", kcal: 50 },
              ] },
          ],
        },
        {
          id: "lanche_tarde",
          name: "Lanche da Tarde",
          time: "16:30",
          totalKcal: 220,
          items: [
            { foodKey: "pao", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 130,
              substitutions: [
                { foodKey: "tapioca", name: "Tapioca", quantityG: 40, householdMeasure: "1 disco pequeno", kcal: 120 },
              ] },
            { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 40, householdMeasure: "1 fatia média", kcal: 100,
              substitutions: [
                { foodKey: "ovo", name: "Ovo mexido", quantityG: 50, householdMeasure: "1 unidade", kcal: 80 },
                { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 60, householdMeasure: "3 colheres de sopa", kcal: 100 },
              ] },
          ],
        },
        {
          id: "jantar",
          name: "Jantar",
          time: "20:00",
          totalKcal: 380,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 240,
              substitutions: [
                { foodKey: "peixe-grelhado", name: "Peixe grelhado", quantityG: 160, householdMeasure: "1 filé", kcal: 220 },
                { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 240 },
              ] },
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 80, householdMeasure: "1 unidade pequena", kcal: 90,
              substitutions: [
                { foodKey: "mandioca-cozida", name: "Mandioca cozida", quantityG: 70, householdMeasure: "1 pedaço pequeno", kcal: 90 },
              ] },
            { foodKey: "legumes", name: "Legumes assados", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 80,
              substitutions: [
                { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 60 },
              ] },
          ],
        },
      ],
      recommendations: {
        waterMl: 2500,
        sleepHours: 8,
        teaRoutine: ["Chá de canela após almoço"],
        strategies: ["Treino de força mantido 3x/semana", "Caminhada pós-refeição", "Açúcar refinado segue zero"],
      },
    },
  ],
};
