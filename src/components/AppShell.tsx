import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  FileStack,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
  ClipboardList,
  MessageSquareHeart,
  DollarSign,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyPendingAnamnesesCount } from "@/lib/anamnesis/review.functions";
import { getMyIdentityState } from "@/lib/phase2/identity.functions";
import { getMyFeedbackStatus } from "@/lib/feedback/feedback.functions";
import { applyTheme, getStoredTheme } from "@/lib/patient/theme";
import { supabase } from "@/integrations/supabase/client";
import { createAvatarSignedUrl } from "@/lib/profile/avatar-storage";
import fjLogo from "@/assets/fitjourney-logo.png";
import { ExpirationBanner } from "@/components/ExpirationBanner";

// Cache module-level do estado do sidebar — sobrevive a remounts do AppShell.
let __sidebarOpenCache: boolean | null = null;




const nutritionistNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", icon: Users },
  { to: "/anamneses", label: "Anamneses", icon: ClipboardList, badgeKey: "pending-anamneses" as const },
  { to: "/templates", label: "Templates", icon: FileStack },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

const patientNav = [
  { to: "/my-dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/my-plan", label: "Meu Plano", icon: LayoutDashboard },
  { to: "/my-plan/feedback", label: "Feedback", icon: MessageSquareHeart, badgeKey: "feedback-pending" as const },
  { to: "/my-plan/settings", label: "Configurações", icon: Settings },
] as const;

function Crumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segs = path.split("/").filter(Boolean);
  if (segs.length === 0) return <span>Início</span>;
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    patients: "Pacientes",
    new: "Nova Anamnese",
    templates: "Templates",
    settings: "Configurações",
    diet: "Dieta",
  };
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground min-w-0">
      {segs.map((s, i) => (
        <span key={i} className="flex items-center gap-2 min-w-0">
          {i > 0 && <ChevronRight className="size-3 opacity-50 shrink-0" />}
          <span className={"truncate " + (i === segs.length - 1 ? "text-foreground" : "")}>
            {labelMap[s] ?? s}
          </span>
        </span>
      ))}
    </div>
  );
}

function BackButton() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  // Esconde nas raízes de cada persona (nutri e paciente).
  if (
    path === "/" ||
    path === "/dashboard" ||
    path === "/my-dashboard" ||
    path === "/my-plan"
  ) {
    return null;
  }
  function goBack() {
    // Determinístico: sobe para a rota pai dentro do app.
    // NÃO usar router.history.back() — ele pode sair do app shell
    // (login, intro, landing antiga) e quebrar a continuidade visual.
    const segs = path.split("/").filter(Boolean);
    segs.pop();
    const parent = segs.length > 0 ? "/" + segs.join("/") : "/dashboard";
    navigate({ to: parent });
  }
  return (
    <button
      onClick={goBack}
      title="Voltar"
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
    >
      <ArrowLeft className="size-3.5" />
      <span className="hidden sm:inline">Voltar</span>
    </button>
  );
}

function AccessGateSplash() {
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="fj-logo-aura relative inline-flex items-center justify-center size-[72px] shrink-0">
          <span className="fj-logo-pulse" aria-hidden />
          <img src={fjLogo} alt="FitJourney" className="relative z-10 size-[72px] object-contain" />
        </span>
        <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden />
      </div>
    </div>
  );
}

