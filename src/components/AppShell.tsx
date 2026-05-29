import { Link, Outlet, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileStack,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";


const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", icon: Users },
  { to: "/templates", label: "Templates", icon: FileStack },
  { to: "/settings", label: "Configurações", icon: Settings },
];

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
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {segs.map((s, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-3 opacity-50" />}
          <span className={i === segs.length - 1 ? "text-foreground" : ""}>
            {labelMap[s] ?? s}
          </span>
        </span>
      ))}
    </div>
  );
}

export function AppShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, user, roles, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const isAdmin = roles.includes("admin");
  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = email.split("@")[0];

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-sidebar px-4 py-6 flex flex-col">
        <Link to="/dashboard" className="flex items-center gap-3 px-2 mb-10">
          <div className="size-8 bg-primary rounded-sm grid place-items-center">
            <div className="size-4 border-2 border-background rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tight uppercase italic">
            FitJourney
          </span>
        </Link>

        <nav className="space-y-1 flex-1">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
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
                {item.label}
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

      <div className="pl-64">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <BackButton />
            <Crumbs />
          </div>

          <div className="flex items-center gap-4">
            {header}
            <div className="text-right">
              <p className="text-xs font-medium flex items-center gap-1.5 justify-end">
                {displayName}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5">
                    <ShieldCheck className="size-2.5" />
                    Admin
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">
                {email}
              </p>
            </div>
            <div className="size-10 rounded-full bg-surface border border-border grid place-items-center text-xs font-mono">
              {initials}
            </div>
          </div>
        </header>
        <main className="p-8 max-w-7xl mx-auto">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
