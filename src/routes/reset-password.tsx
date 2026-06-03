import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/BrandLockup";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — FitJourney" },
      {
        name: "description",
        content: "Defina uma nova senha para acessar o painel FitJourney.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase coloca o usuário em sessão automaticamente ao seguir o link
  // de recovery (evento PASSWORD_RECOVERY). Aqui detectamos isso para
  // liberar o formulário só quando há sessão válida de recovery.
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setAuthorized(true);
          setReady(true);
        }
      },
    );

    // Fallback: já pode haver sessão (recovery resolveu antes do mount).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setAuthorized(true);
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // Pequeno delay para a UI de sucesso aparecer.
      setTimeout(() => {
        navigate({ to: "/app", replace: true });
      }, 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar a senha.";
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

        {!ready ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !authorized ? (
          <div className="text-center space-y-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-destructive">
                Link inválido
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-2">
                Não foi possível validar o link
              </h2>
              <p className="text-sm text-muted-foreground mt-3">
                O link de recuperação pode ter expirado ou já ter sido utilizado.
                Solicite um novo link.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Solicitar novo link
            </Link>
          </div>
        ) : done ? (
          <div className="text-center space-y-5">
            <div className="mx-auto size-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30">
              <CheckCircle2 className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Senha atualizada
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-2">Pronto!</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Redirecionando para o painel...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Nova senha
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-2">Defina sua nova senha</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Use pelo menos 8 caracteres. Evite senhas reutilizadas.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Nova senha
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Confirmar senha
              </label>
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
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
              Atualizar senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
