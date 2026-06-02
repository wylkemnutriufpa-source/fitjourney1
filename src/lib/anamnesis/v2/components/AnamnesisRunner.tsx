// Runner UI — paciente online e (Fase 2) nutricionista manual usam o MESMO.
// Sem lógica clínica embutida. Apenas renderiza o catálogo.
//
// Autosave em DUAS CAMADAS:
//   1. localStorage (debounce 400ms) — sobrevive a reload e crash de browser.
//   2. Banco via server fn (debounce 2s) — sobrevive a troca de aparelho,
//      cache limpo e até reset de localStorage.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudCheck,
  CloudOff,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { loadCatalog } from "../catalog/loader";
import type { Answers } from "../catalog/types";
import {
  getVisibleQuestions,
  isAnswered,
  validateAnswers,
} from "../runner";
import { QuestionField } from "./QuestionField";
import {
  discardAnamnesisDraft,
  loadAnamnesisDraft,
  saveAnamnesisDraft,
} from "@/lib/anamnesis/drafts.functions";

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
  /**
   * Habilita autosave no banco (paciente logado). Default: false.
   * Quando true: hidrata respostas do DB na montagem (se existir),
   * salva no DB a cada 2s, e limpa o draft no DB no submit.
   */
  enableDbDraft?: boolean;
}

const DEFAULT_DRAFT_KEY = "fj:anamnesis-draft:v1";

type DbSaveStatus = "idle" | "saving" | "saved" | "error";

export function AnamnesisRunner({
  initialAnswers,
  onSubmit,
  submitting,
  submitLabel = "Finalizar anamnese",
  draftKey = DEFAULT_DRAFT_KEY,
  enableDbDraft = false,
}: Props) {
  const catalog = useMemo(() => loadCatalog(), []);
  const loadDraftFn = useServerFn(loadAnamnesisDraft);
  const saveDraftFn = useServerFn(saveAnamnesisDraft);
  const discardDraftFn = useServerFn(discardAnamnesisDraft);

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
  const [dbStatus, setDbStatus] = useState<DbSaveStatus>("idle");
  const [dbDraftFoundAt, setDbDraftFoundAt] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedFromDb = useRef(false);
  const hasUnsavedChanges = useRef(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitBlockedMsg, setSubmitBlockedMsg] = useState<string | null>(null);

  // 1) Hidrata do DB se enableDbDraft e ainda sem respostas significativas.
  useEffect(() => {
    if (!enableDbDraft || hydratedFromDb.current) return;
    hydratedFromDb.current = true;
    (async () => {
      try {
        const res = await loadDraftFn();
        if (res.found && res.answers && Object.keys(res.answers).length > 0) {
          // Só sobrescreve se localStorage está vazio ou DB é mais recente.
          const localRaw =
            typeof window !== "undefined"
              ? window.localStorage.getItem(draftKey)
              : null;
          let localUpdatedAt = 0;
          if (localRaw) {
            try {
              localUpdatedAt =
                (JSON.parse(localRaw) as { updatedAt?: number }).updatedAt ?? 0;
            } catch {
              /* ignore */
            }
          }
          const dbUpdatedAt = new Date(res.updatedAt).getTime();
          if (!localRaw || dbUpdatedAt > localUpdatedAt) {
            setAnswers(res.answers as Answers);
          }
          setDbDraftFoundAt(res.updatedAt);
        }
      } catch (e) {
        console.warn("[anamnesis] loadDraft falhou:", e);
      }
    })();
  }, [enableDbDraft, draftKey, loadDraftFn]);

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

  // 2) Autosave local (debounced 400ms).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Object.keys(answers).length === 0) return;
    if (localTimer.current) clearTimeout(localTimer.current);
    hasUnsavedChanges.current = true;
    localTimer.current = setTimeout(() => {
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
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [answers, draftKey]);

  // 3) Autosave no banco (debounced 2s).
  useEffect(() => {
    if (!enableDbDraft) return;
    if (Object.keys(answers).length === 0) return;
    if (dbTimer.current) clearTimeout(dbTimer.current);
    dbTimer.current = setTimeout(async () => {
      setDbStatus("saving");
      try {
        await saveDraftFn({ data: { answers: answers as any } });
        setDbStatus("saved");
        hasUnsavedChanges.current = false;
      } catch (e) {
        console.warn("[anamnesis] saveDraft falhou:", e);
        setDbStatus("error");
      }
    }, 2000);
    return () => {
      if (dbTimer.current) clearTimeout(dbTimer.current);
    };
  }, [answers, enableDbDraft, saveDraftFn]);

  // 4) beforeunload: avisa se há mudança não salva no DB.
  useEffect(() => {
    if (!enableDbDraft) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges.current) return;
      const msg =
        "Você tem alterações que ainda não foram salvas no servidor. Aguarde alguns segundos antes de sair, ou suas últimas respostas podem ser perdidas.";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enableDbDraft]);

  const clearLocalDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  async function handleNext() {
    const next: Record<string, boolean> = { ...touched };
    blockVisible.forEach((v) => (next[v.question.id] = true));
    setTouched(next);
    if (blockHasErrors) return;

    if (isLast) {
      if (allIssues.length > 0) {
        // Marca TODAS as visíveis como touched para revelar erros em todos os blocos
        const allTouched: Record<string, boolean> = { ...next };
        visible.forEach((v) => (allTouched[v.question.id] = true));
        setTouched(allTouched);

        // Navega para o primeiro bloco que contém erro
        const firstBadId = allIssues[0].questionId;
        const targetIdx = catalog.blocks.findIndex((b) =>
          visible.some(
            (v) => v.blockId === b.id && v.question.id === firstBadId,
          ),
        );
        if (targetIdx >= 0) setBlockIdx(targetIdx);

        const badQ = visible.find((v) => v.question.id === firstBadId);
        setSubmitBlockedMsg(
          `Não foi possível enviar: ${allIssues.length} resposta(s) precisam de ajuste. ` +
            (badQ
              ? `Comece por “${badQ.question.title}” — ${allIssues[0].message}.`
              : ""),
        );
        return;
      }
      setSubmitBlockedMsg(null);
      // Garante salvamento final do DB antes do submit (cancela debounce).
      if (dbTimer.current) clearTimeout(dbTimer.current);
      if (enableDbDraft) {
        try {
          await saveDraftFn({ data: { answers: answers as any } });
        } catch {
          /* segue mesmo assim — submit é a verdade final */
        }
      }
      await onSubmit(answers);
      clearLocalDraft();
      hasUnsavedChanges.current = false;
      if (enableDbDraft) {
        try {
          await discardDraftFn();
        } catch {
          /* ignore */
        }
      }
      setDbStatus("idle");
      setDbDraftFoundAt(null);
      return;
    }
    setBlockIdx((i) => i + 1);
  }

  function handleBack() {
    setBlockIdx((i) => Math.max(0, i - 1));
  }

  async function handleConfirmDiscard() {
    setDiscarding(true);
    try {
      clearLocalDraft();
      if (enableDbDraft) {
        await discardDraftFn();
      }
      setAnswers({});
      setBlockIdx(0);
      setTouched({});
      setSavedAt(null);
      setDbStatus("idle");
      setDbDraftFoundAt(null);
      hasUnsavedChanges.current = false;
      setConfirmDiscard(false);
    } catch (e) {
      console.error("[anamnesis] discard falhou:", e);
    } finally {
      setDiscarding(false);
    }
  }

  const hasAnyAnswer = Object.keys(answers).length > 0;
  const hasDraftToDiscard =
    hasAnyAnswer || !!dbDraftFoundAt || (typeof window !== "undefined" && !!window.localStorage.getItem(draftKey));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-end justify-between mb-2 gap-2 flex-wrap">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Bloco {blockIdx + 1} de {catalog.blocks.length}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <DraftStatusBadge
              enableDbDraft={enableDbDraft}
              dbStatus={dbStatus}
              localSavedAt={savedAt}
            />
            <p className="text-[10px] font-mono text-muted-foreground">{progress}%</p>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {dbDraftFoundAt && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CloudCheck className="size-4 shrink-0" />
          <span>
            Encontramos um rascunho salvo em{" "}
            <strong>{new Date(dbDraftFoundAt).toLocaleString("pt-BR")}</strong>.
            Continuamos de onde você parou.
          </span>
        </div>
      )}

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
            onChange={(v) => {
              setAnswers((p) => ({ ...p, [question.id]: v }));
              if (submitBlockedMsg) setSubmitBlockedMsg(null);
            }}
            error={touched[question.id] ? issueMap.get(question.id) : undefined}
          />
        ))}
      </div>

      {submitBlockedMsg && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {submitBlockedMsg}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={blockIdx === 0 || submitting}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
            Voltar
          </button>
          {hasDraftToDiscard && (
            <button
              type="button"
              onClick={() => setConfirmDiscard(true)}
              disabled={submitting || discarding}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 disabled:opacity-30"
              data-testid="discard-draft-button"
            >
              <Trash2 className="size-3.5" />
              Descartar rascunho
            </button>
          )}
        </div>
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

      {confirmDiscard && (
        <ConfirmDiscardModal
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={handleConfirmDiscard}
          loading={discarding}
        />
      )}
    </div>
  );
}

