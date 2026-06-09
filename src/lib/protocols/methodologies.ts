// Biblioteca de Metodologias por protocolo.
// PURO. Sem IO. Mesmo shape de ModuleMethodology (compatível com ModuleMethodologyCard).
// Quando um módulo já define methodology própria (Fit GLP, Gastrite), ela tem precedência.

import type { ModuleMethodology } from "./catalog";

export const METHODOLOGIES_BY_PROTOCOL: Record<string, ModuleMethodology> = {
  // IFJ (guarda-chuva) — usa a metodologia do Fit GLP como referência geral
  "ifj": {
    title: "Metodologia Inteligência FitJourney",
    subtitle:
      "Plataforma clínica modular: cada módulo aplica princípios fisiológicos específicos sobre uma base comum de saciedade, estabilidade glicêmica e comportamento.",
    pillars: [
      {
        title: "1. Base metabólica",
        summary: "Proteína em todas as refeições, fibra estratégica e controle de velocidade glicêmica.",
        examples: ["Proteína 1.6–2.0 g/kg", "Fibra ≥ 25 g/dia", "Carbo + fibra sempre juntos"],
      },
      {
        title: "2. Camada comportamental",
        summary: "Hacks metabólicos e rotinas de adesão antes de qualquer restrição calórica agressiva.",
        examples: ["Pausa de 20 min", "Caminhada pós-refeição", "Janela de jejum noturna"],
      },
      {
        title: "3. Personalização por módulo",
        summary: "O módulo ativo define o ajuste fino (GLP-1, gastrite, SOP, anemia, etc.) sobre a base.",
      },
    ],
    behavioralRules: [
      { name: "Proteína primeiro", description: "A primeira garfada de toda refeição é proteína." },
      { name: "Hidratação consciente", description: "35 ml/kg/dia distribuídos ao longo do dia." },
      { name: "Movimento diário", description: "Pelo menos 30 min de caminhada, idealmente após refeições." },
    ],
  },

  "fit-glp": {
    title: "Metodologia GLP-1 Natural",
    subtitle: "Maximizar saciedade endógena (GLP-1, PYY, CCK) sem fármaco.",
    pillars: [
      { title: "1. Pré-carga de saciedade", summary: "Distensão gástrica leve antes da refeição.", examples: ["300–500 ml água 10 min antes", "Salada crua de entrada"] },
      { title: "2. Proteína primeiro", summary: "Estabiliza glicemia e antecipa saciedade." },
      { title: "3. Fibra estratégica", summary: "Distribuir fibras solúveis e insolúveis ao longo do dia." },
    ],
    behavioralRules: [
      { name: "Pausa de 20 minutos", description: "Aguarde antes de repetir o prato." },
      { name: "Mastigar 20x", description: "Tempo de mastigação prolonga sinal de saciedade." },
      { name: "Caminhar 10 min após comer", description: "Reduz pico glicêmico e acelera esvaziamento gástrico." },
    ],
  },

  "gastrite": {
    title: "Metodologia Anti-Inflamatória Gástrica",
    subtitle: "Reduzir agressão à mucosa e regenerar a barreira gástrica.",
    pillars: [
      { title: "1. Proteção da mucosa", summary: "Evitar irritantes diretos e manter pH adequado.", examples: ["Sem café puro em jejum", "Sem álcool", "Sem AINEs por conta"] },
      { title: "2. Fracionamento", summary: "Refeições menores e mais frequentes para evitar estômago vazio prolongado." },
      { title: "3. Suporte regenerativo", summary: "Nutrientes que apoiam reparo do epitélio gástrico.", examples: ["Glutamina", "Zinco", "Vitamina A"] },
    ],
    behavioralRules: [
      { name: "Mastigar devagar", description: "Reduz trabalho mecânico do estômago." },
      { name: "Sem deitar após comer", description: "Aguarde 2 h para reduzir refluxo." },
      { name: "Estômago 80%", description: "Pare antes do estufamento." },
    ],
  },

  "jejum-intermitente": {
    title: "Metodologia Jejum Metabólico",
    subtitle: "Janela alimentar controlada para melhora de sensibilidade insulínica e autofagia.",
    pillars: [
      { title: "1. Janela alimentar", summary: "Concentrar ingestão em 8–10 h; jejum 14–16 h.", examples: ["12h–20h", "10h–18h"] },
      { title: "2. Qualidade da quebra", summary: "Primeira refeição rica em proteína e fibra, pobre em refinados." },
      { title: "3. Jejum limpo", summary: "Durante o jejum: apenas água, café preto, chá. Zero calorias." },
    ],
    behavioralRules: [
      { name: "Hidratação no jejum", description: "Aumentar água para evitar dor de cabeça." },
      { name: "Treino na janela", description: "Preferir treinos próximos da janela alimentar." },
      { name: "Sono consistente", description: "Jejum não compensa sono ruim." },
    ],
  },

  "low-carb": {
    title: "Metodologia Low Carb Estruturada",
    subtitle: "Redução controlada de carboidratos com priorização de saciedade e adesão.",
    pillars: [
      { title: "1. Carbo de qualidade", summary: "Eliminar refinados; manter raízes, frutas e leguminosas em volume reduzido." },
      { title: "2. Proteína elevada", summary: "1.8–2.2 g/kg para preservar massa magra." },
      { title: "3. Gordura como aliada", summary: "Azeite, abacate, castanhas, peixes gordurosos." },
    ],
    behavioralRules: [
      { name: "Fibra antes do carbo", description: "Salada primeiro reduz pico glicêmico." },
      { name: "Sem bebida calórica", description: "Sucos e refrigerantes saem do plano." },
      { name: "Substituir, não privar", description: "Trocar versões em vez de eliminar refeições." },
    ],
  },

  "ciclo-carbo": {
    title: "Metodologia Carbo Cycling",
    subtitle: "Variação calculada de carboidratos por dia conforme demanda metabólica.",
    pillars: [
      { title: "1. Dias altos", summary: "Treino intenso ou longo: carbo elevado para reposição de glicogênio." },
      { title: "2. Dias baixos", summary: "Descanso ou treino leve: carbo reduzido, gordura mais alta." },
      { title: "3. Proteína fixa", summary: "Independente do ciclo, mantém-se constante." },
    ],
    behavioralRules: [
      { name: "Sincronizar com treino", description: "Carbo concentrado peri-treino em dias altos." },
      { name: "Dia alto ≠ dia livre", description: "Qualidade nutricional permanece." },
      { name: "Registrar resposta", description: "Composição corporal a cada 2 semanas." },
    ],
  },

  "agua": {
    title: "Metodologia de Hidratação Funcional",
    subtitle: "Hidratação como vetor de saciedade, performance cognitiva e drenagem.",
    pillars: [
      { title: "1. Meta diária", summary: "35 ml/kg de peso corporal, ajustado por clima e atividade." },
      { title: "2. Distribuição", summary: "Beber em intervalos regulares; evitar grandes volumes às refeições." },
      { title: "3. Eletrólitos", summary: "Em calor ou esforço intenso, repor sódio, potássio e magnésio." },
    ],
    behavioralRules: [
      { name: "500 ml ao acordar", description: "Reidrata após jejum noturno." },
      { name: "Garrafa visível", description: "Vê = bebe." },
      { name: "Xixi palha", description: "Urina amarelo-clara como termômetro." },
    ],
  },

  "anti-ansiedade": {
    title: "Metodologia Nutrição-Comportamento",
    subtitle: "Estabilizar humor via glicemia, microbiota e precursores de neurotransmissores.",
    pillars: [
      { title: "1. Estabilidade glicêmica", summary: "Evitar picos e quedas que disparam ansiedade." },
      { title: "2. Triptofano e magnésio", summary: "Suporte para serotonina e relaxamento neuromuscular.", examples: ["Banana", "Aveia", "Castanhas", "Cacau 70%"] },
      { title: "3. Eixo intestino-cérebro", summary: "Fibras prebióticas e fermentados para microbiota saudável." },
    ],
    behavioralRules: [
      { name: "Esperar 10 min", description: "Diferenciar fome real de gatilho emocional." },
      { name: "Comer sem tela", description: "Aumenta percepção de saciedade." },
      { name: "Cafeína controlada", description: "Limitar a 1–2 doses até as 14 h." },
    ],
  },

  "anti-enxaqueca": {
    title: "Metodologia Anti-Enxaqueca Nutricional",
    subtitle: "Identificar gatilhos alimentares e estabilizar fatores moduladores.",
    pillars: [
      { title: "1. Evitar gatilhos", summary: "Reduzir alimentos tiraminados e ricos em aminas vasoativas.", examples: ["Queijos amarelos", "Embutidos", "Vinho tinto", "Chocolate em excesso"] },
      { title: "2. Estabilidade glicêmica", summary: "Hipoglicemia é gatilho frequente — sem pular refeições." },
      { title: "3. Hidratação e magnésio", summary: "Magnésio reduz frequência e intensidade." },
    ],
    behavioralRules: [
      { name: "Diário de gatilhos", description: "Mapear padrões pessoais." },
      { name: "Sem jejum prolongado", description: "Intervalos máximos de 4–5 h." },
      { name: "Hidratação ao primeiro sinal", description: "500 ml de água ao notar aura." },
    ],
  },

  "antiparasitario": {
    title: "Metodologia Antiparasitária Nutricional",
    subtitle: "Reduzir ambiente favorável ao parasita e fortalecer barreira intestinal.",
    pillars: [
      { title: "1. Higiene alimentar", summary: "Lavagem correta de vegetais e segurança da água.", examples: ["Solução clorada", "Água filtrada/fervida"] },
      { title: "2. Alimentos antiparasitários", summary: "Inclusão de itens com ação coadjuvante.", examples: ["Alho", "Semente de abóbora", "Cravo", "Coco"] },
      { title: "3. Reforço da mucosa", summary: "Glutamina, zinco e probióticos pós-tratamento." },
    ],
    behavioralRules: [
      { name: "Lavar é tratar", description: "Toda folha passa por solução clorada." },
      { name: "Unha curta", description: "Reduz reinfecção fecal-oral." },
      { name: "Água segura", description: "Filtrada ou fervida sempre." },
    ],
  },

  "anticelulite": {
    title: "Metodologia Anti-Celulite",
    subtitle: "Reduzir retenção, inflamação e fibrose do tecido subcutâneo.",
    pillars: [
      { title: "1. Drenagem", summary: "Hidratação adequada e redução de sódio oculto." },
      { title: "2. Anti-inflamatório", summary: "Ômega-3, polifenóis e antioxidantes diários." },
      { title: "3. Suporte ao colágeno", summary: "Proteína suficiente, vitamina C, silício." },
    ],
    behavioralRules: [
      { name: "35 ml/kg de água", description: "Pouca água = mais retenção." },
      { name: "Caminhada 30 min/dia", description: "Estimula drenagem linfática." },
      { name: "Reduzir ultraprocessados", description: "Principal fonte de sódio oculto." },
    ],
  },

  "antiqueda": {
    title: "Metodologia Capilar Nutricional",
    subtitle: "Fornecer matéria-prima e cofatores para o folículo piloso.",
    pillars: [
      { title: "1. Proteína", summary: "1.6–2.0 g/kg — cabelo é queratina." },
      { title: "2. Ferro e ferritina", summary: "Combinação com vitamina C para absorção." },
      { title: "3. Cofatores", summary: "Zinco, biotina, vitamina D, ômega-3." },
    ],
    behavioralRules: [
      { name: "Sem déficit agressivo", description: "Acima de 500 kcal/dia aumenta eflúvio." },
      { name: "Ferro + vitamina C", description: "Mesma refeição." },
      { name: "Sono ≥ 7h", description: "Regeneração folicular é noturna." },
    ],
  },

  "anti-inflamatorio": {
    title: "Metodologia Anti-Inflamatória",
    subtitle: "Reduzir inflamação crônica de baixo grau por densidade de fitoquímicos e ômega-3.",
    pillars: [
      { title: "1. Diversidade vegetal", summary: "Pelo menos 30 plantas diferentes por semana." },
      { title: "2. Ômega-3", summary: "Peixe gorduroso 2x/semana ou suplementação dirigida." },
      { title: "3. Redução de ultraprocessados", summary: "Eliminar gorduras trans e açúcar livre." },
    ],
    behavioralRules: [
      { name: "Regra dos 5 ingredientes", description: "Evitar rótulos com mais de 5 industriais." },
      { name: "Arco-íris no prato", description: "5 cores de vegetais/frutas por dia." },
      { name: "Peixe da semana", description: "Inclusão fixa no plano." },
    ],
  },

  "antiinchaco": {
    title: "Metodologia Anti-Inchaço",
    subtitle: "Reduzir distensão abdominal por aerofagia, FODMAPs e retenção hídrica.",
    pillars: [
      { title: "1. Reduzir aerofagia", summary: "Mastigação lenta, sem canudo, sem gomas." },
      { title: "2. FODMAPs sob controle", summary: "Identificar gatilhos individuais por teste de reintrodução." },
      { title: "3. Sódio consciente", summary: "Reduzir ultraprocessados, fonte oculta de retenção." },
    ],
    behavioralRules: [
      { name: "Mastigar 20x", description: "Engolir ar é causa principal de inchaço." },
      { name: "Caminhada digestiva", description: "10 min após refeições." },
      { name: "Sem refrigerante", description: "Gás carbônico distende o estômago." },
    ],
  },

  "beleza": {
    title: "Metodologia Beleza de Dentro",
    subtitle: "Pele, cabelo e unhas como expressão do estado nutricional sistêmico.",
    pillars: [
      { title: "1. Substrato proteico", summary: "Aminoácidos para colágeno, queratina e elastina." },
      { title: "2. Antioxidantes", summary: "Carotenoides, polifenóis, vitaminas C e E." },
      { title: "3. Hidratação e ômega-3", summary: "Manutenção da barreira cutânea." },
    ],
    behavioralRules: [
      { name: "Proteína em toda refeição", description: "Distribuir aporte de aminoácidos." },
      { name: "Bronze de dentro", description: "Carotenoides diários (cenoura, abóbora, mamão)." },
      { name: "Hidratação 35 ml/kg", description: "Elasticidade cutânea começa na garrafa." },
    ],
  },

  "anticonstipacao": {
    title: "Metodologia Intestino em Movimento",
    subtitle: "Atacar simultaneamente as 3 causas: água, fibra e movimento.",
    pillars: [
      { title: "1. Fibra solúvel + insolúvel", summary: "25–35 g/dia com balanço entre os dois tipos." },
      { title: "2. Hidratação real", summary: "Fibra sem água = constipação pior." },
      { title: "3. Movimento", summary: "Atividade física estimula o peristaltismo." },
    ],
    behavioralRules: [
      { name: "Tríade do intestino", description: "Água + fibra + movimento todos os dias." },
      { name: "Horário sagrado", description: "Mesmo horário diário, idealmente pós-café." },
      { name: "Primeiro copo", description: "500 ml de água ao acordar." },
    ],
  },

  "pre-natal": {
    title: "Metodologia Nutricional Gestacional",
    subtitle: "Demandas aumentadas de ferro, folato, iodo, colina, DHA e proteína.",
    pillars: [
      { title: "1. Micronutrientes-chave", summary: "Ferro, folato, iodo, B12, colina, DHA, vitamina D." },
      { title: "2. Proteína suficiente", summary: "+25 g/dia a partir do 2º trimestre." },
      { title: "3. Segurança alimentar", summary: "Evitar listeria, mercúrio alto, álcool, queijos crus." },
    ],
    behavioralRules: [
      { name: "Ferro + vitamina C", description: "Mesma refeição para absorção." },
      { name: "Lanche de emergência", description: "Reduz náusea por estômago vazio." },
      { name: "5–6 refeições pequenas", description: "Melhora tolerância digestiva." },
    ],
  },

  "resistencia-insulina": {
    title: "Metodologia de Sensibilização Insulínica",
    subtitle: "Achatar curva glicêmica e aumentar captação muscular de glicose.",
    pillars: [
      { title: "1. Qualidade do carbo", summary: "Integrais, com fibra e proteína associadas." },
      { title: "2. Sequência da refeição", summary: "Vegetal → proteína → carbo." },
      { title: "3. Músculo como remédio", summary: "Treino de força aumenta GLUT-4." },
    ],
    behavioralRules: [
      { name: "Carbo nunca sozinho", description: "Sempre com proteína e fibra." },
      { name: "Caminhada da glicose", description: "10 min após cada refeição." },
      { name: "Sem ultraprocessados", description: "Refinados disparam pico insulínico." },
    ],
  },

  "anemia": {
    title: "Metodologia Anti-Anemia",
    subtitle: "Reposição de ferro biodisponível com cofatores e remoção de inibidores.",
    pillars: [
      { title: "1. Ferro heme e não-heme", summary: "Carnes vermelhas magras, vísceras, leguminosas, folhas verde-escuras." },
      { title: "2. Cofatores", summary: "Vitamina C, B12, folato, cobre." },
      { title: "3. Inibidores afastados", summary: "Café, chá preto, cálcio e fitatos longe do ferro." },
    ],
    behavioralRules: [
      { name: "Dupla do ferro", description: "Ferro + vitamina C na mesma refeição." },
      { name: "Café distante", description: "1 h antes/depois das principais." },
      { name: "Consistência diária", description: "Estoque se constrói com regularidade." },
    ],
  },

  "sop": {
    title: "Metodologia SOP — Eixo Insulina/Andrógenos",
    subtitle: "Reduzir hiperinsulinemia para modular ovário e hiperandrogenismo.",
    pillars: [
      { title: "1. Controle glicêmico", summary: "Carbos integrais, sem refinados, sem açúcar livre." },
      { title: "2. Proteína distribuída", summary: "1.6–2.0 g/kg em todas as refeições." },
      { title: "3. Anti-inflamatório", summary: "Ômega-3, polifenóis, inositol (quando indicado)." },
    ],
    behavioralRules: [
      { name: "Treino de força 3x/semana", description: "Aumenta sensibilidade insulínica." },
      { name: "Sem pular refeições", description: "Estabilidade glicêmica é tratamento." },
      { name: "Sono ≥ 7 h", description: "Privação piora resistência insulínica." },
    ],
  },
};

export function getMethodologyFor(protocolId: string): ModuleMethodology | undefined {
  return METHODOLOGIES_BY_PROTOCOL[protocolId];
}
