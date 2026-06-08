import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Activity, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signupNutritionist } from "@/lib/phase2/signup.functions";
import authBg from "@/assets/auth-bg.mp4.asset.json";

export const Route = createFileRoute("/signup/nutritionist")({
  head: () => ({
    meta: [
      { title: "Cadastro — FitJourney" },
      { name: "description", content: "Crie sua conta de nutricionista." },
    ],
  }),
  component: SignupNutritionistPage,
});

function SignupNutritionistPage() {
  const navigate = useNavigate();
  const signup = useServerFn(signupNutritionist);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({
        data: {
          email,
          password,
          redirectTo: `${window.location.origin}/auth/check-email`,
        },
      });
      navigate({ to: "/auth/check-email" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao criar conta.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-background text-foreground px-5 sm:px-6 py-8 sm:py-12">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6 sm:space-y-7">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para o login
        </Link>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Cadastro
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            Criar conta de nutricionista
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            Após criar a conta você precisa confirmar seu email antes de
            acessar o painel.
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

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Senha (mín. 8 caracteres)
          </label>
          <div className="relative">
            <input
              required
              minLength={8}
              maxLength={128}
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
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2 break-words">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Activity className="size-4" />
          )}
          Criar conta
        </button>

        <div className="pt-2 border-t border-border/60 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 text-center">
            Já tem conta?
          </p>
          <Link
            to="/app"
            className="w-full flex items-center justify-center gap-2 rounded-md border-2 border-primary bg-primary/10 px-4 py-3 text-base font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Entrar na minha conta
          </Link>
        </div>
      </form>
    </div>
  );
}
