/**
 * Conteúdo editável da Landing Page.
 *
 * Estrutura (schema v1): apenas os campos que o admin pode editar pela UI.
 * O JSX da landing (gradientes, animações, ícones, layout) permanece fixo
 * em `src/routes/index.tsx`. Esta camada cobre textos, listas e mídias.
 */

import { supabase } from "@/integrations/supabase/client";

export const LANDING_SCHEMA_VERSION = 1;

export type LandingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  popular: boolean;
  features: string[];
  cta: string;
};

export type LandingFaq = { id: string; q: string; a: string };
export type LandingTestimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
};
export type LandingStat = { id: string; value: string; label: string };

export type LandingContent = {
  hero: {
    badge: string;
    title_line1: string;
    title_line2: string; // renderizado com destaque dourado
    description: string;
    cta_primary: string;
    cta_secondary: string;
    trust_items: string[]; // 3 itens de "sem cartão..."
    hero_media_url: string; // se vazio, mostra a logo orbital padrão
    hero_media_type: "image" | "video" | "logo-orbital";
  };
  obstacle: {
    visible: boolean;
    eyebrow: string;
    title_line1: string;
    title_line2: string;
    description: string;
    cards: Array<{
      id: string;
      title: string;
      desc: string;
      consequence: string;
      tone: "primary" | "gold";
    }>;
    footer_text: string;
  };
  features: {
    visible: boolean;
    eyebrow: string;
    title_line1: string;
    title_line2: string;
    description: string;
    items: Array<{ id: string; icon: string; title: string; desc: string; tag: string }>;
  };
  pricing: {
    visible: boolean;
    eyebrow: string;
    title_line1: string;
    title_line2: string;
    description: string;
    plans: LandingPlan[];
  };
  testimonials: {
    visible: boolean;
    eyebrow: string;
    title: string;
    items: LandingTestimonial[];
  };
  faq: {
    visible: boolean;
    eyebrow: string;
    title: string;
    items: LandingFaq[];
  };
  stats: { visible: boolean; items: LandingStat[] };
  final_cta: {
    visible: boolean;
    title: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
  };
  trust_badges: { visible: boolean; items: Array<{ id: string; label: string }> };
};

