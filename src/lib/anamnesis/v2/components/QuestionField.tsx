import { useState } from "react";
import type { AnswerValue, Question } from "../catalog/types";

interface Props {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  error?: string;
}

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary";

/**
 * Normalização "amigável" de entradas numéricas com unidade conhecida.
 * Retorna { value, notice } — notice é exibido inline quando a normalização
 * altera o valor digitado (ex: paciente digitou em metros).
 */
function normalizeNumeric(
  unit: string | undefined,
  raw: number,
): { value: number; notice: string | null } {
  if (!Number.isFinite(raw)) return { value: raw, notice: null };
  if (unit === "cm") {
    // Altura humana: < 3 = quase certamente metros; entre 3 e 10 = ambíguo
    // (digitou "5" achando que era metro? — não normalizamos, devolvemos como está
    // e a validação min/max captura). Apenas < 3 normalizamos com aviso.
    if (raw > 0 && raw < 3) {
      const cm = Math.round(raw * 100);
      return { value: cm, notice: `Convertemos ${raw} m para ${cm} cm.` };
    }
  }
  if (unit === "kg") {
    // Peso humano: > 1000 = quase certamente gramas (ex: 70000g)
    if (raw >= 1000 && raw <= 300000) {
      const kg = Math.round(raw / 1000);
      return { value: kg, notice: `Convertemos ${raw} g para ${kg} kg.` };
    }
  }
  return { value: raw, notice: null };
}

export function QuestionField({ question: q, value, onChange, error }: Props) {
  const [normalizeNotice, setNormalizeNotice] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium tracking-tight text-foreground">
        {q.title}
        {q.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {q.description && (
        <p className="text-xs text-muted-foreground">{q.description}</p>
      )}

      {q.type === "boolean" && (
        <div className="flex gap-2">
          {[
            { v: true, label: "Sim" },
            { v: false, label: "Não" },
          ].map((opt) => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => onChange(opt.v)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                value === opt.v
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-foreground hover:bg-accent/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {q.type === "single_choice" && q.options && (
        <div className="grid gap-1.5">
          {q.options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                value === o.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-foreground hover:bg-accent/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {q.type === "multi_choice" && q.options && (
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => {
            const arr = Array.isArray(value) ? value : [];
            const active = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  onChange(
                    active ? arr.filter((x) => x !== o.value) : [...arr, o.value],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-foreground hover:bg-accent/40"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "number" && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={q.min}
              max={q.max}
              placeholder={
                q.unit === "cm"
                  ? "ex: 165"
                  : q.unit === "kg"
                    ? "ex: 70"
                    : q.min !== undefined
                      ? `entre ${q.min} e ${q.max ?? "—"}`
                      : undefined
              }
              value={value === null || value === undefined ? "" : Number(value)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setNormalizeNotice(null);
                  onChange(null);
                  return;
                }
                // Sem normalizar durante o onChange — usuário pode ainda estar digitando.
                onChange(Number(raw));
                // Se já estava normalizado, qualquer nova digitação limpa o aviso.
                if (normalizeNotice) setNormalizeNotice(null);
              }}
              onBlur={(e) => {
                const raw = e.target.value;
                if (raw === "") return;
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                const norm = normalizeNumeric(q.unit, n);
                if (norm.value !== n) {
                  onChange(norm.value);
                  setNormalizeNotice(norm.notice);
                }
              }}
              className={inputCls}
            />
            {q.unit && (
              <span className="text-xs font-mono text-muted-foreground">{q.unit}</span>
            )}
          </div>
          {normalizeNotice && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {normalizeNotice}
            </p>
          )}
          {(q.min !== undefined || q.max !== undefined) && !normalizeNotice && (
            <p className="text-[11px] text-muted-foreground">
              Informe em <strong>{q.unit ?? "número"}</strong>
              {q.min !== undefined && q.max !== undefined
                ? ` (entre ${q.min} e ${q.max})`
                : ""}
              .
            </p>
          )}
        </>
      )}

      {q.type === "text" && (
        <textarea
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
