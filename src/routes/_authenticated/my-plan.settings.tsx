import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/my-plan/settings")({
  beforeLoad: () => { throw redirect({ to: "/meu-plano/settings" }); },
});
