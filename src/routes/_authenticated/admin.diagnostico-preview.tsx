import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Beaker, Loader2, RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listActiveTriggers,
  type TriggerDTO,
} from "@/lib/diagnostic/diagnostic.functions";
import {
  gerarDiagnostico,
  type QuizAnswers,
  type Diagnosis,
} from "@/lib/diagnostic/engine";

export const Route = createFileRoute("/_authenticated/admin/diagnostico-preview")({
  component: AdminDiagnosticPreview,
});

type Profile = { id: string; label: string; descr: string; answers: QuizAnswers };

const PROFILES: Profile[] = [
  {
    id: "feminino_sobrepeso_sop",
    label: "Mulher 34a · Sobrepeso · SOP",
    descr: "Emagrecer, água baixa, cansaço, sono ruim.",
    answers: {
      nome: "Mariana Silva",
      idade: 34,
      sexo: "feminino",
      peso: 82,
      altura: 165,
      objetivo: "emagrecer",
      refeicoesPorDia: "3a4",
      aguaPorDia: "1a1_5l",
      atividadeFisica: "leve",
      sono: "6a7h",
      condicoes: ["sop"],
      queixas: ["cansaco", "inchaco"],
    },
  },
  {
    id: "masculino_obesidade_diabetes",
    label: "Homem 48a · Obesidade · Diabetes + Hipertensão",
    descr: "Sedentário, compulsão, sono curto.",
    answers: {
      nome: "Carlos Eduardo",
      idade: 48,
      sexo: "masculino",
      peso: 108,
      altura: 175,
      objetivo: "emagrecer",
      refeicoesPorDia: "menos_3",
      aguaPorDia: "menos_1l",
      atividadeFisica: "sedentario",
      sono: "menos_6h",
      condicoes: ["diabetes", "hipertensao", "compulsao"],
      queixas: ["cansaco", "compulsao"],
    },
  },
  {
    id: "feminino_ideal_energia",
    label: "Mulher 28a · IMC ideal · Falta de energia",
    descr: "Quer mais energia, sono ok, ativa.",
    answers: {
      nome: "Júlia Mendes",
      idade: 28,
      sexo: "feminino",
      peso: 60,
      altura: 168,
      objetivo: "energia",
      refeicoesPorDia: "5_mais",
      aguaPorDia: "2l",
      atividadeFisica: "moderado",
      sono: "7a8h",
      condicoes: [],
      queixas: ["cansaco"],
    },
  },
  {
    id: "masculino_massa",
    label: "Homem 25a · Ganhar massa",
    descr: "Intenso, tireoide, sono bom.",
    answers: {
      nome: "Lucas Almeida",
      idade: 25,
      sexo: "masculino",
      peso: 72,
      altura: 180,
      objetivo: "ganhar_massa",
      refeicoesPorDia: "5_mais",
      aguaPorDia: "mais_2_5l",
      atividadeFisica: "intenso",
      sono: "7a8h",
      condicoes: ["tireoide"],
      queixas: [],
    },
  },
  {
    id: "feminino_baixo_gastrite",
    label: "Mulher 41a · Baixo peso · Gastrite",
    descr: "Intestino preso, compulsão à noite.",
    answers: {
      nome: "Ana Beatriz",
      idade: 41,
      sexo: "feminino",
      peso: 48,
      altura: 168,
      objetivo: "energia",
      refeicoesPorDia: "3a4",
      aguaPorDia: "1a1_5l",
      atividadeFisica: "leve",
      sono: "6a7h",
      condicoes: ["gastrite_refluxo", "intestino"],
      queixas: ["compulsao", "inchaco"],
    },
  },
];

