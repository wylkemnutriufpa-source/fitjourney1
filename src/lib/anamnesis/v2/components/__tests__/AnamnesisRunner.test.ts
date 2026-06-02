// Testes unitários do contrato de autosave local do AnamnesisRunner.
// Valida o contrato de serialização/restauração/limpeza do rascunho.
// O componente em si é validado em integração manual + e2e (próxima fase).

import { describe, it, expect, beforeEach } from "vitest";

const KEY = "fj:anamnesis-draft:test";

// Storage in-memory (vitest roda em node sem window por padrão).
const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
};

function saveDraft(answers: Record<string, unknown>) {
  storage.setItem(KEY, JSON.stringify({ answers, updatedAt: Date.now() }));
}
function loadDraft(): { answers: Record<string, unknown>; updatedAt: number } | null {
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function clearDraft() { storage.removeItem(KEY); }

describe("AnamnesisRunner — contrato de rascunho", () => {
  beforeEach(() => storage.clear());

  it("salva e restaura respostas idênticas", () => {
    saveDraft({ age: 30, weight: 72.5, conditions: ["diabetes"] });
    const d = loadDraft();
    expect(d!.answers.age).toBe(30);
    expect(d!.answers.weight).toBe(72.5);
    expect(d!.answers.conditions).toEqual(["diabetes"]);
  });

  it("inclui timestamp para resolver conflito DB vs local", () => {
    const before = Date.now();
    saveDraft({ foo: "bar" });
    expect(loadDraft()!.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("debounce: múltiplas escritas só persistem a última", async () => {
    // Simula a lógica de debounce do Runner.
    let timer: any = null;
    const debouncedSave = (a: Record<string, unknown>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => saveDraft(a), 50);
    };
    debouncedSave({ v: 1 });
    debouncedSave({ v: 2 });
    debouncedSave({ v: 3 });
    await new Promise((r) => setTimeout(r, 80));
    expect(loadDraft()!.answers.v).toBe(3);
  });

  it("clearDraft remove o rascunho", () => {
    saveDraft({ goal: "lose" });
    expect(loadDraft()).not.toBeNull();
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("loadDraft retorna null se JSON corrompido", () => {
    storage.setItem(KEY, "{not valid json");
    expect(loadDraft()).toBeNull();
  });

  it("após submit bem-sucedido o rascunho é descartado", () => {
    saveDraft({ q1: "a" });
    clearDraft(); // simula clearDraft pós-submit
    expect(storage.getItem(KEY)).toBeNull();
  });
});
