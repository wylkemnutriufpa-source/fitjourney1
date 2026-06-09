import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/my-plan/physical-assessment")({
  beforeLoad: () => { throw redirect({ to: "/meu-plano/physical-assessment" }); },
});
