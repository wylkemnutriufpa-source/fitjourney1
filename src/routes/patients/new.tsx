import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { calcTMB, calcGET, type Goal } from "@/lib/mock-data";
import { Calculator, Save, Activity } from "lucide-react";

export const Route = createFileRoute("/patients/new")({
  head: () => ({ meta: [{ title: "Nova Anamnese — FitJourney" }] }),
  component: NewPatient,
});

const sections = [
  { id: "pessoais", label: "Dados Pessoais" },
  { id: "antropo", label: "Antropometria" },
  { id: "esporte", label: "Dados Esportivos" },
  { id: "rotina", label: "Preferências & Horários" },
  { id: "saude", label: "Alergias & Histórico" },
];

const activityFactors = [
  { v: 1.2, label: "Sedentário" },
  { v: 1.375, label: "Leve (1-3x sem)" },
  { v: 1.55, label: "Moderado (3-5x sem)" },
  { v: 1.725, label: "Intenso (6-7x sem)" },
  { v: 1.9, label: "Atleta (2x dia)" },
];

const goals: Goal[] = ["Performance", "Hipertrofia", "Emagrecimento", "Manutenção"];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/70 font-mono">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary";

function NewPatient() {
  const navigate = useNavigate();
  const [sex, setSex] = useState<"M" | "F">("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(178);
  const [factor, setFactor] = useState(1.55);
  const [goal, setGoal] = useState<Goal>("Performance");
  const [adjust, setAdjust] = useState(0);

  const tmb = calcTMB(sex, weight, height, age);
  const get = calcGET(tmb, factor);
  const tdee = get + adjust;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Anamnese Médica Esportiva
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Novo Paciente</h1>
          </div>
          <button
            onClick={() => navigate({ to: "/patients/$id", params: { id: "p-001" } })}
            className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
          >
            <Save className="size-3.5" />
            Salvar Paciente
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-8">
          <aside className="space-y-1">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40"
              >
                <span className="font-mono text-primary/60 mr-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
              </a>
            ))}
          </aside>

          <div className="space-y-10">
            <section id="pessoais" className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                01 · Dados Pessoais
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome completo">
                  <input className={inputCls} defaultValue="Ricardo G. Mendes" />
                </Field>
                <Field label="Email">
                  <input className={inputCls} type="email" defaultValue="ricardo@email.com" />
                </Field>
                <Field label="Idade">
                  <input
                    className={inputCls}
                    type="number"
                    value={age}
                    onChange={(e) => setAge(+e.target.value)}
                  />
                </Field>
                <Field label="Sexo">
                  <div className="flex gap-2">
                    {(["M", "F"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSex(s)}
                        className={
                          "flex-1 py-2 rounded-md text-sm font-medium border " +
                          (sex === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground")
                        }
                      >
                        {s === "M" ? "Masculino" : "Feminino"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </section>

            <section id="antropo" className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                02 · Antropometria
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Peso (kg)">
                  <input
                    className={inputCls}
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(+e.target.value)}
                  />
                </Field>
                <Field label="Altura (cm)">
                  <input
                    className={inputCls}
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(+e.target.value)}
                  />
                </Field>
                <Field label="% Gordura" hint="opcional, bioimpedância">
                  <input className={inputCls} type="number" defaultValue={14} />
                </Field>
                <Field label="Circunf. Cintura (cm)">
                  <input className={inputCls} type="number" defaultValue={82} />
                </Field>
                <Field label="Circunf. Quadril (cm)">
                  <input className={inputCls} type="number" defaultValue={98} />
                </Field>
                <Field label="Massa Magra (kg)">
                  <input className={inputCls} type="number" defaultValue={64} />
                </Field>
              </div>
            </section>

            <section id="esporte" className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                03 · Dados Esportivos
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Modalidade Principal">
                  <input className={inputCls} defaultValue="Triathlon" />
                </Field>
                <Field label="Nível">
                  <select className={inputCls}>
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                    <option>Profissional</option>
                  </select>
                </Field>
                <Field label="Volume Semanal (h)">
                  <input className={inputCls} type="number" defaultValue={12} />
                </Field>
                <Field label="Nível de Atividade (Fator)">
                  <select
                    className={inputCls}
                    value={factor}
                    onChange={(e) => setFactor(+e.target.value)}
                  >
                    {activityFactors.map((a) => (
                      <option key={a.v} value={a.v}>
                        {a.label} · ×{a.v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Objetivo Principal">
                  <div className="flex gap-1.5 flex-wrap">
                    {goals.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => {
                          setGoal(g);
                          setAdjust(
                            g === "Emagrecimento" ? -400 : g === "Hipertrofia" ? 300 : g === "Performance" ? -150 : 0,
                          );
                        }}
                        className={
                          "px-3 py-1.5 rounded text-xs font-medium border " +
                          (goal === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground")
                        }
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Ajuste calórico (kcal)" hint="déficit/superávit">
                  <input
                    className={inputCls}
                    type="number"
                    value={adjust}
                    onChange={(e) => setAdjust(+e.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section id="rotina" className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                04 · Preferências & Horários
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Horário do Treino">
                  <input className={inputCls} defaultValue="06:00 - 08:00" />
                </Field>
                <Field label="Refeições por dia">
                  <input className={inputCls} type="number" defaultValue={5} />
                </Field>
                <Field label="Alimentos preferidos">
                  <textarea
                    className={inputCls + " min-h-[80px]"}
                    defaultValue="Frango, arroz, batata doce, ovos, frutas vermelhas..."
                  />
                </Field>
                <Field label="Alimentos rejeitados">
                  <textarea className={inputCls + " min-h-[80px]"} defaultValue="Beterraba, fígado" />
                </Field>
              </div>
            </section>

            <section id="saude" className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                05 · Alergias & Histórico
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Alergias">
                  <input className={inputCls} defaultValue="Lactose (leve)" />
                </Field>
                <Field label="Restrições">
                  <input className={inputCls} defaultValue="Nenhuma" />
                </Field>
                <Field label="Medicamentos em uso">
                  <input className={inputCls} defaultValue="Nenhum" />
                </Field>
                <Field label="Suplementação atual">
                  <input className={inputCls} defaultValue="Whey, creatina, ômega-3" />
                </Field>
                <Field label="Histórico clínico">
                  <textarea
                    className={inputCls + " min-h-[80px] col-span-2"}
                    defaultValue="Sem comorbidades. Cirurgia de menisco em 2022."
                  />
                </Field>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="sticky top-24 space-y-4">
              <div className="border border-border rounded-lg p-5 bg-surface space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="size-4 text-primary" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Métricas calculadas
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-mono text-muted-foreground">TMB</span>
                    <span className="text-xl font-bold font-mono">
                      {tmb} <span className="text-xs text-muted-foreground">kcal</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-mono text-muted-foreground">GET</span>
                    <span className="text-xl font-bold font-mono">
                      {get} <span className="text-xs text-muted-foreground">kcal</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-3 border-t border-border">
                    <span className="text-xs font-mono text-primary uppercase">TDEE alvo</span>
                    <span className="text-2xl font-bold font-mono text-primary">
                      {tdee} <span className="text-xs opacity-60">kcal</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full border border-border text-xs font-mono uppercase tracking-widest py-2 rounded hover:bg-background flex items-center justify-center gap-2"
                >
                  <Activity className="size-3" /> Recalcular
                </button>
              </div>
              <div className="border border-dashed border-border rounded-lg p-4 text-[11px] text-muted-foreground font-mono leading-relaxed">
                Fórmula Mifflin-St Jeor aplicada automaticamente. Ajuste o fator de atividade conforme volume de treino.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
