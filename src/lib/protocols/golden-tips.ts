// Biblioteca de "Dicas de Ouro" (Hacks Metabólicos) por protocolo.
// PURO. Sem IO. Renderizada pelo componente GoldenTips na página de detalhe.
// Cada protocolo tem 3 dicas exclusivas com ação simples e benefício fisiológico.

export type GoldenTipSize = "sm" | "md" | "lg";

export interface GoldenTip {
  readonly emoji: string;
  readonly title: string;
  readonly objective: string;
  readonly howTo: ReadonlyArray<string>;
  readonly benefit?: string;
  /** Tamanho do card no render. Default "md". */
  readonly size?: GoldenTipSize;
}

const GLP1_TIPS: GoldenTip[] = [
  {
    emoji: "⏱️",
    title: "Pausa Metabólica de 20 Minutos™",
    objective: "Aumentar saciedade real antes de repetir o prato.",
    howTo: [
      "Termine a refeição e pare de comer.",
      "Aguarde cerca de 20 minutos.",
      "Beba água, se desejar.",
      "Só então decida se ainda está com fome de verdade.",
    ],
    benefit: "Dá tempo para GLP-1, PYY e CCK sinalizarem saciedade ao cérebro.",
  },
  {
    emoji: "🥩",
    title: "Proteína Âncora™",
    objective: "Reduzir fome ao longo da refeição.",
    howTo: ["Toda refeição começa pela proteína."],
    benefit: "Estabiliza glicemia e aumenta saciedade precoce.",
  },
  {
    emoji: "🥬",
    title: "Metade Verde™",
    objective: "Aumentar volume alimentar com baixa densidade calórica.",
    howTo: ["50% do prato deve ser vegetal."],
    benefit: "Distensão gástrica + fibra = saciedade prolongada.",
  },
];