export function AppShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, roles, loading: authLoading, signOut } = useAuth();

  const isAdmin = roles.includes("admin");
  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = email.split("@")[0];

  const isPatientArea =
    path === "/my-dashboard" ||
    path.startsWith("/my-dashboard/") ||
    path === "/my-plan" ||
    path.startsWith("/my-plan/") ||
    path.startsWith("/onboarding/patient");

  const avatarQuery = useQuery({
    queryKey: ["app-shell-avatar", user?.id, isPatientArea],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user?.id) return null;
      const table = isPatientArea ? "patients" : "nutritionists";
      const { data } = await supabase
        .from(table)
        .select("avatar_url")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      return createAvatarSignedUrl(supabase, (data?.avatar_url as string | null) ?? null);
    },
  });
  const avatarUrl = avatarQuery.data ?? null;
  const settingsHref = isPatientArea ? "/my-plan/settings" : "/settings";

  // Sidebar: cache module-level evita que cada remount do AppShell (cada rota
  // envolve <AppShell>) reabra o menu em mobile causando flash "expande/retrai"
  // que o usuário percebia como "não trocou de tela".
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => __sidebarOpenCache ?? true,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    __sidebarOpenCache = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    setMounted(true);
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      __sidebarOpenCache === null
    ) {
      setSidebarOpen(false);
    }
    applyTheme(getStoredTheme());
  }, []);

  // Fecha sidebar automaticamente ao navegar em telas mobile.
  useEffect(() => {
    if (mounted && typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Identity → determina qual nav exibir. Patient nunca pode ver nav de nutri.
  const fetchIdentity = useServerFn(getMyIdentityState);
  const { data: identity } = useQuery({
    queryKey: ["identity-state", user?.id ?? "anonymous"],
    queryFn: () => fetchIdentity(),
    staleTime: 60_000,
    enabled: mounted && !!user?.id,
  });
  const isResolvingIdentity = !mounted || authLoading || (!!user?.id && !identity);
  const isPatient = identity?.role === "patient";
  const roleRouteMismatch = Boolean(
    identity?.state === "S3" &&
      ((identity.role === "patient" && !isPatientArea) ||
        (identity.role !== "patient" && isPatientArea)),
  );
  const baseNav = isPatient ? patientNav : nutritionistNav;
  const nav = !isPatient && isAdmin
    ? ([...baseNav, { to: "/admin/profissionais", label: "Admin", icon: ShieldCheck }] as const)
    : baseNav;

  // Badge de anamneses pendentes (silencioso para não-nutri: retorna 0).
  const fetchPending = useServerFn(getMyPendingAnamnesesCount);
  const { data: pending } = useQuery({
    queryKey: ["nav", "pending-anamneses", user?.id ?? "anonymous"],
    queryFn: () => fetchPending(),
    staleTime: 30_000,
    enabled: mounted && !!user?.id && !isPatient,
  });

  // Badge de feedback pendente (paciente).
  const fetchFbStatus = useServerFn(getMyFeedbackStatus);
  const { data: fbStatus } = useQuery({
    queryKey: ["patient-feedback-status-nav", user?.id ?? "anonymous"],
    queryFn: () => fetchFbStatus(),
    staleTime: 60_000,
    enabled: mounted && !!user?.id && isPatient,
  });

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/app" });
  }

  useEffect(() => {
    if (!roleRouteMismatch) return;
    navigate({
      to: identity?.role === "patient" ? "/my-dashboard" : "/dashboard",
      replace: true,
    });
  }, [identity?.role, navigate, roleRouteMismatch]);

  if (isResolvingIdentity || roleRouteMismatch) {
    return <AccessGateSplash />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <button
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      <aside
        className={
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-sidebar px-4 py-6 flex flex-col transition-transform duration-200 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:px-0 md:border-r-0 md:overflow-hidden")
        }
      >
        <div className="flex items-center justify-between gap-2 px-2 mb-10">
          <button
            type="button"
            onClick={() => {
              import("@/components/IntroOverlay").then((m) => m.playIntro());
            }}
            className="flex items-center gap-3 group focus:outline-none"
            title="Reproduzir intro"
          >
            <span className="fj-logo-aura relative inline-flex items-center justify-center size-[72px] shrink-0">
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
              <img
                src={fjLogo}
                alt="FitJourney"
                className="relative z-10 size-[72px] object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </span>
            <span className="fj-wordmark text-[17px] leading-none">
              FitJourney
            </span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            title="Recolher menu"
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            const badgeKey = "badgeKey" in item ? item.badgeKey : null;
            const badgeCount =
              badgeKey === "pending-anamneses"
                ? pending?.pendingCount ?? 0
                : 0;
            const showDot =
              badgeKey === "feedback-pending" && !!fbStatus?.isPending && !!fbStatus.hasNutritionist;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setSidebarOpen(false);
                    __sidebarOpenCache = false;
                  }
                }}
                className={
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors " +
                  (active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50")
                }
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
                    {badgeCount}
                  </span>
                )}
                {showDot && (
                  <span
                    title="Feedback pendente"
                    className="size-2 rounded-full bg-primary animate-pulse"
                  />
                )}
              </Link>
            );
          })}
        </nav>


        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-md"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </aside>

      <div className={sidebarOpen ? "md:pl-64" : "md:pl-0"}>
        <ExpirationBanner />
        <header className="h-16 border-b border-border flex items-center justify-between gap-3 px-4 sm:px-8 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? "Recolher menu" : "Expandir menu"}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <Menu className="size-4" />
            </button>
            <BackButton />
            <Crumbs />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {header}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium flex items-center gap-1.5 justify-end">
                {displayName}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5">
                    <ShieldCheck className="size-2.5" />
                    Admin
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase truncate max-w-[200px]">
                {email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: settingsHref })}
              title="Abrir configurações"
              className="size-9 sm:size-10 rounded-full bg-surface border border-border overflow-hidden grid place-items-center text-xs font-mono shrink-0 hover:border-primary/60 transition-colors"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
