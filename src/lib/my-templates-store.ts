// Hook + store p/ "Meus Templates" (persistência local — futuro: Supabase)
import { useEffect, useState, useCallback } from "react";
import type { DietTemplate } from "./template-data";

const KEY = "fitjourney.myTemplates.v1";

export type MyTemplate = DietTemplate & {
  basedOn: string;        // id do template do sistema
  savedAt: string;        // ISO
  finalidade?: string;    // ex: "Atleta hipertrofia 80kg"
  observacoes?: string;   // texto livre
};

function read(): MyTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as MyTemplate[];
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
