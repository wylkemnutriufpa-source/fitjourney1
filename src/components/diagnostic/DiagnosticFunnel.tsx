import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Target,
  Droplet,
  HeartPulse,
  Activity,
  Moon,
  Frown,
  Apple,
  Brain,
  Flame,
  Scale,
  Wind,
  Cookie,
  Soup,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  listActiveTriggers,
  submitDiagnosticResponse,
  type TriggerDTO,
} from "@/lib/diagnostic/diagnostic.functions";
import {
  gerarDiagnostico,
  type QuizAnswers,
  type Diagnosis,
} from "@/lib/diagnostic/engine";

type LeadForm = { fullName: string; email: string; whatsapp: string };

const TOTAL_STEPS = 5;

const initialAnswers: QuizAnswers = {
  nome: "",
  idade: 0,
  sexo: "feminino",
  peso: 0,
  altura: 0,
  objetivo: "emagrecer",
  refeicoesPorDia: "3a4",
  aguaPorDia: "1a1_5l",
  atividadeFisica: "leve",
  sono: "6a7h",
  condicoes: [],
  queixas: [],
};

export function DiagnosticFunnel({ onCheckout, onComplete }: { onCheckout: () => void; onComplete?: () => void }) {
  const [phase, setPhase] = useState<"capture" | "quiz" | "loading" | "whatsapp_gate" | "result">("capture");
  const [lead, setLead] = useState<LeadForm>({ fullName: "", email: "", whatsapp: "" });
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [step, setStep] = useState(1);
  const [triggers, setTriggers] = useState<TriggerDTO[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadTriggers = useServerFn(listActiveTriggers);
  const submit = useServerFn(submitDiagnosticResponse);

  // pré-carrega gatilhos assim que a captura é feita
  useEffect(() => {
    if (phase !== "capture") {
      loadTriggers().then(setTriggers).catch(() => setTriggers([]));
    }
  }, [phase, loadTriggers]);

  async function handleLead(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!lead.fullName.trim() || !lead.email.trim() || !lead.whatsapp.trim()) {
      setErr("Preencha todos os campos para liberar o questionário.");
      return;
    }
    setAnswers((a) => ({ ...a, nome: lead.fullName }));
    setPhase("whatsapp_gate");
  }

  async function finishQuiz() {
    setPhase("loading");
    setErr(null);
    try {
      const list = triggers.length > 0 ? triggers : await loadTriggers();
      const d = gerarDiagnostico(answers, list);
      setDiagnosis(d);
      await submit({
        data: {
          fullName: lead.fullName,
          email: lead.email,
          whatsapp: lead.whatsapp,
          answers: answers as unknown as Record<string, unknown>,
          diagnosis: d as unknown as Record<string, unknown>,
          imc: d.imc,
          pesoIdeal: d.pesoIdeal,
          diferencaKg: d.diferencaKg,
          triggersAcionados: d.triggersAcionados,
        },
      });
      // pequeno delay para o efeito "wow"
      setTimeout(() => {
        setPhase("result");
        onComplete?.();
      }, 1200);
    } catch (e: any) {
      setErr(e?.message ?? "Não conseguimos gerar seu diagnóstico agora.");
      setPhase("quiz");
    }
  }

  return (
    <div className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 sm:p-7 shadow-[0_30px_80px_-30px_oklch(0_0_0/0.5)] overflow-hidden">
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-[var(--gold,oklch(0.78_0.13_85))]/20 -z-10" />

      <AnimatePresence mode="wait">
        {phase === "capture" && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Diagnóstico gratuito
            </div>
            <h3 className="text-2xl font-bold leading-tight">
              Descubra em 3 minutos como está sua saúde nutricional
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              Responda nosso questionário rápido e receba uma análise clínica
              personalizada feita pelo método FitJourney.
            </p>

            <form onSubmit={handleLead} className="mt-5 space-y-3">
              <Input
                required
                placeholder="Seu nome completo"
                value={lead.fullName}
                onChange={(e) => setLead({ ...lead, fullName: e.target.value })}
              />
              <Input
                required
                type="email"
                placeholder="Seu e-mail"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
              />
              <Input
                required
                placeholder="WhatsApp (com DDD)"
                value={lead.whatsapp}
                onChange={(e) => setLead({ ...lead, whatsapp: e.target.value })}
              />
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground rounded-full h-12 text-base font-semibold"
              >
                Quero meu diagnóstico gratuito agora <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Seu diagnóstico aparece na tela e enviaremos detalhes pelo WhatsApp.
              </p>
            </form>
          </motion.div>
        )}

        {phase === "quiz" && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
          >
            <QuizProgress step={step} total={TOTAL_STEPS} />
            <div className="mt-5 min-h-[340px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.28 }}
                >
                  {step === 1 && <Step1 answers={answers} setAnswers={setAnswers} />}
                  {step === 2 && <Step2 answers={answers} setAnswers={setAnswers} />}
                  {step === 3 && <Step3 answers={answers} setAnswers={setAnswers} />}
                  {step === 4 && <Step4 answers={answers} setAnswers={setAnswers} />}
                  {step === 5 && <Step5 answers={answers} setAnswers={setAnswers} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {err && <p className="text-sm text-destructive mt-2">{err}</p>}

            <div className="mt-5 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  disabled={!canAdvance(step, answers)}
                  onClick={() => setStep((s) => s + 1)}
                  className="gradient-primary text-primary-foreground rounded-full px-6 h-11"
                >
                  Próxima <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!canAdvance(step, answers)}
                  onClick={finishQuiz}
                  className="gradient-primary text-primary-foreground rounded-full px-6 h-11"
                >
                  Ver meu diagnóstico <Sparkles className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 flex flex-col items-center justify-center text-center min-h-[340px]"
          >
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <div className="relative size-16 rounded-full gradient-primary flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <p className="mt-6 font-semibold">
              Cruzando suas respostas com nossa base clínica…
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Montando sua análise personalizada.
            </p>
          </motion.div>
        )}

        {phase === "whatsapp_gate" && (
          <motion.div
            key="whatsapp_gate"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="py-6 text-center"
          >
            <div className="mx-auto size-16 rounded-full bg-[#25D366]/15 flex items-center justify-center mb-4">
              <svg viewBox="0 0 32 32" className="size-8 fill-[#25D366]" aria-hidden>
                <path d="M19.11 17.21c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34s-.96.94-.96 2.29.98 2.66 1.12 2.84c.14.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.03 5.33c-5.9 0-10.7 4.8-10.7 10.7 0 1.88.49 3.72 1.43 5.34l-1.51 5.52 5.65-1.48a10.7 10.7 0 0 0 5.13 1.31h.01c5.9 0 10.7-4.8 10.7-10.7s-4.8-10.69-10.71-10.69zm0 19.59h-.01c-1.59 0-3.15-.43-4.5-1.24l-.32-.19-3.35.88.89-3.27-.21-.34a8.9 8.9 0 1 1 16.45-4.73c0 4.91-3.99 8.89-8.95 8.89z"/>
              </svg>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
              Falta 1 passo antes do diagnóstico
            </p>
            <h3 className="text-2xl font-bold tracking-tight">
              Confirme seu WhatsApp, {lead.fullName.split(" ")[0] || "tudo certo"}!
            </h3>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
              Para liberar o questionário e seu diagnóstico, entre no nosso grupo
              de <strong>Dicas Diárias no WhatsApp</strong>. É lá que enviamos
              orientações nutricionais todos os dias — e é assim que confirmamos
              que seu número é real.
            </p>
            <a
              href="https://chat.whatsapp.com/EeWyBhE9LDXCigseMT6ff1?s=cl&p=i&mlu=0&ilr=0&amv=1"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold px-6 h-12 transition-colors shadow-lg shadow-[#25D366]/30"
            >
              <svg viewBox="0 0 32 32" className="size-5 fill-white" aria-hidden>
                <path d="M19.11 17.21c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34s-.96.94-.96 2.29.98 2.66 1.12 2.84c.14.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.03 5.33c-5.9 0-10.7 4.8-10.7 10.7 0 1.88.49 3.72 1.43 5.34l-1.51 5.52 5.65-1.48a10.7 10.7 0 0 0 5.13 1.31h.01c5.9 0 10.7-4.8 10.7-10.7s-4.8-10.69-10.71-10.69z"/>
              </svg>
              Entrar no grupo agora
            </a>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setPhase("quiz")}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Já entrei no grupo, liberar questionário
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-6 max-w-sm mx-auto">
              Sem confirmação do WhatsApp, não conseguimos enviar seu plano nem
              o acompanhamento nutricional especializado.
            </p>
          </motion.div>
        )}

        {phase === "result" && diagnosis && (
          <DiagnosisResult diagnosis={diagnosis} onCheckout={onCheckout} />
        )}
      </AnimatePresence>
    </div>
  );
}