export const GOLDEN_TIPS_BY_PROTOCOL: Record<string, ReadonlyArray<GoldenTip>> = {
  // GLP-1 Natural (IFJ guarda-chuva + Fit GLP módulo histórico)
  "ifj": GLP1_TIPS,
  "fit-glp": GLP1_TIPS,

  "gastrite": [
    {
      emoji: "🛡️",
      title: "Escudo Gástrico de 3 Minutos™",
      objective: "Reduzir agressão à mucosa gástrica.",
      howTo: [
        "Comece a refeição de forma lenta e tranquila.",
        "Mastigue devagar nos primeiros 3 minutos.",
        "Evite líquidos gelados ou ácidos no início.",
      ],
      benefit: "Reduz acidez reativa e melhora digestão mecânica.",
    },
    {
      emoji: "🍽️",
      title: "Fome Não é Emergência™",
      objective: "Evitar chegar faminto à refeição.",
      howTo: [
        "Mantenha intervalos regulares (3–4h).",
        "Tenha um lanche pequeno de emergência (fruta + castanha).",
      ],
      benefit: "Evita pico de ácido gástrico em estômago vazio.",
    },
    {
      emoji: "📏",
      title: "Estômago 80%™",
      objective: "Evitar distensão excessiva do estômago.",
      howTo: ["Pare de comer antes de sentir estufamento."],
      benefit: "Reduz refluxo e pressão sobre a cárdia.",
    },
  ],

  "jejum-intermitente": [
    {
      emoji: "🥚",
      title: "Primeira Mordida Inteligente™",
      objective: "Quebrar o jejum sem disparar glicemia.",
      howTo: ["Comece pela proteína.", "Evite pão ou doce na primeira mordida."],
      benefit: "Resposta insulínica controlada após o jejum.",
    },
    {
      emoji: "💧",
      title: "Janela Limpa™",
      objective: "Manter o jejum metabólico real.",
      howTo: [
        "Durante o jejum: apenas água, café sem açúcar, chá.",
        "Sem leite, sem adoçante calórico, sem suco.",
      ],
      benefit: "Mantém insulina baixa e autofagia ativa.",
    },
    {
      emoji: "🌙",
      title: "Última Garfada 3h Antes™",
      objective: "Melhorar sono e iniciar jejum noturno.",
      howTo: ["Encerre a alimentação 3h antes de dormir."],
      benefit: "Melhora digestão noturna e qualidade do sono.",
    },
  ],

  "low-carb": [
    {
      emoji: "🔁",
      title: "Troca Invisível™",
      objective: "Reduzir carbo sem sensação de privação.",
      howTo: ["Não retire alimentos — substitua por versões low carb."],
      benefit: "Aumenta adesão de longo prazo.",
    },
    {
      emoji: "🥗",
      title: "Fibra Antes do Carbo™",
      objective: "Reduzir pico glicêmico.",
      howTo: ["Coma salada primeiro, carbo por último."],
      benefit: "Atenua absorção de glicose.",
    },
    {
      emoji: "🆘",
      title: "Emergência Low Carb™",
      objective: "Evitar escorregão por falta de opção.",
      howTo: ["Tenha sempre: ovo cozido, castanhas, queijo, iogurte."],
      benefit: "Cobre fome inesperada sem sair do protocolo.",
    },
  ],

  "ciclo-carbo": [
    {
      emoji: "🎯",
      title: "Ganhe o Carbo™",
      objective: "Usar carbo alto apenas quando faz sentido.",
      howTo: ["Carbo alto apenas em dias de treino intenso ou demanda real."],
      benefit: "Reposição de glicogênio direcionada.",
    },
    {
      emoji: "⚖️",
      title: "Dia Alto ≠ Dia Livre",
      objective: "Manter qualidade nutricional no ciclo.",
      howTo: ["Mais carbo não significa comer qualquer coisa — priorize fontes limpas."],
      benefit: "Aproveita janela anabólica sem inflamar.",
    },
    {
      emoji: "🏋️",
      title: "Treino Merece Energia™",
      objective: "Sincronizar carbo com performance.",
      howTo: ["Concentre o maior carbo do dia próximo ao treino."],
      benefit: "Melhora rendimento e recuperação.",
    },
  ],

  "agua": [
    {
      emoji: "🌅",
      title: "Regra dos Primeiros 500ml™",
      objective: "Reidratar após o jejum noturno.",
      howTo: ["Beba 500ml de água ao acordar, antes do café."],
      benefit: "Acelera trânsito intestinal e desperta o metabolismo.",
    },
    {
      emoji: "🍶",
      title: "Gatilho da Garrafa™",
      objective: "Hidratar passivamente ao longo do dia.",
      howTo: ["Carregue uma garrafa para todo lugar — vê = bebe."],
      benefit: "Aumenta ingestão sem esforço cognitivo.",
    },
    {
      emoji: "🟡",
      title: "Xixi Palha™",
      objective: "Avaliar hidratação na prática.",
      howTo: ["Urina amarelo-clara = hidratação adequada.", "Amarelo escuro = beba mais agora."],
    },
  ],

  "anti-ansiedade": [
    {
      emoji: "🧠",
      title: "Fome ou Emoção?™",
      objective: "Diferenciar fome física de emocional.",
      howTo: ["Espere 10 minutos antes de comer.", "Se a vontade passou, era emoção."],
      benefit: "Reduz episódios de compulsão.",
    },
    {
      emoji: "🍓",
      title: "Lanche Calmante™",
      objective: "Estabilizar humor e glicemia.",
      howTo: ["Combine proteína + fruta no lanche."],
      benefit: "Fornece triptofano e evita pico glicêmico.",
    },
    {
      emoji: "🛋️",
      title: "Regra do Sofá™",
      objective: "Evitar comer no automático.",
      howTo: ["Não coma assistindo TV ou rolando o celular."],
      benefit: "Aumenta percepção de saciedade.",
    },
  ],

  "anti-enxaqueca": [
    {
      emoji: "☕",
      title: "Nunca Pule o Café da Manhã™",
      objective: "Evitar gatilho por hipoglicemia.",
      howTo: ["Faça o café da manhã em até 1h após acordar."],
      benefit: "Longos jejuns são gatilho frequente.",
    },
    {
      emoji: "💧",
      title: "Hidratação Primeiro™",
      objective: "Excluir desidratação antes de medicar.",
      howTo: ["Ao primeiro sinal de dor, beba 500ml de água."],
      benefit: "Dor de cabeça pode ser sede mal interpretada.",
    },
    {
      emoji: "📓",
      title: "Diário dos Gatilhos™",
      objective: "Identificar padrões individuais.",
      howTo: ["Registre diariamente: sono, estresse, alimentação."],
      benefit: "Permite mapeamento personalizado dos gatilhos.",
    },
  ],

  "antiparasitario": [
    {
      emoji: "🧼",
      title: "Lavar é Tratar™",
      objective: "Eliminar carga parasitária dos vegetais.",
      howTo: [
        "Lave em água corrente.",
        "Deixe 15 min em solução clorada (1 colher de água sanitária por L).",
        "Enxágue em água filtrada.",
      ],
    },
    {
      emoji: "🚰",
      title: "Água Segura™",
      objective: "Reduzir reinfecção via água.",
      howTo: ["Priorize água filtrada ou fervida."],
    },
    {
      emoji: "💅",
      title: "Unha Curta™",
      objective: "Reduzir reinfecção fecal-oral.",
      howTo: ["Mantenha unhas curtas e limpas.", "Lave as mãos antes das refeições."],
    },
  ],

  "anticelulite": [
    {
      emoji: "💧",
      title: "Água Move Linfa™",
      objective: "Reduzir retenção hídrica.",
      howTo: ["Mantenha 35ml/kg de água por dia."],
      benefit: "Pouca água = mais retenção e aparência de celulite.",
    },
    {
      emoji: "🚶",
      title: "Movimento Diário™",
      objective: "Estimular drenagem linfática.",
      howTo: ["Caminhe pelo menos 30 minutos por dia."],
    },
    {
      emoji: "🌈",
      title: "Colora o Prato™",
      objective: "Aumentar antioxidantes anti-inflamatórios.",
      howTo: ["Inclua pelo menos 3 cores de vegetais por refeição."],
    },
  ],

  "antiqueda": [
    {
      emoji: "🥩",
      title: "Proteína é Matéria-Prima™",
      objective: "Fornecer aminoácidos para o folículo.",
      howTo: ["Atinja 1.6–2.0g/kg de proteína por dia."],
      benefit: "Cabelo é majoritariamente proteína (queratina).",
    },
    {
      emoji: "⚠️",
      title: "Dieta Restritiva Cobra Juros™",
      objective: "Evitar eflúvio telógeno por restrição.",
      howTo: ["Evite déficits maiores que 500 kcal/dia."],
      benefit: "Emagrecer rápido demais aumenta queda em 2–3 meses.",
    },
    {
      emoji: "🍊",
      title: "Prato do Folículo™",
      objective: "Maximizar absorção de ferro.",
      howTo: ["Combine proteína + ferro + vitamina C na mesma refeição."],
    },
  ],

  "anti-inflamatorio": [
    {
      emoji: "5️⃣",
      title: "Regra dos 5 Ingredientes™",
      objective: "Reduzir ultraprocessados.",
      howTo: ["Evite produtos com mais de 5 ingredientes industriais no rótulo."],
    },
    {
      emoji: "🌈",
      title: "Arco-Íris Nutricional™",
      objective: "Diversificar fitoquímicos.",
      howTo: ["Consuma 5 cores diferentes de vegetais/frutas por dia."],
    },
    {
      emoji: "🐟",
      title: "Peixe da Semana™",
      objective: "Aumentar ômega-3.",
      howTo: ["Inclua peixe gorduroso (salmão, sardinha, atum) 2x/semana."],
    },
  ],

  "antiinchaco": [
    {
      emoji: "🦷",
      title: "Mastigue 20x™",
      objective: "Reduzir aerofagia.",
      howTo: ["Mastigue cada garfada cerca de 20 vezes."],
      benefit: "Engolir ar é uma das maiores causas de estufamento.",
    },
    {
      emoji: "🧂",
      title: "Sal Escondido™",
      objective: "Reduzir retenção hídrica.",
      howTo: ["Reduza ultraprocessados — eles têm mais sódio que o saleiro."],
    },
    {
      emoji: "🚶",
      title: "Caminhada Digestiva™",
      objective: "Estimular trânsito gástrico.",
      howTo: ["Caminhe 10 minutos após as principais refeições."],
    },
  ],

  "beleza": [
    {
      emoji: "🧱",
      title: "Colágeno Precisa de Tijolos™",
      objective: "Fornecer substrato para síntese de colágeno.",
      howTo: ["Consuma proteína de qualidade em todas as refeições."],
    },
    {
      emoji: "☀️",
      title: "Bronze de Dentro™",
      objective: "Aumentar carotenoides na pele.",
      howTo: ["Inclua cenoura, abóbora, mamão, manga diariamente."],
    },
    {
      emoji: "💧",
      title: "Pele Hidratada Começa na Garrafa™",
      objective: "Manter elasticidade cutânea.",
      howTo: ["Atinja 35ml/kg de água por dia."],
    },
  ],

  "anticonstipacao": [
    {
      emoji: "🔱",
      title: "Tríade do Intestino™",
      objective: "Atacar as 3 causas principais.",
      howTo: ["Garanta diariamente: água + fibra + movimento."],
    },
    {
      emoji: "⏰",
      title: "Horário Sagrado™",
      objective: "Treinar reflexo gastro-cólico.",
      howTo: ["Tente evacuar sempre no mesmo horário, de preferência após o café da manhã."],
    },
    {
      emoji: "🥤",
      title: "Primeiro Copo™",
      objective: "Despertar o intestino.",
      howTo: ["Beba 500ml de água ao acordar, antes de qualquer coisa."],
    },
  ],

  "pre-natal": [
    {
      emoji: "🍊",
      title: "Ferro Nunca Sozinho™",
      objective: "Maximizar absorção de ferro.",
      howTo: ["Combine fonte de ferro com vitamina C (laranja, acerola, limão) na mesma refeição."],
    },
    {
      emoji: "🎒",
      title: "Lanche de Emergência™",
      objective: "Evitar enjoo por estômago vazio.",
      howTo: ["Tenha bolacha de água/biscoito simples ou fruta sempre à mão."],
    },
    {
      emoji: "🍽️",
      title: "Pequenas Refeições™",
      objective: "Aumentar tolerância digestiva.",
      howTo: ["Faça 5–6 refeições pequenas em vez de 3 grandes."],
    },
  ],

  "resistencia-insulina": [
    {
      emoji: "🤝",
      title: "Carbo Nunca Sozinho™",
      objective: "Reduzir pico glicêmico.",
      howTo: ["Combine sempre carbo + proteína + fibra."],
    },
    {
      emoji: "🚶",
      title: "Caminhada da Glicose™",
      objective: "Aumentar captação muscular de glicose.",
      howTo: ["Caminhe 10 minutos logo após cada refeição principal."],
      benefit: "Músculo capta glicose sem precisar de insulina.",
    },
    {
      emoji: "🔢",
      title: "Sequência Inteligente™",
      objective: "Achatar a curva glicêmica.",
      howTo: ["Coma na ordem: vegetal → proteína → carbo."],
    },
  ],

  "anemia": [
    {
      emoji: "🍋",
      title: "Dupla do Ferro™",
      objective: "Aumentar biodisponibilidade do ferro.",
      howTo: ["Sempre combine ferro com vitamina C na mesma refeição."],
    },
    {
      emoji: "☕",
      title: "Café Distante™",
      objective: "Evitar inibição da absorção.",
      howTo: ["Evite café, chá preto e mate até 1h antes/depois das refeições principais."],
    },
    {
      emoji: "📅",
      title: "Ferro Todo Dia™",
      objective: "Construir estoque consistente.",
      howTo: ["Consistência diária supera doses isoladas exageradas."],
    },
  ],

  "sop": [
    {
      emoji: "♀️",
      title: "Prato Hormonal™",
      objective: "Estabilizar insulina e andrógenos.",
      howTo: ["Inclua proteína em TODAS as refeições, sem exceção."],
    },
    {
      emoji: "🌾",
      title: "Carbo Estratégico™",
      objective: "Reduzir resistência insulínica.",
      howTo: ["Priorize carbo integral; evite refinados e açúcar livre."],
    },
    {
      emoji: "💪",
      title: "Músculo é Remédio™",
      objective: "Aumentar sensibilidade à insulina.",
      howTo: ["Treino de força 3x/semana é parte do tratamento, não opcional."],
    },
  ],
};

export function getGoldenTipsFor(protocolId: string): ReadonlyArray<GoldenTip> {
  return GOLDEN_TIPS_BY_PROTOCOL[protocolId] ?? [];
}
