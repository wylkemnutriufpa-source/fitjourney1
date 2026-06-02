// Landing pública do profissional /n/{slug}
// Template padrão FitJourney com dados editáveis do nutricionista
// (foto, nome, especialidade, headline, bio, CRN) e CTA de cadastro
// usando o link bonito /c/{slug}/{code}.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Sparkles, ShieldCheck, ArrowRight, User } from "lucide-react";
import { LogoOrbital } from "@/components/LogoOrbital";
import { getNutritionistPublicProfile } from "@/lib/profile/nutritionist-public.functions";
import { resolveInviteBySlug } from "@/lib/profile/nutritionist-public.functions";

const profileQO = (slug: string) =>
  queryOptions({
    queryKey: ["nutri-public-profile", slug],
    queryFn: () => getNutritionistPublicProfile({ data: { slug } }),
  });

const inviteQO = (slug: string) =>
  queryOptions({
    queryKey: ["invite", slug, "auto"],
    queryFn: () => resolveInviteBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/n/$slug")({
  loader: async ({ params, context }) => {
    const [profile] = await Promise.all([
      context.queryClient.ensureQueryData(profileQO(params.slug)),
      context.queryClient
        .ensureQueryData(inviteQO(params.slug))
        .catch(() => null),
    ]);
    return profile;
  },
  head: ({ loaderData }) => {
    const name =
      loaderData?.displayName?.trim() ||
      loaderData?.fullName ||
      "Nutricionista — FitJourney";
    const headline =
      loaderData?.publicHeadline ||
      loaderData?.specialty ||
      "Plano alimentar personalizado com FitJourney.";
    return {
      meta: [
        { title: `${name} — FitJourney` },
        { name: "description", content: headline },
        { property: "og:title", content: `${name} — FitJourney` },
        { property: "og:description", content: headline },
        ...(loaderData?.avatarUrl
          ? [{ property: "og:image", content: loaderData.avatarUrl } as const]
          : []),
      ],
    };
  },
  component: NutritionistLanding,
  errorComponent: () => <NotFound />,
  notFoundComponent: () => <NotFound />,
});

function NutritionistLanding() {
  const params = Route.useParams();
  const { data: profile } = useSuspenseQuery(profileQO(params.slug));
  const { data: invite } = useSuspenseQuery(inviteQO(params.slug));

  if (!profile) return <NotFound />;

  const name =
    profile.displayName?.trim() || profile.fullName || "Nutricionista";
  const ctaHref = invite ? `/c/${profile.slug}/${invite.code}` : "/signup";
  const ctaEnabled = !!invite;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoOrbital size="size-9" />
            <span className="font-bold tracking-tight">FitJourney</span>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
            Acesso por convite
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-10">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center">
          <div className="size-32 sm:size-40 rounded-full bg-surface border-2 border-primary/20 overflow-hidden shadow-[0_24px_70px_-20px_rgba(0,0,0,0.25)] grid place-items-center shrink-0 mx-auto md:mx-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={name}
                className="size-full object-cover"
              />
            ) : (
              <User className="size-12 text-muted-foreground" />
            )}
          </div>
          <div className="text-center md:text-left space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5 justify-center md:justify-start">
              <Sparkles className="size-3.5" />
              Plano com {name}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              {profile.publicHeadline?.trim() ||
                "Sua jornada nutricional, planejada com método."}
            </h1>
            {profile.specialty && (
              <p className="text-sm text-muted-foreground">
                {profile.specialty}
                {profile.crn ? ` · ${profile.crn}` : ""}
              </p>
            )}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center md:items-start justify-center md:justify-start">
              {ctaEnabled ? (
                <a
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  Começar minha anamnese
                  <ArrowRight className="size-4" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-muted text-muted-foreground px-6 py-3 text-sm font-semibold cursor-not-allowed">
                  Convite indisponível
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Acompanhamento profissional
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      {profile.publicBio?.trim() && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 border-t border-border/60">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Sobre {name}
          </p>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
            {profile.publicBio}
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 border-t border-border/60">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-6">
          Como funciona
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: "01",
              t: "Anamnese guiada",
              d: "Responde sua anamnese online em poucos minutos.",
            },
            {
              n: "02",
              t: "Plano sob medida",
              d: `${name} aprova e libera seu plano personalizado.`,
            },
            {
              n: "03",
              t: "Acompanhamento",
              d: "Feedbacks regulares, ajustes e progresso visível.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <p className="text-[10px] font-mono text-muted-foreground">
                {s.n}
              </p>
              <h3 className="text-base font-semibold mt-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      {ctaEnabled && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-20 pt-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Pronto pra começar?
          </h2>
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
          >
            Criar minha conta
            <ArrowRight className="size-4" />
          </a>
        </section>
      )}

      <footer className="border-t border-border/60 py-6 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Powered by FitJourney
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <div className="max-w-sm space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Página não encontrada
        </p>
        <h2 className="text-2xl font-bold">
          Esse profissional ainda não publicou uma página.
        </h2>
        <Link to="/" className="inline-block text-xs text-primary hover:underline">
          Conhecer o FitJourney
        </Link>
      </div>
    </div>
  );
}
