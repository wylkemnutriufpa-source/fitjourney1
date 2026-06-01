import { createFileRoute, useNavigate, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyIdentityState, type IdentityStateDTO } from "@/lib/phase2/identity.functions";
import fjLogo from "@/assets/fitjourney-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitJourney — Acesso" },
      { name: "description", content: "Plataforma para nutricionistas esportivos." },
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
        <div className="flex items-center gap-3">
          <img
            src={fjLogo}
            alt="FitJourney"
            className="size-10 object-contain"
          />
          <span className="fj-wordmark text-2xl leading-none">FitJourney</span>
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
          <div className="lg:hidden flex flex-col items-center gap-3 -mt-2 mb-2">
            <span className="fj-logo-aura relative inline-flex items-center justify-center size-16 shrink-0">
              <span className="fj-logo-pulse" aria-hidden />
              <span className="fj-logo-orbit fj-logo-orbit-1" aria-hidden>
                <span className="fj-logo-particle" />
              </span>
              <span className="fj-logo-orbit fj-logo-orbit-2" aria-hidden>
                <span className="fj-logo-particle fj-logo-particle-gold" />
              </span>
              <img src={fjLogo} alt="FitJourney" className="relative z-10 size-16 object-contain" />
            </span>
            <span className="fj-wordmark text-xl leading-none">FitJourney</span>
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
