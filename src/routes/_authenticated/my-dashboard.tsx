// Patient Dashboard — invariante #6 (skill fitjourney-clinical-invariants).
// Centro da experiência do paciente: Dashboard → Plano → Feedback → Histórico.
// READ ONLY. Zero recálculo. Zero normalização. Zero inferência.
// Lê ClinicalContext (estado clínico atual) + snapshot do plano ativo.

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Utensils,
  MessageSquare,
  History,
  AlertCircle,
  CheckCircle2,
  Scale,
  Target,
  ArrowRight,
  Wallet,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeedbackCountdown } from "@/components/feedback/FeedbackCountdown";
import { getMyFeedbackStatus } from "@/lib/feedback/feedback.functions";
import { getMyActivePlan } from "@/lib/plans/patient-plan.functions";
import { getMyPatientProfile } from "@/lib/profile/patient-profile.functions";
import { getMyClinicalContext } from "@/lib/clinical/context.functions";
import { getMyActiveSubscription } from "@/lib/finance/subscriptions.functions";
import {
  daysUntil,
  formatMoneyBRL,
  formatShortDate as formatSubDate,
  planKindLabel,
  statusLabel,
} from "@/lib/finance/format";
import {
  getPeriod,
  periodLabel,
  pickGreetingMessage,
  formatTodayPtBr,
} from "@/lib/patient/greetings";

export const Route = createFileRoute("/_authenticated/my-dashboard")({
  head: () => ({ meta: [{ title: "Início — FitJourney" }] }),
  component: MyDashboardPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="text-sm text-destructive" role="alert">
        Não foi possível carregar seu painel: {error.message}
      </div>
    </AppShell>
  ),
});

const MISSING_LABELS: Record<string, string> = {
  weight: "peso atual",
  goal: "objetivo",
  sex: "sexo",
  ageYears: "idade",
  heightCm: "altura",
  activity: "nível de atividade",
};

