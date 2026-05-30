import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth/check-email")({
  head: () => ({
    meta: [
      { title: "Confirme seu email — FitJourney" },
      {
        name: "description",
        content: "Verifique seu email para ativar sua conta.",
      },
    ],
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto size-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30">
          <MailCheck className="size-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Confirmação pendente
          </p>
          <h2 className="text-2xl font-bold tracking-tight mt-2">
            Verifique seu email
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Enviamos um link de confirmação para o email que você cadastrou.
            Clique no link e depois entre no painel para continuar o
            onboarding.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Ir para login
        </Link>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          Não recebeu? Verifique a pasta de spam.
        </p>
      </div>
    </div>
  );
}
