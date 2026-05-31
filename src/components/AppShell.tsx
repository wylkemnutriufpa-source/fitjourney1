import { Link, Outlet, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyPendingAnamnesesCount } from "@/lib/anamnesis/review.functions";
import { getMyIdentityState } from "@/lib/phase2/identity.functions";
import { applyTheme, getStoredTheme } from "@/lib/patient/theme";


const nutritionistNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", icon: Users },
  { to: "/anamneses", label: "Anamneses", icon: ClipboardList, badgeKey: "pending-anamneses" as const },
  { to: "/templates", label: "Templates", icon: FileStack },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

const patientNav = [
  { to: "/my-plan", label: "Meu Plano", icon: LayoutDashboard },
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
  const router = useRouter();
  const navigate = useNavigate();
  if (path === "/" || path === "/dashboard") return null;
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    const parent = path.split("/").slice(0, -1).join("/") || "/dashboard";
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

export function AppShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, roles, signOut } = useAuth();

  const isAdmin = roles.includes("admin");
  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = email.split("@")[0];

  // Sidebar: começa sempre aberto (SSR e client) para evitar hydration mismatch.
  // Fecha em mobile após o mount via useEffect.
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
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
    queryKey: ["identity-state"],
    queryFn: () => fetchIdentity(),
    staleTime: 60_000,
    enabled: mounted,
  });
  const isPatient = identity?.role === "patient";
  const nav = isPatient ? patientNav : nutritionistNav;

  // Badge de anamneses pendentes (silencioso para não-nutri: retorna 0).
  const fetchPending = useServerFn(getMyPendingAnamnesesCount);
  const { data: pending } = useQuery({
    queryKey: ["nav", "pending-anamneses"],
    queryFn: () => fetchPending(),
    staleTime: 30_000,
    enabled: mounted && !isPatient,
  });

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
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
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-sm grid place-items-center">
              <div className="size-4 border-2 border-background rotate-45" />
            </div>
            <span className="text-lg font-bold tracking-tight uppercase italic">
              FitJourney
            </span>
          </Link>
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
            const badgeCount =
              "badgeKey" in item && item.badgeKey === "pending-anamneses"
                ? pending?.pendingCount ?? 0
                : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
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
            <div className="size-9 sm:size-10 rounded-full bg-surface border border-border grid place-items-center text-xs font-mono shrink-0">
              {initials}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