/** Conteúdo padrão (usado como fallback e como seed inicial do editor). */
export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    badge: "Nutrição clínica determinística + IA",
    title_line1: "Atendimento clínico de excelência.",
    title_line2: "Sem retrabalho.",
    description:
      "O FitJourney concentra anamnese, avaliação física, plano alimentar, gamificação e financeiro em uma única plataforma — com IA que economiza horas e o Protocolo FitJourney™ que garante decisões clínicas auditáveis.",
    cta_primary: "Testar 3 dias grátis",
    cta_secondary: "Conhecer recursos",
    trust_items: [
      "Sem cartão de crédito",
      "Acesso imediato",
      "Pacientes acessam por convite",
    ],
    hero_media_url: "",
    hero_media_type: "logo-orbital",
  },
  obstacle: {
    visible: true,
    eyebrow: "O obstáculo invisível",
    title_line1: "Cada atendimento esconde",
    title_line2: "horas de retrabalho",
    description:
      "Não é falta de organização. É falta de uma plataforma feita para a rotina clínica do nutricionista moderno — onde anamnese, plano, IA e engajamento conversam entre si.",
    cards: [
      {
        id: "c1",
        title: "Atendimento fragmentado",
        desc: "Prontuário num sistema, anamnese em PDF, plano na planilha, conversa no WhatsApp pessoal.",
        consequence: "30–40 min/dia procurando arquivos — 15 horas perdidas por mês.",
        tone: "primary",
      },
      {
        id: "c2",
        title: "Plano alimentar tomando suas noites",
        desc: "Cada plano leva 40–60 min. Você fecha o consultório e passa a noite montando entregas.",
        consequence:
          "Um teto artificial no faturamento. O tempo cresce, mas o número de pacientes estagna.",
        tone: "gold",
      },
      {
        id: "c3",
        title: "Adesão sem ferramentas reais",
        desc: "Lembretes manuais, follow-up no boca-a-boca, sem dado clínico em tempo real.",
        consequence:
          "Paciente sumindo no meio do plano e resultado clínico que não aparece nas redes.",
        tone: "primary",
      },
    ],
    footer_text:
      "Junte-se aos nutricionistas que recuperaram suas noites — com decisões clínicas auditáveis e pacientes mais engajados.",
  },
  features: {
    visible: true,
    eyebrow: "Recursos",
    title_line1: "Tudo que você precisa.",
    title_line2: "Nada que você não precisa.",
    description:
      "13 módulos integrados para transformar seu consultório de nutrição em uma experiência premium.",
    items: [
      { id: "f1", icon: "Brain", title: "IA Integrada", tag: "Core", desc: "Análise de refeições por foto, geração automática de planos alimentares e receitas personalizadas com inteligência artificial." },
      { id: "f2", icon: "Shield", title: "Protocolo FitJourney™", tag: "Exclusivo", desc: "Motor clínico 100% determinístico: onboarding guiado, cálculos automáticos (TMB/TDEE), geração de pré-planos com scoring inteligente e auditabilidade total." },
      { id: "f3", icon: "Users", title: "Gestão de Pacientes", tag: "Gestão", desc: "Cadastro completo, anamnese inteligente, timeline de eventos, scoring de engajamento e prontuário digital." },
      { id: "f4", icon: "Dumbbell", title: "Módulo Personal Trainer", tag: "Novo", desc: "Gestão completa de treinos, anamnese fitness, biblioteca de exercícios e acompanhamento de carga e esforço." },
      { id: "f5", icon: "BarChart3", title: "Avaliação Física Completa", tag: "Clínico", desc: "Dobras cutâneas (Jackson-Pollock 7), circunferências, composição corporal, IMC, TMB e TDEE automático." },
      { id: "f6", icon: "Utensils", title: "Planos Alimentares", tag: "Nutrição", desc: "Crie planos detalhados por dia/refeição com metas de macros, templates reutilizáveis e agendamento inteligente." },
      { id: "f7", icon: "Zap", title: "Gamificação Avançada", tag: "Engajamento", desc: "XP, streaks, conquistas, desafios semanais e ranking. Aumente a adesão do paciente em até 3x." },
      { id: "f8", icon: "MessageSquare", title: "Chat em Tempo Real", tag: "Comunicação", desc: "Acompanhamento direto com seu nutricionista, com indicador de presença, respostas rápidas e histórico completo." },
      { id: "f9", icon: "FileText", title: "Protocolos & Programas", tag: "Automação", desc: "Crie protocolos reutilizáveis e programas como 'Projeto Biquíni' com inscrição em massa de pacientes." },
      { id: "f10", icon: "Camera", title: "Análise Corporal por Foto", tag: "IA", desc: "Upload de fotos (frente, lado, costas) com análise de IA: tipo corporal, % gordura e evolução visual." },
      { id: "f11", icon: "Pill", title: "Prescrição de Suplementos", tag: "Clínico", desc: "Prescreva suplementos com dosagem, frequência, horário, marca e motivo. Paciente visualiza tudo." },
      { id: "f12", icon: "Target", title: "Metas Semanais", tag: "Engajamento", desc: "Defina metas de hidratação, passos, sono, treino. Acompanhe progresso visual por paciente." },
      { id: "f13", icon: "DollarSign", title: "Financeiro Integrado", tag: "Negócio", desc: "Controle pagamentos, assinaturas e planos. Multi-gateway: Stripe, Mercado Pago, PIX e manual." },
    ],
  },
  pricing: {
    visible: true,
    eyebrow: "Planos",
    title_line1: "Comece grátis.",
    title_line2: "Cresça sem surpresas.",
    description: "Sem fidelidade. Sem taxa de setup. Cancele quando quiser.",
    plans: [
      {
        id: "basic",
        name: "Basic",
        price: "R$ 39,90",
        period: "/mês",
        popular: false,
        cta: "Começar 3 dias grátis →",
        features: [
          "Até 30 pacientes ativos",
          "Anamnese inteligente + prontuário",
          "Planos alimentares com templates",
          "Avaliação física completa (TMB/TDEE)",
          "Chat em tempo real com pacientes",
          "Aplicativo PWA da sua marca",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        price: "R$ 74,90",
        period: "/mês",
        popular: true,
        cta: "Começar 3 dias grátis →",
        features: [
          "Pacientes ilimitados",
          "Protocolo FitJourney™ (motor clínico determinístico)",
          "IA: análise de refeição por foto + receitas",
          "Gamificação completa (XP, streaks, conquistas)",
          "Análise corporal por foto + evolução visual",
          "Prescrição de suplementos + metas semanais",
          "Financeiro multi-gateway (Stripe, Pix, Mercado Pago)",
          "Branding personalizado + suporte prioritário",
        ],
      },
    ],
  },
  testimonials: {
    visible: true,
    eyebrow: "Depoimentos",
    title: "Nutricionistas que já transformaram o consultório",
    items: [
      { id: "t1", name: "Dra. Ana Costa", role: "Nutricionista Esportiva", rating: 5, avatar: "AC", text: "O FitJourney revolucionou meu atendimento. A IA me economiza 3h por dia e meus pacientes adoram a gamificação!" },
      { id: "t2", name: "Dr. Carlos Silva", role: "Nutricionista Clínico", rating: 5, avatar: "CS", text: "Meus pacientes nunca foram tão engajados. A adesão ao tratamento subiu 60% com os streaks e desafios." },
      { id: "t3", name: "Dra. Mariana Luz", role: "Nutricionista Funcional", rating: 5, avatar: "ML", text: "Relatórios profissionais com 1 clique, análise corporal por IA, chat integrado. Tudo que eu precisava em um só lugar." },
      { id: "t4", name: "Dr. Rafael Mendes", role: "Nutricionista Comportamental", rating: 5, avatar: "RM", text: "O chat em tempo real com meus pacientes mudou tudo. Consigo acompanhar de perto e resolver dúvidas na hora." },
    ],
  },
  faq: {
    visible: true,
    eyebrow: "FAQ",
    title: "Perguntas frequentes",
    items: [
      { id: "q1", q: "Preciso instalar alguma coisa?", a: "Não! FitJourney é 100% web e PWA. Funciona no navegador e pode ser instalado como app no celular." },
      { id: "q2", q: "Meus pacientes precisam pagar?", a: "Não. Apenas o profissional paga pelo plano. Pacientes acessam gratuitamente com login próprio." },
      { id: "q3", q: "A IA substitui o nutricionista?", a: "Jamais! A IA é sua assistente — analisa dados, gera sugestões e economiza tempo. Todas as decisões clínicas são suas." },
      { id: "q4", q: "Meus dados estão seguros?", a: "Sim. Usamos criptografia de ponta, autenticação robusta e Row-Level Security. Cada paciente só acessa seus próprios dados." },
      { id: "q5", q: "Posso personalizar com minha marca?", a: "Sim! No plano Premium você personaliza cores, logo e nome da marca. Seus pacientes veem sua identidade visual." },
      { id: "q6", q: "Tem suporte?", a: "Sim! Chat in-app e email para todos. Suporte prioritário para planos Profissional e Premium." },
    ],
  },
  stats: {
    visible: true,
    items: [
      { id: "s1", value: "500+", label: "Nutricionistas" },
      { id: "s2", value: "10k+", label: "Pacientes ativos" },
      { id: "s3", value: "60%", label: "Mais adesão" },
      { id: "s4", value: "99.9%", label: "Uptime" },
    ],
  },
  final_cta: {
    visible: true,
    title: "Pronto para transformar seu consultório?",
    description:
      "Comece com 3 dias grátis. Sem cartão de crédito, sem compromisso. Cancele quando quiser.",
    cta_primary: "Começar Grátis Agora",
    cta_secondary: "Falar com vendas",
  },
  trust_badges: {
    visible: true,
    items: [
      { id: "tb1", label: "LGPD Compliant" },
      { id: "tb2", label: "Dados Criptografados" },
      { id: "tb3", label: "99.9% Uptime" },
      { id: "tb4", label: "IA de Última Geração" },
    ],
  },
};

