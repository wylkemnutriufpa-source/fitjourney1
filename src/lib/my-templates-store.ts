// Hook + store p/ "Meus Templates" (persistência local — futuro: Supabase)
import { useEffect, useState, useCallback } from "react";
import type { PlannerTemplate } from "./meal-planner";
import { normalizeStoredPlannerTemplate } from "./meal-planner";

const KEY = "fitjourney.myTemplates.v1";

export type MyTemplate = PlannerTemplate & {
  basedOn: string;        // id do template do sistema
  savedAt: string;        // ISO
  finalidade?: string;    // ex: "Atleta hipertrofia 80kg"
  observacoes?: string;   // texto livre
};

function read(): MyTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as Array<MyTemplate | Record<string, unknown>>;
    const list: MyTemplate[] = [];
    raw.forEach((entry) => {
      const normalized = normalizeStoredPlannerTemplate(entry);
      if (!normalized) return;
      list.push({
        ...normalized,
        basedOn: typeof (entry as MyTemplate).basedOn === "string" ? (entry as MyTemplate).basedOn : normalized.id,
        savedAt: typeof (entry as MyTemplate).savedAt === "string" ? (entry as MyTemplate).savedAt : new Date().toISOString(),
        finalidade: typeof (entry as MyTemplate).finalidade === "string" ? (entry as MyTemplate).finalidade : undefined,
        observacoes: typeof (entry as MyTemplate).observacoes === "string" ? (entry as MyTemplate).observacoes : undefined,
      });
    });
    return list;
  } catch {
    return [];
  }
}

function write(list: MyTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("myTemplates:changed"));
}

export function useMyTemplates() {
  const [list, setList] = useState<MyTemplate[]>([]);

  useEffect(() => {
    setList(read());
    const onChange = () => setList(read());
    window.addEventListener("myTemplates:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("myTemplates:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const save = useCallback((tpl: MyTemplate) => {
    const all = read();
    const idx = all.findIndex((t) => t.id === tpl.id);
    if (idx >= 0) all[idx] = tpl;
    else all.unshift(tpl);
    write(all);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id));
  }, []);

  return { list, save, remove };
}
