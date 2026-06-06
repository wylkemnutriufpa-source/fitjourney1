// QA Robot — Auditoria SOMENTE LEITURA dos templates (modo diário/templates V1
// + smart-seeds) e do piloto V2 (modo semanal).
//
// Aplica as regras soberanas de `fitjourney-template-rules`:
//
//   • Imagem só é exigida no ALIMENTO ÂNCORA:
//       - almoço/jantar → proteína principal (primeiro item scaleGroup=protein)
//       - café/lanche   → primeiro item do bloco (carboidrato base)
//   • Acompanhamentos, recheios, bebidas e fruta NÃO precisam de imagem.
//   • Substituições só são auditadas para itens-âncora; respeitam scaleGroup
//     do base; não podem duplicar o base; rotação café/lanche precisa de
//     pool > 1.
//
// Saídas:
//   /tmp/qa-templates-report.json — todas as issues
//   Resumo + samples no stdout

import { templates as systemTemplates } from "../src/lib/template-data";
import { SMART_TEMPLATE_SEEDS } from "../src/lib/templates/smart-seeds";
import { toPlannerTemplate } from "../src/lib/meal-planner";
import type {
  PlannerFoodItem,
  PlannerMeal,
  PlannerMealOption,
  PlannerTemplate,
} from "../src/lib/meal-planner";
import { espHipertrofiaV2Piloto } from "../src/lib/v2/template-data.v2";
import { buildSnapshotV2 } from "../src/lib/v2/snapshot/build";
import fs from "node:fs";
import path from "node:path";

// Replicar lógica de resolução de imagem (food-images.ts usa import.meta.glob).
const FOODS_DIR = path.join(process.cwd(), "src/assets/foods");
const availableImages = new Set(
  fs.readdirSync(FOODS_DIR).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, "")),
);
const sortedKeys = [...availableImages].sort();
const CATEGORY_FALLBACKS: Array<{ rx: RegExp; key: string }> = [
  { rx: /banana/i, key: "banana-com-aveia" },
  { rx: /(?<!\w)(maca|maçã)(?!\w)/i, key: "maca" },
  { rx: /laranja/i, key: "laranja" },
  { rx: /mam[aã]o/i, key: "mamao" },
  { rx: /pera/i, key: "pera" },
  { rx: /uva/i, key: "uva" },
  { rx: /abacaxi/i, key: "abacaxi" },
  { rx: /manga/i, key: "manga" },
  { rx: /morango/i, key: "morango" },
  { rx: /goiaba/i, key: "goiaba" },
  { rx: /melancia/i, key: "melancia" },
  { rx: /mel[aã]o/i, key: "melao" },
  { rx: /(contrafil[eé]|patinho|alcatra|coxao|m[uú]sculo|fraldinha|cupim|bovin|carne\s*vermelha|bife)/i, key: "carne-grelhada" },
  { rx: /ac[eé]m/i, key: "acem" },
  { rx: /picanha(?!\s*su)/i, key: "picanha" },
  { rx: /maminha/i, key: "maminha" },
  { rx: /(costela\s*su[ií]na|bisteca|panceta|costelinha)/i, key: "costela-suina" },
  { rx: /(carr[eé]|pernil|lombo)/i, key: "lombo-suino" },
  { rx: /(file\s*(de\s*)?porco|fil[eé]\s*su[ií]no)/i, key: "file-de-porco" },
  { rx: /(porco|su[ií]no|bacon)/i, key: "lombo-suino" },
  { rx: /(coxa|sobrecoxa)/i, key: "coxa-e-sobrecoxa" },
  { rx: /(frango|peito\s*de\s*frango|peru|aves?)/i, key: "frango-grelhado" },
  { rx: /(til[aá]pia|sal[mã]o|atum|peixe|merluza|sardinha|pesc|bacalhau|cama?r[aã]o|polvo|lula)/i, key: "file-de-tilapia" },
  { rx: /\bovo(s)?\b|omelete|clara/i, key: "ovos-cozidos" },
  { rx: /crepioca/i, key: "crepioca" },
  { rx: /tapioca/i, key: "tapioca-com-queijo" },
  { rx: /p[aã]o\s*(com\s*)?ovo/i, key: "pao-com-ovo" },
  { rx: /p[aã]o/i, key: "pao-com-queijo" },
  { rx: /torrada/i, key: "torrada-integral" },
  { rx: /batata(\s|-)?doce/i, key: "frango-com-batata-doce" },
  { rx: /aveia|oats|mingau/i, key: "mingau-de-aveia" },
  { rx: /cuscuz/i, key: "cuscuz-com-ovo" },
  { rx: /quinoa/i, key: "quinoa-cozida" },
  { rx: /(arroz|macarr[aã]o|massa)/i, key: "macarrao-com-carne-moida" },
  { rx: /milho/i, key: "milho-cozido" },
  { rx: /wrap|rap\s*10|rap10|tortilha/i, key: "wrap-de-frango" },
  { rx: /panqueca/i, key: "panqueca-de-banana" },
  { rx: /whey|shake/i, key: "whey-shake" },
  { rx: /chocolate\s*(quente|cacau)|achocolatado/i, key: "chocolate-quente" },
  { rx: /caf[eé]\s*com\s*leite/i, key: "copo-de-leite-morno" },
  { rx: /iogurte/i, key: "iogurte-natural" },
  { rx: /leite/i, key: "copo-de-leite-morno" },
  { rx: /castanha|granola|am[eê]ndoa|noz|chia/i, key: "iogurte-com-granola-2" },
  { rx: /fruta|berry|frutas\s*vermelhas/i, key: "salada-de-frutas" },
];
function imgFor(key: string, name?: string): string | undefined {
  if (availableImages.has(key)) return key;
  const norm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const pre = sortedKeys.find((k) => k.startsWith(norm));
  if (pre) return pre;
  const hay = `${name ?? ""} ${key}`;
  for (const { rx, key: fb } of CATEGORY_FALLBACKS) {
    if (rx.test(hay) && availableImages.has(fb)) return fb;
  }
  return undefined;
}

