import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/BrandLockup";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — FitJourney" },
      {
        name: "description",
        content: "Receba um link para redefinir sua senha do painel FitJourney.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );
      if (error) throw error;
      // Sempre mostra sucesso (não vaza existência de email).
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar link.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4 py-8">
      <div className="w-full max-w-sm space-y-7">
        <div className="flex justify-center">
          <BrandLockup
            slot="auth-hero"
            wordmarkAs={<Link to="/" className="fj-wordmark leading-none">FitJourney</Link>}
          />
        </div>

        {sent ? (
          <div className="text-center space-y-5">
            <div className="mx-auto size-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30">
              <MailCheck className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Verifique seu email
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-2">Link enviado</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Se existe uma conta com esse email, você vai receber um link para
                redefinir sua senha. Verifique também a pasta de spam.
              </p>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Voltar para login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Recuperação
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-2">Esqueci minha senha</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Informe seu email e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {error && (
              <p className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
              Enviar link
            </button>

            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 text-center">
              Lembrou?{" "}
              <Link to="/app" className="text-primary hover:underline">
                Voltar para login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
