// Runner puro — avalia trigger e decide quais perguntas renderizar.
// Sem React. Sem IO. Determinístico.

import type {
  Answers,
  CatalogManifest,
  Question,
  Trigger,
} from "./catalog/types";

export function isQuestionActive(q: Question, answers: Answers): boolean {
  if (!q.trigger) return true;
  return evalTrigger(q.trigger, answers);
}

function evalTrigger(trigger: Trigger, answers: Answers): boolean {
  if (!trigger.all || trigger.all.length === 0) return true;
  return trigger.all.every((cond) => {
    const v = answers[cond.questionId];
    if ("equals" in cond) return v === cond.equals;
    if ("includes" in cond) return Array.isArray(v) && v.includes(cond.includes);
    if ("in" in cond) return typeof v === "string" && cond.in.includes(v);
    if ("truthy" in cond) return v === true || (typeof v === "string" && v.length > 0);
    return false;
  });
}

export interface VisibleQuestion {
  blockId: string;
  blockTitle: string;
  question: Question;
}

export function getVisibleQuestions(
  catalog: CatalogManifest,
  answers: Answers,
): VisibleQuestion[] {
  const out: VisibleQuestion[] = [];
  for (const block of catalog.blocks) {
    for (const q of block.questions) {
      if (isQuestionActive(q, answers)) {
        out.push({ blockId: block.id, blockTitle: block.title, question: q });
      }
    }
  }
  return out;
}

export function isAnswered(q: Question, answers: Answers): boolean {
  const v = answers[q.id];
  if (v === null || v === undefined || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export interface ValidationIssue {
  questionId: string;
  message: string;
}

export function validateAnswers(
  catalog: CatalogManifest,
  answers: Answers,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const { question } of getVisibleQuestions(catalog, answers)) {
    if (question.required && !isAnswered(question, answers)) {
      issues.push({ questionId: question.id, message: "Resposta obrigatória" });
    }
    if (question.type === "number" && isAnswered(question, answers)) {
      const n = Number(answers[question.id]);
      if (Number.isNaN(n)) {
        issues.push({ questionId: question.id, message: "Valor numérico inválido" });
      } else if (typeof question.min === "number" && n < question.min) {
        issues.push({ questionId: question.id, message: `Mínimo ${question.min}` });
      } else if (typeof question.max === "number" && n > question.max) {
        issues.push({ questionId: question.id, message: `Máximo ${question.max}` });
      }
    }
  }
  return issues;
}
