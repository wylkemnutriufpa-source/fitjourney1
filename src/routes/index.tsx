import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, Users, Brain, Shield, BarChart3, Utensils, CheckCircle2,
  ArrowRight, Star, Zap, Heart, ChevronRight, Pill, Camera,
  Target, MessageSquare, FileText, Rocket, ClipboardCheck,
  Palette, DollarSign, Play, ArrowDown, Menu, X, Globe, Lock, Cpu,
  Dumbbell, Instagram, Mail, MessageCircle,
  type LucideIcon,
} from "lucide-react";

// Contatos oficiais FitJourney
const CONTACT_INSTAGRAM = "https://www.instagram.com/fitjourney_system?igsh=eWlodHhjN2l4ZjVu";
const CONTACT_WHATSAPP = "https://wa.me/message/G3GN7VMIMTAWA1";
const CONTACT_WHATSAPP_LABEL = "(91) 98415-5365";
const CONTACT_EMAIL = "sistemafitjourney.suporte@gmail.com";

// Ícone oficial do WhatsApp (SVG inline — lucide não traz a marca)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.27.21-.6.21-.96 0-.16-.044-.215-.115-.34-.214-.4-2.105-1.435-2.564-1.435m-3.04-13.05c-7.115 0-12.93 5.815-12.93 12.93 0 2.49.715 4.92 2.078 7.02L3 28l4.135-1.293a12.91 12.91 0 0 0 6.93 2.05c7.115 0 12.93-5.815 12.93-12.93C26.995 8.7 22.18 4.155 16.07 4.155m0 23.515a10.7 10.7 0 0 1-5.7-1.625l-.405-.245-2.45.77.78-2.392-.27-.405a10.6 10.6 0 0 1-1.625-5.7c0-5.844 4.83-10.675 10.67-10.675a10.7 10.7 0 0 1 10.67 10.675c0 5.84-4.825 10.675-10.67 10.675"/>
    </svg>
  );
}
import { LogoMark } from "@/components/LogoMark";
import { LogoOrbital } from "@/components/LogoOrbital";
import {
  DEFAULT_LANDING_CONTENT,
  fetchLandingContent,
  type LandingContent,
} from "@/lib/landing/landing-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitJourney — Plataforma de Nutrição com IA e Gamificação" },
      {
        name: "description",
        content:
          "Gerencie pacientes, crie planos alimentares com IA e engaje com gamificação. A plataforma #1 para nutricionistas modernos.",
      },
      { property: "og:title", content: "FitJourney — Plataforma de Nutrição com IA e Gamificação" },
      {
        property: "og:description",
        content:
          "Gerencie pacientes, crie planos alimentares com IA e engaje com gamificação. A plataforma #1 para nutricionistas modernos.",
      },
      { property: "og:url", content: "https://www.fitjourney.com.br/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.fitjourney.com.br/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FitJourney",
          url: "https://www.fitjourney.com.br",
          description:
            "Plataforma de nutrição com IA e gamificação para nutricionistas modernos.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "FitJourney",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          url: "https://www.fitjourney.com.br",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "BRL",
            description: "Trial gratuito de 3 dias",
          },
        }),
      },
    ],
  }),
  component: Landing,
});

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
} as const;
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } } as const;
const scaleIn = { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } } } as const;

/* ─── Mapa de ícones (string editável → componente Lucide) ─── */
const ICONS: Record<string, LucideIcon> = {
  Brain, Shield, Users, Dumbbell, BarChart3, Utensils, Zap, MessageSquare,
  FileText, Camera, Pill, Target, DollarSign, Sparkles, Heart, Rocket,
  ClipboardCheck, Palette, Lock, Globe, Cpu, Star, Play, ChevronRight,
};
function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} />;
}

