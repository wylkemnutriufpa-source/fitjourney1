import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OnlineInviteDialog } from "@/components/patients/OnlineInviteDialog";
import { calcTMB } from "@/lib/engine/tdee";
import { Calculator, Activity, ChevronDown, UserPlus, Info } from "lucide-react";

type Goal = "Performance" | "Hipertrofia" | "Emagrecimento" | "Manutenção";

export const Route = createFileRoute("/_authenticated/patients/new")({
  head: () => ({ meta: [{ title: "Calculadora TDEE — FitJourney" }] }),
  component: NewPatient,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="max-w-md mx-auto py-16 space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-destructive">Erro</p>
        <h2 className="text-2xl font-bold">Não foi possível carregar a calculadora.</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs">
          Tentar novamente
        </button>
      </div>
    </AppShell>
  ),
});

function CollapsibleSection({
  id,
  index,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  index: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border border-border rounded-lg bg-surface/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
      >
        <h2 className="text-sm font-mono uppercase tracking-widest text-primary text-left">
          {String(index).padStart(2, "0")} · {title}
        </h2>
        <ChevronDown
          className={
            "size-4 text-muted-foreground transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      {open && <div className="px-5 pb-6 pt-2 space-y-6 border-t border-border/60">{children}</div>}
    </section>
  );
}

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sex, setSex] = useState<"M" | "F">("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(178);
  const [factor, setFactor] = useState(1.55);
  const [goal, setGoal] = useState<Goal>("Performance");
  const [adjust, setAdjust] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.id, true])),
  );
  const toggleSection = (id: string) =>
    setOpenSections((p) => ({ ...p, [id]: !p[id] }));

  // Sidebar anchors: expand target section if collapsed
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace("#", "");
      if (id && sections.some((s) => s.id === id)) {
        setOpenSections((p) => ({ ...p, [id]: true }));
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const tmb = calcTMB({ sex: sex === "M" ? "male" : "female", weightKg: weight, heightCm: height, ageYears: age });
  const get = Math.round(tmb * factor);
  const tdee = get + adjust;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Calculadora TDEE / Pré-anamnese
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Simulação Antropométrica</h1>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90 self-start sm:self-auto"
          >
            <UserPlus className="size-3.5" />
            Convidar paciente
          </button>
        </div>

        <div className="border border-dashed border-amber-400/40 bg-amber-400/5 rounded-md p-4 text-[12px] text-muted-foreground flex gap-3">
          <Info className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-foreground text-[13px] font-medium">
              Esta tela é uma calculadora de TDEE / pré-anamnese.
            </p>
            <p>
              Para cadastrar um paciente real, use <strong>Convidar paciente</strong> (acima) ou
              compartilhe seu link público em{" "}
              <Link to="/settings" className="text-primary hover:underline">Configurações</Link>.
              O vínculo paciente↔nutricionista nasce pelo convite e é imutável depois — por isso o
              cadastro manual aqui não persiste.
            </p>
          </div>
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
            <CollapsibleSection id="pessoais" index={1} title="Dados Pessoais" open={openSections["pessoais"]} onToggle={() => toggleSection("pessoais")}>
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
            </CollapsibleSection>

            <CollapsibleSection id="antropo" index={2} title="Antropometria" open={openSections["antropo"]} onToggle={() => toggleSection("antropo")}>
              <p className="text-[11px] text-muted-foreground">
                Todos os campos abaixo são <strong>opcionais</strong>. Preencha o que tiver disponível
                — o sistema funciona mesmo com avaliação física parcial ou ausente.
              </p>

              {/* Básico */}
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
                  Básico
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <Field label="Data da avaliação" hint="opcional">
                    <input className={inputCls} type="date" />
                  </Field>
                </div>
              </div>

              {/* Bioimpedância */}
              <div className="space-y-3 border-t border-border/50 pt-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
                  Bioimpedância (BIA) <span className="opacity-60">— opcional</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="% Gordura corporal"><input className={inputCls} type="number" step="0.1" placeholder="ex: 18.5" /></Field>
                  <Field label="% Massa muscular"><input className={inputCls} type="number" step="0.1" placeholder="ex: 42.0" /></Field>
                  <Field label="Massa magra (kg)"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Massa gorda (kg)"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Água corporal (%)"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Gordura visceral" hint="nível (1–30)"><input className={inputCls} type="number" /></Field>
                  <Field label="TMB medida (kcal)" hint="se BIA fornece"><input className={inputCls} type="number" /></Field>
                  <Field label="Idade metabólica"><input className={inputCls} type="number" /></Field>
                  <Field label="Equipamento" hint="ex: InBody 270, Tanita">
                    <input className={inputCls} type="text" />
                  </Field>
                </div>
              </div>

              {/* Perímetros (circunferências) */}
              <div className="space-y-3 border-t border-border/50 pt-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
                  Perímetros / Circunferências (cm) <span className="opacity-60">— opcional</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Pescoço"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Tórax"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Cintura"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Abdômen"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Quadril"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Braço relaxado"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Braço contraído"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Antebraço"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Coxa proximal"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Coxa medial"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Panturrilha"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Punho"><input className={inputCls} type="number" step="0.1" /></Field>
                </div>
              </div>

              {/* Dobras cutâneas + protocolo */}
              <div className="space-y-3 border-t border-border/50 pt-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
                  Dobras cutâneas (mm) <span className="opacity-60">— opcional</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Protocolo">
                    <select className={inputCls} defaultValue="">
                      <option value="">— Selecione —</option>
                      <option value="pollock-3h">Pollock 3 dobras (homens)</option>
                      <option value="pollock-3m">Pollock 3 dobras (mulheres)</option>
                      <option value="pollock-7">Pollock 7 dobras</option>
                      <option value="jackson-pollock">Jackson & Pollock</option>
                      <option value="petroski">Petroski (brasileiros)</option>
                      <option value="guedes-3">Guedes 3 dobras</option>
                      <option value="faulkner">Faulkner (4 dobras)</option>
                      <option value="durnin-womersley">Durnin & Womersley</option>
                      <option value="slaughter">Slaughter (crianças/adolesc.)</option>
                    </select>
                  </Field>
                  <Field label="Avaliador / Equipamento" hint="ex: Cescorf, Sanny">
                    <input className={inputCls} type="text" />
                  </Field>
                  <Field label="% Gordura calculada" hint="opcional, manual">
                    <input className={inputCls} type="number" step="0.1" />
                  </Field>

                  <Field label="Tríceps"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Bíceps"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Subescapular"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Suprailíaca"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Supraespinal"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Abdominal"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Peitoral"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Axilar média"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Coxa"><input className={inputCls} type="number" step="0.1" /></Field>
                  <Field label="Panturrilha medial"><input className={inputCls} type="number" step="0.1" /></Field>
                </div>
              </div>

              <div className="border border-dashed border-amber-400/30 bg-amber-400/5 rounded-md p-3 text-[11px] text-muted-foreground">
                Nenhum dos campos antropométricos é obrigatório. A ausência de avaliação física
                <strong> jamais bloqueia</strong> cadastro, anamnese, plano ou publicação — só melhora a
                precisão dos cálculos quando disponível.
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="esporte" index={3} title="Dados Esportivos" open={openSections["esporte"]} onToggle={() => toggleSection("esporte")}>
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
            </CollapsibleSection>

            <CollapsibleSection id="rotina" index={4} title="Preferências & Horários" open={openSections["rotina"]} onToggle={() => toggleSection("rotina")}>
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
            </CollapsibleSection>

            <CollapsibleSection id="saude" index={5} title="Alergias & Histórico" open={openSections["saude"]} onToggle={() => toggleSection("saude")}>
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
            </CollapsibleSection>
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
