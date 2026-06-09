import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/my-plan/update-health-profile")({
  beforeLoad: () => { throw redirect({ to: "/meu-plano/update-health-profile" }); },
});
