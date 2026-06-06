// QA Robot — Audita TODOS os templates da Biblioteca + smart-seeds.
// Verifica: cobertura no catálogo, coerência de scaleGroup nas substituições,
// duplicidade base↔substituição, ausência de bloco materializado.

import { templates as systemTemplates } from "../src/lib/template-data";
import { SMART_TEMPLATE_SEEDS } from "../src/lib/templates/smart-seeds";
import { toPlannerTemplate } from "../src/lib/meal-planner";
import type { PlannerFoodItem, PlannerTemplate } from "../src/lib/meal-planner";
import fs from "node:fs";
import path from "node:path";

const FOODS_DIR = path.join(process.cwd(), "src/assets/foods");
const availableImages = new Set(
  fs.readdirSync(FOODS_DIR).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, "")),
);

type Issue = {
  template: string;
  meal: string;
  item: string;
  kind:
    | "no-equivalents-block"
    | "group-mismatch"
    | "duplicate-of-base"
    | "image-missing"
    | "empty-options";
  detail: string;
};

const issues: Issue[] = [];

function auditItem(template: string, meal: string, item: PlannerFoodItem) {
  const mat = item.materializedEquivalents;
  if (!mat) {
    issues.push({
      template, meal, item: item.name,
      kind: "no-equivalents-block",
      detail: `foodKey="${item.foodKey}" scaleGroup=${item.scaleGroup} — sem cobertura no catálogo TACO`,
    });
    return;
  }
  if (mat.options.length === 0) {
    issues.push({ template, meal, item: item.name, kind: "empty-options", detail: "bloco vazio" });
    return;
  }
  for (const opt of mat.options) {
    if (opt.scaleGroup !== item.scaleGroup) {
      issues.push({
        template, meal, item: item.name,
        kind: "group-mismatch",
        detail: `sub "${opt.name}" tem scaleGroup=${opt.scaleGroup} (base=${item.scaleGroup})`,
      });
    }
    if (opt.foodKey === item.foodKey) {
      issues.push({
        template, meal, item: item.name,
        kind: "duplicate-of-base",
        detail: `sub "${opt.name}" usa o mesmo foodKey do base ("${opt.foodKey}")`,
      });
    }
    const slug = opt.imageSlug ?? opt.foodKey;
    if (!availableImages.has(slug)) {
      // food-images.ts tem fallback por nome — então não é fatal, só sinaliza.
      issues.push({
        template, meal, item: item.name,
        kind: "image-missing",
        detail: `sub "${opt.name}" imageSlug="${slug}" não existe — depende de fallback`,
      });
    }
  }
}

function auditTemplate(label: string, tpl: PlannerTemplate) {
  for (const meal of tpl.meals) {
    for (const it of meal.main.items) auditItem(label, meal.label, it);
    for (const eq of meal.equivalents) {
      for (const it of eq.items) auditItem(label, `${meal.label} (eq)`, it);
    }
  }
}

console.log(`📚 Auditando ${systemTemplates.length} templates da Biblioteca...`);
for (const t of systemTemplates) {
  try {
    const planner = toPlannerTemplate(t);
    auditTemplate(t.name, planner);
  } catch (err) {
    issues.push({
      template: t.name, meal: "-", item: "-",
      kind: "no-equivalents-block",
      detail: `EXCEPTION: ${(err as Error).message}`,
    });
  }
}

console.log(`🌱 Auditando ${SMART_TEMPLATE_SEEDS.length} smart-seeds...`);
for (const seed of SMART_TEMPLATE_SEEDS) {
  try {
    const planner = toPlannerTemplate(seed as any);
    auditTemplate(`[smart] ${seed.name}`, planner);
  } catch (err) {
    issues.push({
      template: seed.name, meal: "-", item: "-",
      kind: "no-equivalents-block",
      detail: `EXCEPTION: ${(err as Error).message}`,
    });
  }
}

// Resumo
const byKind = issues.reduce<Record<string, number>>((acc, i) => {
  acc[i.kind] = (acc[i.kind] ?? 0) + 1;
  return acc;
}, {});

console.log("\n========== RESUMO ==========");
console.log(`Total de issues: ${issues.length}`);
for (const [k, n] of Object.entries(byKind)) console.log(`  ${k}: ${n}`);

// Por template — top 10
const byTpl = issues.reduce<Record<string, number>>((acc, i) => {
  acc[i.template] = (acc[i.template] ?? 0) + 1;
  return acc;
}, {});
console.log("\nTemplates com mais issues:");
Object.entries(byTpl).sort((a,b) => b[1]-a[1]).slice(0,15).forEach(([t,n]) => console.log(`  ${n.toString().padStart(3)}  ${t}`));

// Sample primeiras 30 issues críticas (group-mismatch + duplicate)
const critical = issues.filter((i) => i.kind === "group-mismatch" || i.kind === "duplicate-of-base");
console.log(`\n========== CRÍTICAS (${critical.length}) — primeiras 40 ==========`);
critical.slice(0, 40).forEach((i) =>
  console.log(`  [${i.template}] ${i.meal} :: ${i.item} → ${i.detail}`),
);

// Sample no-equivalents-block — primeiras 25
const noBlock = issues.filter((i) => i.kind === "no-equivalents-block");
console.log(`\n========== SEM COBERTURA TACO (${noBlock.length}) — primeiras 25 ==========`);
noBlock.slice(0, 25).forEach((i) =>
  console.log(`  [${i.template}] ${i.meal} :: ${i.item} → ${i.detail}`),
);

// Image-missing — primeiras 15
const imgMissing = issues.filter((i) => i.kind === "image-missing");
console.log(`\n========== IMAGEM AUSENTE (depende fallback) (${imgMissing.length}) — primeiras 15 ==========`);
imgMissing.slice(0, 15).forEach((i) =>
  console.log(`  [${i.template}] ${i.meal} :: ${i.item} → ${i.detail}`),
);

// Output JSON completo
fs.writeFileSync("/tmp/qa-templates-report.json", JSON.stringify(issues, null, 2));
console.log(`\n📄 Relatório completo: /tmp/qa-templates-report.json`);

process.exit(issues.length > 0 ? 1 : 0);