type Severity = "CRITICO" | "ALTO" | "MEDIO" | "BAIXO";

type Kind =
  | "anchor-image-missing"       // bug real: âncora sem imagem
  | "anchor-no-substitutions"    // âncora sem bloco materializado
  | "anchor-empty-substitutions" // bloco existe mas vazio
  | "group-mismatch"             // sub em scaleGroup diferente
  | "duplicate-of-base"          // sub repete o foodKey base
  | "rotation-pool-too-small"    // café/lanche sem rotação suficiente
  | "sub-image-missing";         // imagem da substituição não resolve

type Issue = {
  template: string;
  meal: string;
  mealKind: "main-meal" | "snack" | "other";
  item: string;
  kind: Kind;
  severity: Severity;
  detail: string;
};

const issues: Issue[] = [];

function classifyMeal(label: string): "main-meal" | "snack" | "other" {
  if (/almo[çc]o|jantar/i.test(label)) return "main-meal";
  if (/caf[eé]|lanche|ceia|desjejum/i.test(label)) return "snack";
  return "other";
}

function isAccompaniment(name: string): boolean {
  return /feij[ãa]o|salada|fruta\s*(de\s*sobremesa)?|legume|verdura|à\s*vontade/i.test(name);
}

function pickAnchor(
  opt: PlannerMealOption,
  mealKind: "main-meal" | "snack" | "other",
): PlannerFoodItem | null {
  if (mealKind === "main-meal") {
    return opt.items.find((i) => i.scaleGroup === "protein" && !isAccompaniment(i.name)) ?? null;
  }
  if (mealKind === "snack") {
    return opt.items[0] ?? null;
  }
  return opt.items[0] ?? null;
}

function hasImage(item: { foodKey: string; name: string; imageSlug?: string }): boolean {
  const url =
    imgFor(item.imageSlug ?? "", item.name) ??
    imgFor(item.foodKey, item.name);
  return Boolean(url);
}