function canAdvance(step: number, a: QuizAnswers): boolean {
  if (step === 1) return a.idade > 0 && a.peso > 0 && a.altura > 0;
  return true;
}

function QuizProgress({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>Pergunta {step}/{total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full gradient-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   STEPS
   ════════════════════════════════════════════════════ */

type StepProps = {
  answers: QuizAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<QuizAnswers>>;
};

function Step1({ answers, setAnswers }: StepProps) {
  return (
    <div className="space-y-4">
      <Header title="Vamos começar!" subtitle="Nos conte um pouco sobre você." />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Idade"
          value={answers.idade || ""}
          onChange={(v) => setAnswers({ ...answers, idade: Number(v) })}
        />
        <SelectField
          label="Sexo"
          value={answers.sexo}
          onChange={(v) => setAnswers({ ...answers, sexo: v as any })}
          options={[
            { value: "feminino", label: "Feminino" },
            { value: "masculino", label: "Masculino" },
            { value: "outro", label: "Prefiro não dizer" },
          ]}
        />
        <NumberField
          label="Peso (kg)"
          value={answers.peso || ""}
          step="0.1"
          onChange={(v) => setAnswers({ ...answers, peso: Number(v) })}
        />
        <NumberField
          label="Altura (cm)"
          value={answers.altura || ""}
          onChange={(v) => setAnswers({ ...answers, altura: Number(v) })}
        />
      </div>
    </div>
  );
}

function Step2({ answers, setAnswers }: StepProps) {
  const objetivos = [
    { id: "emagrecer", label: "Emagrecer com saúde", icon: Scale },
    { id: "ganhar_massa", label: "Ganhar massa muscular", icon: Activity },
    { id: "energia", label: "Mais energia e disposição", icon: Flame },
    { id: "saude", label: "Melhorar saúde (diabetes, pressão)", icon: HeartPulse },
    { id: "intestino", label: "Reduzir inchaço e melhorar intestino", icon: Apple },
  ];
  return (
    <div className="space-y-4">
      <Header title="Qual seu principal objetivo agora?" />
      <div className="grid gap-2">
        {objetivos.map((o) => (
          <ChoiceCard
            key={o.id}
            icon={o.icon}
            label={o.label}
            selected={answers.objetivo === o.id}
            onClick={() => setAnswers({ ...answers, objetivo: o.id })}
          />
        ))}
      </div>
    </div>
  );
}

function Step3({ answers, setAnswers }: StepProps) {
  return (
    <div className="space-y-4">
      <Header title="Como estão seus hábitos?" />
      <RadioRow
        label="Refeições por dia"
        value={answers.refeicoesPorDia}
        onChange={(v) => setAnswers({ ...answers, refeicoesPorDia: v as any })}
        options={[
          { value: "menos_3", label: "Menos de 3" },
          { value: "3a4", label: "3 a 4" },
          { value: "5_mais", label: "5 ou mais" },
        ]}
      />
      <RadioRow
        label="Água por dia"
        value={answers.aguaPorDia}
        onChange={(v) => setAnswers({ ...answers, aguaPorDia: v as any })}
        options={[
          { value: "menos_1l", label: "< 1L" },
          { value: "1a1_5l", label: "1–1,5L" },
          { value: "2l", label: "2L" },
          { value: "mais_2_5l", label: "+2,5L" },
        ]}
      />
      <RadioRow
        label="Atividade física"
        value={answers.atividadeFisica}
        onChange={(v) => setAnswers({ ...answers, atividadeFisica: v as any })}
        options={[
          { value: "sedentario", label: "Sedentário" },
          { value: "leve", label: "Leve" },
          { value: "moderado", label: "Moderado" },
          { value: "intenso", label: "Intenso" },
        ]}
      />
      <RadioRow
        label="Horas de sono"
        value={answers.sono}
        onChange={(v) => setAnswers({ ...answers, sono: v as any })}
        options={[
          { value: "menos_6h", label: "< 6h" },
          { value: "6a7h", label: "6–7h" },
          { value: "7a8h", label: "7–8h" },
          { value: "mais_8h", label: "+8h" },
        ]}
      />
    </div>
  );
}

function Step4({ answers, setAnswers }: StepProps) {
  const opts = [
    { id: "diabetes", label: "Diabetes / pré-diabetes", icon: Cookie },
    { id: "hipertensao", label: "Pressão alta / hipertensão", icon: HeartPulse },
    { id: "tireoide", label: "Problemas de tireoide", icon: Sparkles },
    { id: "sop", label: "SOP / resistência à insulina", icon: Target },
    { id: "intestino", label: "Intestino preso / inchaço", icon: Wind },
    { id: "gastrite_refluxo", label: "Gastrite ou refluxo", icon: Flame },
    { id: "compulsao", label: "Compulsão / ansiedade", icon: Frown },
  ];
  return (
    <div className="space-y-4">
      <Header
        title="Você possui alguma dessas condições?"
        subtitle="Pode marcar mais de uma — ou nenhuma."
      />
      <div className="grid gap-2">
        {opts.map((o) => (
          <MultiChoice
            key={o.id}
            icon={o.icon}
            label={o.label}
            selected={answers.condicoes.includes(o.id)}
            onClick={() =>
              setAnswers({
                ...answers,
                condicoes: answers.condicoes.includes(o.id)
                  ? answers.condicoes.filter((c) => c !== o.id)
                  : [...answers.condicoes, o.id],
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function Step5({ answers, setAnswers }: StepProps) {
  const opts = [
    { id: "cansaco", label: "Cansaço e falta de energia", icon: Moon },
    { id: "dificuldade_emagrecer", label: "Dificuldade para emagrecer", icon: Scale },
    { id: "inchaco", label: "Inchaço abdominal constante", icon: Wind },
    { id: "compulsao", label: "Fome fora de hora / compulsão", icon: Cookie },
    { id: "agua", label: "Dificuldade de beber água", icon: Droplet },
    { id: "sono", label: "Sono ruim", icon: Soup },
  ];
  const toggle = (id: string) => {
    const has = answers.queixas.includes(id);
    if (has) {
      setAnswers({ ...answers, queixas: answers.queixas.filter((q) => q !== id) });
    } else if (answers.queixas.length < 3) {
      setAnswers({ ...answers, queixas: [...answers.queixas, id] });
    }
  };
  return (
    <div className="space-y-4">
      <Header
        title="Quais suas principais dificuldades?"
        subtitle={`Escolha até 3 (${answers.queixas.length}/3)`}
      />
      <div className="grid gap-2">
        {opts.map((o) => (
          <MultiChoice
            key={o.id}
            icon={o.icon}
            label={o.label}
            selected={answers.queixas.includes(o.id)}
            disabled={!answers.queixas.includes(o.id) && answers.queixas.length >= 3}
            onClick={() => toggle(o.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   RESULT
   ════════════════════════════════════════════════════ */
function DiagnosisResult({
  diagnosis,
  onCheckout,
}: {
  diagnosis: Diagnosis;
  onCheckout: () => void;
}) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
        <CheckCircle2 className="w-4 h-4" /> Seu diagnóstico está pronto
      </div>
      <h3 className="text-2xl font-bold leading-tight">{diagnosis.saudacao}</h3>

      <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          Análise corporal
        </p>
        <p className="text-sm leading-relaxed">{diagnosis.analisePeso}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="IMC" value={diagnosis.imc.toFixed(1).replace(".", ",")} />
          <Stat
            label="Peso ideal"
            value={`${diagnosis.pesoIdeal.toString().replace(".", ",")} kg`}
          />
          <Stat
            label="Diferença"
            value={`${diagnosis.diferencaKg > 0 ? "+" : ""}${diagnosis.diferencaKg
              .toString()
              .replace(".", ",")} kg`}
            accent={Math.abs(diagnosis.diferencaKg) > 2}
          />
        </div>
      </div>

      {diagnosis.dicas.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Pontos de atenção
          </p>
          <ul className="space-y-2">
            {diagnosis.dicas.map((d, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed p-3 rounded-xl bg-muted/40 border border-border/40"
              >
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl gradient-primary p-5 text-primary-foreground">
        <p className="font-semibold text-base leading-snug">{diagnosis.cta}</p>
        <Button
          type="button"
          onClick={onCheckout}
          className="mt-4 w-full bg-background text-foreground hover:bg-background/90 rounded-full h-12 text-base font-semibold"
        >
          Quero meu acompanhamento completo <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      <p className="text-[11px] text-center text-muted-foreground">
        Este diagnóstico é uma análise inicial. Para conduta clínica completa,
        agende com um nutricionista FitJourney.
      </p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════ */
function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h4 className="text-lg font-bold leading-tight">{title}</h4>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`text-sm rounded-xl border px-3 py-2 transition-all ${
                active
                  ? "border-primary bg-primary/10 text-foreground font-semibold"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceCard({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: any;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full text-left p-3.5 rounded-xl border transition-all ${
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_0_3px_oklch(0.62_0.16_155/0.15)]"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <span
        className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function MultiChoice({
  icon: Icon,
  label,
  selected,
  disabled,
  onClick,
}: {
  icon: any;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full text-left p-3.5 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <span
        className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-sm font-medium flex-1">{label}</span>
      <span
        className={`size-5 rounded-md border-2 flex items-center justify-center ${
          selected ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
      </span>
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 ${accent ? "bg-primary/15" : "bg-muted/40"}`}>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`text-base font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
