// Renderização humanizada das respostas de anamnese.
// Lê o catálogo para mapear question.id → título e options → labels.
// Layout: chips/cartões agrupados por bloco clínico.

import { useMemo } from "react";
import { CATALOG } from "@/lib/anamnesis/v2/catalog/catalog";
import type { Question, CatalogBlock } from "@/lib/anamnesis/v2/catalog/types";

type AnswerValue = string | number | boolean | string[] | null | undefined;

function formatValue(q: Question | undefined, raw: AnswerValue): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (typeof raw === "boolean") return raw ? "Sim" : "Não";
  if (Array.isArray(raw)) {
    if (raw.length === 0) return "—";
    return raw
      .map((v) => q?.options?.find((o) => o.value === v)?.label ?? String(v))
      .join(", ");
  }
  if (typeof raw === "number") {
    return q?.unit ? `${raw} ${q.unit}` : String(raw);
  }
  // string
  return q?.options?.find((o) => o.value === raw)?.label ?? String(raw);
}

function severityForBool(v: AnswerValue): "neutral" | "positive" | "warning" {
  if (typeof v === "boolean") return v ? "warning" : "positive";
  return "neutral";
}

export function AnamnesisAnswersView({ rawJson }: { rawJson: string }) {
  const answers = useMemo<Record<string, AnswerValue>>(() => {
    try {
      return JSON.parse(rawJson) as Record<string, AnswerValue>;
    } catch {
      return {};
    }
  }, [rawJson]);

  // Indexa questions por id
  const qIndex = useMemo(() => {
    const m = new Map<string, Question>();
    for (const b of CATALOG.blocks) for (const q of b.questions) m.set(q.id, q);
    return m;
  }, []);

  // Agrupa respostas por bloco. Respostas órfãs (sem catálogo) vão num bloco "Outros".
  const grouped = useMemo(() => {
    const byBlock = new Map<
      string,
      { block: CatalogBlock | null; entries: Array<{ id: string; q?: Question; value: AnswerValue }> }
    >();

    const blockOfQuestion = new Map<string, CatalogBlock>();
    for (const b of CATALOG.blocks) for (const q of b.questions) blockOfQuestion.set(q.id, b);

    for (const [id, value] of Object.entries(answers)) {
      const q = qIndex.get(id);
      const b = blockOfQuestion.get(id) ?? null;
      const key = b?.id ?? "__other__";
      if (!byBlock.has(key)) byBlock.set(key, { block: b, entries: [] });
      byBlock.get(key)!.entries.push({ id, q, value });
    }

    // Ordena na ordem do catálogo
    const ordered: Array<{ block: CatalogBlock | null; entries: Array<{ id: string; q?: Question; value: AnswerValue }> }> = [];
    for (const b of CATALOG.blocks) {
      const g = byBlock.get(b.id);
      if (g && g.entries.length > 0) {
        // ordena entries pela posição da pergunta no bloco
        const order = new Map(b.questions.map((q, i) => [q.id, i]));
        g.entries.sort((a, z) => (order.get(a.id) ?? 999) - (order.get(z.id) ?? 999));
        ordered.push(g);
      }
    }
    const other = byBlock.get("__other__");
    if (other && other.entries.length > 0) ordered.push(other);
    return ordered;
  }, [answers, qIndex]);

  if (grouped.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Sem respostas para exibir.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(({ block, entries }) => (
        <section key={block?.id ?? "other"} className="space-y-2">
          <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {block?.title ?? "Outras respostas"}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(({ id, q, value }) => {
              const sev = severityForBool(value);
              const tone =
                sev === "warning"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : sev === "positive"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-muted/30";
              return (
                <div
                  key={id}
                  className={
                    "rounded-md border px-3 py-2 text-left flex flex-col gap-0.5 " +
                    tone
                  }
                  title={id}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                    {q?.title ?? id}
                  </span>
                  <span className="text-sm font-medium text-foreground break-words">
                    {formatValue(q, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
