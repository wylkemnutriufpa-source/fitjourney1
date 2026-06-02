import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { LogoOrbital } from "@/components/LogoOrbital";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — FitJourney" },
      { name: "description", content: "Canais de atendimento e suporte da FitJourney." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoOrbital size="size-10" />
            <span className="font-display font-bold text-lg">FitJourney</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl font-bold mb-3">Suporte</h1>
        <p className="text-muted-foreground mb-10">
          Estamos prontos para te ajudar. Escolha o canal de sua preferência.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:sistemafitjourney.suporte@gmail.com"
            className="group rounded-xl border border-border/40 bg-card/40 p-6 hover:border-primary/60 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">E-mail</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Para dúvidas, solicitações e questões sobre privacidade.
            </p>
            <p className="text-sm font-medium text-primary group-hover:underline break-all">
              sistemafitjourney.suporte@gmail.com
            </p>
          </a>

          <a
            href="https://wa.me/5591984155365"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border/40 bg-card/40 p-6 hover:border-primary/60 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">WhatsApp</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Atendimento rápido para dúvidas operacionais.
            </p>
            <p className="text-sm font-medium text-primary group-hover:underline">
              (91) 98415-5365
            </p>
          </a>
        </div>

        <div className="mt-8 rounded-xl border border-border/30 bg-muted/20 p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Horário de atendimento</p>
            <p>Segunda a sexta, das 9h às 18h (horário de Brasília). Mensagens enviadas fora desse horário serão respondidas no próximo dia útil.</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/30 flex gap-4 text-sm">
          <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>
          <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">Voltar ao início</Link>
        </div>
      </main>
    </div>
  );
}
