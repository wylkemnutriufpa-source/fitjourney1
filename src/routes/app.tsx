import { createFileRoute, useNavigate, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyIdentityState, type IdentityStateDTO } from "@/lib/phase2/identity.functions";
import { LogoVideo } from "@/components/LogoVideo";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "FitJourney — Acesso ao painel" },
      { name: "description", content: "Entrar no painel do FitJourney." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Login,
});

// Resolve a rota de destino correta a partir da identidade (server-side).
// Evita flash de UI de nutri para usuário paciente (e vice-versa) entre
// signIn e o redirect do guard `_authenticated`.
function pickLandingRoute(identity: IdentityStateDTO): string {
  if (identity.appRoles.includes("admin")) return "/dashboard";
  if (identity.state === "S1") return "/auth/check-email";
  if (identity.role === "patient") {
    return identity.patient?.onboardingCompletedAt
      ? "/my-dashboard"
      : "/onboarding/patient";
  }
  if (identity.state === "S2") return "/onboarding/nutritionist";
  return "/dashboard";
}

function Login() {
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState("wylkem.nutri.ufpa@gmail.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedTarget, setResolvedTarget] = useState<string | null>(null);
  const resolvingRef = useRef(false);

  useEffect(() => {
    setResolvedTarget(null);
    setError(null);
    resolvingRef.current = false;
  }, [session?.user?.id]);

  // Sessão pré-existente: resolve identidade no servidor antes de navegar.
  // A resolução é determinística (query por auth_user_id em patients/nutritionists).
  // Se falhar, é problema de infra/rede — NÃO de identidade. Mostramos erro e
  // mantemos a sessão; usuário pode recarregar. Nunca deslogamos por isso, nunca
  // damos fallback para outra área (paciente jamais vai parar em /dashboard).
  useEffect(() => {
    if (!session || resolvedTarget || resolvingRef.current) return;
    resolvingRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const id = await getMyIdentityState();
        if (!cancelled) setResolvedTarget(pickLandingRoute(id));
      } catch (err) {
        console.error("[Login] identity resolve failed:", err);
        if (!cancelled) {
          setError(
            "Não foi possível validar seu perfil agora (problema de conexão). Recarregue a página.",
          );
        }
      } finally {
        resolvingRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, resolvedTarget]);


  if (loading) return null;
  if (session) {
    if (!resolvedTarget) return null; // aguarda resolução; sem flash
    return <Navigate to={resolvedTarget} replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password, rememberMe);
    if (error) {
      setSubmitting(false);
      setError(error);
      return;
    }
    try {
      const identity = await getMyIdentityState();
      navigate({ to: pickLandingRoute(identity) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível validar seu perfil.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar border-r border-border relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <span className="fj-logo-aura relative inline-flex items-center justify-center size-10 shrink-0">
            <span className="fj-logo-pulse" aria-hidden />
            <span className="fj-logo-orbit fj-logo-orbit-1" aria-hidden>
              <span className="fj-logo-particle" />
            </span>
            <span className="fj-logo-orbit fj-logo-orbit-2" aria-hidden>
              <span className="fj-logo-particle fj-logo-particle-gold" />
            </span>
            <span className="fj-logo-orbit fj-logo-orbit-3" aria-hidden>
              <span className="fj-logo-particle" />
            </span>
            <span className="fj-logo-orbit fj-logo-orbit-4" aria-hidden>
              <span className="fj-logo-particle fj-logo-particle-gold" />
            </span>
            <LogoVideo className="relative z-10 size-10 object-contain" />
          </span>
          <span className="fj-wordmark text-2xl leading-none">FitJourney</span>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Performance / Nutrition / Lab
          </p>
          <h1 className="text-5xl font-bold tracking-tighter leading-[0.95]">
            Anamnese clínica.
            <br />
            <span className="italic text-muted-foreground">Plano cirúrgico.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Métricas metabólicas calculadas em segundos, templates editáveis e
            substituições equivalentes que se atualizam em tempo real.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "TMB", v: "Mifflin-St Jeor", hint: "kcal basais" },
              { k: "GET", v: "Fator atividade", hint: "kcal × PAL" },
              { k: "TDEE", v: "Objetivo final", hint: "déficit / superávit" },
            ].map((m) => (
              <div
                key={m.k}
                className="group relative border border-border/80 rounded-lg p-3 bg-gradient-to-br from-surface/80 to-surface/30 backdrop-blur-sm hover:border-primary/50 transition-colors overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="relative text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                  {m.v}
                </p>
                <p className="relative text-lg font-bold font-mono mt-1 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                  {m.k}
                </p>
                <p className="relative text-[9px] font-mono text-muted-foreground/70 mt-0.5">
                  {m.hint}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
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

        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-[var(--gold)]/5 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-7">
          <div className="lg:hidden flex flex-col items-center gap-3 -mt-2 mb-4">
            <span className="fj-logo-aura relative inline-flex items-center justify-center size-32 shrink-0">
              <span className="fj-logo-pulse" aria-hidden />
              <span className="fj-logo-orbit fj-logo-orbit-1" aria-hidden>
                <span className="fj-logo-particle" />
              </span>
              <span className="fj-logo-orbit fj-logo-orbit-2" aria-hidden>
                <span className="fj-logo-particle fj-logo-particle-gold" />
              </span>
              <span className="fj-logo-orbit fj-logo-orbit-3" aria-hidden>
                <span className="fj-logo-particle" />
              </span>
              <span className="fj-logo-orbit fj-logo-orbit-4" aria-hidden>
                <span className="fj-logo-particle fj-logo-particle-gold" />
              </span>
              <LogoVideo className="relative z-10 size-32 object-contain" />
            </span>
            <span className="fj-wordmark text-2xl leading-none">FitJourney</span>
          </div>
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

          <label className="flex items-center gap-2 cursor-pointer select-none -mt-3">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-border bg-surface text-primary focus:ring-primary accent-primary"
            />
            <span className="text-xs text-muted-foreground">Manter conectado</span>
          </label>

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