/* ─── Conteúdo estático (não editável pelo admin nesta v1) ─── */
const howItWorks = [
  { step: "01", title: "Crie sua conta profissional", desc: "Cadastro exclusivo para nutricionistas. 3 dias grátis, sem cartão.", icon: Sparkles },
  { step: "02", title: "Convide seus pacientes", desc: "Pacientes recebem acesso por convite — via link mágico ou senha temporária.", icon: Users },
  { step: "03", title: "Configure protocolos", desc: "Crie planos alimentares, protocolos e metas personalizadas.", icon: ClipboardCheck },
  { step: "04", title: "Acompanhe com IA", desc: "A IA analisa evolução, gera relatórios e sugere ajustes automaticamente.", icon: Brain },
];
const howItWorksPatient = [
  { step: "01", title: "Receba o convite", desc: "Seu nutricionista cria sua conta e envia o acesso por e-mail.", icon: Lock },
  { step: "02", title: "Complete seu onboarding", desc: "Preencha a anamnese e aceite os termos clínicos (LGPD).", icon: ClipboardCheck },
  { step: "03", title: "Siga seu plano", desc: "Acesse dietas, checklists, receitas e acompanhe sua evolução.", icon: Target },
  { step: "04", title: "Evolua com dados", desc: "Sua jornada é acompanhada por inteligência clínica em tempo real.", icon: Brain },
];
const allFeaturesList = [
  "Dashboard inteligente", "Gestão de pacientes", "Anamnese com IA", "Planos alimentares",
  "Avaliação física completa", "Análise corporal por foto", "Protocolos reutilizáveis",
  "Programas em grupo", "Gamificação (XP/streaks)", "Desafios semanais", "Metas semanais",
  "Chat em tempo real", "Receitas com IA", "Banco TACO 600+ alimentos",
  "Lista de compras", "Suplementação", "Relatórios semanais", "Agenda de consultas",
  "Push notifications", "Branding personalizado", "Financeiro multi-gateway", "Feedbacks",
  "Dicas globais", "Biblioteca do paciente", "Calculadoras (peso/água)", "Health Check Quiz",
];

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");
  const target = parseFloat(value) || 0;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 1500;
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const e = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.floor(target * e).toString());
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{display}{suffix}</span>;
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navScrolled = useNavScroll();

  const { data } = useQuery<LandingContent>({
    queryKey: ["landing-content"],
    queryFn: fetchLandingContent,
    initialData: DEFAULT_LANDING_CONTENT,
    staleTime: 60_000,
  });
  const c = data ?? DEFAULT_LANDING_CONTENT;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ══════════ NAV ══════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${navScrolled ? "glass border-b border-border/30 shadow-card" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => import("@/components/IntroOverlay").then((m) => m.playIntro())}
              className="focus:outline-none cursor-pointer"
              title="Ver intro"
            >
              <LogoOrbital size="size-14" />
            </button>
            <Link to="/" className="fj-wordmark text-lg leading-none">FitJourney</Link>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {[["#features", "Recursos"], ["#how", "Como Funciona"], ["#pricing", "Preços"], ["#testimonials", "Depoimentos"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/60 hover:text-foreground transition-colors text-muted-foreground"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Fale com a gente
            </button>
            <Link to="/app" className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors">Entrar</Link>
            <Link to="/signup/nutritionist" className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity">
              Começar Grátis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fale com a gente"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden glass border-t border-border/30 p-4 space-y-3">
            {[["#features", "Recursos"], ["#how", "Como Funciona"], ["#pricing", "Preços"], ["#testimonials", "Depoimentos"]].map(([href, label]) => (
              <a key={href} href={href} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenu(false)}>{label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/app" className="flex-1 inline-flex items-center justify-center border border-border rounded-md px-3 py-2 text-sm font-semibold">Entrar</Link>
              <Link to="/signup/nutritionist" className="flex-1 inline-flex items-center justify-center gradient-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-semibold shadow-glow">Criar Conta</Link>
            </div>
            <div className="pt-3 mt-2 border-t border-border/30">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Fale com a gente</p>
              <div className="flex items-center gap-2">
                <a href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2 text-sm hover:border-primary/60 transition-colors">
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" /> WhatsApp
                </a>
                <a href={CONTACT_INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2 text-sm hover:border-primary/60 transition-colors">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
                <a href={`mailto:${CONTACT_EMAIL}`} aria-label="E-mail" className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2 text-sm hover:border-primary/60 transition-colors">
                  <Mail className="w-4 h-4" /> E-mail
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section ref={heroRef} className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4 overflow-hidden noise-overlay">
        <div className="absolute inset-0 -z-10 dot-grid opacity-40" />
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-10 -left-32 w-[600px] h-[600px] bg-primary/[0.06] blur-[120px] morph-orb" />
          <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-[var(--gold)]/[0.06] blur-[100px] morph-orb" style={{ animationDelay: "-4s" }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/[0.04] blur-[150px] morph-orb" style={{ animationDelay: "-8s" }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
            {/* — Coluna esquerda: copy — */}
            <motion.div variants={stagger} initial="hidden" animate="show" className="text-center lg:text-left">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-premium text-primary text-sm font-semibold mb-8 gradient-border">
                <Sparkles className="w-4 h-4" />
                {c.hero.badge}
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </motion.div>

              <motion.h1 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] mb-6 tracking-tight">
                {c.hero.title_line1}{" "}
                <span className="text-gradient-animated">{c.hero.title_line2}</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
                {c.hero.description}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5">
                <Link to="/signup/nutritionist" className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground shadow-glow rounded-md text-base px-8 h-14 font-semibold hover:scale-[1.03] active:scale-[0.98] transition-transform">
                  {c.hero.cta_primary} <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#features" className="inline-flex items-center justify-center gap-2 border border-border glass rounded-md text-base px-7 h-14 font-medium hover:bg-muted transition-colors">
                  <Play className="w-4 h-4" /> {c.hero.cta_secondary}
                </a>
              </motion.div>

              <motion.p variants={fadeUp} className="text-xs text-muted-foreground flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1">
                {c.hero.trust_items.map((t) => (
                  <span key={t}>✅ {t}</span>
                ))}
              </motion.p>

              {c.stats.visible && (
                <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3 max-w-md mx-auto lg:mx-0 mt-10">
                  {c.stats.items.map((stat, i) => (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center glass-premium rounded-xl p-2.5 gradient-border"
                    >
                      <p className="font-display text-lg md:text-2xl font-bold text-gradient-animated leading-none">
                        <AnimatedCounter value={stat.value.replace(/[^0-9]/g, "")} suffix={stat.value.replace(/[0-9.]/g, "")} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium leading-tight">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* — Coluna direita: mídia editável OU logo orbital — */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="relative mx-auto w-full max-w-[560px] aspect-square hidden md:block"
            >
              {c.hero.hero_media_type === "image" && c.hero.hero_media_url ? (
                <img src={c.hero.hero_media_url} alt="" className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-glow" />
              ) : c.hero.hero_media_type === "video" && c.hero.hero_media_url ? (
                <video src={c.hero.hero_media_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-glow" />
              ) : (
                <>
                  <div className="absolute inset-[8%] rounded-full border border-primary/20" />
                  <div className="absolute inset-[22%] rounded-full border border-[var(--gold)]/15 border-dashed" />
                  <div className="absolute inset-[36%] rounded-full border border-primary/10" />
                  <div className="absolute inset-[28%] rounded-full bg-primary/10 blur-3xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative fj-logo-aura" style={{ width: 280, height: 280 }}>
                      <div className="fj-logo-pulse" />
                      <div className="fj-logo-orbit fj-logo-orbit-1"><span className="fj-logo-particle" /></div>
                      <div className="fj-logo-orbit fj-logo-orbit-2"><span className="fj-logo-particle fj-logo-particle-gold" /></div>
                      <div className="fj-logo-orbit fj-logo-orbit-3"><span className="fj-logo-particle" /></div>
                      <div className="fj-logo-orbit fj-logo-orbit-4"><span className="fj-logo-particle fj-logo-particle-gold" /></div>
                      <LogoMark className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_30px_oklch(0.62_0.16_155/0.55)]" />
                    </div>
                  </div>
                  {[
                    { icon: Users, label: "Pacientes", style: "top-[4%] left-[6%]", delay: 0 },
                    { icon: Brain, label: "IA Clínica", style: "top-[2%] right-[4%]", delay: 0.4 },
                    { icon: Utensils, label: "Plano Alimentar", style: "top-[44%] -left-[6%]", delay: 0.8 },
                    { icon: Zap, label: "Gamificação", style: "top-[42%] -right-[8%]", delay: 1.2 },
                    { icon: BarChart3, label: "Avaliação Física", style: "bottom-[6%] left-[2%]", delay: 1.6 },
                    { icon: DollarSign, label: "Financeiro", style: "bottom-[2%] right-[6%]", delay: 2 },
                  ].map((chip) => (
                    <motion.div
                      key={chip.label}
                      initial={{ opacity: 0, scale: 0.6, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.6 + chip.delay * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={`absolute ${chip.style}`}
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3 + chip.delay, repeat: Infinity, ease: "easeInOut", delay: chip.delay }}
                        className="glass-premium gradient-border rounded-full px-3.5 py-2 flex items-center gap-2 shadow-card whitespace-nowrap"
                      >
                        <chip.icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold">{chip.label}</span>
                      </motion.div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-medium tracking-wider uppercase">Role</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ OBSTÁCULO INVISÍVEL ══════════ */}
      {c.obstacle.visible && (
        <section className="py-24 px-4 relative noise-overlay border-y border-border/30 bg-muted/10">
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-[1fr_1.2fr] gap-10 mb-16 items-end">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium text-[var(--gold)] text-xs font-bold mb-5 gradient-border uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" /> {c.obstacle.eyebrow}
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-bold leading-[1.08]">
                  {c.obstacle.title_line1}{" "}
                  <span className="text-gradient-animated italic font-display">{c.obstacle.title_line2}</span>
                </h2>
              </div>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed md:text-right">
                {c.obstacle.description}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {c.obstacle.cards.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-premium gradient-border rounded-2xl p-7 card-hover-glow flex flex-col"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${p.tone === "gold" ? "bg-[var(--gold)]/10 text-[var(--gold)]" : "bg-primary/10 text-primary"}`}>
                    <X className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-3">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{p.desc}</p>
                  <div className="mt-auto pt-4 border-t border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5">Consequência</p>
                    <p className={`text-sm font-medium ${p.tone === "gold" ? "text-[var(--gold)]" : "text-primary"}`}>{p.consequence}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-14 text-center">
              <p className="text-muted-foreground text-sm mb-5">{c.obstacle.footer_text}</p>
              <a href="#features" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all">
                Como o FitJourney resolve <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════ TRUST BADGES ══════════ */}
      {c.trust_badges.visible && (
        <section className="py-6 border-y border-border/30 bg-muted/10">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              {c.trust_badges.items.map((b) => (
                <div key={b.id} className="flex items-center gap-2 text-muted-foreground/70">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ SOCIAL PROOF BAR ══════════ */}
      <section className="py-10 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground mb-5 font-semibold uppercase tracking-widest">Usado por profissionais de todo o Brasil</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-muted-foreground/40 font-display font-bold text-xl">
            {["CRN-3", "ASBRAN", "Clínicas Premium", "Consultórios Solo", "Universidades"].map((t) => (
              <span key={t} className="hover:text-muted-foreground/70 transition-colors duration-300 cursor-default">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      {c.features.visible && (
        <section id="features" className="py-28 px-4 relative noise-overlay">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full glass-premium text-primary text-xs font-bold mb-5 gradient-border uppercase tracking-widest">{c.features.eyebrow}</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-5">
                {c.features.title_line1}<br className="hidden md:block" />{" "}
                <span className="text-gradient-animated">{c.features.title_line2}</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">{c.features.description}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {c.features.items.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative glass-premium rounded-2xl p-6 card-hover-glow shimmer-sweep cursor-default gradient-border"
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">{f.tag}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/15 group-hover:shadow-glow transition-all duration-500">
                    <Icon name={f.icon} className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FULL FEATURE LIST ══════════ */}
      <section className="py-16 px-4 bg-muted/20 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">+27 funcionalidades integradas</h3>
            <p className="text-muted-foreground">Acesso completo a todas as funcionalidades no plano <span className="text-primary font-semibold">Premium</span>.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allFeaturesList.map((f) => (
              <motion.div key={f} variants={fadeUp} className="flex items-center gap-2 text-sm py-2.5 px-3 rounded-xl glass-premium border border-border/30 hover:border-primary/20 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium">{f}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS — PROFESSIONALS ══════════ */}
      <section id="how" className="py-28 px-4 relative noise-overlay">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full glass-premium text-[var(--gold)] text-xs font-bold mb-5 gradient-border uppercase tracking-widest">Para Nutricionistas</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Comece em minutos.
              <br />
              <span className="text-gradient-animated">Escale com inteligência.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative text-center group">
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px]">
                    <div className="w-full h-full bg-gradient-to-r from-primary/30 to-transparent" />
                  </div>
                )}
                <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary shadow-glow flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <span className="font-display text-xs font-bold text-primary tracking-widest">{step.step}</span>
                <h3 className="font-display font-semibold text-lg mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS — PATIENTS ══════════ */}
      <section className="py-28 px-4 bg-muted/20 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full glass-premium text-primary text-xs font-bold mb-5 gradient-border uppercase tracking-widest">Para Pacientes</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Acesso seguro por <span className="text-gradient-animated">convite do profissional</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Pacientes não criam contas sozinhos. Seu nutricionista convida você, garantindo um ambiente clínico seguro e controlado.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorksPatient.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--gold)]/10 flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-[var(--gold)]" />
                </div>
                <span className="font-display text-xs font-bold text-[var(--gold)] tracking-widest">{step.step}</span>
                <h3 className="font-display font-semibold mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl glass-premium gradient-border">
              <Shield className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Conformidade LGPD</p>
                <p className="text-xs text-muted-foreground">Consentimento clínico explícito, versionado e auditável. Seus dados estão protegidos.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      {c.testimonials.visible && (
        <section id="testimonials" className="py-28 px-4 relative noise-overlay">
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full glass-premium text-[var(--gold)] text-xs font-bold mb-5 gradient-border uppercase tracking-widest">{c.testimonials.eyebrow}</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
                {c.testimonials.title}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {c.testimonials.items.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }} className="glass-premium rounded-2xl p-7 card-hover-glow gradient-border">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />
                    ))}
                  </div>
                  <p className="text-sm mb-6 leading-relaxed italic text-foreground/90">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-glow">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ PRICING ══════════ */}
      {c.pricing.visible && (
        <section id="pricing" className="py-28 px-4 bg-muted/20 border-y border-border/30">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full glass-premium text-primary text-xs font-bold mb-5 gradient-border uppercase tracking-widest">{c.pricing.eyebrow}</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
                {c.pricing.title_line1} <span className="text-gradient-animated">{c.pricing.title_line2}</span>
              </h2>
              <p className="text-muted-foreground text-lg">{c.pricing.description}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
              {c.pricing.plans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative glass-premium rounded-2xl p-8 gradient-border ${plan.popular ? "ring-2 ring-primary/30 shadow-glow md:scale-105" : "card-hover-glow"} transition-all`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
                      ⭐ Mais Popular
                    </div>
                  )}
                  <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/signup/nutritionist"
                    className={`w-full h-12 inline-flex items-center justify-center gap-1 rounded-md font-semibold text-sm transition-opacity ${plan.popular ? "gradient-primary text-primary-foreground shadow-glow hover:opacity-90" : "border border-border hover:bg-muted"}`}
                  >
                    {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FAQ ══════════ */}
      {c.faq.visible && (
        <section id="faq" className="py-28 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full glass-premium text-[var(--gold)] text-xs font-bold mb-5 gradient-border uppercase tracking-widest">{c.faq.eyebrow}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{c.faq.title}</h2>
            </motion.div>

            <div className="space-y-3">
              {c.faq.items.map((faq, i) => (
                <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full glass-premium rounded-xl p-5 text-left card-hover-glow gradient-border"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-semibold text-sm pr-4">{faq.q}</h3>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-90" : ""}`} />
                    </div>
                    {openFaq === i && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {faq.a}
                      </motion.p>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FINAL CTA ══════════ */}
      {c.final_cta.visible && (
        <section className="py-28 px-4 relative noise-overlay">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={scaleIn} className="max-w-4xl mx-auto text-center relative z-10">
            <div className="absolute inset-0 rounded-3xl gradient-primary opacity-[0.03] blur-2xl" />
            <div className="relative glass-premium rounded-3xl p-10 md:p-20 gradient-border shimmer-sweep">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary shadow-glow flex items-center justify-center mb-8">
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-5">
                {c.final_cta.title}
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
                {c.final_cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup/nutritionist" className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground shadow-glow rounded-md text-base px-12 h-14 font-semibold hover:scale-105 active:scale-[0.98] transition-transform">
                  <Sparkles className="w-4 h-4" /> {c.final_cta.cta_primary}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-5">Sem cartão de crédito · 3 dias grátis · Pacientes acessam por convite</p>
            </div>
          </motion.div>
        </section>
      )}

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-border/30 py-14 px-4 bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => import("@/components/IntroOverlay").then((m) => m.playIntro())}
                  className="focus:outline-none cursor-pointer"
                  title="Ver intro"
                >
                  <LogoOrbital size="size-14" />
                </button>
                <Link to="/" className="font-display font-bold text-lg">FitJourney</Link>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-4">
                Plataforma completa para nutricionistas modernos.
              </p>
              <div className="flex gap-2 flex-wrap mb-5">
                {c.trust_badges.items.slice(0, 3).map((b) => (
                  <span key={b.id} className="text-[10px] font-semibold text-muted-foreground/60 bg-muted/50 px-2 py-1 rounded-md">
                    {b.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={CONTACT_INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram FitJourney"
                  className="size-10 inline-flex items-center justify-center rounded-full border border-border bg-card/50 hover:border-primary/60 hover:text-primary transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={CONTACT_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp FitJourney"
                  className="size-10 inline-flex items-center justify-center rounded-full border border-border bg-card/50 hover:border-[#25D366]/60 hover:text-[#25D366] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  aria-label="E-mail FitJourney"
                  className="size-10 inline-flex items-center justify-center rounded-full border border-border bg-card/50 hover:border-primary/60 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-sm">Produto</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-sm">Acesso</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/app" className="hover:text-primary transition-colors">Entrar no painel</Link></li>
                <li><Link to="/signup/nutritionist" className="hover:text-primary transition-colors">Criar conta</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-sm">Legal & Suporte</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
                <li><Link to="/suporte" className="hover:text-foreground transition-colors">Suporte</Link></li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors break-all">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                    <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 text-[#25D366]" /> {CONTACT_WHATSAPP_LABEL}
                  </a>
                </li>
                <li>
                  <a href={CONTACT_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                    <Instagram className="w-3.5 h-3.5 shrink-0" /> @fitjourney_system
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FitJourney. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5">
              Feito com <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" /> no Brasil
            </p>
          </div>
        </div>
      </footer>

      {/* ══════════ BOTÃO FLUTUANTE WHATSAPP ══════════ */}
      <a
        href={CONTACT_WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Converse com Sistema FitJourney no WhatsApp"
        className="fixed bottom-5 right-5 z-40 group inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-3 pr-4 py-3 shadow-[0_10px_30px_-8px_rgba(37,211,102,0.55)] hover:shadow-[0_14px_36px_-8px_rgba(37,211,102,0.75)] hover:scale-[1.04] active:scale-95 transition-all"
      >
        <span className="relative inline-flex items-center justify-center size-8">
          <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" aria-hidden />
          <WhatsAppIcon className="relative size-7" />
        </span>
        <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
          Converse no WhatsApp
        </span>
      </a>
    </div>
  );
}
