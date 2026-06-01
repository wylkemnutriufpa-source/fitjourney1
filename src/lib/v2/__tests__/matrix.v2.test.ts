import { describe, it, expect } from "vitest";
import { validateMatrix } from "../matrix.v2";

describe("validateMatrix (V2)", () => {
  it("aceita proteína ↔ proteína", () => {
    expect(validateMatrix("protein", "protein").ok).toBe(true);
  });
  it("aceita carbo ↔ carbo", () => {
    expect(validateMatrix("carb", "carb").ok).toBe(true);
  });
  it("aceita gordura ↔ gordura", () => {
    expect(validateMatrix("fat", "fat").ok).toBe(true);
  });
  it("rejeita proteína ↔ carbo", () => {
    const r = validateMatrix("protein", "carb");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Matriz/);
  });
  it("rejeita carbo ↔ gordura", () => {
    expect(validateMatrix("carb", "fat").ok).toBe(false);
  });
  it("rejeita proteína ↔ gordura", () => {
    expect(validateMatrix("protein", "fat").ok).toBe(false);
  });
  it("mixed é aceito em qualquer direção", () => {
    expect(validateMatrix("mixed", "protein").ok).toBe(true);
    expect(validateMatrix("carb", "mixed").ok).toBe(true);
  });
});
