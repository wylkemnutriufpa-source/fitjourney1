import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context, location }) => {
    // SSR: parent _authenticated guard retorna cedo no servidor (sem identity).
    // Não podemos validar admin aqui sem identity — deixamos o client revalidar.
    if (typeof window === "undefined") return;
    const identity = (context as any)?.identity;
    if (identity && !identity.appRoles?.includes("admin")) {
      throw redirect({ to: "/dashboard" });
    }
    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/profissionais" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/admin/profissionais", label: "Profissionais" },
    { to: "/admin/pacientes", label: "Pacientes" },
    { to: "/admin/leads", label: "Leads" },
    { to: "/admin/landing", label: "Landing Page" },
    { to: "/admin/logos", label: "Logos" },
    { to: "/admin/settings", label: "Checkout" },
  ];
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <ShieldCheck className="size-3.5" /> Painel Admin
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Administração</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
          {tabs.map((t) => {
            const active = path === t.to || path.startsWith(t.to + "/");
            return (
              <Link
                key={t.to}
                to={t.to}
                className={
                  "px-3 py-2.5 text-sm font-medium rounded-lg border text-center transition-colors " +
                  (active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </div>
    </AppShell>
  );
}
