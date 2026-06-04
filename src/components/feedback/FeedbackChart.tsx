// Gráfico premium de evolução — Peso + IMC + marcadores de feedback.
// Renderização pura a partir do array de feedbacks (mais antigos primeiro).
// Sem cálculo clínico complexo — apenas Peso e IMC = peso/(altura/100)^2.

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, Activity } from "lucide-react";
import type { FeedbackDTO } from "@/lib/feedback/feedback.functions";
import { computeImc } from "@/lib/feedback/copy";

type Point = {
  dateLabel: string;
  dateISO: string;
  weight: number | null;
  imc: number | null;
};

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  unit,
  delta,
  deltaUnit,
  inverted,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  deltaUnit?: string;
  /** Quando true, queda é "boa" (peso, IMC). */
  inverted?: boolean;
}) {
  let DeltaIcon = Minus;
  let deltaColor = "text-muted-foreground";
  if (delta != null && Math.abs(delta) >= 0.05) {
    const good = inverted ? delta < 0 : delta > 0;
    DeltaIcon = delta > 0 ? TrendingUp : TrendingDown;
    deltaColor = good ? "text-emerald-500" : "text-amber-500";
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-1.5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight tabular-nums">
        {value}
        {unit && (
          <span className="text-xs text-muted-foreground font-mono ml-1">
            {unit}
          </span>
        )}
      </p>
      {delta != null && (
        <div
          className={`flex items-center gap-1 text-[11px] font-mono ${deltaColor}`}
        >
          <DeltaIcon className="size-3" />
          <span className="tabular-nums">
            {delta > 0 ? "+" : ""}
            {delta.toFixed(deltaUnit === "kg" ? 1 : 1)}
            {deltaUnit ? ` ${deltaUnit}` : ""}
          </span>
          <span className="text-muted-foreground">vs anterior</span>
        </div>
      )}
    </div>
  );
}

export function FeedbackChart({
  feedbacks,
  fallbackHeightCm,
}: {
  /** Em qualquer ordem; o componente ordena por created_at asc. */
  feedbacks: ReadonlyArray<FeedbackDTO> | undefined;
  /** Usado pra calcular IMC quando o feedback não tem snapshot de altura. */
  fallbackHeightCm: number | null;
}) {
  const { points, hasWeight, hasImc, current, previous, total } = useMemo(() => {
    const safe = feedbacks ?? [];
    const sorted = [...safe].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const points: Point[] = sorted.map((f) => {
      const h = f.heightCmSnapshot ?? fallbackHeightCm ?? null;
      return {
        dateISO: f.createdAt,
        dateLabel: fmtDateShort(f.createdAt),
        weight: f.weightKg ?? null,
        imc: computeImc(f.weightKg, h),
      };
    });
    const withWeight = points.filter((p) => p.weight != null);
    const withImc = points.filter((p) => p.imc != null);
    const current = withWeight[withWeight.length - 1] ?? null;
    const previous = withWeight[withWeight.length - 2] ?? null;
    return {
      points,
      hasWeight: withWeight.length > 0,
      hasImc: withImc.length > 0,
      current,
      previous,
      total: sorted.length,
    };
  }, [feedbacks, fallbackHeightCm]);

  const currentWeight = current?.weight ?? null;
  const previousWeight = previous?.weight ?? null;
  const deltaWeight =
    currentWeight != null && previousWeight != null
      ? Math.round((currentWeight - previousWeight) * 10) / 10
      : null;

  const currentImc = current?.imc ?? null;
  const previousImc = previous?.imc ?? null;
  const deltaImc =
    currentImc != null && previousImc != null
      ? Math.round((currentImc - previousImc) * 10) / 10
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Peso atual"
          value={currentWeight != null ? currentWeight.toFixed(1) : "—"}
          unit="kg"
          delta={deltaWeight}
          deltaUnit="kg"
          inverted
        />
        <StatCard
          label="Peso anterior"
          value={previousWeight != null ? previousWeight.toFixed(1) : "—"}
          unit="kg"
        />
        <StatCard
          label="IMC atual"
          value={currentImc != null ? currentImc.toFixed(1) : "—"}
          delta={deltaImc}
          deltaUnit=""
          inverted
        />
        <StatCard
          label="Feedbacks enviados"
          value={String(total)}
        />
      </div>

      {points.length < 2 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center space-y-2">
          <Activity className="size-6 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Envie pelo menos 2 feedbacks para ver sua curva de evolução.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Evolução
              </p>
              <h3 className="text-lg font-semibold">Peso & IMC ao longo do tempo</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Peso
              </span>
              {hasImc && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> IMC
                </span>
              )}
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={points}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="dateLabel"
                  stroke="currentColor"
                  className="text-muted-foreground"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="weight"
                  stroke="currentColor"
                  className="text-muted-foreground"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 1", "dataMax + 1"]}
                  width={36}
                />
                {hasImc && (
                  <YAxis
                    yAxisId="imc"
                    orientation="right"
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 0.5", "dataMax + 0.5"]}
                    width={28}
                  />
                )}
                <Tooltip
                  cursor={{
                    stroke: "currentColor",
                    strokeOpacity: 0.2,
                    strokeWidth: 1,
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const p = payload[0].payload as Point;
                    return (
                      <div className="rounded-md border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg space-y-1">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {fmtDateLong(p.dateISO)}
                        </p>
                        {p.weight != null && (
                          <p className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-primary" />
                            <span className="text-muted-foreground">Peso</span>
                            <span className="font-semibold tabular-nums ml-auto">
                              {p.weight.toFixed(1)} kg
                            </span>
                          </p>
                        )}
                        {p.imc != null && (
                          <p className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">IMC</span>
                            <span className="font-semibold tabular-nums ml-auto">
                              {p.imc.toFixed(1)}
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                {hasWeight && (
                  <Area
                    yAxisId="weight"
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#weightFill)"
                    dot={{ r: 3, fill: "var(--primary)" }}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                  />
                )}
                {hasImc && (
                  <Line
                    yAxisId="imc"
                    type="monotone"
                    dataKey="imc"
                    stroke="rgb(16 185 129)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2.5, fill: "rgb(16 185 129)" }}
                    isAnimationActive
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {!hasImc && (
            <p className="text-[11px] text-muted-foreground">
              Para visualizar a curva de IMC, cadastre sua altura em
              Configurações.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
