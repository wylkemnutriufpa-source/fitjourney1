import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getPatient } from "@/lib/mock-data";
import { Edit3, FileText, ChevronRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/patients/$id/")({
  head: () => ({ meta: [{ title: "Perfil do paciente — FitJourney" }] }),
  loader: ({ params }) => {
    const patient = getPatient(params.id);
    if (!patient) throw notFound();
    return { patient };
  },
  component: PatientProfile,
});

function Metric({ label, value, unit, accent }: { label: string; value: number; unit: string; accent?: boolean }) {
  return (
    <div
      className={
        "p-6 rounded-lg border space-y-3 " +
        (accent ? "bg-primary/10 border-primary/30" : "bg-surface border-border")
      }
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={"text-4xl font-bold tracking-tighter " + (accent ? "text-primary" : "")}>
        {value.toLocaleString("pt-BR")} <span className="text-sm text-muted-foreground font-mono">{unit}</span>
      </p>
    </div>
  );
}

function PatientProfile() {
  const { patient: p } = Route.useLoaderData();

  return (
    <AppShell
      header={
        <Link
          to="/patients/$id/diet"
          params={{ id: p.id }}
          className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
        >
          <FileText className="size-3.5" />
          Montar Dieta
        </Link>
      }
    >
      <div className="space-y-10">
        <div className="flex items-end justify-between border-b border-border pb-6">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-full bg-surface border border-border grid place-items-center text-lg font-mono">
              {p.initials}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {p.sport} · {p.age} anos · {p.sex} · {p.heightCm}cm · {p.weightKg}kg
              </p>
              <h1 className="text-3xl font-bold tracking-tight">{p.name}</h1>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-background border border-border">
                  {p.goal}
                </span>
                <span
                  className={
                    "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase " +
                    (p.status === "Ativo" ? "text-emerald-400" : "text-amber-400")
                  }
                >
                  <span
                    className={
                      "size-1.5 rounded-full " +
                      (p.status === "Ativo" ? "bg-emerald-400" : "bg-amber-400")
                    }
                  />
                  {p.status}
                </span>
              </div>
            </div>
          </div>
          <button className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 flex items-center gap-2">
            <Edit3 className="size-3.5" />
            Editar Anamnese
          </button>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            Métricas Metabólicas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Metric label="TMB (Basal)" value={p.tmb} unit="kcal" />
            <Metric label="GET (Gasto Total)" value={p.get} unit="kcal" />
            <Metric label="TDEE (Alvo)" value={p.tdee} unit="kcal" accent />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Evolução do Peso
                </p>
                <h3 className="text-lg font-semibold mt-1">Últimas 6 semanas</h3>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={p.progress}>
                  <XAxis dataKey="week" stroke="oklch(0.68 0.02 240)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.013 240)",
                      border: "1px solid oklch(0.30 0.012 240)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="oklch(0.72 0.17 230)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.72 0.17 230)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Histórico de Dietas
            </p>
            {[
              { name: "Endurance High-Carb v2", date: "20 Mai", active: true },
              { name: "Hipertrofia Fase 2", date: "12 Abr" },
              { name: "Manutenção Off-season", date: "01 Mar" },
            ].map((d) => (
              <Link
                key={d.name}
                to="/patients/$id/diet"
                params={{ id: p.id }}
                className="flex items-center justify-between p-3 rounded border border-border bg-background hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {d.name}
                    {d.active && (
                      <span className="text-[9px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5">
                        ativa
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">{d.date}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Dados Clínicos
            </p>
            <dl className="text-sm space-y-2">
              {[
                ["Alergias", "Lactose (leve)"],
                ["Restrições", "Nenhuma"],
                ["Suplementos", "Whey, creatina, ômega-3"],
                ["Volume semanal", "12h"],
                ["Horário treino", "06:00 - 08:00"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border last:border-0 py-1.5">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Macros Alvo (TDEE)
            </p>
            <div className="space-y-3">
              {[
                { k: "Proteínas", g: Math.round((p.tdee * 0.3) / 4), pct: 30, c: "bg-primary" },
                { k: "Carboidratos", g: Math.round((p.tdee * 0.5) / 4), pct: 50, c: "bg-emerald-400" },
                { k: "Gorduras", g: Math.round((p.tdee * 0.2) / 9), pct: 20, c: "bg-amber-400" },
              ].map((m) => (
                <div key={m.k} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{m.k}</span>
                    <span className="font-mono text-muted-foreground">
                      {m.g}g · {m.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div className={m.c + " h-full rounded-full"} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
