// Patient Dashboard — invariante #6 (skill fitjourney-clinical-invariants).
// Centro da experiência do paciente: Dashboard → Plano → Feedback → Histórico.
// READ ONLY. Zero recálculo. Zero normalização. Zero inferência.
// Lê ClinicalContext (estado clínico atual) + snapshot do plano ativo.

import { useMemo } from "react";
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
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
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

  const greeting = useMemo(() => {
    const now = new Date();
    const period = getPeriod(now.getHours());
    return {
      label: periodLabel(period),
      message: pickGreetingMessage(period),
      today: formatTodayPtBr(now),
    };
  }, []);

  const firstName = (profile?.fullName ?? "").split(" ")[0] ?? "";
  const snapshot = (plan?.snapshot ?? null) as
    | { name?: string; kcal?: number; meals?: unknown[] }
    | null;
  const hasPlan = Boolean(plan && snapshot);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Saudação */}
        <header className="space-y-1">
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

        {/* Plano contratado (financeiro) */}
        <section
          aria-labelledby="subscription"
          className="bg-surface border border-border rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2
              id="subscription"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              Plano contratado
            </h2>
            <Wallet className="size-3 text-muted-foreground" />
          </div>
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
        </section>



        {/* Plano ativo resumido */}
        <section
          aria-labelledby="active-plan"
          className="bg-surface border border-border rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2
              id="active-plan"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              Plano ativo
            </h2>
            {hasPlan && (
              <Link
                to="/my-plan"
                className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline"
              >
                Abrir <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
          {planLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : !hasPlan ? (
            <p className="text-sm text-muted-foreground">
              Nenhum plano publicado por enquanto. Assim que seu nutricionista
              publicar, ele aparece aqui.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xl font-semibold tracking-tight">
                {snapshot?.name ?? "Plano alimentar"}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-mono">
                {typeof snapshot?.kcal === "number" && (
                  <span>
                    {Math.round(snapshot.kcal).toLocaleString("pt-BR")} kcal/dia
                  </span>
                )}
                {Array.isArray(snapshot?.meals) && (
                  <span>{snapshot.meals.length} refeições/dia</span>
                )}
                {plan?.publishedAt && (
                  <span>publicado em {formatShortDate(plan.publishedAt)}</span>
                )}
              </div>
            </div>
          )}
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
