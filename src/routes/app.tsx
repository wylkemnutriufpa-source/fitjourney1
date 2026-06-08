import { createFileRoute, useNavigate, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyIdentityState, type IdentityStateDTO } from "@/lib/phase2/identity.functions";
import authBg from "@/assets/auth-bg.mp4.asset.json";

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

const IDENTITY_TIMEOUT_MS = 6000;

function resolveIdentityWithTimeout(): Promise<IdentityStateDTO> {
  return Promise.race([
    getMyIdentityState(),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Tempo esgotado ao validar seu perfil.")), IDENTITY_TIMEOUT_MS);
    }),
  ]);
}

function Login() {
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState("");
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

  useEffect(() => {
    if (!session || resolvedTarget || resolvingRef.current) return;
    resolvingRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const id = await resolveIdentityWithTimeout();
        if (!cancelled) setResolvedTarget(pickLandingRoute(id));
      } catch (err) {
        console.error("[Login] identity resolve failed:", err);
        if (!cancelled) {
          setError("Não foi possível validar seu perfil agora (problema de conexão). Recarregue a página.");
        }
      } finally {
        resolvingRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, resolvedTarget]);

  if (loading) return <AuthGateState message="Restaurando sua sessão..." />;
  if (session) {
    if (!resolvedTarget) {
      return (
        <AuthGateState
          message={error ?? "Validando seu perfil..."}
          tone={error ? "error" : "loading"}
        />
      );
    }
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
      const identity = await resolveIdentityWithTimeout();
      navigate({ to: pickLandingRoute(identity) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível validar seu perfil.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-foreground">
      {/* Fullscreen background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={authBg.url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Overlay para legibilidade — escurece sobretudo a parte inferior */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85" />

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-6 sm:px-8 sm:pt-8">
          <Link to="/" className="fj-wordmark text-lg leading-none text-white">
            FitJourney
          </Link>
          <Link
            to="/signup/nutritionist"
            className="text-[11px] font-mono uppercase tracking-widest text-white/80 hover:text-white"
          >
            Criar conta
          </Link>
        </header>

        {/* Spacer empurra o form para a área dos "quadrados" do vídeo */}
        <div className="flex-1" />

        {/* Card do login sobreposto */}
        <div className="px-4 pb-8 sm:px-6 sm:pb-12">
          <form
            onSubmit={submit}
            className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-white/15 bg-black/55 p-5 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-6"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                Acesso
              </p>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Entrar no painel
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                Email
              </label>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/60">
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
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-white/30 bg-white/10 accent-primary"
                />
                <span className="text-xs text-white/70">Manter conectado</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-white/70 hover:text-white"
              >
                Esqueci senha
              </Link>
            </div>

            {error && (
              <p className="rounded border border-destructive/40 bg-destructive/15 px-3 py-2 text-xs font-mono text-destructive-foreground">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AuthGateState({
  message,
  tone = "loading",
}: {
  message: string;
  tone?: "loading" | "error";
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-card/70">
          {tone === "loading" ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <Activity className="size-5 text-destructive" />
          )}
        </div>
        <p className={tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {message}
        </p>
        {tone === "error" && (
          <a
            href="/app"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Tentar novamente
          </a>
        )}
      </div>
    </div>
  );
}
