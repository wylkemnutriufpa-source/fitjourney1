// Patient App — Clinical Alerts (READ ONLY, renderização burra).
// Consome SOMENTE a última anamnese APROVADA. Submitted/draft NÃO disparam alerta.
// Fonte: getMyLatestAnamnesisSummary.

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { getMyLatestAnamnesisSummary } from "@/lib/anamnesis/review.functions";
import { describeAllAlerts, type AlertSeverity } from "@/lib/anamnesis/v2/alerts.catalog";

const sevStyle: Record<AlertSeverity, { box: string; icon: typeof AlertCircle; iconCls: string }> = {
  critical: {
    box: "border-destructive/50 bg-destructive/10 text-destructive",
    icon: AlertCircle,
    iconCls: "text-destructive",
  },
  warning: {
    box: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: AlertTriangle,
    iconCls: "text-amber-600 dark:text-amber-400",
  },
  info: {
    box: "border-border bg-muted/40 text-foreground",
    icon: Info,
    iconCls: "text-muted-foreground",
  },
};

export function ClinicalAlerts() {
  const fetchSummary = useServerFn(getMyLatestAnamnesisSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["patient", "latest-anamnesis-summary"],
    queryFn: () => fetchSummary(),
    staleTime: 60_000,
  });

  if (isLoading || !data) return null;

  const alerts = describeAllAlerts({
    clinicalFlags: data.clinicalFlags,
    riskFlags: data.riskFlags,
  });

  if (alerts.length === 0) return null;

  const approved = data.approvedAt
    ? new Date(data.approvedAt).toLocaleDateString("pt-BR")
    : null;

  return (
    <section className="space-y-2" aria-label="Alertas clínicos">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Perfil clínico {approved && <span>· revisado em {approved}</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {alerts.map((a) => {
          const s = sevStyle[a.severity];
          const Icon = s.icon;
          return (
            <div
              key={`${a.kind}:${a.code}`}
              className={"flex items-start gap-2 rounded-md border px-3 py-2 " + s.box}
            >
              <Icon className={"size-4 mt-0.5 shrink-0 " + s.iconCls} />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{a.label}</p>
                {a.hint && (
                  <p className="text-xs opacity-80 mt-0.5">{a.hint}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
