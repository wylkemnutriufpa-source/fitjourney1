import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/my-plan/protocolos")({
  beforeLoad: () => { throw redirect({ to: "/meu-plano/protocolos" }); },
});
