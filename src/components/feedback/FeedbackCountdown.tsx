// Cronômetro de feedback do paciente.
// Lê frequencyDays do nutricionista + lastFeedbackAt e mostra:
// - quantos dias faltam até o próximo
// - quantos dias atrasado, se for o caso
// - barra de progresso visual
//
// READ-ONLY. Não dispara mutations. Não infere dado clínico.

import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  frequencyDays: number;
  lastFeedbackAt: string | null;
  daysSinceLast: number | null;
};

function pluralDays(n: number): string {
  return `${n} dia${n === 1 ? "" : "s"}`;
}

export function FeedbackCountdown({
  frequencyDays,
  lastFeedbackAt,
  daysSinceLast,
}: Props) {
  // Caso 1: nunca enviou feedback
  if (lastFeedbackAt === null || daysSinceLast === null) {
    return (
      <div className="bg-surface border border-primary/40 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary">
          <Clock className="size-3.5" />
          Próximo feedback
        </div>
        <p className="text-2xl font-bold tracking-tight">
          Envie seu primeiro feedback
        </p>
        <p className="text-xs text-muted-foreground">
          Você combinou com seu nutricionista enviar feedback a cada{" "}
          <strong className="text-foreground">{pluralDays(frequencyDays)}</strong>.
        </p>
      </div>
    );
  }

  const daysRemaining = frequencyDays - daysSinceLast;
  const isOverdue = daysRemaining < 0;
  const isDueToday = daysRemaining === 0;
  const isUpcoming = daysRemaining > 0;

  // Progresso 0..1 (1 = vencido)
  const progress = Math.min(1, Math.max(0, daysSinceLast / frequencyDays));
  const progressPct = Math.round(progress * 100);

  const tone = isOverdue
    ? {
        border: "border-destructive/50",
        ring: "bg-destructive/10",
        bar: "bg-destructive",
        text: "text-destructive",
        Icon: AlertTriangle,
      }
    : isDueToday
      ? {
          border: "border-amber-500/50",
          ring: "bg-amber-500/10",
          bar: "bg-amber-500",
          text: "text-amber-500",
          Icon: AlertTriangle,
        }
      : {
          border: "border-primary/40",
          ring: "bg-primary/5",
          bar: "bg-primary",
          text: "text-primary",
          Icon: Clock,
        };

  const headline = isOverdue
    ? `Atrasado há ${pluralDays(Math.abs(daysRemaining))}`
    : isDueToday
      ? "Feedback é hoje"
      : `Faltam ${pluralDays(daysRemaining)}`;

  const subline = isOverdue ? (
    <>
      Seu envio anterior foi há <strong>{pluralDays(daysSinceLast)}</strong>. A
      frequência combinada é de{" "}
      <strong className="text-foreground">{pluralDays(frequencyDays)}</strong>.
      Envie agora para manter o acompanhamento em dia.
    </>
  ) : isDueToday ? (
    <>
      Já se passaram <strong>{pluralDays(daysSinceLast)}</strong> desde o último
      envio. Aproveite o dia para registrar como foi a semana.
    </>
  ) : (
    <>
      Último envio há <strong>{pluralDays(daysSinceLast)}</strong>. Próximo
      envio combinado em <strong>{pluralDays(daysRemaining)}</strong>.
    </>
  );

  const Icon = tone.Icon;

  return (
    <div
      className={
        "bg-surface border rounded-lg p-5 space-y-4 " + tone.border
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div
            className={
              "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest " +
              tone.text
            }
          >
            <Icon className="size-3.5" />
            Próximo feedback
          </div>
          <p className={"text-2xl font-bold tracking-tight " + tone.text}>
            {headline}
          </p>
        </div>
        {!isOverdue && !isDueToday && (
          <CheckCircle2 className="size-5 text-primary/60 shrink-0" />
        )}
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1.5">
        <div className={"h-2 rounded-full overflow-hidden " + tone.ring}>
          <div
            className={"h-full transition-all duration-500 " + tone.bar}
            style={{ width: `${progressPct}%` }}
            aria-hidden
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>Último: há {pluralDays(daysSinceLast)}</span>
          <span>Ciclo: {pluralDays(frequencyDays)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{subline}</p>
    </div>
  );
}
