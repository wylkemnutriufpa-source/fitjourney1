// Catálogo clínico — entidade tipada.
// Fonte hoje: arquivo. Amanhã: tabela question_catalogs (Fase 2).
// Runner e adapter consomem APENAS via loader.loadCatalog().

export type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

export type Answers = Record<string, AnswerValue>;

export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "number"
  | "boolean"
  | "text"
  | "scale";

export interface Option {
  value: string;
  label: string;
}

export interface Trigger {
  // Renderiza pergunta se TODAS as condições baterem.
  // Cada condição: { questionId, equals } (ou includes p/ multi_choice)
  all?: Array<
    | { questionId: string; equals: AnswerValue }
    | { questionId: string; includes: string }
    | { questionId: string; truthy: true }
  >;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  options?: Option[]; // single/multi
  min?: number;
  max?: number;
  unit?: string;
  trigger?: Trigger; // se ausente, sempre renderiza
  clinicalTags?: string[]; // tags emitidas ao adapter quando respondida positivamente
  domain: ClinicalDomain;
}

export type ClinicalDomain =
  | "basics"
  | "digestive"
  | "metabolic"
  | "cardiovascular"
  | "medications"
  | "labs"
  | "sleep"
  | "physical_activity"
  | "screening";

export interface CatalogBlock {
  id: string;
  domain: ClinicalDomain;
  title: string;
  description?: string;
  questions: Question[];
}

export interface CatalogManifest {
  version: string; // ex "clinical-v2.2026-05-31"
  blocks: CatalogBlock[];
}
