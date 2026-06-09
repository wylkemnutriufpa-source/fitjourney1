import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/my-plan/anamnese")({
  beforeLoad: () => { throw redirect({ to: "/meu-plano/anamnese" }); },
});
