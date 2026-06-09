// Redirect legacy /my-plan → /meu-plano (mantém pacientes com a URL antiga
// bookmarkada vendo o plano publicado).
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/my-plan")({
  beforeLoad: () => {
    throw redirect({ to: "/meu-plano" });
  },
});
