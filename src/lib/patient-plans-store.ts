// Plano aplicado a paciente — snapshot local (futuro: Supabase plans table).
// "Sem trava, sem bloqueio: escolhe, aplica, salva. Paciente recebe."

import { useCallback, useEffect, useState } from "react";
import type { PlannerTemplate } from "./meal-planner";

const KEY = "fitjourney.patientPlans.v1";

export type AppliedPlan = {
  id: string;             // plan id
  patientId: string;
  patientName: string;
  templateId: string;
  templateName: string;
  snapshot: PlannerTemplate; // V3 snapshot imutável após salvar
  appliedAt: string;      // ISO
  finalidade?: string;
};

function read(): AppliedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as AppliedPlan[];
  } catch {
    return [];
  }
}

function write(list: AppliedPlan[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("patientPlans:changed"));
}

export function applyPlanToPatient(input: Omit<AppliedPlan, "id" | "appliedAt">): AppliedPlan {
  const plan: AppliedPlan = {
    ...input,
    id: `plan-${Date.now()}`,
    appliedAt: new Date().toISOString(),
  };
  const all = read();
  all.unshift(plan);
  write(all);
  return plan;
}

export function usePatientPlans(patientId?: string) {
  const [list, setList] = useState<AppliedPlan[]>([]);

  useEffect(() => {
    const refresh = () => {
      const all = read();
      setList(patientId ? all.filter((p) => p.patientId === patientId) : all);
    };
    refresh();
    window.addEventListener("patientPlans:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("patientPlans:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [patientId]);

  const apply = useCallback((input: Omit<AppliedPlan, "id" | "appliedAt">) => {
    return applyPlanToPatient(input);
  }, []);

  return { list, apply };
}