function MyDashboardPage() {
  const fetchPlan = useServerFn(getMyActivePlan);
  const fetchProfile = useServerFn(getMyPatientProfile);
  const fetchClinical = useServerFn(getMyClinicalContext);

  const { data: profile } = useQuery({
    queryKey: ["my-patient-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["patient", "active-plan"],
    queryFn: () => fetchPlan(),
    staleTime: 30_000,
  });
  const { data: clinical, isLoading: clinicalLoading } = useQuery({
    queryKey: ["patient", "clinical-context"],
    queryFn: () => fetchClinical(),
    staleTime: 30_000,
  });
  const fetchSubscription = useServerFn(getMyActiveSubscription);
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["patient", "active-subscription"],
    queryFn: () => fetchSubscription(),
    staleTime: 30_000,
  });
  const fetchFbStatus = useServerFn(getMyFeedbackStatus);
  const { data: fbStatus } = useQuery({
    queryKey: ["patient-feedback-status-dashboard"],
    queryFn: () => fetchFbStatus(),
    staleTime: 30_000,
  });

  // Saudação depende do horário/local do cliente → calcular só após mount
  // evita hydration mismatch (React #418) que apagava a tela.
  const [greeting, setGreeting] = useState<{
    label: string;
    message: string;
    today: string;
  } | null>(null);
  useEffect(() => {
    const now = new Date();
    const period = getPeriod(now.getHours());
    setGreeting({
      label: periodLabel(period),
      message: pickGreetingMessage(period),
      today: formatTodayPtBr(now),
    });
  }, []);

  const firstName = (profile?.fullName ?? "").split(" ")[0] ?? "";
  const snapshot = (plan?.snapshot ?? null) as
    | { name?: string; kcal?: number; meals?: unknown[] }
    | null;
  const hasPlan = Boolean(plan && snapshot);

  const showLegacyWelcome = Boolean(
    profile?.sourceLegacyId && profile?.hasAnamnesis === false,
  );

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Boas-vindas para pacientes migrados do FJ1 */}
        {showLegacyWelcome && <LegacyWelcomeBanner firstName={firstName} />}

        {/* Saudação — só renderiza após mount (evita SSR/client mismatch). */}
        <header className="space-y-1 min-h-[88px]">
          {greeting && (
            <>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {greeting.today}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                {greeting.label}
                {firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                {greeting.message}
              </p>
            </>
          )}
        </header>

        {/* Estado clínico */}
        <section
          aria-labelledby="clinical-state"
          className="bg-surface border border-border rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2
              id="clinical-state"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              Seu estado clínico
            </h2>
            {clinical?.ready ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-500">
                <CheckCircle2 className="size-3" /> pronto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-amber-500">
                <AlertCircle className="size-3" /> dados pendentes
              </span>
            )}
          </div>

          {clinicalLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : !clinical ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há dados clínicos vinculados ao seu perfil.
            </p>
          ) : clinical.ready ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStat
                icon={Scale}
                label="Peso atual"
                value={`${clinical.currentWeight!.weightKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`}
                hint={`Registrado em ${formatShortDate(clinical.currentWeight!.measuredAt)}`}
              />
              <ClinicalStat
                icon={Target}
                label="Objetivo"
                value={goalLabel(clinical.currentGoal!.kind)}
                hint={`Definido em ${formatShortDate(clinical.currentGoal!.decidedAt)}`}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Faltam algumas informações para personalizar seu acompanhamento:
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {clinical.missing.map((k) => (
                  <li
                    key={k}
                    className="text-[11px] font-mono uppercase tracking-wide border border-border rounded px-2 py-1 bg-background"
                  >
                    {MISSING_LABELS[k] ?? k}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Você ainda pode navegar normalmente. Conforme novas anamneses e
                feedbacks chegam, esta seção se atualiza.
              </p>
            </div>
          )}
        </section>

        {/* Plano ativo + Plano contratado (mesclados) */}
        <section
          aria-labelledby="active-plan"
          className="bg-surface border border-border rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2
              id="active-plan"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              Plano ativo
            </h2>
            <Wallet className="size-3 text-muted-foreground" />
          </div>

          {planLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : !hasPlan ? (
            <p className="text-sm text-muted-foreground">
              Nenhum plano publicado por enquanto. Assim que seu nutricionista
              publicar, ele aparece aqui.
            </p>
          ) : (
            <Link
              to="/my-plan"
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition"
            >
              <div>
                <p className="text-base font-semibold tracking-tight">
                  Acesse seu plano
                </p>
                {plan?.publishedAt && (
                  <p className="text-[11px] font-mono text-muted-foreground">
                    publicado em {formatShortDate(plan.publishedAt)}
                  </p>
                )}
              </div>
              <ArrowRight className="size-4 text-primary" />
            </Link>
          )}

          {/* Plano contratado (financeiro) */}
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Plano contratado
            </p>
            {subLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : !subscription ? (
              <p className="text-sm text-muted-foreground">
                Nenhum plano financeiro registrado pelo seu nutricionista.
              </p>
            ) : (
              <SubscriptionInfo
                planKind={subscription.planKind}
                status={subscription.status}
                priceCents={subscription.priceCents}
                startsAt={subscription.startsAt}
                endsAt={subscription.endsAt}
              />
            )}
          </div>
        </section>

        {/* Tiles de navegação */}
        <section
          aria-label="Navegação"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <NavTile
            to="/my-plan"
            icon={Utensils}
            title="Meu plano"
            description="Refeições, equivalências e detalhes do plano publicado."
          />
          <NavTile
            to="/my-plan/feedback"
            icon={MessageSquare}
            title="Enviar feedback"
            description="Compartilhe peso, fotos e como foi a semana."
          />
          <NavTile
            icon={History}
            title="Histórico"
            description="Linha do tempo da sua jornada."
            comingSoon
          />
        </section>
      </div>
    </AppShell>
  );
}

