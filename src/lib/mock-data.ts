// Mock data for FitJourney — sports nutritionist platform
export type Goal = "Hipertrofia" | "Emagrecimento" | "Performance" | "Manutenção";

export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F";
  weightKg: number;
  heightCm: number;
  sport: string;
  goal: Goal;
  status: "Ativo" | "Pausado";
  lastVisit: string;
  tmb: number;
  get: number;
  tdee: number;
  initials: string;
  progress: { week: string; weight: number }[];
};

export const patients: Patient[] = [
  {
    id: "p-001",
    name: "Ricardo G. Mendes",
    age: 32,
    sex: "M",
    weightKg: 78,
    heightCm: 182,
    sport: "Triathlon (Pro)",
    goal: "Performance",
    status: "Ativo",
    lastVisit: "2026-05-20",
    tmb: 2140,
    get: 3850,
    tdee: 3200,
    initials: "RM",
    progress: [
      { week: "S1", weight: 80.2 },
      { week: "S2", weight: 79.6 },
      { week: "S3", weight: 79.1 },
      { week: "S4", weight: 78.4 },
      { week: "S5", weight: 78.0 },
      { week: "S6", weight: 77.6 },
    ],
  },
  {
    id: "p-002",
    name: "Helena Souza",
    age: 28,
    sex: "F",
    weightKg: 62,
    heightCm: 168,
    sport: "Crossfit",
    goal: "Hipertrofia",
    status: "Ativo",
    lastVisit: "2026-05-26",
    tmb: 1450,
    get: 2380,
    tdee: 2550,
    initials: "HS",
    progress: [
      { week: "S1", weight: 60.0 },
      { week: "S2", weight: 60.4 },
      { week: "S3", weight: 60.8 },
      { week: "S4", weight: 61.2 },
      { week: "S5", weight: 61.6 },
      { week: "S6", weight: 62.0 },
    ],
  },
  {
    id: "p-003",
    name: "Felipe Almeida",
    age: 35,
    sex: "M",
    weightKg: 74,
    heightCm: 178,
    sport: "Ciclismo Estrada",
    goal: "Performance",
    status: "Ativo",
    lastVisit: "2026-05-22",
    tmb: 1820,
    get: 3120,
    tdee: 3000,
    initials: "FA",
    progress: [
      { week: "S1", weight: 76.0 },
      { week: "S2", weight: 75.4 },
      { week: "S3", weight: 75.0 },
      { week: "S4", weight: 74.6 },
      { week: "S5", weight: 74.2 },
      { week: "S6", weight: 74.0 },
    ],
  },
  {
    id: "p-004",
    name: "Marina Castro",
    age: 24,
    sex: "F",
    weightKg: 58,
    heightCm: 165,
    sport: "Corrida 10k",
    goal: "Emagrecimento",
    status: "Ativo",
    lastVisit: "2026-05-18",
    tmb: 1380,
    get: 2150,
    tdee: 1900,
    initials: "MC",
    progress: [
      { week: "S1", weight: 61.0 },
      { week: "S2", weight: 60.5 },
      { week: "S3", weight: 60.0 },
      { week: "S4", weight: 59.4 },
      { week: "S5", weight: 58.7 },
      { week: "S6", weight: 58.0 },
    ],
  },
  {
    id: "p-005",
    name: "Daniel Pires",
    age: 41,
    sex: "M",
    weightKg: 88,
    heightCm: 185,
    sport: "Musculação",
    goal: "Hipertrofia",
    status: "Pausado",
    lastVisit: "2026-04-30",
    tmb: 2050,
    get: 3100,
    tdee: 3300,
    initials: "DP",
    progress: [
      { week: "S1", weight: 86.0 },
      { week: "S2", weight: 86.5 },
      { week: "S3", weight: 87.0 },
      { week: "S4", weight: 87.4 },
      { week: "S5", weight: 87.8 },
      { week: "S6", weight: 88.0 },
    ],
  },
  {
    id: "p-006",
    name: "Beatriz Lima",
    age: 30,
    sex: "F",
    weightKg: 65,
    heightCm: 170,
    sport: "Natação",
    goal: "Manutenção",
    status: "Ativo",
    lastVisit: "2026-05-24",
    tmb: 1500,
    get: 2400,
    tdee: 2400,
    initials: "BL",
    progress: [
      { week: "S1", weight: 65.0 },
      { week: "S2", weight: 65.2 },
      { week: "S3", weight: 65.1 },
      { week: "S4", weight: 65.0 },
      { week: "S5", weight: 65.1 },
      { week: "S6", weight: 65.0 },
    ],
  },
];

export function getPatient(id: string) {
  return patients.find((p) => p.id === id);
}

export type MealItem = { name: string; qty: string };
export type Meal = {
  id: string;
  time: string;
  label: string;
  title: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  items: MealItem[];
  substitutions: MealItem[][];
};

export type DietVariation = {
  id: string;
  label: string;
  kcal: number;
  meals: Meal[];
};

export type DietTemplate = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  variations: DietVariation[];
};