function DraftStatusBadge({
  enableDbDraft,
  dbStatus,
  localSavedAt,
}: {
  enableDbDraft: boolean;
  dbStatus: DbSaveStatus;
  localSavedAt: number | null;
}) {
  if (enableDbDraft) {
    if (dbStatus === "saving")
      return (
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <Loader2 className="size-3 animate-spin" /> Salvando…
        </span>
      );
    if (dbStatus === "saved")
      return (
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CloudCheck className="size-3" /> Salvo no servidor
        </span>
      );
    if (dbStatus === "error")
      return (
        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <CloudOff className="size-3" /> Salvo só localmente
        </span>
      );
    if (localSavedAt)
      return (
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <Save className="size-3" /> Rascunho local
        </span>
      );
    return null;
  }
  if (localSavedAt)
    return (
      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
        <Save className="size-3" /> Rascunho salvo
      </span>
    );
  return null;
}

function ConfirmDiscardModal({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-title"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h3
            id="discard-title"
            className="text-lg font-bold tracking-tight flex items-center gap-2"
          >
            <Trash2 className="size-5 text-destructive" />
            Descartar rascunho?
          </h3>
          <p className="text-sm text-muted-foreground">
            Todas as respostas que você já preencheu serão{" "}
            <strong className="text-foreground">apagadas</strong> deste aparelho{" "}
            <strong className="text-foreground">e do servidor</strong>. Você
            recomeçará do zero. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-2"
            data-testid="confirm-discard-button"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Sim, descartar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
