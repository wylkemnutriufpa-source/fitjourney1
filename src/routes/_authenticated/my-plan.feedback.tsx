import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/my-plan/feedback")({
  beforeLoad: () => { throw redirect({ to: "/meu-plano/feedback" }); },
});
