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
    badge: "Soberania clínica para nutricionistas",
    title_line1: "Horas de montagem de plano viram",
    title_line2: "minutos de decisão clínica.",
    description:
      "O FitJourney reúne anamnese, avaliação física, plano alimentar, acompanhamento e IA em um único sistema — para você passar menos tempo operando e mais tempo atendendo. O que você publica é exatamente o que o paciente recebe.",
    cta_primary: "Testar grátis por 3 dias",
    cta_secondary: "Ver como funciona",
    trust_items: [
      "Sem cartão de crédito",
      "Acesso imediato",
      "Pacientes entram apenas por convite",
    ],
    hero_media_url: "",
    hero_media_type: "logo-orbital",
  },
  obstacle: {
    visible: true,
    eyebrow: "Soberania clínica",
    title_line1: "O problema não é criar planos.",
    title_line2: "É confiar neles.",
    description:
      "A maioria dos sistemas calcula em um lugar, substitui em outro e recomenda em um terceiro. O nutricionista publica uma coisa, o paciente vê outra. O FitJourney foi construído diferente: tudo nasce no plano clínico, tudo é auditável, tudo é reproduzível.",
    cards: [
      {
        id: "c1",
        title: "Uma única fonte da verdade",
        desc: "Cálculos, substituições e equivalências vivem dentro do mesmo plano clínico — não em planilhas paralelas nem em integrações frágeis.",
        consequence: "O que você publica é exatamente o que o paciente recebe.",
        tone: "primary",
      },
      {
        id: "c2",
        title: "Decisão clínica auditável",
        desc: "Cada ajuste, substituição e cálculo fica registrado, versionado e reproduzível — pronto para revisão e defesa técnica.",
        consequence: "Sem improviso. Sem depender da memória.",
        tone: "gold",
      },
      {
        id: "c3",
        title: "Paciente recebe o plano congelado",
        desc: "Depois de publicado, o snapshot do plano é imutável. Nada é recalculado no celular do paciente, nada muda sem o seu aval.",
        consequence: "Adesão sobe porque a entrega é confiável.",
        tone: "primary",
      },
    ],
    footer_text:
      "Soberania clínica é o que separa um software de dieta de uma plataforma onde você apoia a sua reputação.",
  },
  features: {
    visible: true,
    eyebrow: "Plataforma",
    title_line1: "Quatro pilares.",
    title_line2: "Uma única plataforma.",
    description:
      "Tudo que o consultório de nutrição moderno precisa — organizado em quatro pilares que conversam entre si, sem retrabalho.",
    items: [
      // Atendimento Clínico
      { id: "f1", icon: "FileText", tag: "Atendimento Clínico", title: "Anamnese inteligente", desc: "Coleta guiada, alertas clínicos automáticos e prontuário pronto para consulta — sem PDFs avulsos." },
      { id: "f2", icon: "BarChart3", tag: "Atendimento Clínico", title: "Avaliação física completa", desc: "Dobras (Jackson-Pollock 7), circunferências, composição corporal, IMC, TMB e TDEE calculados automaticamente." },
      { id: "f3", icon: "Shield", tag: "Atendimento Clínico", title: "Protocolo FitJourney™", desc: "Motor clínico determinístico: cada decisão fica registrada, auditável e reproduzível. Sem caixa-preta." },
      // Nutrição
      { id: "f4", icon: "Utensils", tag: "Nutrição", title: "Planos alimentares clínicos", desc: "Monte, edite e publique planos por dia/refeição com metas de macros e snapshot imutável para o paciente." },
      { id: "f5", icon: "Brain", tag: "Nutrição", title: "Templates reutilizáveis", desc: "Biblioteca de templates clínicos com substituições equivalentes — clone, ajuste e publique em minutos." },
      { id: "f6", icon: "Pill", tag: "Nutrição", title: "Prescrição de suplementos", desc: "Dosagem, frequência, horário e marca. O paciente recebe a prescrição dentro do mesmo app." },
      // Engajamento
      { id: "f7", icon: "MessageSquare", tag: "Engajamento", title: "App do paciente + chat", desc: "PWA com a sua marca, chat em tempo real, plano congelado e histórico clínico ao alcance da mão." },
      { id: "f8", icon: "Target", tag: "Engajamento", title: "Metas semanais", desc: "Hidratação, passos, sono, treino — metas claras com acompanhamento visual de progresso." },
      { id: "f9", icon: "Zap", tag: "Engajamento", title: "Gamificação clínica", desc: "XP, streaks, conquistas e desafios. Adesão até 3× maior, sem virar joguinho." },
      // Crescimento
      { id: "f10", icon: "DollarSign", tag: "Crescimento", title: "Financeiro integrado", desc: "Assinaturas, pagamentos avulsos e cobrança recorrente. Multi-gateway: Stripe, Mercado Pago, PIX e manual." },
      { id: "f11", icon: "Users", tag: "Crescimento", title: "Programas e protocolos", desc: "Lance turmas como 'Projeto Verão' com inscrição em massa e jornadas clínicas reutilizáveis." },
      { id: "f12", icon: "Camera", tag: "Crescimento", title: "IA + relatórios", desc: "Análise de refeição por foto, evolução corporal por imagem e relatórios profissionais com 1 clique." },
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
      content: content as any,
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
