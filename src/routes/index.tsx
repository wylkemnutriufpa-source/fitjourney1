import { createFileRoute, useNavigate, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitJourney — Acesso" },
      { name: "description", content: "Plataforma para nutricionistas esportivos." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState("wylkem.nutri.ufpa@gmail.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  // Redirect declarativo (sem useEffect) — evita reagir a mudanças de
  // referência de `session` (TOKEN_REFRESHED no iframe causava loop).
  if (session) return <Navigate to="/dashboard" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar border-r border-border relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded-sm grid place-items-center">
            <div className="size-4 border-2 border-background rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tight uppercase italic">FitJourney</span>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Performance / Nutrition / Lab
          </p>
          <h1 className="text-5xl font-bold tracking-tighter leading-[0.95]">
            Anamnese clínica.
            <br />
            <span className="italic text-muted-foreground">Dieta cirúrgica.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Métricas metabólicas calculadas em segundos, templates editáveis e
            substituições equivalentes que se atualizam em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { k: "TMB", v: "Mifflin-St Jeor" },
            { k: "GET", v: "Fator atividade" },
            { k: "TDEE", v: "Objetivo final" },
          ].map((m) => (
            <div key={m.k} className="border border-border rounded-md p-3 bg-surface/60">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {m.v}
              </p>
              <p className="text-lg font-bold font-mono mt-1">{m.k}</p>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-7">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Acesso
            </p>
            <h2 className="text-3xl font-bold tracking-tight mt-2">Entrar no painel</h2>
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
              Senha
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            Entrar
          </button>

          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 text-center">
            Novo aqui?{" "}
            <Link to="/signup/nutritionist" className="text-primary hover:underline">
              Criar conta de nutricionista
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