const baseMeals: Meal[] = [
  {
    id: "m1",
    time: "06:30",
    label: "Pré-Treino",
    title: "Pre-Workout Load",
    kcal: 450,
    protein: 28,
    carbs: 65,
    fat: 8,
    items: [
      { name: "Aveia em flocos", qty: "80g" },
      { name: "Whey protein", qty: "1 scoop (30g)" },
      { name: "Mirtilo", qty: "50g" },
    ],
    substitutions: [
      [
        { name: "Pão integral", qty: "2 fatias" },
        { name: "Whey protein", qty: "1 scoop" },
        { name: "Banana", qty: "1 unidade" },
      ],
      [
        { name: "Tapioca", qty: "60g" },
        { name: "Ovos", qty: "3 unidades" },
        { name: "Mamão", qty: "100g" },
      ],
    ],
  },
  {
    id: "m2",
    time: "10:00",
    label: "Pós-Treino",
    title: "Recovery Shake",
    kcal: 280,
    protein: 35,
    carbs: 28,
    fat: 4,
    items: [
      { name: "Whey isolado", qty: "40g" },
      { name: "Banana", qty: "1 unidade" },
      { name: "Água de coco", qty: "300ml" },
    ],
    substitutions: [
      [
        { name: "Iogurte natural", qty: "200g" },
        { name: "Granola", qty: "30g" },
        { name: "Mel", qty: "10g" },
      ],
    ],
  },
  {
    id: "m3",
    time: "13:00",
    label: "Almoço",
    title: "Proteína & Carbo Complexo",
    kcal: 720,
    protein: 55,
    carbs: 80,
    fat: 18,
    items: [
      { name: "Peito de frango grelhado", qty: "180g" },
      { name: "Arroz integral", qty: "120g (cozido)" },
      { name: "Brócolis", qty: "100g" },
      { name: "Azeite extra-virgem", qty: "10ml" },
    ],
    substitutions: [
      [
        { name: "Filé mignon magro", qty: "150g" },
        { name: "Batata doce", qty: "200g" },
        { name: "Espinafre refogado", qty: "100g" },
      ],
      [
        { name: "Salmão grelhado", qty: "150g" },
        { name: "Quinoa", qty: "100g" },
        { name: "Mix de folhas", qty: "à vontade" },
      ],
    ],
  },
  {
    id: "m4",
    time: "16:30",
    label: "Lanche",
    title: "Snack Proteico",
    kcal: 320,
    protein: 22,
    carbs: 35,
    fat: 10,
    items: [
      { name: "Iogurte grego", qty: "200g" },
      { name: "Castanha do Pará", qty: "20g" },
      { name: "Frutas vermelhas", qty: "80g" },
    ],
    substitutions: [
      [
        { name: "Pasta de amendoim", qty: "20g" },
        { name: "Pão integral", qty: "1 fatia" },
        { name: "Whey", qty: "1 scoop" },
      ],
    ],
  },
  {
    id: "m5",
    time: "20:00",
    label: "Jantar",
    title: "Refeição Leve",
    kcal: 540,
    protein: 42,
    carbs: 45,
    fat: 16,
    items: [
      { name: "Tilápia grelhada", qty: "180g" },
      { name: "Purê de batata doce", qty: "150g" },
      { name: "Aspargos", qty: "100g" },
    ],
    substitutions: [
      [
        { name: "Ovos mexidos", qty: "4 unidades" },
        { name: "Abacate", qty: "1/2 unidade" },
        { name: "Salada verde", qty: "à vontade" },
      ],
    ],
  },
];

export const templates: DietTemplate[] = [
  {
    id: "t-end-hc",
    name: "Endurance High-Carb",
    description: "Otimizado para esportes de longa duração com janela de carbs pré e pós treino.",
    tags: ["Triathlon", "Ciclismo", "Corrida"],
    variations: [
      { id: "v1", label: "Manutenção", kcal: 2800, meals: baseMeals },
      { id: "v2", label: "Treino Longo", kcal: 3200, meals: baseMeals },
      { id: "v3", label: "Descanso", kcal: 2400, meals: baseMeals.slice(0, 4) },
    ],
  },
  {
    id: "t-hyp-2",
    name: "Hipertrofia Fase 2",
    description: "Superávit calórico moderado, alta proteína, 5 refeições.",
    tags: ["Musculação", "Crossfit"],
    variations: [
      { id: "v1", label: "Treino", kcal: 3000, meals: baseMeals },
      { id: "v2", label: "Descanso", kcal: 2700, meals: baseMeals.slice(0, 4) },
    ],
  },
  {
    id: "t-cut",
    name: "Cutting Definição",
    description: "Déficit calórico controlado preservando massa magra.",
    tags: ["Emagrecimento", "Estética"],
    variations: [
      { id: "v1", label: "Treino", kcal: 2000, meals: baseMeals.slice(0, 4) },
      { id: "v2", label: "Descanso", kcal: 1800, meals: baseMeals.slice(0, 4) },
    ],
  },
];


// Mifflin-St Jeor
export function calcTMB(sex: "M" | "F", weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "M" ? base + 5 : base - 161);
}

export function calcGET(tmb: number, activityFactor: number) {
  return Math.round(tmb * activityFactor);
}
