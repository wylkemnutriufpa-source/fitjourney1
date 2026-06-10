// Módulo ÁGUA — Lote 5 do roll-out.
//
// Protocolo de hiperhidratação estilo "peak week" de bodybuilder, adaptado
// para uso clínico geral (10 dias). Estrutura inspirada na preparação
// de competidores: carregamento progressivo → pico → corte controlado.
//
// IMPORTANTE: NÃO é um protocolo para diurese de competição. É um modelo
// clínico de manejo hídrico intensivo de 10 dias, útil para:
//   - resetar hábito de hidratação
//   - reduzir retenção crônica por baixa ingesta
//   - melhorar performance e composição corporal antes de eventos
//   - desafios de hidratação supervisionados
//
// Regras invioláveis:
//   - SEM diuréticos, SEM restrição severa de sódio sem supervisão
//   - Cardiopatas, nefropatas e gestantes: PROIBIDO sem aval médico
//   - Acompanhamento clínico obrigatório nos 10 dias
//
// Determinístico. Sem IO. Sem IA.

import type { ProtocolModule } from "../catalog";

export const AGUA_MODULE: ProtocolModule = {
  id: "agua",
  name: "Módulo Água — Hiperhidratação 10 Dias",
  tagline: "Protocolo estilo peak-week: carrega → pico → corte controlado.",
  methodology: {
    title: "Metodologia Hiperhidratação Clínica (10 dias)",
    subtitle:
      "Inspirado na peak-week do bodybuilding: aumenta gradualmente a ingesta hídrica para forçar adaptação renal/hormonal (queda de ADH e aldosterona), depois retorna ao basal sem rebote — resultado: redução de retenção, melhora da pele, performance e adesão à hidratação.",
    pillars: [
      { title: "1. Carregamento progressivo (D1–D4)", summary: "Subir +500 ml/dia partindo do basal até atingir 2× o basal. Espalhar em copos de 250–300 ml a cada 60–90 min.", examples: ["D1: basal +500 ml", "D2: +1000 ml", "D3: +1500 ml", "D4: 2× basal"] },
      { title: "2. Pico (D5–D7)", summary: "Manter o pico (35–45 ml/kg × 2) por 3 dias completos. Sódio mantido normal (3–5 g/dia) — NUNCA cortar.", examples: ["Adulto 70 kg: ~5,6 L/dia", "Atleta 80 kg: ~6,4 L/dia", "Sempre com eletrólitos"] },
      { title: "3. Corte controlado (D8–D10)", summary: "Reduzir 1–1,5 L/dia até retornar ao basal recomendado. Sódio reduz junto progressivamente, nunca zera.", examples: ["D8: pico −1 L", "D9: pico −2 L", "D10: basal definitivo"] },
      { title: "4. Eletrólitos sempre presentes", summary: "Hiperhidratação SEM sódio/potássio causa hiponatremia (perigosa). Cada litro extra acompanha pitada de sal e fonte de potássio.", examples: ["1 pitada sal rosa por garrafa", "Água de coco 200 ml/dia", "Banana, abacate, batata-doce"] },
      { title: "5. Cronograma fixo + lembrete", summary: "Beber em horários definidos a cada 60–90 min. Última dose 2h antes de dormir para não fragmentar sono.", examples: ["07h, 09h, 11h, 13h, 15h, 17h, 19h, 21h", "Garrafa marcada com horários", "App de lembrete"] },
    ],
    behavioralRules: [
      { name: "Regra do basal individual", description: "Basal = peso (kg) × 35 ml. Pico = basal × 2. Nunca passar de 45 ml/kg em pico sem supervisão." },
      { name: "Regra do sódio mantido", description: "Sódio normal (3–5 g/dia). Não cortar sal — provoca hiponatremia por diluição." },
      { name: "Regra do corte sem rebote", description: "Após D10, manter basal calculado para sempre. Quem volta para 1 L/dia perde tudo em 48h." },
      { name: "Regra dos sinais de alerta", description: "Suspender se: dor de cabeça intensa, náusea, confusão, edema visível, ganho >2 kg em 24h — sinais de hiponatremia/sobrecarga." },
    ],
    disclaimer:
      "PROIBIDO para insuficiência cardíaca, insuficiência renal, hiponatremia prévia, SIADH e gestantes sem aval médico. Acompanhamento clínico obrigatório nos 10 dias. Não usar diuréticos. Suspender ao primeiro sinal de alerta.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Carregamento (D1–D4)",
      durationWeeks: 1,
      description: "Sobe +500 ml/dia. Corpo começa a reduzir ADH e aldosterona — diurese aumenta naturalmente.",
      dailyKcalTarget: 2000,
      macros: { protein: 30, carb: 45, fat: 25 },
      recommendations: {
        waterMl: 4000,
        sleepHours: 8,
        teaRoutine: ["Chás contam como líquido — máximo 500 ml/dia", "Chá-verde só até 14h", "Camomila/melissa à noite"],
        strategies: [
          "D1: basal +500 ml | D2: +1000 ml | D3: +1500 ml | D4: 2× basal",
          "Adulto 70 kg parte de 2,5 L → chega em 5 L no D4",
          "1 pitada de sal rosa por garrafa de 1 L",
          "Banana + abacate todo dia (potássio)",
          "Última dose 2h antes de dormir",
        ],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h) + 500 ml água", time: "07:00", totalKcal: 420, items: [
          { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
            { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
            { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 60, householdMeasure: "2 fatias", kcal: 145 },
          ]},
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140, substitutions: [
            { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos", kcal: 145 },
            { foodKey: "aveia", name: "Aveia", quantityG: 40, householdMeasure: "4 colheres", kcal: 150 },
          ]},
          { foodKey: "banana", name: "Banana (potássio)", quantityG: 100, householdMeasure: "1 unidade", kcal: 89, substitutions: [
            { foodKey: "mamao", name: "Mamão", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
            { foodKey: "maca", name: "Maçã", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
          ]},
        ]},
        { id: "lanche-m", name: "Lanche da Manhã (10h) + 500 ml água + 1 pitada sal rosa", time: "10:00", totalKcal: 180, items: [
          { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
          { foodKey: "amendoas", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90, substitutions: [
            { foodKey: "castanha-para", name: "Castanha-do-pará", quantityG: 15, householdMeasure: "2 unidades", kcal: 100 },
          ]},
        ]},
        { id: "almoco", name: "Almoço (13h) + 500 ml água", time: "13:00", totalKcal: 620, items: [
          { foodKey: "frango-peito", name: "Peito de frango grelhado", quantityG: 140, householdMeasure: "1 filé", kcal: 230, substitutions: [
            { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife", kcal: 220 },
            { foodKey: "tilapia", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce (potássio)", quantityG: 150, householdMeasure: "1 unidade", kcal: 130, substitutions: [
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          ]},
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60 },
          { foodKey: "salada-folhas", name: "Salada verde", quantityG: 150, householdMeasure: "1 prato", kcal: 40 },
          { foodKey: "abacate", name: "Abacate (potássio + gordura boa)", quantityG: 50, householdMeasure: "2 colheres", kcal: 80, substitutions: [
            { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
          ]},
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h) + 500 ml água de coco", time: "16:00", totalKcal: 200, items: [
          { foodKey: "agua-coco", name: "Água de coco natural (eletrólitos)", quantityG: 200, householdMeasure: "1 copo", kcal: 40, substitutions: [
            { foodKey: "iogurte-natural", name: "Iogurte natural + pitada de sal", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
          ]},
          { foodKey: "banana", name: "Banana com canela", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
          { foodKey: "amendoas", name: "Amêndoas", quantityG: 10, householdMeasure: "6 unidades", kcal: 60 },
        ]},
        { id: "jantar", name: "Jantar (20h) + 500 ml água (última dose hídrica)", time: "20:00", totalKcal: 500, items: [
          { foodKey: "salmao", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 270, substitutions: [
            { foodKey: "frango-peito", name: "Peito de frango", quantityG: 130, householdMeasure: "1 filé", kcal: 215 },
            { foodKey: "atum", name: "Atum em água", quantityG: 130, householdMeasure: "1 lata", kcal: 170 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 120, householdMeasure: "1 unidade", kcal: 105 },
          { foodKey: "legumes-mix", name: "Legumes refogados", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Pico (D5–D7)",
      durationWeeks: 1,
      description: "Pico de 2× o basal por 3 dias. ADH suprimido, aldosterona baixa. SEMPRE com eletrólitos.",
      dailyKcalTarget: 2000,
      macros: { protein: 30, carb: 45, fat: 25 },
      recommendations: {
        waterMl: 5500,
        sleepHours: 8,
        teaRoutine: ["Chás contam como líquido — manter abaixo de 700 ml", "Sem diuréticos naturais (cavalinha, hibisco em excesso)"],
        strategies: [
          "70 kg: ~5,5 L | 80 kg: ~6,4 L | 90 kg: ~7,2 L",
          "Sódio mantido (3–5 g/dia) — sal em todas as refeições",
          "2 pitadas de sal rosa por garrafa de 1 L",
          "Água de coco 200 ml + banana 2× ao dia",
          "Monitorar peso pela manhã (variação até 1 kg é normal)",
          "Suspender ao 1º sinal: dor de cabeça forte, náusea, confusão",
        ],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h) + 700 ml água + sal", time: "07:00", totalKcal: 430, items: [
          { foodKey: "ovo", name: "Ovos mexidos + pitada de sal", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
          { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
        ]},
        { id: "lanche-m", name: "Lanche (10h) + 700 ml água + 200 ml água de coco", time: "10:00", totalKcal: 210, items: [
          { foodKey: "agua-coco", name: "Água de coco", quantityG: 200, householdMeasure: "1 copo", kcal: 40 },
          { foodKey: "iogurte-natural", name: "Iogurte natural com pitada de sal", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
          { foodKey: "castanha-para", name: "Castanha-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 65 },
        ]},
        { id: "almoco", name: "Almoço (13h) + 700 ml água", time: "13:00", totalKcal: 660, items: [
          { foodKey: "patinho", name: "Patinho grelhado (com sal normal)", quantityG: 150, householdMeasure: "1 bife", kcal: 255, substitutions: [
            { foodKey: "frango-peito", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 245 },
            { foodKey: "salmao", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 270 },
          ]},
          { foodKey: "batata-doce", name: "Batata-doce (potássio)", quantityG: 180, householdMeasure: "1 unidade grande", kcal: 155 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 100, householdMeasure: "1 concha cheia", kcal: 75 },
          { foodKey: "salada-folhas", name: "Salada verde com tomate", quantityG: 150, householdMeasure: "1 prato", kcal: 50 },
          { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres", kcal: 80 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h) + 700 ml água + 200 ml água de coco", time: "16:00", totalKcal: 230, items: [
          { foodKey: "agua-coco", name: "Água de coco", quantityG: 200, householdMeasure: "1 copo", kcal: 40 },
          { foodKey: "banana", name: "Banana com pasta de amendoim", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
          { foodKey: "pasta-amendoim", name: "Pasta de amendoim integral", quantityG: 15, householdMeasure: "1 colher", kcal: 95, substitutions: [
            { foodKey: "amendoas", name: "Amêndoas", quantityG: 15, householdMeasure: "10 unidades", kcal: 90 },
          ]},
        ]},
        { id: "jantar", name: "Jantar (20h) + 700 ml água (encerra ingesta às 21h)", time: "20:00", totalKcal: 520, items: [
          { foodKey: "salmao", name: "Salmão grelhado", quantityG: 130, householdMeasure: "1 filé", kcal: 270 },
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 150, householdMeasure: "1 unidade", kcal: 130 },
          { foodKey: "legumes-mix", name: "Brócolis + abobrinha", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
    {
      id: 3,
      name: "Fase 3 — Corte Controlado (D8–D10)",
      durationWeeks: 1,
      description: "Reduz 1–1,5 L/dia. ADH ainda suprimido — diurese alta mantém efeito drenante. Sem rebote.",
      dailyKcalTarget: 2000,
      macros: { protein: 30, carb: 45, fat: 25 },
      recommendations: {
        waterMl: 3500,
        sleepHours: 8,
        teaRoutine: ["Chás liberados normalmente", "Camomila à noite"],
        strategies: [
          "D8: pico −1 L | D9: pico −2 L | D10: basal definitivo (35 ml/kg)",
          "Manter pitada de sal por garrafa nos D8–D9",
          "D10 em diante: hidratação basal PARA SEMPRE — não voltar para 1 L/dia",
          "Pesar pela manhã: queda de 1–2 kg em D8–D10 é normal (água retida saindo)",
        ],
      },
      meals: [
        { id: "cafe", name: "Café da Manhã (07h) + 500 ml água", time: "07:00", totalKcal: 420, items: [
          { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156 },
          { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
          { foodKey: "mamao", name: "Mamão", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
        ]},
        { id: "lanche-m", name: "Lanche da Manhã (10h) + 400 ml água", time: "10:00", totalKcal: 190, items: [
          { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 130 },
          { foodKey: "amendoas", name: "Amêndoas", quantityG: 10, householdMeasure: "6 unidades", kcal: 60 },
        ]},
        { id: "almoco", name: "Almoço (13h) + 500 ml água", time: "13:00", totalKcal: 620, items: [
          { foodKey: "frango-peito", name: "Frango grelhado", quantityG: 140, householdMeasure: "1 filé", kcal: 230 },
          { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "4 colheres", kcal: 125 },
          { foodKey: "feijao-preto", name: "Feijão preto", quantityG: 80, householdMeasure: "1 concha", kcal: 60 },
          { foodKey: "salada-folhas", name: "Salada verde", quantityG: 150, householdMeasure: "1 prato", kcal: 40 },
          { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres", kcal: 80 },
        ]},
        { id: "lanche-t", name: "Lanche da Tarde (16h) + 400 ml água", time: "16:00", totalKcal: 200, items: [
          { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 120 },
          { foodKey: "banana", name: "Banana", quantityG: 80, householdMeasure: "1 pequena", kcal: 70 },
        ]},
        { id: "jantar", name: "Jantar (20h) + 400 ml água (última dose 21h)", time: "20:00", totalKcal: 500, items: [
          { foodKey: "tilapia", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé", kcal: 180 },
          { foodKey: "batata-doce", name: "Batata-doce", quantityG: 120, householdMeasure: "1 unidade", kcal: 105 },
          { foodKey: "legumes-mix", name: "Legumes refogados", quantityG: 200, householdMeasure: "2 conchas", kcal: 80 },
          { foodKey: "azeite", name: "Azeite", quantityG: 10, householdMeasure: "1 colher", kcal: 90 },
        ]},
      ],
    },
  ],
};
