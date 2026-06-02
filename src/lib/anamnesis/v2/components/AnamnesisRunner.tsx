// Runner UI — paciente online e (Fase 2) nutricionista manual usam o MESMO.
// Sem lógica clínica embutida. Apenas renderiza o catálogo.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { loadCatalog } from "../catalog/loader";
import type { Answers } from "../catalog/types";
import {
  getVisibleQuestions,
  isAnswered,
  validateAnswers,
} from "../runner";
import { QuestionField } from "./QuestionField";

interface Props {
  initialAnswers?: Answers;
  onSubmit: (answers: Answers) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  /**
   * Chave de autosave local (localStorage). Rascunho apenas — não é verdade
   * clínica. Limpo automaticamente após submit bem-sucedido.
   * Default: "fj:anamnesis-draft:v1".
   */
  draftKey?: string;
}

const DEFAULT_DRAFT_KEY = "fj:anamnesis-draft:v1";

export function AnamnesisRunner({
  initialAnswers,
  onSubmit,
  submitting,
  submitLabel = "Finalizar anamnese",
  draftKey = DEFAULT_DRAFT_KEY,
}: Props) {
  const catalog = useMemo(() => loadCatalog(), []);

  // Carrega rascunho local (se houver) na montagem.
  const [answers, setAnswers] = useState<Answers>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      return initialAnswers;
    }
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as { answers?: Answers };
      return parsed.answers ?? {};
    } catch {
      return {};
    }
  });
  const [blockIdx, setBlockIdx] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const visible = useMemo(
    () => getVisibleQuestions(catalog, answers),
    [catalog, answers],
  );
  const block = catalog.blocks[blockIdx];
  const blockVisible = visible.filter((v) => v.blockId === block.id);

  const allIssues = useMemo(
    () => validateAnswers(catalog, answers),
    [catalog, answers],
  );
  const issueMap = new Map(allIssues.map((i) => [i.questionId, i.message]));

  const blockHasErrors = blockVisible.some(
    (v) => v.question.required && !isAnswered(v.question, answers),
  );

  const isLast = blockIdx === catalog.blocks.length - 1;
  const progress = Math.round(((blockIdx + 1) / catalog.blocks.length) * 100);

  // Autosave local (debounced 400ms). Rascunho — não verdade clínica.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Object.keys(answers).length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ answers, updatedAt: Date.now() }),
        );
        setSavedAt(Date.now());
      } catch {
        // quota cheia / privacy mode — silenciar; rascunho é best-effort
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [answers, draftKey]);

  function clearDraft() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }

  function setAnswer(id: string, v: Answers[string]) {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }

  async function handleNext() {
    // marca tudo do bloco como touched para exibir erros
    const next: Record<string, boolean> = { ...touched };
    blockVisible.forEach((v) => (next[v.question.id] = true));
    setTouched(next);
    if (blockHasErrors) return;

    if (isLast) {
      if (allIssues.length > 0) return;
      await onSubmit(answers);
      clearDraft();
      return;
    }
    setBlockIdx((i) => i + 1);
  }


  function handleBack() {
    setBlockIdx((i) => Math.max(0, i - 1));
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-end justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Bloco {blockIdx + 1} de {catalog.blocks.length}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">{progress}%</p>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">{block.title}</h2>
        {block.description && (
          <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {blockVisible.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma pergunta deste bloco se aplica.
          </p>
        )}
        {blockVisible.map(({ question }) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(v) => setAnswer(question.id, v)}
            error={touched[question.id] ? issueMap.get(question.id) : undefined}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleBack}
          disabled={blockIdx === 0 || submitting}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isLast ? submitLabel : "Avançar"}
          {!isLast && <ChevronRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
