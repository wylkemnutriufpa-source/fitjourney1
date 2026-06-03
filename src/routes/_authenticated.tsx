// _authenticated layout — server-side identity gate.
// Resolve estado real (S1/S2/S3) via server fn antes de renderizar qualquer
// rota protegida. Nenhum estado é inferido do cliente.

import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { getMyIdentityState } from "@/lib/phase2/identity.functions";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/_authenticated")({
  // Rotas protegidas dependem da sessão persistida no browser. Renderizar esse
  // subtree no servidor causa HTML sem sessão + hidratação com sessão, gerando
  // mismatch React #418 e chamadas serverFn sem Authorization em hard reload.
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Defesa extra caso este guard rode fora do browser em algum ambiente.
    if (typeof window === "undefined") {
      return;
    }

    // 1) Client-side session gate — evita chamar serverFn sem token e
    //    impede o loop "serverFn 401 → redirect / → login → redirect /dashboard".
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/app" });
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
        throw redirect({ to: "/app" });
      }
      throw err;
    }

    const path = location.pathname;
    const onOnboarding =
      path === "/onboarding/nutritionist" ||
      path.startsWith("/onboarding/nutritionist/");
    const onPatientOnboarding =
      path === "/onboarding/patient" || path.startsWith("/onboarding/patient/");
    const isPatientRoute =
      path === "/my-dashboard" ||
      path.startsWith("/my-dashboard/") ||
      path === "/my-plan" ||
      path.startsWith("/my-plan/") ||
      onPatientOnboarding;

    const isAdmin = identity.appRoles.includes("admin");

    if (isAdmin && identity.state !== "S1") {
      if (isPatientRoute) {
        throw redirect({ to: "/dashboard", replace: true });
      }
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

    if (identity.state === "S3" && identity.role !== "patient" && isPatientRoute) {
      throw redirect({ to: "/dashboard", replace: true });
    }

    // Patient gate: pacientes acessam /my-dashboard, /my-plan/* e
    // /onboarding/patient.
    // - Enquanto onboarding_completed_at IS NULL → força /onboarding/patient.
    // - Após onboarding concluído: /onboarding/patient bloqueado (semântica de
    //   primeira entrada). Tela inicial = /my-dashboard (invariante #6).
    if (identity.state === "S3" && identity.role === "patient") {
      const onboardingDone = Boolean(identity.patient?.onboardingCompletedAt);

      if (!onboardingDone) {
        if (!onPatientOnboarding) {
          throw redirect({ to: "/onboarding/patient", replace: true });
        }
        return { identity };
      }

      if (onPatientOnboarding) {
        throw redirect({ to: "/my-dashboard", replace: true });
      }
      if (!isPatientRoute || onPatientOnboarding) {
        throw redirect({ to: "/my-dashboard", replace: true });
      }
    }

    return { identity };
  },
  component: () => <Outlet />,
});
