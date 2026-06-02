// Fonte hardcoded do catálogo clínico V2. Determinístico.
// Para adicionar perguntas: edite aqui e bumpe CATALOG_VERSION.

import { CATALOG_VERSION } from "./catalog.version";
import type { CatalogManifest } from "./types";

export const CATALOG: CatalogManifest = {
  version: CATALOG_VERSION,
  blocks: [
    // ===== BLOCO 1 — Dados Básicos =====
    {
      id: "basics",
      domain: "basics",
      title: "Dados básicos",
      description: "Informações iniciais para cálculo metabólico.",
      questions: [
        {
          id: "basics.sex",
          domain: "basics",
          type: "single_choice",
          title: "Sexo biológico",
          required: true,
          options: [
            { value: "male", label: "Masculino" },
            { value: "female", label: "Feminino" },
          ],
        },
        {
          id: "basics.ageYears",
          domain: "basics",
          type: "number",
          title: "Idade",
          required: true,
          min: 12,
          max: 100,
          unit: "anos",
        },
        {
          id: "basics.weightKg",
          domain: "basics",
          type: "number",
          title: "Peso atual (em quilos)",
          description: "Em kg. Exemplo: 70",
          required: true,
          min: 30,
          max: 300,
          unit: "kg",
        },
        {
          id: "basics.heightCm",
          domain: "basics",
          type: "number",
          title: "Altura (em centímetros)",
          description: "Em cm, não em metros. Exemplo: 165, não 1.65.",
          required: true,
          min: 120,
          max: 230,
          unit: "cm",
        },
        {
          id: "basics.goal",
          domain: "basics",
          type: "single_choice",
          title: "Objetivo principal",
          required: true,
          options: [
            { value: "cut", label: "Emagrecimento" },
            { value: "maintain", label: "Manutenção" },
            { value: "bulk", label: "Hipertrofia" },
            { value: "performance", label: "Performance esportiva" },
            { value: "health", label: "Saúde geral" },
          ],
        },
        {
          id: "basics.activity",
          domain: "basics",
          type: "single_choice",
          title: "Nível de atividade",
          required: true,
          options: [
            { value: "sedentary", label: "Sedentário" },
            { value: "light", label: "Leve (1-3x/semana)" },
            { value: "moderate", label: "Moderado (3-5x/semana)" },
            { value: "high", label: "Intenso (6-7x/semana)" },
            { value: "extreme", label: "Atleta (2x/dia)" },
          ],
        },
        // Gestação aparece só para sexo feminino
        {
          id: "basics.pregnancy",
          domain: "basics",
          type: "boolean",
          title: "Está grávida no momento?",
          trigger: { all: [{ questionId: "basics.sex", equals: "female" }] },
          clinicalTags: ["pregnancy"],
        },
      ],
    },

    // ===== BLOCO 2 — Saúde Digestiva =====
    {
      id: "digestive",
      domain: "digestive",
      title: "Saúde digestiva",
      questions: [
        {
          id: "digestive.gastritis",
          domain: "digestive",
          type: "boolean",
          title: "Possui gastrite?",
          clinicalTags: ["gastritis"],
        },
        {
          id: "digestive.gastritis.diagnosedAt",
          domain: "digestive",
          type: "single_choice",
          title: "Quando foi diagnosticada?",
          trigger: { all: [{ questionId: "digestive.gastritis", truthy: true }] },
          options: [
            { value: "lt_3m", label: "Menos de 3 meses" },
            { value: "3_6m", label: "3 a 6 meses" },
            { value: "gt_6m", label: "Mais de 6 meses" },
          ],
        },
        {
          id: "digestive.gastritis.inTreatment",
          domain: "digestive",
          type: "boolean",
          title: "Está em tratamento?",
          trigger: { all: [{ questionId: "digestive.gastritis", truthy: true }] },
        },
        {
          id: "digestive.gastritis.symptoms",
          domain: "digestive",
          type: "multi_choice",
          title: "Sintomas atuais",
          trigger: { all: [{ questionId: "digestive.gastritis", truthy: true }] },
          options: [
            { value: "heartburn", label: "Azia" },
            { value: "reflux", label: "Refluxo" },
            { value: "pain", label: "Dor" },
            { value: "nausea", label: "Náusea" },
            { value: "fullness", label: "Estômago cheio" },
          ],
        },
        {
          id: "digestive.reflux",
          domain: "digestive",
          type: "boolean",
          title: "Possui refluxo?",
          clinicalTags: ["reflux"],
        },
        {
          id: "digestive.ibs",
          domain: "digestive",
          type: "boolean",
          title: "Síndrome do intestino irritável?",
          clinicalTags: ["ibs"],
        },
        {
          id: "digestive.constipation",
          domain: "digestive",
          type: "boolean",
          title: "Constipação frequente?",
          clinicalTags: ["constipation"],
        },
      ],
    },

    // ===== BLOCO 3 — Saúde Metabólica =====
    {
      id: "metabolic",
      domain: "metabolic",
      title: "Saúde metabólica",
      questions: [
        {
          id: "metabolic.diabetes",
          domain: "metabolic",
          type: "single_choice",
          title: "Diabetes",
          options: [
            { value: "none", label: "Não tenho" },
            { value: "pre", label: "Pré-diabetes" },
            { value: "type1", label: "Tipo 1" },
            { value: "type2", label: "Tipo 2" },
          ],
        },
        {
          id: "metabolic.thyroid",
          domain: "metabolic",
          type: "single_choice",
          title: "Tireoide",
          options: [
            { value: "none", label: "Sem alteração" },
            { value: "hypo", label: "Hipotireoidismo" },
            { value: "hyper", label: "Hipertireoidismo" },
          ],
        },
        {
          id: "metabolic.sop",
          domain: "metabolic",
          type: "boolean",
          title: "Síndrome dos Ovários Policísticos (SOP)?",
          trigger: { all: [{ questionId: "basics.sex", equals: "female" }] },
          clinicalTags: ["sop"],
        },
        {
          id: "metabolic.insulinResistance",
          domain: "metabolic",
          type: "boolean",
          title: "Resistência à insulina?",
          clinicalTags: ["insulin_resistance"],
        },
      ],
    },

    // ===== BLOCO 4 — Saúde Cardiovascular =====
    {
      id: "cardiovascular",
      domain: "cardiovascular",
      title: "Saúde cardiovascular",
      questions: [
        {
          id: "cardio.hypertension",
          domain: "cardiovascular",
          type: "boolean",
          title: "Possui hipertensão?",
          clinicalTags: ["hypertension"],
        },
        {
          id: "cardio.cholesterol",
          domain: "cardiovascular",
          type: "boolean",
          title: "Colesterol elevado?",
          clinicalTags: ["high_cholesterol"],
        },
        {
          id: "cardio.triglycerides",
          domain: "cardiovascular",
          type: "boolean",
          title: "Triglicerídeos elevados?",
          clinicalTags: ["high_triglycerides"],
        },
      ],
    },

    // ===== BLOCO 5 — Medicações =====
    {
      id: "medications",
      domain: "medications",
      title: "Medicações",
      questions: [
        {
          id: "meds.continuous",
          domain: "medications",
          type: "boolean",
          title: "Faz uso de medicação contínua?",
        },
        {
          id: "meds.list",
          domain: "medications",
          type: "text",
          title: "Quais medicações? (nome, dose, frequência)",
          description: "Ex: Losartana 50mg 1x/dia; Metformina 850mg 2x/dia",
          trigger: { all: [{ questionId: "meds.continuous", truthy: true }] },
        },
      ],
    },

    // ===== BLOCO 6 — Sono =====
    {
      id: "sleep",
      domain: "sleep",
      title: "Sono",
      questions: [
        {
          id: "sleep.hours",
          domain: "sleep",
          type: "number",
          title: "Quantas horas dorme por noite?",
          min: 0,
          max: 14,
          unit: "h",
        },
        {
          id: "sleep.wakesTired",
          domain: "sleep",
          type: "boolean",
          title: "Acorda cansado?",
        },
        {
          id: "sleep.awakenings",
          domain: "sleep",
          type: "boolean",
          title: "Acorda durante a noite?",
        },
        {
          id: "sleep.snoring",
          domain: "sleep",
          type: "boolean",
          title: "Ronca?",
          clinicalTags: ["snoring"],
        },
        {
          id: "sleep.apnea",
          domain: "sleep",
          type: "boolean",
          title: "Possui apneia diagnosticada?",
          clinicalTags: ["sleep_apnea"],
        },
      ],
    },

    // ===== BLOCO 7 — Atividade física =====
    {
      id: "physical_activity",
      domain: "physical_activity",
      title: "Atividade física",
      questions: [
        {
          id: "activity.practices",
          domain: "physical_activity",
          type: "boolean",
          title: "Pratica atividade física?",
        },
        {
          id: "activity.modality",
          domain: "physical_activity",
          type: "single_choice",
          title: "Qual modalidade principal?",
          trigger: { all: [{ questionId: "activity.practices", truthy: true }] },
          options: [
            { value: "musculacao", label: "Musculação" },
            { value: "corrida", label: "Corrida" },
            { value: "ciclismo", label: "Ciclismo" },
            { value: "crossfit", label: "Crossfit" },
            { value: "natacao", label: "Natação" },
            { value: "luta", label: "Lutas" },
            { value: "futebol", label: "Futebol" },
            { value: "triathlon", label: "Triathlon" },
            { value: "outro", label: "Outro" },
          ],
        },
        {
          id: "activity.frequencyPerWeek",
          domain: "physical_activity",
          type: "number",
          title: "Quantos treinos por semana?",
          trigger: { all: [{ questionId: "activity.practices", truthy: true }] },
          min: 1,
          max: 14,
          unit: "x/sem",
        },
        {
          id: "activity.weeklyVolumeMinutes",
          domain: "physical_activity",
          type: "number",
          title: "Volume semanal total",
          trigger: { all: [{ questionId: "activity.practices", truthy: true }] },
          min: 0,
          max: 2000,
          unit: "min",
        },
      ],
    },
  ],
};