function AdminDiagnosticPreview() {
  const loadTriggers = useServerFn(listActiveTriggers);
  const [triggers, setTriggers] = useState<TriggerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(PROFILES[0].id);
  const [answers, setAnswers] = useState<QuizAnswers>(PROFILES[0].answers);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [tick, setTick] = useState(0); // força nova rotação de dicas/frases

  useEffect(() => {
    loadTriggers()
      .then((t) => setTriggers(t))
      .catch(() => setTriggers([]))
      .finally(() => setLoading(false));
  }, [loadTriggers]);

  const selected = useMemo(
    () => PROFILES.find((p) => p.id === selectedId) ?? PROFILES[0],
    [selectedId],
  );

  function pickProfile(id: string) {
    const p = PROFILES.find((x) => x.id === id) ?? PROFILES[0];
    setSelectedId(id);
    setAnswers(p.answers);
    setDiagnosis(null);
  }

  function gerar() {
    setTick((t) => t + 1);
    const d = gerarDiagnostico(answers, triggers as any);
    setDiagnosis(d);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
          <Beaker className="size-3.5" /> Preview de Diagnóstico
        </div>
        <h2 className="text-lg font-semibold mt-1">Teste rápido com perfis pré-preenchidos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um perfil pronto, ajuste se quiser e clique em <strong>Gerar Diagnóstico</strong> para
          visualizar a frase clínica + dicas que o sistema rotaciona. <em>Não salva nada no banco.</em>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">1. Perfil pré-preenchido</h3>
          <div className="grid gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProfile(p.id)}
                className={
                  "text-left rounded-lg border px-3 py-2 transition-colors " +
                  (selectedId === p.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40")
                }
              >
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.descr}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Field label="Nome">
              <Input
                value={answers.nome}
                onChange={(e) => setAnswers({ ...answers, nome: e.target.value })}
              />
            </Field>
            <Field label="Idade">
              <Input
                type="number"
                value={answers.idade}
                onChange={(e) => setAnswers({ ...answers, idade: Number(e.target.value) })}
              />
            </Field>
            <Field label="Peso (kg)">
              <Input
                type="number"
                value={answers.peso}
                onChange={(e) => setAnswers({ ...answers, peso: Number(e.target.value) })}
              />
            </Field>
            <Field label="Altura (cm)">
              <Input
                type="number"
                value={answers.altura}
                onChange={(e) => setAnswers({ ...answers, altura: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={gerar} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" /> Carregando gatilhos…
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-1.5" /> Gerar Diagnóstico
                </>
              )}
            </Button>
            {diagnosis && (
              <Button variant="outline" onClick={gerar} title="Sortear novas frases/dicas">
                <RefreshCw className="size-4" />
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Gatilhos ativos carregados: <strong>{triggers.length}</strong>
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 space-y-3 min-h-[260px]">
          <h3 className="text-sm font-semibold">2. Resultado</h3>
          {!diagnosis ? (
            <p className="text-sm text-muted-foreground">
              Clique em <strong>Gerar Diagnóstico</strong> para visualizar.
            </p>
          ) : (
            <div key={tick} className="space-y-3 text-sm">
              <p className="font-medium">{diagnosis.saudacao}</p>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  Análise de peso
                </div>
                <p className="mt-1">{diagnosis.analisePeso}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <Stat label="IMC" value={diagnosis.imc.toFixed(2)} />
                  <Stat label="Peso ideal" value={`${diagnosis.pesoIdeal}kg`} />
                  <Stat label="Diferença" value={`${diagnosis.diferencaKg > 0 ? "+" : ""}${diagnosis.diferencaKg}kg`} />
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Pontos de atenção ({diagnosis.dicasDetalhadas.length})
                </div>
                <ul className="space-y-2">
                  {diagnosis.dicasDetalhadas.map((d) => (
                    <li key={d.slug} className="rounded border border-border bg-background p-2.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                        {d.nome}
                      </div>
                      <p className="text-sm mt-1">{d.frase}</p>
                      {d.dica && (
                        <div className="mt-2 flex gap-2 items-start text-xs text-muted-foreground border-t border-border/60 pt-2">
                          <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{d.dica}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                {diagnosis.cta}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background px-2 py-1">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
