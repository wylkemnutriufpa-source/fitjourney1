// Módulos hormonais / femininos — Lote 3 do roll-out de cardápios.
// Pré-Natal · Anticelulite · Beleza · Antiqueda de Cabelo.
//
// Regras invioláveis (skill fitjourney-template-rules):
//   - Substituição sempre dentro do mesmo scaleGroup (proteína↔proteína etc.)
//   - Porções clínicas reais e práticas
//   - Combinações fáceis (a "dieta fácil" é o diferencial)
//
// Determinístico. Sem IO. Sem IA.

import type { ProtocolModule } from "../catalog";

// ---------------------------------------------------------------------------
// PRÉ-NATAL
// ---------------------------------------------------------------------------

export const PRE_NATAL_MODULE: ProtocolModule = {
  id: "pre-natal",
  name: "Módulo Pré-Natal",
  tagline: "Ácido fólico, ferro, ômega-3 e cálcio — nutrição materno-fetal.",
  methodology: {
    title: "Metodologia Pré-Natal — Nutrição Materno-Fetal",
    subtitle:
      "Cobrir demandas críticas da gestação (folato, ferro, ômega-3, cálcio, colina) com refeições densas, seguras e fáceis — respeitando intolerâncias do trimestre.",
    pillars: [
      { title: "1. Folato e colina diários", summary: "Folhas verde-escuras + ovo todos os dias — formação do tubo neural e cérebro fetal.", examples: ["Espinafre, couve, rúcula", "Ovo inteiro (gema = colina)", "Feijão preto, lentilha"] },
      { title: "2. Ferro biodisponível + vitamina C", summary: "Ferro heme (carnes) combinado com fruta cítrica na mesma refeição triplica absorção.", examples: ["Patinho + suco de laranja", "Fígado 1x/semana", "Feijão + limão"] },
      { title: "3. Ômega-3 (DHA) 2x/semana", summary: "Peixes de baixo mercúrio para desenvolvimento cerebral e ocular do bebê.", examples: ["Sardinha", "Salmão", "Tilápia", "Linhaça moída"] },
      { title: "4. Cálcio fracionado", summary: "3 porções/dia em horários separados do ferro (mineral compete).", examples: ["Iogurte manhã", "Queijo lanche", "Sardinha jantar"] },
      { title: "5. Hidratação e fibras", summary: "Constipação é regra na gestação — antecipar com água e fibra solúvel.", examples: ["Aveia", "Mamão", "Ameixa", "Chia"] },
    ],
    behavioralRules: [
      { name: "Regra do ferro + C", description: "Toda refeição com carne/feijão vem acompanhada de fonte de vitamina C." },
      { name: "Regra da segurança", description: "Sem peixe cru, leite/queijo não pasteurizado, carne malpassada, álcool, fígado em excesso." },
      { name: "Regra do fracionamento", description: "5–6 refeições pequenas — reduz náusea e refluxo do 1º e 3º trimestres." },
    ],
    disclaimer:
      "Acompanhamento obstétrico obrigatório. Suplementação de ácido fólico, ferro e DHA conforme prescrição médica — alimentação NÃO substitui suplemento na gestação.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — 1º Trimestre (Náuseas)",
      durationWeeks: 12,
      description: "Refeições pequenas, frias, neutras. Folato máximo. Anti-náusea com gengibre e proteína fracionada.",
      dailyKcalTarget: 1900,
      macros: { protein: 25, carb: 50, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 9,
        teaRoutine: ["Chá de gengibre fraco 07h (anti-náusea)", "NÃO usar hibisco, sene, boldo, alecrim, canela em casca"],
        strategies: ["Comer antes de levantar (bolacha água e sal)", "Evitar cheiros fortes", "Fracionar de 3 em 3h", "Suplementação prescrita pelo obstetra"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã (07h)", time: "07:00", totalKcal: 380,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
              { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 60, householdMeasure: "2 fatias", kcal: 145 },
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 130 },
            ]},
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos pequenos", kcal: 145 },
              { foodKey: "aveia", name: "Aveia em flocos", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150 },
              { foodKey: "cuscuz", name: "Cuscuz", quantityG: 90, householdMeasure: "½ xícara", kcal: 140 },
            ]},
            { foodKey: "mamao", name: "Mamão papaia", quantityG: 200, householdMeasure: "1 fatia grande", kcal: 80, substitutions: [
              { foodKey: "banana", name: "Banana prata", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
              { foodKey: "maca", name: "Maçã", quantityG: 150, householdMeasure: "1 unidade", kcal: 80 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã (10h)", time: "10:00", totalKcal: 200,
          items: [
            { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 100, substitutions: [
              { foodKey: "queijo-cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
              { foodKey: "leite-desnatado", name: "Leite desnatado", quantityG: 240, householdMeasure: "1 copo", kcal: 80 },
            ]},
            { foodKey: "biscoito-agua-sal", name: "Biscoito de água e sal", quantityG: 30, householdMeasure: "5 unidades", kcal: 130, substitutions: [
              { foodKey: "torrada-integral", name: "Torrada integral", quantityG: 30, householdMeasure: "3 unidades", kcal: 120 },
              { foodKey: "pao-frances", name: "Pão francês", quantityG: 50, householdMeasure: "1 unidade", kcal: 135 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço (12h30)", time: "12:30", totalKcal: 550,
          items: [
            { foodKey: "patinho", name: "Patinho moído refogado", quantityG: 130, householdMeasure: "5 colheres de sopa", kcal: 240, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 248 },
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres de sopa", kcal: 138, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce cozida", quantityG: 150, householdMeasure: "1 unidade média", kcal: 130 },
              { foodKey: "mandioca", name: "Mandioca cozida", quantityG: 100, householdMeasure: "1 pedaço médio", kcal: 145 },
            ]},
            { foodKey: "feijao", name: "Feijão preto", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha cozida", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
              { foodKey: "grao-de-bico", name: "Grão de bico cozido", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
            ]},
            { foodKey: "salada-verde", name: "Salada de folhas + tomate + limão", quantityG: 200, householdMeasure: "2 xícaras", kcal: 92, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
              { foodKey: "abobrinha", name: "Abobrinha refogada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 220,
          items: [
            { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 50, householdMeasure: "2 fatias", kcal: 120, substitutions: [
              { foodKey: "ricota", name: "Ricota fresca", quantityG: 80, householdMeasure: "2 fatias", kcal: 110 },
              { foodKey: "ovo", name: "Ovo cozido", quantityG: 100, householdMeasure: "2 unidades", kcal: 156 },
            ]},
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 40, householdMeasure: "1 fatia e meia", kcal: 110, substitutions: [
              { foodKey: "tapioca", name: "Tapioca pequena", quantityG: 40, householdMeasure: "1 disco", kcal: 95 },
              { foodKey: "torrada-integral", name: "Torrada integral", quantityG: 30, householdMeasure: "3 unidades", kcal: 120 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar (19h30)", time: "19:30", totalKcal: 480,
          items: [
            { foodKey: "peixe-grelhado", name: "Sardinha assada (rica em DHA + cálcio)", quantityG: 130, householdMeasure: "3 unidades", kcal: 230, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
              { foodKey: "ovo", name: "Omelete recheado (2 ovos + queijo)", quantityG: 130, householdMeasure: "2 ovos + queijo", kcal: 240 },
            ]},
            { foodKey: "batata-doce", name: "Purê de batata-doce", quantityG: 150, householdMeasure: "1 escumadeira", kcal: 130, substitutions: [
              { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres de sopa", kcal: 138 },
              { foodKey: "mandioquinha", name: "Mandioquinha cozida", quantityG: 130, householdMeasure: "1 escumadeira", kcal: 140 },
            ]},
            { foodKey: "legumes", name: "Legumes refogados (abobrinha + cenoura)", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
              { foodKey: "couve-flor", name: "Couve-flor no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 65 },
            ]},
          ],
        },
        {
          id: "ceia", name: "Ceia (22h)", time: "22:00", totalKcal: 170,
          items: [
            { foodKey: "leite-desnatado", name: "Leite morno", quantityG: 240, householdMeasure: "1 copo", kcal: 80, substitutions: [
              { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 100 },
            ]},
            { foodKey: "aveia", name: "Aveia em flocos", quantityG: 25, householdMeasure: "2 colheres de sopa", kcal: 90, substitutions: [
              { foodKey: "biscoito-agua-sal", name: "Biscoito de água e sal", quantityG: 20, householdMeasure: "3 unidades", kcal: 85 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — 2º e 3º Trimestre",
      durationWeeks: 28,
      description: "Aumento calórico (+300 kcal). Foco em ferro, ômega-3 e cálcio. Refeições maiores, sem refluxo à noite.",
      dailyKcalTarget: 2200,
      macros: { protein: 28, carb: 47, fat: 25 },
      recommendations: {
        waterMl: 3000, sleepHours: 9,
        teaRoutine: ["Camomila 21h (sono)", "Continuar evitando hibisco, sene, boldo, alecrim, canela em casca"],
        strategies: ["Sardinha 1x/semana", "Fígado 1x/semana (2º tri)", "Reduzir volume no jantar p/ evitar refluxo", "Atividade física leve"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café Reforçado (07h)", time: "07:00", totalKcal: 480,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 150, householdMeasure: "3 unidades", kcal: 234, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 200, householdMeasure: "1 pote grande", kcal: 130 },
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 100, householdMeasure: "5 colheres de sopa", kcal: 165 },
            ]},
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 60, householdMeasure: "2 fatias grandes", kcal: 165, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 70, householdMeasure: "2 discos", kcal: 170 },
              { foodKey: "aveia", name: "Aveia", quantityG: 50, householdMeasure: "5 colheres de sopa", kcal: 185 },
            ]},
            { foodKey: "laranja", name: "Suco de laranja natural (vit. C p/ ferro)", quantityG: 200, householdMeasure: "1 copo", kcal: 90, substitutions: [
              { foodKey: "kiwi", name: "Kiwi", quantityG: 150, householdMeasure: "2 unidades", kcal: 90 },
              { foodKey: "morango", name: "Morangos", quantityG: 200, householdMeasure: "1 xícara", kcal: 65 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã (10h)", time: "10:00", totalKcal: 230,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105, substitutions: [
              { foodKey: "queijo-cottage", name: "Queijo cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
            ]},
            { foodKey: "castanha", name: "Mix de castanhas", quantityG: 20, householdMeasure: "1 punhado pequeno", kcal: 120, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 20, householdMeasure: "15 unidades", kcal: 120 },
              { foodKey: "nozes", name: "Nozes", quantityG: 20, householdMeasure: "5 unidades", kcal: 125 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço Reforçado (12h30)", time: "12:30", totalKcal: 650,
          items: [
            { foodKey: "patinho", name: "Patinho grelhado (ferro heme)", quantityG: 150, householdMeasure: "1 bife médio", kcal: 275, substitutions: [
              { foodKey: "figado", name: "Fígado acebolado (1x/semana — ferro máximo)", quantityG: 100, householdMeasure: "1 fatia média", kcal: 175 },
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 170, householdMeasure: "1 filé grande", kcal: 280 },
              { foodKey: "peixe-grelhado", name: "Salmão grelhado", quantityG: 150, householdMeasure: "1 posta", kcal: 280 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 120, householdMeasure: "6 colheres de sopa", kcal: 165, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 180, householdMeasure: "1 unidade grande", kcal: 155 },
              { foodKey: "quinoa", name: "Quinoa cozida", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 145 },
            ]},
            { foodKey: "feijao", name: "Feijão preto", quantityG: 130, householdMeasure: "1 concha cheia", kcal: 105, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 130, householdMeasure: "1 concha cheia", kcal: 125 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 130, householdMeasure: "1 concha cheia", kcal: 155 },
            ]},
            { foodKey: "salada-verde", name: "Salada verde com tomate e limão", quantityG: 200, householdMeasure: "2 xícaras", kcal: 105, substitutions: [
              { foodKey: "brocolis", name: "Brócolis refogado", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde (16h)", time: "16:00", totalKcal: 280,
          items: [
            { foodKey: "pao-integral", name: "Sanduíche: pão integral", quantityG: 60, householdMeasure: "2 fatias", kcal: 165, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 60, householdMeasure: "2 discos pequenos", kcal: 145 },
            ]},
            { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 50, householdMeasure: "2 fatias", kcal: 120, substitutions: [
              { foodKey: "ricota", name: "Ricota", quantityG: 80, householdMeasure: "2 fatias", kcal: 110 },
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 80, householdMeasure: "4 colheres", kcal: 130 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar (19h30)", time: "19:30", totalKcal: 460,
          items: [
            { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 150, householdMeasure: "1 filé grande", kcal: 180, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
              { foodKey: "patinho", name: "Patinho refogado", quantityG: 130, householdMeasure: "1 porção", kcal: 240 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 unidade pequena", kcal: 115, substitutions: [
              { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "4 colheres de sopa", kcal: 110 },
            ]},
            { foodKey: "legumes", name: "Mix de legumes refogados", quantityG: 250, householdMeasure: "2 xícaras grandes", kcal: 100, substitutions: [
              { foodKey: "abobrinha", name: "Abobrinha + cenoura", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
            ]},
          ],
        },
        {
          id: "ceia", name: "Ceia (22h)", time: "22:00", totalKcal: 200,
          items: [
            { foodKey: "leite-desnatado", name: "Leite morno", quantityG: 240, householdMeasure: "1 copo", kcal: 80, substitutions: [
              { foodKey: "iogurte-natural", name: "Iogurte natural", quantityG: 200, householdMeasure: "1 copo", kcal: 100 },
            ]},
            { foodKey: "aveia", name: "Aveia", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 110, substitutions: [
              { foodKey: "banana", name: "Banana prata", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
            ]},
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTICELULITE
// ---------------------------------------------------------------------------

export const ANTICELULITE_MODULE: ProtocolModule = {
  id: "anticelulite",
  name: "Módulo Anticelulite",
  tagline: "Drenagem, anti-inflamatórios e suporte ao colágeno.",
  methodology: {
    title: "Metodologia Anticelulite — Drenar + Construir Colágeno",
    subtitle:
      "Atacar os 3 mecanismos da celulite: retenção hídrica, inflamação crônica e degradação do colágeno — via redução de sódio, polifenóis e proteína colágena.",
    pillars: [
      { title: "1. Sódio controlado (<2 g/dia)", summary: "Cortar ultraprocessados, embutidos, queijos amarelos, molhos prontos.", examples: ["Sem caldo em tablete", "Sem salgadinhos", "Sem hambúrguer industrial"] },
      { title: "2. Potássio e diuréticos naturais", summary: "Reequilibrar sódio/potássio para reduzir retenção visível.", examples: ["Melancia", "Pepino", "Abacaxi", "Água de coco", "Chá verde"] },
      { title: "3. Proteína colágena diária", summary: "Aminoácidos (prolina, glicina, lisina) + vitamina C constroem colágeno dérmico.", examples: ["Frango com pele cozida", "Caldo de osso", "Ovo", "Peixe", "Gelatina pura"] },
      { title: "4. Anti-inflamatórios (polifenóis e ômega-3)", summary: "Frutas vermelhas, azeite extravirgem, peixes — reduzem inflamação subcutânea.", examples: ["Mirtilo", "Morango", "Sardinha", "Linhaça"] },
      { title: "5. Hidratação alta + circulação", summary: "3 L/dia + exercício de força — drenagem só funciona com movimento.", examples: ["Água 35 ml/kg", "Chá verde", "Hibisco", "Musculação"] },
    ],
    behavioralRules: [
      { name: "Regra do rótulo", description: "Comprou industrializado? Sódio até 120 mg por 100 g — acima disso, não entra." },
      { name: "Regra dos vermelhos", description: "1 porção/dia de fruta vermelha — antocianinas protegem o colágeno." },
      { name: "Regra do movimento", description: "Sem exercício de força + cardio, drenagem nutricional sozinha não muda celulite." },
    ],
    disclaimer:
      "Celulite tem componentes genéticos e hormonais. Nutrição reduz fatores agravantes — não promete eliminação total.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Drenagem (4 sem)",
      durationWeeks: 4,
      description: "Reduzir retenção e inflamação. Sódio mínimo, potássio máximo, hidratação agressiva.",
      dailyKcalTarget: 1500,
      macros: { protein: 35, carb: 40, fat: 25 },
      recommendations: {
        waterMl: 3000, sleepHours: 8,
        teaRoutine: ["Hibisco gelado 10h (drenante)", "Chá verde 15h (lipolítico)", "Cavalinha 17h (drenante)"],
        strategies: ["Sem sal de adição na mesa", "Sem embutidos", "1 fruta vermelha/dia", "Caminhada 30 min/dia"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 330,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos sem sal (no azeite)", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
              { foodKey: "whey", name: "Whey protein isolado", quantityG: 30, householdMeasure: "1 scoop", kcal: 120 },
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
            ]},
            { foodKey: "tapioca", name: "Tapioca pequena", quantityG: 40, householdMeasure: "1 disco", kcal: 95, substitutions: [
              { foodKey: "aveia", name: "Aveia", quantityG: 30, householdMeasure: "3 colheres de sopa", kcal: 110 },
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 30, householdMeasure: "1 fatia", kcal: 80 },
            ]},
            { foodKey: "morango", name: "Morangos (antocianinas)", quantityG: 150, householdMeasure: "1 xícara", kcal: 50, substitutions: [
              { foodKey: "mirtilo", name: "Mirtilo", quantityG: 100, householdMeasure: "½ xícara", kcal: 55 },
              { foodKey: "amora", name: "Amora", quantityG: 100, householdMeasure: "½ xícara", kcal: 45 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 140,
          items: [
            { foodKey: "agua-coco", name: "Água de coco natural (potássio)", quantityG: 200, householdMeasure: "1 copo", kcal: 40, substitutions: [
              { foodKey: "cha-verde", name: "Chá verde gelado sem açúcar", quantityG: 250, householdMeasure: "1 copo", kcal: 5 },
            ]},
            { foodKey: "abacaxi", name: "Abacaxi em cubos (bromelaína)", quantityG: 150, householdMeasure: "1 fatia grossa", kcal: 75, substitutions: [
              { foodKey: "melancia", name: "Melancia", quantityG: 200, householdMeasure: "1 fatia", kcal: 60 },
              { foodKey: "mamao", name: "Mamão", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 470,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado com ervas (sem sal)", quantityG: 150, householdMeasure: "1 filé médio", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 130, householdMeasure: "1 bife médio", kcal: 240 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce assada", quantityG: 130, householdMeasure: "1 unidade pequena", kcal: 115, substitutions: [
              { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "4 colheres", kcal: 110 },
              { foodKey: "quinoa", name: "Quinoa", quantityG: 90, householdMeasure: "3 colheres", kcal: 110 },
            ]},
            { foodKey: "salada-verde", name: "Salada de pepino + tomate + folhas + limão", quantityG: 250, householdMeasure: "2 xícaras grandes", kcal: 107, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
              { foodKey: "abobrinha", name: "Abobrinha grelhada", quantityG: 200, householdMeasure: "2 xícaras", kcal: 60 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 180,
          items: [
            { foodKey: "iogurte-natural", name: "Iogurte natural desnatado", quantityG: 200, householdMeasure: "1 copo", kcal: 100, substitutions: [
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 120, householdMeasure: "4 colheres de sopa", kcal: 110 },
            ]},
            { foodKey: "mirtilo", name: "Mirtilo + chia", quantityG: 100, householdMeasure: "½ xícara + 1 colher", kcal: 80, substitutions: [
              { foodKey: "morango", name: "Morango", quantityG: 150, householdMeasure: "1 xícara", kcal: 50 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 380,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado (ômega-3)", quantityG: 130, householdMeasure: "1 posta média", kcal: 245, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
              { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
            ]},
            { foodKey: "legumes", name: "Legumes no vapor (chuchu, cenoura, abobrinha)", quantityG: 250, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
              { foodKey: "couve-flor", name: "Couve-flor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 80 },
            ]},
            { foodKey: "abacate", name: "Abacate (½ pequeno)", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80, substitutions: [
              { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Construção de Colágeno (8 sem)",
      durationWeeks: 8,
      description: "Mantém drenagem e adiciona aporte proteico colágeno + vit. C para reconstrução dérmica.",
      dailyKcalTarget: 1650,
      macros: { protein: 38, carb: 37, fat: 25 },
      recommendations: {
        waterMl: 3000, sleepHours: 8,
        teaRoutine: ["Hibisco 10h", "Chá verde 15h", "Camomila 21h"],
        strategies: ["1 porção/dia fruta vermelha + vit. C", "Caldo de osso 2x/semana", "Musculação 3x/semana"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 380,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos + 1 fatia de queijo branco", quantityG: 150, householdMeasure: "2 ovos + 1 fatia", kcal: 220, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego + whey", quantityG: 200, householdMeasure: "1 pote + 1 scoop", kcal: 220 },
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 120, householdMeasure: "6 colheres", kcal: 200 },
            ]},
            { foodKey: "tapioca", name: "Tapioca", quantityG: 50, householdMeasure: "1 disco médio", kcal: 120, substitutions: [
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 40, householdMeasure: "1 fatia e meia", kcal: 110 },
              { foodKey: "aveia", name: "Aveia", quantityG: 35, householdMeasure: "3 colheres e meia", kcal: 130 },
            ]},
            { foodKey: "kiwi", name: "Kiwi (vit. C p/ colágeno)", quantityG: 70, householdMeasure: "1 unidade", kcal: 45, substitutions: [
              { foodKey: "morango", name: "Morango", quantityG: 150, householdMeasure: "1 xícara", kcal: 50 },
              { foodKey: "laranja", name: "Laranja", quantityG: 130, householdMeasure: "1 unidade", kcal: 60 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 170,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105, substitutions: [
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
            ]},
            { foodKey: "amendoa", name: "Amêndoas", quantityG: 12, householdMeasure: "10 unidades", kcal: 70, substitutions: [
              { foodKey: "castanha", name: "Castanha-do-pará", quantityG: 12, householdMeasure: "2 unidades", kcal: 80 },
              { foodKey: "nozes", name: "Nozes", quantityG: 12, householdMeasure: "3 unidades", kcal: 75 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 520,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado (coxa com pele 1x/sem — colágeno)", quantityG: 150, householdMeasure: "1 porção", kcal: 260, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 140, householdMeasure: "1 bife", kcal: 260 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 90, householdMeasure: "4,5 colheres", kcal: 125, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115 },
              { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres", kcal: 120 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 80, householdMeasure: "½ concha", kcal: 65, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 80, householdMeasure: "½ concha", kcal: 75 },
            ]},
            { foodKey: "salada-verde", name: "Salada + limão + azeite", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 200,
          items: [
            { foodKey: "whey", name: "Shake: whey + água + morango", quantityG: 30, householdMeasure: "1 scoop + 150 g morango", kcal: 170, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego + frutas vermelhas", quantityG: 170, householdMeasure: "1 pote + 100 g", kcal: 160 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 380,
          items: [
            { foodKey: "peixe-grelhado", name: "Sardinha assada (ômega-3 + cálcio)", quantityG: 130, householdMeasure: "3 unidades", kcal: 230, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
            ]},
            { foodKey: "legumes", name: "Mix de legumes refogados", quantityG: 250, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
            ]},
            { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 10, householdMeasure: "1 colher de sopa", kcal: 90, substitutions: [
              { foodKey: "abacate", name: "Abacate", quantityG: 50, householdMeasure: "2 colheres de sopa", kcal: 80 },
            ]},
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// BELEZA (pele, cabelo, unhas)
// ---------------------------------------------------------------------------

export const BELEZA_MODULE: ProtocolModule = {
  id: "beleza",
  name: "Módulo Beleza",
  tagline: "Pele, cabelo e unhas — colágeno, silício, biotina e antioxidantes.",
  methodology: {
    title: "Metodologia Beleza — Nutrição da Pele, Cabelo e Unhas",
    subtitle:
      "Fornecer matéria-prima (proteína, biotina, zinco, silício) + proteção (vit. C, E, polifenóis) + hidratação para regenerar tecidos visíveis em 60–90 dias.",
    pillars: [
      { title: "1. Proteína completa diária", summary: "1,2–1,6 g/kg de proteína de alto valor biológico — base da queratina (cabelo/unha) e colágeno (pele).", examples: ["Ovos", "Frango", "Peixe", "Whey", "Iogurte grego"] },
      { title: "2. Biotina e zinco", summary: "Cofatores da queratina — deficiência = unha quebradiça e queda capilar.", examples: ["Gema de ovo", "Castanha-do-pará", "Carne vermelha", "Aveia"] },
      { title: "3. Silício e colágeno", summary: "Silício orgânico (aveia, banana) + vit. C estimulam síntese de colágeno.", examples: ["Aveia", "Banana", "Maçã com casca", "Pepino com casca"] },
      { title: "4. Antioxidantes (vit. C, E, polifenóis)", summary: "Neutralizam radicais livres da exposição solar e poluição.", examples: ["Frutas vermelhas", "Cítricos", "Azeite", "Castanhas", "Chá verde"] },
      { title: "5. Gorduras boas (ômega-3 + abacate)", summary: "Mantêm barreira lipídica da pele e brilho capilar.", examples: ["Sardinha", "Salmão", "Linhaça", "Abacate", "Azeite"] },
    ],
    behavioralRules: [
      { name: "Regra do ovo diário", description: "1 ovo inteiro/dia mínimo — biotina + colina + proteína completa." },
      { name: "Regra da castanha", description: "2 castanhas-do-pará/dia — selênio antioxidante (mais que isso, intoxica)." },
      { name: "Regra dos 90 dias", description: "Pele/cabelo/unha demoram 60–90 dias para mostrar mudança nutricional. Paciência clínica." },
    ],
    disclaimer:
      "Queda intensa, alopecia ou unhas com sulcos exigem investigação médica (tireoide, ferritina, vit. D). Nutrição apoia — não substitui diagnóstico.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Reposição (60 dias)",
      durationWeeks: 8,
      description: "Reabastecer micronutrientes-chave (biotina, zinco, silício, vit. C/E). Proteína alta.",
      dailyKcalTarget: 1700,
      macros: { protein: 35, carb: 40, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 8,
        teaRoutine: ["Chá verde 10h (polifenóis)", "Hibisco 15h", "Cavalinha 17h (silício)"],
        strategies: ["1 ovo/dia mínimo", "2 castanhas-do-pará/dia", "Frutas vermelhas 5x/sem", "Sardinha 1x/sem"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 400,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos (biotina + colina)", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego natural", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
              { foodKey: "whey", name: "Whey protein", quantityG: 30, householdMeasure: "1 scoop", kcal: 120 },
            ]},
            { foodKey: "aveia", name: "Aveia em flocos (silício)", quantityG: 40, householdMeasure: "4 colheres de sopa", kcal: 150, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 50, householdMeasure: "1 disco médio", kcal: 120 },
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
            ]},
            { foodKey: "morango", name: "Morangos (vit. C)", quantityG: 150, householdMeasure: "1 xícara", kcal: 50, substitutions: [
              { foodKey: "kiwi", name: "Kiwi", quantityG: 100, householdMeasure: "1,5 unidade", kcal: 60 },
              { foodKey: "mamao", name: "Mamão", quantityG: 200, householdMeasure: "1 fatia", kcal: 80 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 180,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 105, substitutions: [
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
            ]},
            { foodKey: "castanha", name: "2 castanhas-do-pará (selênio)", quantityG: 10, householdMeasure: "2 unidades", kcal: 75, substitutions: [
              { foodKey: "nozes", name: "Nozes", quantityG: 15, householdMeasure: "4 unidades", kcal: 95 },
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "12 unidades", kcal: 90 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 520,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé médio", kcal: 248, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 140, householdMeasure: "1 bife médio", kcal: 260 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 138, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115 },
              { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres", kcal: 120 },
            ]},
            { foodKey: "feijao", name: "Feijão (zinco)", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
            ]},
            { foodKey: "salada-verde", name: "Salada + tomate + cenoura ralada + limão", quantityG: 200, householdMeasure: "2 xícaras", kcal: 95, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 230,
          items: [
            { foodKey: "tapioca", name: "Tapioca com queijo branco", quantityG: 50, householdMeasure: "1 disco médio", kcal: 120, substitutions: [
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 40, householdMeasure: "1,5 fatia", kcal: 110 },
            ]},
            { foodKey: "queijo-minas", name: "Queijo minas frescal", quantityG: 50, householdMeasure: "2 fatias", kcal: 120, substitutions: [
              { foodKey: "ricota", name: "Ricota", quantityG: 80, householdMeasure: "2 fatias", kcal: 110 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 420,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado (ômega-3)", quantityG: 130, householdMeasure: "1 posta", kcal: 245, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
              { foodKey: "ovo", name: "Omelete recheada", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115, substitutions: [
              { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "4 colheres", kcal: 110 },
            ]},
            { foodKey: "legumes", name: "Mix de legumes refogados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80, substitutions: [
              { foodKey: "brocolis", name: "Brócolis", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Manutenção e Brilho",
      durationWeeks: 8,
      description: "Manter aporte e introduzir colágeno hidrolisado + caldo de osso. Foco no resultado visível.",
      dailyKcalTarget: 1750,
      macros: { protein: 35, carb: 40, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 8,
        teaRoutine: ["Chá verde 10h", "Hibisco 15h"],
        strategies: ["Caldo de osso 2x/sem", "Colágeno hidrolisado 10 g/dia + vit. C (se prescrito)", "Linhaça moída 1 colher/dia"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 420,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos + queijo", quantityG: 150, householdMeasure: "2 ovos + 1 fatia", kcal: 230, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego + whey + linhaça", quantityG: 200, householdMeasure: "1 pote + scoop", kcal: 230 },
            ]},
            { foodKey: "aveia", name: "Aveia + 1 colher de linhaça moída", quantityG: 40, householdMeasure: "4 colheres + linhaça", kcal: 165, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 50, householdMeasure: "1 disco", kcal: 120 },
            ]},
            { foodKey: "morango", name: "Morangos + mirtilo", quantityG: 150, householdMeasure: "1 xícara mista", kcal: 60, substitutions: [
              { foodKey: "kiwi", name: "Kiwi", quantityG: 100, householdMeasure: "1,5 unidade", kcal: 60 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 180,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego + colágeno (se prescrito)", quantityG: 170, householdMeasure: "1 pote", kcal: 105, substitutions: [
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
            ]},
            { foodKey: "castanha", name: "2 castanhas-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 75, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "12 unidades", kcal: 90 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 540,
          items: [
            { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 160, householdMeasure: "1 filé médio-grande", kcal: 265, substitutions: [
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
              { foodKey: "patinho", name: "Patinho grelhado", quantityG: 140, householdMeasure: "1 bife", kcal: 260 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 138, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115 },
            ]},
            { foodKey: "feijao", name: "Feijão preto", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
            ]},
            { foodKey: "salada-verde", name: "Salada colorida + azeite + limão", quantityG: 200, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "brocolis", name: "Brócolis no vapor", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 220,
          items: [
            { foodKey: "whey", name: "Shake: whey + frutas vermelhas + água", quantityG: 30, householdMeasure: "1 scoop + 150 g frutas", kcal: 170, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego + frutas vermelhas", quantityG: 170, householdMeasure: "1 pote + frutas", kcal: 170 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar (Caldo de Osso 2x/sem)", time: "19:30", totalKcal: 390,
          items: [
            { foodKey: "frango-grelhado", name: "Frango (coxa com pele 1x/sem) ou sardinha", quantityG: 140, householdMeasure: "1 porção", kcal: 240, substitutions: [
              { foodKey: "peixe-grelhado", name: "Sardinha assada", quantityG: 130, householdMeasure: "3 unidades", kcal: 230 },
              { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
            ]},
            { foodKey: "legumes", name: "Legumes refogados", quantityG: 250, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "brocolis", name: "Brócolis", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
            ]},
            { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 7, householdMeasure: "1 colher de chá", kcal: 60, substitutions: [
              { foodKey: "abacate", name: "Abacate", quantityG: 40, householdMeasure: "1,5 colher de sopa", kcal: 65 },
            ]},
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ANTIQUEDA
// ---------------------------------------------------------------------------

export const ANTIQUEDA_MODULE: ProtocolModule = {
  id: "antiqueda",
  name: "Módulo Antiqueda de Cabelo",
  tagline: "Ferro, zinco, biotina e proteína — atacar a causa nutricional da queda.",
  methodology: {
    title: "Metodologia Antiqueda — Foco em Ferritina, Zinco e Proteína",
    subtitle:
      "Eflúvio telógeno (queda difusa) responde a déficits de ferritina, zinco, vit. D e proteína. Corrigir + acompanhar exames a cada 90 dias.",
    pillars: [
      { title: "1. Ferro heme + vitamina C", summary: "Ferritina <40 ng/mL é gatilho de queda em mulheres. Carnes vermelhas + cítricos triplicam absorção.", examples: ["Patinho + suco de laranja", "Fígado 1x/sem", "Feijão + limão"] },
      { title: "2. Zinco diário", summary: "Cofator da queratina e da 5-alfa-redutase saudável.", examples: ["Carne vermelha", "Castanha-do-pará", "Sementes de abóbora", "Ovos"] },
      { title: "3. Proteína completa 1,4 g/kg", summary: "Sem proteína suficiente, o folículo entra em fase de repouso.", examples: ["Ovo", "Frango", "Peixe", "Whey", "Iogurte grego"] },
      { title: "4. Biotina, vit. D e ômega-3", summary: "Trio de suporte folicular — vit. D <30 ng/mL = queda agravada.", examples: ["Gema de ovo", "Sardinha", "Salmão", "Linhaça"] },
      { title: "5. Antioxidantes do couro cabeludo", summary: "Polifenóis + vit. E protegem o folículo da inflamação oxidativa.", examples: ["Chá verde", "Frutas vermelhas", "Azeite", "Castanhas"] },
    ],
    behavioralRules: [
      { name: "Regra do ferro + C", description: "Toda refeição com carne ou feijão SEMPRE acompanhada de fruta cítrica ou limão." },
      { name: "Regra do anti-cálcio na refeição de ferro", description: "Não tomar leite/iogurte/queijo na MESMA refeição da fonte principal de ferro — competem na absorção." },
      { name: "Regra dos 90 dias + exame", description: "Reavaliar ferritina, zinco, vit. D, TSH a cada 3 meses. Sem exame, não há manejo." },
    ],
    disclaimer:
      "Queda intensa, com áreas de calvície ou recente perda de cabelo em mecha, exige dermatologista. Nutrição corrige déficit — não trata alopecia androgenética, areata ou cicatricial isoladamente.",
  },
  phases: [
    {
      id: 1,
      name: "Fase 1 — Reposição Agressiva (90 dias)",
      durationWeeks: 12,
      description: "Foco máximo em ferro heme, zinco e proteína. Fígado 1x/semana. Sem laticínios nas refeições de carne.",
      dailyKcalTarget: 1750,
      macros: { protein: 38, carb: 37, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 8,
        teaRoutine: ["Chá verde 10h (polifenóis)", "Cavalinha 15h (silício)", "Camomila 21h (sono)"],
        strategies: ["Patinho ou fígado 5x/sem", "Suco de laranja JUNTO com a carne", "Laticínios só fora das refeições de ferro", "2 castanhas-do-pará/dia"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 380,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos (gema = biotina)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234, substitutions: [
              { foodKey: "frango-desfiado", name: "Frango desfiado", quantityG: 100, householdMeasure: "5 colheres", kcal: 165 },
              { foodKey: "iogurte-grego", name: "Iogurte grego (afastado do almoço)", quantityG: 170, householdMeasure: "1 pote", kcal: 105 },
            ]},
            { foodKey: "pao-integral", name: "Pão integral", quantityG: 40, householdMeasure: "1,5 fatia", kcal: 110, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 50, householdMeasure: "1 disco médio", kcal: 120 },
              { foodKey: "aveia", name: "Aveia", quantityG: 30, householdMeasure: "3 colheres", kcal: 110 },
            ]},
            { foodKey: "kiwi", name: "Kiwi (vit. C)", quantityG: 70, householdMeasure: "1 unidade", kcal: 45, substitutions: [
              { foodKey: "morango", name: "Morangos", quantityG: 150, householdMeasure: "1 xícara", kcal: 50 },
              { foodKey: "laranja", name: "Laranja", quantityG: 130, householdMeasure: "1 unidade", kcal: 60 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 170,
          items: [
            { foodKey: "castanha", name: "2 castanhas-do-pará + 1 punhado pequeno de mix", quantityG: 20, householdMeasure: "1 punhado", kcal: 130, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 20, householdMeasure: "15 unidades", kcal: 120 },
              { foodKey: "nozes", name: "Nozes", quantityG: 20, householdMeasure: "5 unidades", kcal: 125 },
            ]},
            { foodKey: "maca", name: "Maçã", quantityG: 100, householdMeasure: "1 pequena", kcal: 55, substitutions: [
              { foodKey: "banana", name: "Banana", quantityG: 100, householdMeasure: "1 unidade", kcal: 89 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço (REFEIÇÃO-CHAVE DO FERRO)", time: "13:00", totalKcal: 580,
          items: [
            { foodKey: "patinho", name: "Patinho grelhado (ferro heme)", quantityG: 150, householdMeasure: "1 bife médio", kcal: 275, substitutions: [
              { foodKey: "figado", name: "Fígado acebolado (1x/sem — campeão de ferro)", quantityG: 100, householdMeasure: "1 fatia média", kcal: 175 },
              { foodKey: "frango-grelhado", name: "Frango grelhado (com salada de feijão p/ aporte)", quantityG: 150, householdMeasure: "1 filé", kcal: 248 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 138, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115 },
              { foodKey: "quinoa", name: "Quinoa", quantityG: 100, householdMeasure: "4 colheres", kcal: 120 },
            ]},
            { foodKey: "feijao", name: "Feijão preto (ferro não-heme)", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
              { foodKey: "grao-de-bico", name: "Grão de bico", quantityG: 100, householdMeasure: "1 concha", kcal: 120 },
            ]},
            { foodKey: "laranja", name: "Suco de laranja natural (vit. C — potencializa absorção do ferro)", quantityG: 200, householdMeasure: "1 copo", kcal: 90, substitutions: [
              { foodKey: "salada-verde", name: "Salada + tomate + MUITO limão", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde (longe do almoço — pode laticínio)", time: "16:30", totalKcal: 230,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego + whey", quantityG: 170, householdMeasure: "1 pote + scoop", kcal: 200, substitutions: [
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 150, householdMeasure: "5 colheres", kcal: 140 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 420,
          items: [
            { foodKey: "peixe-grelhado", name: "Salmão grelhado (ômega-3 + vit. D)", quantityG: 130, householdMeasure: "1 posta", kcal: 245, substitutions: [
              { foodKey: "peixe-grelhado", name: "Sardinha assada (cálcio + ômega-3)", quantityG: 130, householdMeasure: "3 unidades", kcal: 230 },
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
              { foodKey: "ovo", name: "Omelete (3 ovos)", quantityG: 150, householdMeasure: "3 unidades", kcal: 234 },
            ]},
            { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115, substitutions: [
              { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 80, householdMeasure: "4 colheres", kcal: 110 },
            ]},
            { foodKey: "legumes", name: "Mix de legumes refogados", quantityG: 200, householdMeasure: "2 xícaras", kcal: 80, substitutions: [
              { foodKey: "brocolis", name: "Brócolis", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Fase 2 — Manutenção e Brilho",
      durationWeeks: 12,
      description: "Reavaliação dos exames. Reduz frequência de fígado/patinho e mantém aporte proteico + antioxidantes.",
      dailyKcalTarget: 1700,
      macros: { protein: 33, carb: 42, fat: 25 },
      recommendations: {
        waterMl: 2500, sleepHours: 8,
        teaRoutine: ["Chá verde 10h", "Hibisco 15h"],
        strategies: ["Patinho 3x/sem", "Frango ou peixe nos demais dias", "Linhaça moída 1 colher/dia", "Reavaliar ferritina/zinco/vit. D"],
      },
      meals: [
        {
          id: "cafe_manha", name: "Café da Manhã", time: "07:30", totalKcal: 400,
          items: [
            { foodKey: "ovo", name: "Ovos mexidos", quantityG: 100, householdMeasure: "2 unidades", kcal: 156, substitutions: [
              { foodKey: "iogurte-grego", name: "Iogurte grego + whey", quantityG: 200, householdMeasure: "1 pote + scoop", kcal: 220 },
            ]},
            { foodKey: "aveia", name: "Aveia + linhaça moída", quantityG: 40, householdMeasure: "4 colheres + 1 colher linhaça", kcal: 165, substitutions: [
              { foodKey: "tapioca", name: "Tapioca", quantityG: 50, householdMeasure: "1 disco médio", kcal: 120 },
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 50, householdMeasure: "2 fatias", kcal: 140 },
            ]},
            { foodKey: "morango", name: "Morangos", quantityG: 150, householdMeasure: "1 xícara", kcal: 50, substitutions: [
              { foodKey: "kiwi", name: "Kiwi", quantityG: 70, householdMeasure: "1 unidade", kcal: 45 },
            ]},
          ],
        },
        {
          id: "lanche_manha", name: "Lanche da Manhã", time: "10:30", totalKcal: 180,
          items: [
            { foodKey: "iogurte-grego", name: "Iogurte grego", quantityG: 170, householdMeasure: "1 pote", kcal: 105, substitutions: [
              { foodKey: "queijo-cottage", name: "Cottage", quantityG: 120, householdMeasure: "4 colheres", kcal: 110 },
            ]},
            { foodKey: "castanha", name: "2 castanhas-do-pará", quantityG: 10, householdMeasure: "2 unidades", kcal: 75, substitutions: [
              { foodKey: "amendoa", name: "Amêndoas", quantityG: 15, householdMeasure: "12 unidades", kcal: 90 },
            ]},
          ],
        },
        {
          id: "almoco", name: "Almoço", time: "13:00", totalKcal: 540,
          items: [
            { foodKey: "patinho", name: "Patinho grelhado OU frango", quantityG: 140, householdMeasure: "1 bife médio", kcal: 260, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 150, householdMeasure: "1 filé", kcal: 248 },
              { foodKey: "peixe-grelhado", name: "Tilápia grelhada", quantityG: 180, householdMeasure: "1 filé grande", kcal: 215 },
            ]},
            { foodKey: "arroz-integral", name: "Arroz integral", quantityG: 100, householdMeasure: "5 colheres", kcal: 138, substitutions: [
              { foodKey: "batata-doce", name: "Batata-doce", quantityG: 130, householdMeasure: "1 pequena", kcal: 115 },
            ]},
            { foodKey: "feijao", name: "Feijão", quantityG: 100, householdMeasure: "1 concha", kcal: 80, substitutions: [
              { foodKey: "lentilha", name: "Lentilha", quantityG: 100, householdMeasure: "1 concha", kcal: 95 },
            ]},
            { foodKey: "salada-verde", name: "Salada + tomate + limão", quantityG: 200, householdMeasure: "2 xícaras", kcal: 85, substitutions: [
              { foodKey: "brocolis", name: "Brócolis", quantityG: 200, householdMeasure: "2 xícaras", kcal: 70 },
            ]},
          ],
        },
        {
          id: "lanche_tarde", name: "Lanche da Tarde", time: "16:30", totalKcal: 200,
          items: [
            { foodKey: "tapioca", name: "Tapioca com queijo", quantityG: 50, householdMeasure: "1 disco médio", kcal: 120, substitutions: [
              { foodKey: "pao-integral", name: "Pão integral", quantityG: 40, householdMeasure: "1,5 fatia", kcal: 110 },
            ]},
            { foodKey: "queijo-minas", name: "Queijo minas", quantityG: 40, householdMeasure: "1,5 fatia", kcal: 95, substitutions: [
              { foodKey: "ricota", name: "Ricota", quantityG: 80, householdMeasure: "2 fatias", kcal: 110 },
            ]},
          ],
        },
        {
          id: "jantar", name: "Jantar", time: "19:30", totalKcal: 380,
          items: [
            { foodKey: "peixe-grelhado", name: "Sardinha ou salmão (2x/sem cada)", quantityG: 130, householdMeasure: "1 porção", kcal: 235, substitutions: [
              { foodKey: "frango-grelhado", name: "Frango grelhado", quantityG: 130, householdMeasure: "1 filé médio", kcal: 215 },
              { foodKey: "ovo", name: "Omelete", quantityG: 150, householdMeasure: "3 ovos", kcal: 234 },
            ]},
            { foodKey: "legumes", name: "Legumes refogados", quantityG: 250, householdMeasure: "2 xícaras", kcal: 90, substitutions: [
              { foodKey: "brocolis", name: "Brócolis", quantityG: 250, householdMeasure: "2 xícaras", kcal: 85 },
            ]},
            { foodKey: "azeite", name: "Azeite extravirgem", quantityG: 7, householdMeasure: "1 colher de chá", kcal: 60, substitutions: [
              { foodKey: "abacate", name: "Abacate", quantityG: 40, householdMeasure: "1,5 colher de sopa", kcal: 65 },
            ]},
          ],
        },
      ],
    },
  ],
};