function auditAnchor(
  template: string,
  mealLabel: string,
  mealKind: "main-meal" | "snack" | "other",
  optTitle: string,
  anchor: PlannerFoodItem,
) {
  // 1) imagem da âncora
  if (!hasImage(anchor)) {
    issues.push({
      template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
      kind: "anchor-image-missing", severity: "ALTO",
      detail: `foodKey="${anchor.foodKey}" sem imagem nem fallback de categoria`,
    });
  }

  // 2) substituições da âncora
  const mat = anchor.materializedEquivalents;
  if (!mat) {
    issues.push({
      template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
      kind: "anchor-no-substitutions", severity: "ALTO",
      detail: `âncora "${anchor.name}" (foodKey=${anchor.foodKey}, scaleGroup=${anchor.scaleGroup}) sem cobertura no catálogo TACO`,
    });
    return;
  }
  if (mat.options.length === 0) {
    issues.push({
      template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
      kind: "anchor-empty-substitutions", severity: "ALTO",
      detail: "bloco materializado vazio",
    });
    return;
  }

  if (mealKind === "snack" && mat.options.length < 2) {
    issues.push({
      template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
      kind: "rotation-pool-too-small", severity: "MEDIO",
      detail: `café/lanche com apenas ${mat.options.length} opção(ões) — rotação não funciona`,
    });
  }

  for (const opt of mat.options) {
    if (opt.scaleGroup !== anchor.scaleGroup) {
      issues.push({
        template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
        kind: "group-mismatch", severity: "CRITICO",
        detail: `sub "${opt.name}" scaleGroup=${opt.scaleGroup} ≠ base ${anchor.scaleGroup}`,
      });
    }
    if (opt.foodKey === anchor.foodKey) {
      issues.push({
        template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
        kind: "duplicate-of-base", severity: "ALTO",
        detail: `sub "${opt.name}" duplica foodKey do base ("${opt.foodKey}")`,
      });
    }
    if (!hasImage(opt)) {
      issues.push({
        template, meal: `${mealLabel} · ${optTitle}`, mealKind, item: anchor.name,
        kind: "sub-image-missing", severity: "MEDIO",
        detail: `sub "${opt.name}" (foodKey=${opt.foodKey}) sem imagem nem fallback`,
      });
    }
  }
}

function auditMeal(template: string, m: PlannerMeal) {
  const kind = classifyMeal(m.label);
  const audit = (opt: PlannerMealOption, title: string) => {
    const anchor = pickAnchor(opt, kind);
    if (!anchor) {
      issues.push({
        template, meal: `${m.label} · ${title}`, mealKind: kind, item: "(sem âncora)",
        kind: "anchor-no-substitutions", severity: "ALTO",
        detail: kind === "main-meal"
          ? "almoço/jantar sem proteína principal identificada"
          : "café/lanche sem primeiro item",
      });
      return;
    }
    auditAnchor(template, m.label, kind, title, anchor);
  };
  audit(m.main, m.main.title || "principal");
  m.equivalents.forEach((e, i) => audit(e, e.title || `eq#${i + 1}`));
}

function auditTemplate(label: string, tpl: PlannerTemplate) {
  for (const meal of tpl.meals) auditMeal(label, meal);
}

console.log(`📚 Templates V1 (Biblioteca): ${systemTemplates.length}`);
for (const t of systemTemplates) {
  try { auditTemplate(t.name, toPlannerTemplate(t)); }
  catch (err) {
    issues.push({ template: t.name, meal: "-", mealKind: "other", item: "-",
      kind: "anchor-no-substitutions", severity: "CRITICO",
      detail: `EXCEPTION: ${(err as Error).message}` });
  }
}

console.log(`🌱 Smart-seeds: ${SMART_TEMPLATE_SEEDS.length}`);
for (const s of SMART_TEMPLATE_SEEDS) {
  try { auditTemplate(`[smart] ${s.name}`, toPlannerTemplate(s as any)); }
  catch (err) {
    issues.push({ template: s.name, meal: "-", mealKind: "other", item: "-",
      kind: "anchor-no-substitutions", severity: "CRITICO",
      detail: `EXCEPTION: ${(err as Error).message}` });
  }
}

