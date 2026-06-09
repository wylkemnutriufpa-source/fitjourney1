// Card "Diagnóstico Clínico × Protocolo" — renderer burro.
//
// Lê ClinicalContext + protocolos ativos do paciente, chama a função pura
// `diagnoseProtocolVsClinical` e exibe o gap. NÃO edita nada. NÃO bloqueia.
// Se faltar dado clínico, mostra mensagem amigável (invariante #9).

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { getClinicalContext } from "@/lib/clinical/context.functions";
import { runNutritionEngines } from "@/lib/clinical/run-nutrition-engines";
import { listPatientActiveProtocols } from "@/lib/protocols/active.functions";
import {
  diagnoseProtocolVsClinical,
  type DeltaStatus,
  type MetricDiagnosis,
  type ProtocolDiagnosis,
} from "@/lib/protocols/diagnose";

interface Props {
  readonly patientId: string;
}

const STATUS_STYLES: Record<DeltaStatus, { dot: string; text: string; icon: typeof CheckCircle2 }> = {
  ok: { dot: "bg-emerald-400", text: "text-emerald-400", icon: CheckCircle2 },
  warn: { dot: "bg-amber-400", text: "text-amber-400", icon: AlertTriangle },
  off: { dot: "bg-rose-400", text: "text-rose-400", icon: AlertTriangle },
};

function fmtDelta(m: MetricDiagnosis): string {
  const sign = m.deltaAbs > 0 ? "+" : "";
  const unit = m.unit === "kcal" ? " kcal" : " g";
  const pct = m.deltaPct.toFixed(0);
  return `${sign}${m.deltaAbs}${unit} (${sign}${pct}%)`;
}

export function ProtocolDiagnosticCard({ patientId }: Props) {
  const fetchCtx = useServerFn(getClinicalContext);
  const fetchProtocols = useServerFn(listPatientActiveProtocols);

  const ctxQ = useQuery({
    queryKey: ["clinical-context", patientId],
    queryFn: () => fetchCtx({ data: { patientId } }),
    staleTime: 30_000,
  });
  const protocolsQ = useQuery({
    queryKey: ["patient-active-protocols", patientId],
    queryFn: () => fetchProtocols({ data: { patientId } }),
    staleTime: 30_000,
  });

  const protocols = protocolsQ.data?.protocols ?? [];

  // Se não há protocolo ativo, não renderiza nada — evita ruído no perfil.
  if (!protocolsQ.isLoading && protocols.length === 0) return null;

  const engines = ctxQ.data ? runNutritionEngines(ctxQ.data) : null;

  return (
    <section className="bg-surface border border-border rounded-lg p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Diagnóstico clínico
        </p>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          Protocolo aplicado × meta clínica
        </h3>
        {engines && (
          <p className="text-xs text-muted-foreground pt-1">
            TDEE {engines.tdee} kcal · meta {engines.target.kcal} kcal ·
            P {engines.target.proteinG}g · C {engines.target.carbG}g · G {engines.target.fatG}g
          </p>
        )}
      </div>

      {ctxQ.data && !ctxQ.data.calculable && (
        <div className="flex items-start gap-2 text-xs text-amber-300 border-l-2 border-amber-400/40 pl-3 py-1">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Faltam dados para diagnóstico:{" "}
            <span className="font-mono">{ctxQ.data.missingForCalc.join(", ")}</span>.
            Aprovar uma anamnese com esses campos libera a comparação.
          </span>
        </div>
      )}

      {protocols.map((p) => {
        const diag = diagnoseProtocolVsClinical(p.phase_snapshot, engines);
        return (
          <ProtocolBlock
            key={p.id}
            name={`${p.protocol_name} · ${p.module_name} · Fase ${p.phase_id}`}
            diag={diag}
          />
        );
      })}

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
        Este card é informativo. Você decide se ajusta o plano — o sistema não
        altera nada automaticamente.
      </p>
    </section>
  );
}

function ProtocolBlock({ name, diag }: { name: string; diag: ProtocolDiagnosis }) {
  return (
    <div className="border border-border rounded-md p-4 space-y-3">
      <p className="text-sm font-semibold">{name}</p>

      {diag.kind === "deferred" && (
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          {diag.reason === "missing_clinical_data"
            ? "Diagnóstico indisponível: dados clínicos do paciente incompletos."
            : "Diagnóstico indisponível: este protocolo não tem alvos de kcal/macros definidos."}
        </p>
      )}

      {diag.kind === "ready" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {diag.metrics.map((m) => {
              const s = STATUS_STYLES[m.status];
              const Icon = s.icon;
              return (
                <div
                  key={m.label}
                  className="rounded-md border border-border p-2.5 space-y-1"
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className={"size-1.5 rounded-full " + s.dot} />
                    {m.label}
                  </p>
                  <p className="text-sm tabular-nums">
                    <span className="font-semibold">{m.protocolDelivers}</span>
                    <span className="text-muted-foreground"> / {m.clinicalTarget}{m.unit === "kcal" ? "" : "g"}</span>
                  </p>
                  <p className={"text-[11px] tabular-nums flex items-center gap-1 " + s.text}>
                    <Icon className="size-3" />
                    {fmtDelta(m)}
                  </p>
                </div>
              );
            })}
          </div>

          {diag.suggestions.length > 0 && (
            <ul className="space-y-1 pt-1">
              {diag.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">›</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
