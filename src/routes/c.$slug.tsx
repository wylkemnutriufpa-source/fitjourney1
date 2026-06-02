// /c/{slug} → pega o code ativo do nutri e redireciona para /signup/patient?code=X
// Link curto e memorável (sem precisar do code).

import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { resolveInviteBySlug } from "@/lib/profile/nutritionist-public.functions";

const inviteQO = (slug: string) =>
  queryOptions({
    queryKey: ["invite", slug, "auto"],
    queryFn: () => resolveInviteBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/c/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(inviteQO(params.slug)),
  head: () => ({
    meta: [
      { title: `Convite — FitJourney` },
      { name: "description", content: "Convite de cadastro de paciente." },
    ],
  }),
  component: InviteShortRedirect,
  errorComponent: () => <InviteInvalid />,
});

function InviteShortRedirect() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(inviteQO(params.slug));
  if (!data) return <InviteInvalid />;
  return <Navigate to="/signup/patient" search={{ code: data.code }} replace />;
}

function InviteInvalid() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <div className="max-w-sm space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-destructive">
          Convite indisponível
        </p>
        <h2 className="text-2xl font-bold">Profissional sem convite ativo.</h2>
        <p className="text-sm text-muted-foreground">
          Peça um link de convite atualizado ao seu nutricionista.
        </p>
        <Link to="/" className="inline-block text-xs text-primary hover:underline">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