// ---------- MODO SEMANAL (Piloto V2) ----------
console.log(`📅 Piloto V2 semanal: ${espHipertrofiaV2Piloto.name}`);
try {
  const snap = buildSnapshotV2(espHipertrofiaV2Piloto);
  for (const day of snap.days) {
    for (const meal of day.meals) {
      const kind = classifyMeal(meal.label);
      const anchor = kind === "main-meal"
        ? meal.items.find((i) => i.scaleGroup === "protein" && !isAccompaniment(i.name)) ?? null
        : meal.items[0] ?? null;
      if (!anchor) {
        issues.push({
          template: `[V2] ${snap.name} / ${day.label}`,
          meal: meal.label, mealKind: kind, item: "(sem âncora)",
          kind: "anchor-no-substitutions", severity: "ALTO",
          detail: "âncora não identificada",
        });
        continue;
      }
      if (!hasImage(anchor)) {
        issues.push({
          template: `[V2] ${snap.name} / ${day.label}`,
          meal: meal.label, mealKind: kind, item: anchor.name,
          kind: "anchor-image-missing", severity: "ALTO",
          detail: `foodKey="${anchor.foodKey}" sem imagem`,
        });
      }
      const mat = (anchor as any).materializedEquivalents;
      if (!mat) {
        issues.push({
          template: `[V2] ${snap.name} / ${day.label}`,
          meal: meal.label, mealKind: kind, item: anchor.name,
          kind: "anchor-no-substitutions", severity: "MEDIO",
          detail: `V2 sem materializedEquivalents (esperado se piloto ainda não materializa)`,
        });
        continue;
      }
      if (kind === "snack" && mat.options.length < 2) {
        issues.push({
          template: `[V2] ${snap.name} / ${day.label}`,
          meal: meal.label, mealKind: kind, item: anchor.name,
          kind: "rotation-pool-too-small", severity: "MEDIO",
          detail: `${mat.options.length} opção(ões) só`,
        });
      }
      for (const o of mat.options) {
        if (o.scaleGroup && o.scaleGroup !== anchor.scaleGroup) {
          issues.push({
            template: `[V2] ${snap.name} / ${day.label}`,
            meal: meal.label, mealKind: kind, item: anchor.name,
            kind: "group-mismatch", severity: "CRITICO",
            detail: `sub "${o.name}" scaleGroup=${o.scaleGroup}`,
          });
        }
        if (o.foodKey === anchor.foodKey) {
          issues.push({
            template: `[V2] ${snap.name} / ${day.label}`,
            meal: meal.label, mealKind: kind, item: anchor.name,
            kind: "duplicate-of-base", severity: "ALTO",
            detail: `sub duplica base`,
          });
        }
      }
    }
  }
} catch (err) {
  issues.push({ template: "[V2] piloto", meal: "-", mealKind: "other", item: "-",
    kind: "anchor-no-substitutions", severity: "CRITICO",
    detail: `EXCEPTION V2: ${(err as Error).message}` });
}

// ---------- RESUMO ----------
const bySeverity = issues.reduce<Record<string, number>>((a, i) => { a[i.severity] = (a[i.severity] ?? 0) + 1; return a; }, {});
const byKind = issues.reduce<Record<string, number>>((a, i) => { a[i.kind] = (a[i.kind] ?? 0) + 1; return a; }, {});
const byTpl = issues.reduce<Record<string, number>>((a, i) => { a[i.template] = (a[i.template] ?? 0) + 1; return a; }, {});

console.log("\n========== RESUMO ==========");
console.log(`Total issues: ${issues.length}`);
console.log("\nPor severidade:");
for (const [k, n] of Object.entries(bySeverity).sort((a,b) => b[1]-a[1])) console.log(`  ${k.padEnd(8)} ${n}`);
console.log("\nPor tipo:");
for (const [k, n] of Object.entries(byKind).sort((a,b) => b[1]-a[1])) console.log(`  ${k.padEnd(28)} ${n}`);
console.log("\nTop 15 templates com mais issues:");
Object.entries(byTpl).sort((a,b) => b[1]-a[1]).slice(0,15).forEach(([t,n]) => console.log(`  ${n.toString().padStart(3)}  ${t}`));

const critical = issues.filter((i) => i.severity === "CRITICO");
console.log(`\n========== CRÍTICAS (${critical.length}) — todas ==========`);
critical.slice(0, 60).forEach((i) => console.log(`  [${i.template}] ${i.meal} :: ${i.item} → ${i.kind} — ${i.detail}`));

const alto = issues.filter((i) => i.severity === "ALTO");
console.log(`\n========== ALTAS (${alto.length}) — primeiras 50 ==========`);
alto.slice(0, 50).forEach((i) => console.log(`  [${i.template}] ${i.meal} :: ${i.item} → ${i.kind} — ${i.detail}`));

const medio = issues.filter((i) => i.severity === "MEDIO");
console.log(`\n========== MÉDIAS (${medio.length}) — primeiras 25 ==========`);
medio.slice(0, 25).forEach((i) => console.log(`  [${i.template}] ${i.meal} :: ${i.item} → ${i.kind} — ${i.detail}`));

fs.writeFileSync("/tmp/qa-templates-report.json", JSON.stringify(issues, null, 2));
console.log(`\n📄 Relatório completo: /tmp/qa-templates-report.json (${issues.length} issues)`);

process.exit(0);
