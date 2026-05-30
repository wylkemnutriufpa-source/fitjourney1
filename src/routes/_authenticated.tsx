// _authenticated layout — server-side identity gate.
// Resolve estado real (S1/S2/S3) via server fn antes de renderizar qualquer
// rota protegida. Nenhum estado é inferido do cliente.
//
// Regras:
//   - sem sessão (server fn lança Unauthorized) → redirect "/"
//   - S1 (email não confirmado)                 → redirect "/auth/check-email"
//   - S2 (sem profile)                          → força "/_authenticated/onboarding/nutritionist"
//   - S3 (profile ativo)                        → bloqueia onboarding, libera app
//
// O gate aqui é UX. O gate de segurança real está no domain write layer.

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMyIdentityState } from "@/lib/phase2/identity.functions";

const ONBOARDING_PATH = "/_authenticated/onboarding/nutritionist";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    let identity;
    try {
      identity = await getMyIdentityState();
    } catch {
      throw redirect({ to: "/" });
    }

    const path = location.pathname;
    const onOnboarding =
      path === "/onboarding/nutritionist" ||
      path.startsWith("/onboarding/nutritionist/");

    if (identity.state === "S1") {
      throw redirect({ to: "/auth/check-email" });
    }

    if (identity.state === "S2" && !onOnboarding) {
      throw redirect({ to: "/onboarding/nutritionist" });
    }

    if (identity.state === "S3" && onOnboarding) {
      throw redirect({ to: "/dashboard" });
    }

    return { identity };
  },
  component: () => <Outlet />,
});
