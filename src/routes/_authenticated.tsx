// _authenticated layout — server-side identity gate.
// Resolve estado real (S1/S2/S3) via server fn antes de renderizar qualquer
// rota protegida. Nenhum estado é inferido do cliente.

import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { getMyIdentityState } from "@/lib/phase2/identity.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // SSR não enxerga a sessão persistida no browser. Se redirecionar aqui,
    // um hard reload em /dashboard vira 307 -> / e o iframe do preview pode
    // alternar entre / e /dashboard indefinidamente. O guard autoritativo
    // continua rodando no client antes da navegação/renderização interativa.
    if (typeof window === "undefined") {
      return;
    }

    // 1) Client-side session gate — evita chamar serverFn sem token e
    //    impede o loop "serverFn 401 → redirect / → login → redirect /dashboard".
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/" });
    }

    // 2) Resolve estado autoritativo no servidor.
    let identity;
    try {
      identity = await getMyIdentityState();
    } catch (err) {
      if (isRedirect(err)) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[_authenticated guard] identity resolve failed:", msg);
      // Só desloga em erro real de auth. Outros erros sobem pro errorComponent.
      if (msg.includes("Unauthorized")) {
        throw redirect({ to: "/" });
      }
      throw err;
    }

    const path = location.pathname;
    const onOnboarding =
      path === "/onboarding/nutritionist" ||
      path.startsWith("/onboarding/nutritionist/");

    const isAdmin = identity.appRoles.includes("admin");

    if (isAdmin && identity.state !== "S1") {
      if (onOnboarding && path !== "/dashboard") {
        throw redirect({ to: "/dashboard", replace: true });
      }
      return { identity };
    }

    if (identity.state === "S1" && path !== "/auth/check-email") {
      throw redirect({ to: "/auth/check-email", replace: true });
    }

    if (identity.state === "S2" && !onOnboarding) {
      throw redirect({ to: "/onboarding/nutritionist", replace: true });
    }

    if (identity.state === "S3" && onOnboarding) {
      throw redirect({ to: "/dashboard", replace: true });
    }

    // Patient gate: pacientes só acessam /my-plan.
    // Soberania: admin/nutricionista nunca caem aqui (admin retorna acima,
    // nutricionista tem role !== "patient").
    if (identity.state === "S3" && identity.role === "patient") {
      const isPatientRoute = path === "/my-plan" || path.startsWith("/my-plan/");
      if (!isPatientRoute) {
        throw redirect({ to: "/my-plan", replace: true });
      }
    }

    return { identity };
  },
  component: () => <Outlet />,
});