/**
 * Mescla raso o conteúdo salvo com os defaults para tolerar schemas antigos
 * ou campos faltando.
 */
export function mergeLandingContent(
  saved: Partial<LandingContent> | null | undefined,
): LandingContent {
  if (!saved) return DEFAULT_LANDING_CONTENT;
  const out = { ...DEFAULT_LANDING_CONTENT } as LandingContent;
  for (const key of Object.keys(DEFAULT_LANDING_CONTENT) as Array<keyof LandingContent>) {
    const s = (saved as any)[key];
    if (s && typeof s === "object") {
      (out as any)[key] = { ...(out as any)[key], ...s };
    }
  }
  return out;
}

/** Lê o documento singleton (público — RLS permite). */
export async function fetchLandingContent(): Promise<LandingContent> {
  try {
    const { data, error } = await supabase
      .from("landing_content")
      .select("content")
      .eq("singleton", true)
      .maybeSingle();
    if (error) {
      console.error("[landing] fetch error:", error);
      return DEFAULT_LANDING_CONTENT;
    }
    return mergeLandingContent(data?.content as Partial<LandingContent> | null);
  } catch (e) {
    console.error("[landing] fetch exception:", e);
    return DEFAULT_LANDING_CONTENT;
  }
}

/** Salva o documento singleton (RLS exige role admin). */
export async function saveLandingContent(content: LandingContent): Promise<void> {
  const { error } = await supabase
    .from("landing_content")
    .update({
      content: content as unknown as Record<string, unknown>,
      schema_version: LANDING_SCHEMA_VERSION,
    })
    .eq("singleton", true);
  if (error) throw new Error(error.message);
}

/** Upload de mídia (image/video) para o bucket público `landing-assets`. */
export async function uploadLandingAsset(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("landing-assets").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("landing-assets").getPublicUrl(path);
  return data.publicUrl;
}
