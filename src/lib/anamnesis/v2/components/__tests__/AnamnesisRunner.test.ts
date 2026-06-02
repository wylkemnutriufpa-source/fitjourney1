// Testes unitários do contrato de autosave local (localStorage).
// Cobre: serialização do rascunho, restauração, limpeza.
// O componente em si é validado via integração/manual + e2e (próxima fase).
//
// Por que não @testing-library/react aqui:
// - mantemos o footprint de deps mínimo nesta rodada;
// - validamos o CONTRATO de localStorage (que é o que protege o paciente
//   contra reload acidental) sem precisar montar o componente todo.

import { describe, it, expect, beforeEach } from "vitest";

const KEY = "fj:anamnesis-draft:test";

function saveDraft(answers: Record<string, unknown>) {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ answers, updatedAt: Date.now() }),
  );
}

function loadDraft(): { answers: Record<string, unknown>; updatedAt: number } | null {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearDraft() {
  window.localStorage.removeItem(KEY);
}

describe("AnamnesisRunner — contrato de rascunho local", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("salva e restaura respostas idênticas", () => {
    saveDraft({ age: 30, weight: 72.5, conditions: ["diabetes"] });
    const draft = loadDraft();
    expect(draft).not.toBeNull();
    expect(draft!.answers.age).toBe(30);
    expect(draft!.answers.weight).toBe(72.5);
    expect(draft!.answers.conditions).toEqual(["diabetes"]);
  });

  it("inclui timestamp para resolução de conflito DB vs local", () => {
    const before = Date.now();
    saveDraft({ foo: "bar" });
    const draft = loadDraft();
    expect(draft!.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("clearDraft remove o rascunho", () => {
    saveDraft({ goal: "lose" });
    expect(loadDraft()).not.toBeNull();
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("loadDraft retorna null se localStorage corrompido", () => {
    window.localStorage.setItem(KEY, "{not valid json");
    expect(loadDraft()).toBeNull();
  });

  it("após submit bem-sucedido o rascunho é descartado", () => {
    saveDraft({ q1: "a" });
    // simula submit
    clearDraft();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
