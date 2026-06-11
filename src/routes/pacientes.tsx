import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Brain,
  ClipboardCheck,
  Smartphone,
  HeartPulse,
  ShoppingCart,
  Trophy,
  MessageCircle,
  LineChart,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { BrandLockup } from "@/components/BrandLockup";
import { CheckoutModal } from "@/components/CheckoutModal";
import { createLead } from "@/lib/landing/leads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiagnosticFunnel } from "@/components/diagnostic/DiagnosticFunnel";

export const Route = createFileRoute("/pacientes")({
  head: () => ({
    meta: [
      { title: "FitJourney — Sua Transformação com Inteligência Nutricional" },
      {
        name: "description",
        content:
          "Planos alimentares clínicos personalizados feitos por IA + revisão humana do seu nutricionista. Prático, eficaz e feito para a sua vida real.",
      },
      { property: "og:title", content: "FitJourney — Transformação com Inteligência Nutricional" },
      {
        property: "og:description",
        content:
          "Anamnese inteligente, protocolo clínico personalizado e acompanhamento humano. Comece sua jornada hoje.",
      },
    ],
  }),
  component: PacientesPage,
});

function PacientesPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PageTheme />

      {/* ============ HEADER ============ */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[80px] flex items-center justify-between gap-3">
          <BrandLockup slot="landing-header" />
          {quizDone && (
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
              <a href="#como" className="hover:text-foreground transition-colors">Como funciona</a>
              <a href="#ifj" className="hover:text-foreground transition-colors">A IFJ</a>
              <a href="#vantagens" className="hover:text-foreground transition-colors">Vantagens</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 gradient-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_-8px_oklch(0.62_0.16_155/0.7)] hover:scale-[1.03] transition-all"
          >
            Quero meu plano <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      <main className="pt-[80px]">
        <HeroSection
          onCheckout={() => setCheckoutOpen(true)}
          onQuizDone={() => setQuizDone(true)}
        />

        {quizDone && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <HowItWorks onCheckout={() => setCheckoutOpen(true)} />
            <IFJSection />
            <BenefitsSection onCheckout={() => setCheckoutOpen(true)} />
            <TestimonialsSection />
            <BeforeAfterSection />
            <FAQSection />
            <FinalCTASection onCheckout={() => setCheckoutOpen(true)} />
          </motion.div>
        )}

        <Footer />
      </main>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        audience="patient"
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════════ */
function HeroSection({ onCheckout, onQuizDone }: { onCheckout: () => void; onQuizDone: () => void }) {
  return (
    <section className="relative overflow-hidden">

      {/* glow background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-[var(--gold,oklch(0.78_0.13_85))]/15 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Inteligência FitJourney (IFJ)
          </span>
          <h1 className="text-[clamp(1.75rem,8vw,3.75rem)] sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight break-words">
            Transforme sua saúde de verdade com a{" "}
            <span className="bg-gradient-to-r from-primary to-[var(--gold,oklch(0.78_0.13_85))] bg-clip-text text-transparent break-words">
              Inteligência FitJourney
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Planos alimentares clínicos personalizados feitos pelo nosso sistema inteligente + revisão
            humana do seu nutricionista. Prático, eficaz e feito para caber na
            sua vida real.
          </p>
          <p className="mt-3 text-sm text-muted-foreground/80">
            Chega de dietas genéricas. A Inteligência FitJourney entende suas queixas, seu corpo e
            seu dia a dia para criar um protocolo que realmente funciona.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCheckout}
              className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground rounded-full px-6 py-3.5 text-base font-semibold shadow-[0_12px_32px_-8px_oklch(0.62_0.16_155/0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              Quero meu plano personalizado agora <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#como"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium border border-border hover:bg-muted/40 transition-colors"
            >
              Conheça como funciona →
            </a>
          </div>
        </motion.div>

        {/* Mini formulário de captura */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <DiagnosticFunnel onCheckout={onCheckout} onComplete={onQuizDone} />
        </motion.div>
      </div>
    </section>
  );
}

function LeadCaptureCard() {
  const submit = useServerFn(createLead);
  const [form, setForm] = useState({ fullName: "", email: "", whatsapp: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await submit({ data: { ...form, source: "landing_pacientes" } });
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível enviar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-7 shadow-[0_30px_80px_-30px_oklch(0_0_0/0.5)]">
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-[var(--gold,oklch(0.78_0.13_85))]/20 -z-10" />
      <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" /> Receba seu plano
      </div>
      <h3 className="text-2xl font-bold">Comece sua transformação</h3>
      <p className="text-sm text-muted-foreground mt-1.5">
        Deixe seu contato — nosso time entra em contato em poucas horas com seu
        diagnóstico inicial.
      </p>

      {done ? (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Recebemos seus dados!</p>
            <p className="text-sm text-muted-foreground">
              Em breve entraremos em contato pelo WhatsApp.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handle} className="mt-6 space-y-3">
          <Input
            required
            placeholder="Seu nome completo"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            required
            type="email"
            placeholder="Seu e-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            required
            placeholder="WhatsApp (com DDD)"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground rounded-full h-11 text-base font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Quero meu diagnóstico gratuito"}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Seus dados ficam seguros. Sem spam.
          </p>
        </form>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   HOW IT WORKS
   ════════════════════════════════════════════════════ */
function HowItWorks({ onCheckout }: { onCheckout: () => void }) {
  const steps = [
    {
      icon: ClipboardCheck,
      title: "Anamnese Inteligente",
      desc: "Responda um questionário rápido. A IFJ analisa cansaço, inchaço, compulsão, intestino, objetivos, rotina e restrições.",
    },
    {
      icon: Brain,
      title: "Protocolo Clínico Personalizado",
      desc: "A Inteligência FitJourney gera um plano alimentar baseado em evidências, adaptado exatamente para você.",
    },
    {
      icon: HeartPulse,
      title: "Revisão Humana",
      desc: "Seu nutricionista revisa e ajusta tudo, garantindo segurança e precisão clínica.",
    },
    {
      icon: Smartphone,
      title: "Acompanhamento no App",
      desc: "Plano diário, feedback semanal, fotos de evolução, lista de compras e muito mais no celular.",
    },
  ];
  return (
    <section id="como" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Como funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">4 passos simples para sua transformação</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative rounded-2xl border border-border/60 bg-card/40 p-6 hover:border-primary/40 hover:bg-card/70 transition-all"
            >
              <div className="text-xs font-bold text-primary/70 mb-3">PASSO {i + 1}</div>
              <s.icon className="w-7 h-7 text-primary mb-4" strokeWidth={1.6} />
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <button
            onClick={onCheckout}
            className="inline-flex items-center gap-2 gradient-primary text-primary-foreground rounded-full px-6 py-3 font-semibold shadow-[0_12px_32px_-8px_oklch(0.62_0.16_155/0.7)] hover:scale-[1.03] transition-all"
          >
            Quero começar minha transformação <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   IFJ
   ════════════════════════════════════════════════════ */
function IFJSection() {
  const points = [
    "Anamnese Inteligente — entende você melhor que muitos atendimentos iniciais",
    "Protocolos baseados em queixas clínicas (resistência à insulina, SOP, tireoide, menopausa, performance, emagrecimento)",
    "Planos práticos e realistas — receitas rápidas, quantidades exatas, substituições fáceis",
    "Ajustes contínuos — o plano evolui junto com você",
    "Combinação perfeita — tecnologia de ponta + acompanhamento humano",
  ];
  return (
    <section id="ifj" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Inteligência FitJourney</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight">
            O sistema inteligente mais avançado em{" "}
            <span className="bg-gradient-to-r from-primary to-[var(--gold,oklch(0.78_0.13_85))] bg-clip-text text-transparent">
              nutrição clínica
            </span>{" "}
            do Brasil
          </h2>
          <p className="mt-4 text-muted-foreground">
            Combinamos um sistema inteligente treinado em milhares de casos
            clínicos com a sensibilidade humana do seu nutricionista.
          </p>
        </div>
        <ul className="space-y-3">
          {points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   BENEFITS
   ════════════════════════════════════════════════════ */
function BenefitsSection({ onCheckout }: { onCheckout: () => void }) {
  const items = [
    { icon: Smartphone, title: "App próprio com plano, feedback e fotos", desc: "Acompanhe seu plano, envie feedback semanal e fotos de evolução." },
    { icon: Brain, title: "Sistema Inteligente + Acompanhamento Humano", desc: "Plano gerado pelo nosso sistema inteligente e sempre revisado pelo nutricionista." },
    { icon: Trophy, title: "Gamificação, metas e streaks", desc: "Conquistas e evolução visual para manter o foco." },
    { icon: ShoppingCart, title: "Lista de compras, água e substituições", desc: "Ferramentas práticas do dia a dia, todas dentro do app." },
    { icon: MessageCircle, title: "Chat com a IFJ 24h", desc: "Tire dúvidas sobre trocas, receitas, sintomas e ajustes rápidos." },
    { icon: LineChart, title: "Relatórios de evolução", desc: "Gráficos claros e profissionais para você e seu médico." },
  ];
  return (
    <section id="vantagens" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Facilidades e Vantagens</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Tudo o que você precisa, no seu bolso</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-2xl border border-border/60 bg-card/40 p-6 hover:border-primary/40 transition-all"
            >
              <it.icon className="w-6 h-6 text-primary mb-3" strokeWidth={1.6} />
              <h3 className="font-semibold mb-1.5">{it.title}</h3>
              <p className="text-sm text-muted-foreground">{it.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <button
            onClick={onCheckout}
            className="inline-flex items-center gap-2 gradient-primary text-primary-foreground rounded-full px-6 py-3 font-semibold shadow-[0_12px_32px_-8px_oklch(0.62_0.16_155/0.7)] hover:scale-[1.03] transition-all"
          >
            Quero essas facilidades na minha vida <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   TESTIMONIALS
   ════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const t = [
    { name: "Ana Clara, 34", result: "-9 kg em 3 meses", quote: "Finalmente consegui emagrecer sem passar fome e sem ficar ansiosa. O plano é delicioso e o app facilita tudo!" },
    { name: "Marina, 41", result: "Tireoide controlada", quote: "Em poucas semanas voltei a ter energia. O acompanhamento humano fez toda a diferença." },
    { name: "Rafael, 29", result: "+5 kg de massa magra", quote: "Plano realista, com receitas que cabem na minha rotina. Resultado consistente." },
  ];
  return (
    <section className="py-20 sm:py-28 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Histórias reais de transformação</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {t.map((it) => (
            <div key={it.name} className="rounded-2xl border border-border/60 bg-card/60 p-6">
              {/* Placeholder de foto */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-[var(--gold,oklch(0.78_0.13_85))]/30 mb-4" />
              <p className="text-sm leading-relaxed italic">"{it.quote}"</p>
              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="font-semibold text-sm">{it.name}</p>
                <p className="text-xs text-primary">{it.result}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   BEFORE x AFTER
   ════════════════════════════════════════════════════ */
function BeforeAfterSection() {
  const before = ["Dietas frustrantes e conta-gotas", "Falta de energia", "Resultados lentos", "Compulsão e ansiedade"];
  const after = ["Energia o dia todo", "Resultados visíveis e consistentes", "Acompanhamento real", "Prazer em comer saudável"];
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Antes × Depois</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">A diferença que a FitJourney faz</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Antes</p>
            <ul className="space-y-3">
              {before.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-primary/[0.05] p-7 shadow-[0_20px_60px_-20px_oklch(0.62_0.16_155/0.4)]">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Depois</p>
            <ul className="space-y-3">
              {after.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   FAQ
   ════════════════════════════════════════════════════ */
function FAQSection() {
  const faqs = [
    { q: "É só IA ou tem nutricionista de verdade?", a: "É a combinação das duas: a IA gera o plano com alta precisão e o nutricionista revisa e acompanha cada etapa." },
    { q: "Quanto tempo leva para ver resultados?", a: "A maioria dos pacientes nota mais energia e bem-estar já na primeira semana. Resultados visíveis costumam aparecer entre 3 e 6 semanas." },
    { q: "Preciso ir ao consultório?", a: "Não necessariamente. Tudo pode ser feito 100% online, pelo app." },
    { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade. Você decide quanto tempo quer manter o acompanhamento." },
  ];
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Perguntas Frequentes</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Dúvidas comuns</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border/60 bg-card/40 p-5 open:bg-card/70 open:border-primary/40 transition-all"
            >
              <summary className="cursor-pointer font-semibold flex items-center justify-between gap-4 list-none">
                {f.q}
                <span className="text-primary transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   FINAL CTA
   ════════════════════════════════════════════════════ */
function FinalCTASection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[var(--gold,oklch(0.78_0.13_85))]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
          Pronto para transformar sua saúde de forma{" "}
          <span className="bg-gradient-to-r from-primary to-[var(--gold,oklch(0.78_0.13_85))] bg-clip-text text-transparent">
            inteligente?
          </span>
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Comece hoje. Vagas limitadas por nutricionista.
        </p>
        <button
          onClick={onCheckout}
          className="mt-8 inline-flex items-center gap-2 gradient-primary text-primary-foreground rounded-full px-8 py-4 text-lg font-semibold shadow-[0_20px_60px_-15px_oklch(0.62_0.16_155/0.8)] hover:scale-[1.04] active:scale-[0.97] transition-all"
        >
          Quero meu plano com a IFJ <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          Já tem convite do seu nutricionista?{" "}
          <Link to="/app" className="text-primary hover:underline">Entrar no app</Link>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-10 text-center text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} FitJourney. Todos os direitos reservados.</span>
        <div className="flex gap-5">
          <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
          <Link to="/termos" className="hover:text-foreground">Termos</Link>
          <Link to="/suporte" className="hover:text-foreground">Suporte</Link>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════
   Small inline theme — gold accent
   ════════════════════════════════════════════════════ */
function PageTheme() {
  return (
    <style>{`
      :root { --gold: oklch(0.78 0.13 85); }
      .gradient-primary {
        background-image: linear-gradient(135deg, oklch(0.62 0.16 155), oklch(0.55 0.18 150));
      }
    `}</style>
  );
}
