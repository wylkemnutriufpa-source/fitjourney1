// /c/{slug}/{code} → valida slug+code e redireciona para /signup/patient?code=X
// Link bonito do convite individual. Se inválido, mostra erro amigável.

import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { resolveInviteBySlug } from "@/lib/profile/nutritionist-public.functions";

const inviteQO = (slug: string, code: string) =>
  queryOptions({
    queryKey: ["invite", slug, code],
    queryFn: () => resolveInviteBySlug({ data: { slug, code } }),
  });

export const Route = createFileRoute("/c/$slug/$code")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(inviteQO(params.slug, params.code)),
  head: ({ params }) => ({
    meta: [
      { title: `Convite — FitJourney` },
      {
        name: "description",
        content: `Convite de cadastro de paciente (${params.slug}).`,
      },
    ],
  }),
  component: InviteRedirect,
  errorComponent: () => <InviteInvalid />,
});

function InviteRedirect() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(inviteQO(params.slug, params.code));
  if (!data) return <InviteInvalid />;
  return <Navigate to="/signup/patient" search={{ code: data.code }} replace />;
}

function InviteInvalid() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <div className="max-w-sm space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-destructive">
          Convite inválido
        </p>
        <h2 className="text-2xl font-bold">Link de convite inválido ou expirado.</h2>
        <p className="text-sm text-muted-foreground">
          Peça um novo link ao seu nutricionista.
        </p>
        <Link to="/" className="inline-block text-xs text-primary hover:underline">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
