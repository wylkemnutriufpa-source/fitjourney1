import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Brain, ClipboardList, Lock, Sparkles, Utensils } from "lucide-react";
import fjLogo from "@/assets/fitjourney-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitJourney — Anamnese clínica. Plano cirúrgico." },
      {
        name: "description",
        content:
          "Plataforma soberana para nutricionistas esportivos: anamnese clínica, classificação determinística e planos alimentares com snapshot imutável.",
      },
      { property: "og:title", content: "FitJourney — Anamnese clínica. Plano cirúrgico." },
      {
        property: "og:description",
        content:
          "Anamnese, classificação e plano alimentar em pipeline determinístico. Para nutricionistas e seus pacientes.",
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
          "@type": "SoftwareApplication",
          name: "FitJourney",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          url: "https://www.fitjourney.com.br/",
          description:
            "Plataforma de nutrição esportiva com anamnese clínica, classificação determinística e planos alimentares.",
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <ForNutritionists />
        <ForPatients />
        <Pipeline />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={fjLogo} alt="FitJourney" className="size-8 object-contain" />
          <span className="fj-wordmark text-lg leading-none">FitJourney</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <a href="#nutricionistas" className="hover:text-foreground transition-colors">Nutricionistas</a>
          <a href="#pacientes" className="hover:text-foreground transition-colors">Pacientes</a>
          <a href="#pipeline" className="hover:text-foreground transition-colors">Como funciona</a>
        </nav>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          Entrar
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-[var(--gold)]/5 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Performance / Nutrition / Lab
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.95]">
            Anamnese clínica.
            <br />
            <span className="italic text-muted-foreground">Plano cirúrgico.</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-lg">
            Métricas metabólicas em segundos, classificação determinística e
            planos alimentares com snapshot imutável. Pensado para nutricionistas
            esportivos e entregue limpo para o paciente.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/signup/nutritionist"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Criar conta de nutricionista
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#pacientes"
              className="inline-flex items-center gap-2 border border-border bg-surface/40 rounded-md px-5 py-3 text-sm font-semibold hover:border-primary/60 transition-colors"
            >
              Sou paciente
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "TMB", v: "Mifflin-St Jeor", hint: "kcal basais" },
            { k: "GET", v: "Fator atividade", hint: "kcal × PAL" },
            { k: "TDEE", v: "Objetivo final", hint: "déficit / superávit" },
          ].map((m) => (
            <div
              key={m.k}
              className="relative border border-border/80 rounded-lg p-4 bg-gradient-to-br from-surface/80 to-surface/30 backdrop-blur-sm overflow-hidden"
            >
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                {m.v}
              </p>
              <p className="text-2xl font-bold font-mono mt-1 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                {m.k}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/70 mt-0.5">
                {m.hint}
              </p>
            </div>
          ))}
          <div className="col-span-3 flex items-center justify-between border border-border/60 rounded-lg px-4 py-3 bg-surface/30">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Sistema soberano · v3
              </p>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
              Snapshot imutável
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
      {children}
    </p>
  );
}

function ForNutritionists() {
  const features = [
    {
      icon: ClipboardList,
      title: "Anamnese clínica",
      desc: "Coleta estruturada que vira verdade clínica do paciente — sem duplicação, sem retrabalho.",
    },
    {
      icon: Brain,
      title: "Classificação determinística",
      desc: "Motores consomem só o ClinicalContext. Mesma entrada, mesmo plano. Sempre.",
    },
    {
      icon: Utensils,
      title: "Templates editáveis",
      desc: "7 dias modulares com substituições equivalentes. Recalcula tudo em tempo real antes de publicar.",
    },
    {
      icon: Lock,
      title: "Snapshot imutável",
      desc: "Publicou? Congelou. Paciente e PDF leem o mesmo snapshot. Zero divergência.",
    },
  ];
  return (
    <section id="nutricionistas" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl space-y-4 mb-14">
          <SectionLabel>Para nutricionistas</SectionLabel>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Da anamnese ao plano publicado, sem improviso.
          </h2>
          <p className="text-muted-foreground">
            Pipeline soberano: Anamnese → Classificação → Template → Snapshot →
            Render. Você edita no clínico, o paciente recebe pronto.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-border/80 rounded-lg p-6 bg-surface/40 hover:border-primary/60 transition-colors"
            >
              <f.icon className="size-5 text-primary" />
              <h3 className="text-lg font-semibold mt-4">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            to="/signup/nutritionist"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Criar conta de nutricionista
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ForPatients() {
  return (
    <section id="pacientes" className="border-b border-border/60 bg-sidebar/40">
      <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-4">
          <SectionLabel>Para pacientes</SectionLabel>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Seu plano. Limpo. Direto.
          </h2>
          <p className="text-muted-foreground">
            Você não precisa criar conta sozinho. Quem libera o acesso é o seu
            nutricionista — através de um link de convite com código único.
          </p>
        </div>
        <div className="border border-border rounded-xl p-6 bg-surface/60 space-y-5">
          <div className="flex items-start gap-3">
            <span className="size-7 shrink-0 rounded-md bg-primary/15 text-primary font-mono text-sm flex items-center justify-center">1</span>
            <div>
              <p className="text-sm font-semibold">Receba o convite</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seu nutricionista envia um link exclusivo por WhatsApp ou email.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="size-7 shrink-0 rounded-md bg-primary/15 text-primary font-mono text-sm flex items-center justify-center">2</span>
            <div>
              <p className="text-sm font-semibold">Faça seu cadastro</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie sua senha e confirme seus dados em menos de 2 minutos.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="size-7 shrink-0 rounded-md bg-primary/15 text-primary font-mono text-sm flex items-center justify-center">3</span>
            <div>
              <p className="text-sm font-semibold">Acesse seu plano</p>
              <p className="text-xs text-muted-foreground mt-1">
                Refeições, substituições e progresso — tudo num único lugar.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/60">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Já tem acesso?{" "}
              <Link to="/app" className="text-primary hover:underline">
                Entrar no app
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = ["Anamnese", "Classificação", "Template", "Snapshot", "Render"];
  return (
    <section id="pipeline" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl space-y-4 mb-12">
          <SectionLabel>Pipeline soberano</SectionLabel>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Determinístico do começo ao fim.
          </h2>
          <p className="text-muted-foreground">
            Cada etapa alimenta a próxima com dados imutáveis. Sem inferência em
            runtime. Sem múltiplas verdades.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="border border-border rounded-lg px-4 py-3 bg-surface/40">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Etapa {i + 1}
                </p>
                <p className="text-base font-semibold mt-1">{s}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="size-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[var(--gold)]/5" />
      <div className="relative max-w-4xl mx-auto px-6 py-24 text-center space-y-7">
        <Sparkles className="size-6 text-primary mx-auto" />
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
          Pronto para sair do improviso?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Crie sua conta de nutricionista e comece a publicar planos com
          arquitetura clínica de verdade.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup/nutritionist"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Criar conta
            <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 border border-border bg-surface/40 rounded-md px-6 py-3 text-sm font-semibold hover:border-primary/60 transition-colors"
          >
            <Activity className="size-4" />
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src={fjLogo} alt="FitJourney" className="size-6 object-contain" />
          <span className="fj-wordmark text-sm leading-none">FitJourney</span>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          © {new Date().getFullYear()} FitJourney · Sistema soberano · v3
        </p>
      </div>
    </footer>
  );
}