function SubscriptionInfo({
  planKind,
  status,
  priceCents,
  startsAt,
  endsAt,
}: {
  planKind: Parameters<typeof planKindLabel>[0];
  status: Parameters<typeof statusLabel>[0];
  priceCents: number;
  startsAt: string;
  endsAt: string | null;
}) {
  const remaining = daysUntil(endsAt);
  const isExpired = remaining !== null && remaining < 0;
  const isExpiringSoon =
    remaining !== null && remaining >= 0 && remaining <= 7;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-xl font-semibold tracking-tight">
          {planKindLabel(planKind)}
        </span>
        <span className="text-base font-mono">
          {formatMoneyBRL(priceCents)}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
          {statusLabel(status)}
        </span>
      </div>
      <p className="text-xs font-mono text-muted-foreground">
        {formatSubDate(startsAt)} → {formatSubDate(endsAt)}
        {remaining !== null && !isExpired && (
          <> · faltam {remaining} dia{remaining === 1 ? "" : "s"}</>
        )}
      </p>
      {isExpired && (
        <p
          className="text-xs font-medium text-amber-500 border border-amber-500/40 rounded px-2 py-1.5 bg-amber-500/5"
          role="status"
        >
          Seu plano venceu em {formatSubDate(endsAt)}. Entre em contato com seu
          nutricionista para renovar. Seu acompanhamento continua acessível.
        </p>
      )}
      {!isExpired && isExpiringSoon && (
        <p
          className="text-xs font-medium text-amber-500 border border-amber-500/40 rounded px-2 py-1.5 bg-amber-500/5"
          role="status"
        >
          Seu plano vence em {remaining} dia{remaining === 1 ? "" : "s"}. Lembre
          de combinar a renovação.
        </p>
      )}
    </div>
  );
}

function ClinicalStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded border border-border bg-background px-3 py-2">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-lg font-bold tracking-tight">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NavTile({
  to,
  icon: Icon,
  title,
  description,
  comingSoon,
}: {
  to?: string;
  icon: typeof Utensils;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  const inner = (
    <div
      className={
        "h-full p-5 rounded-lg border border-border bg-surface space-y-2 transition " +
        (comingSoon
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-primary/40 hover:bg-primary/5")
      }
    >
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-primary" />
        {comingSoon && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
            em breve
          </span>
        )}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
  if (comingSoon || !to) return inner;
  return (
    <Link to={to} className="block">
      {inner}
    </Link>
  );
}

function goalLabel(kind: string): string {
  switch (kind) {
    case "cut":
      return "Emagrecimento";
    case "bulk":
      return "Hipertrofia";
    case "maintain":
      return "Manutenção";
    case "performance":
      return "Performance";
    case "health":
      return "Saúde";
    default:
      return kind;
  }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function LegacyWelcomeBanner({ firstName }: { firstName: string }) {
  return (
    <section
      aria-labelledby="legacy-welcome"
      className="relative overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-br from-primary/10 via-surface to-gold/5 p-6 sm:p-8 space-y-4"
    >
      <div
        aria-hidden
        className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -left-12 -bottom-12 size-40 rounded-full bg-gold/15 blur-3xl"
      />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gold">
          <Sparkles className="size-3.5" />
          Boas-vindas
        </div>
        <div className="space-y-2">
          <h2
            id="legacy-welcome"
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Bem-vindo{firstName ? `, ${firstName}` : ""} ao{" "}
            <span className="fj-wordmark">FitJourney</span>.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Identificamos seu cadastro anterior. Para liberar todos os recursos
            da nova plataforma, atualize sua{" "}
            <span className="text-foreground font-medium">Anamnese Clínica</span>.
          </p>
        </div>
        <Link
          to="/my-plan/update-health-profile"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_28px_-6px_oklch(0.62_0.16_155/0.7)]"
        >
          <ClipboardList className="size-4" />
          Atualizar Anamnese Clínica
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
