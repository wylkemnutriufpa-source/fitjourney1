// Serializadores: template / dieta → HTML (PDF) e texto (WhatsApp).
import { escapeHtml } from "./share-utils";
import type { DietTemplate } from "./template-data";
import { orientacoesFor } from "./template-data";
import type { Meal, Patient, DietVariation } from "./mock-data";
import type { PlannerTemplate, PlannerMeal, PlannerMealOption } from "./meal-planner";
import { toPlannerTemplate, mealKcalFromOption } from "./meal-planner";

// ============ TEMPLATES ============

function itemsToText(opt: PlannerMealOption) {
  return opt.items.map((i) => `${i.name} — ${i.qty} ${i.unit}`).join("; ");
}

function renderMealHtml(m: PlannerMeal) {
  const mainItems = m.main.items
    .map(
      (i) =>
        `<li><strong>${escapeHtml(i.name)}</strong> — ${i.qty} ${escapeHtml(i.unit)} <span style="color:#666;font-family:ui-monospace,monospace;font-size:10.5px">(${i.kcal} kcal)</span></li>`,
    )
    .join("");
  const recipe = m.main.recipe
    ? `<p style="font-size:11px;color:#444;margin:6px 0 0;white-space:pre-wrap">📝 <em>Modo de preparo:</em>\n${escapeHtml(m.main.recipe)}</p>`
    : "";
  const eqs = m.equivalents
    .map(
      (e) =>
        `<li><strong>${escapeHtml(e.title)}</strong> — ${escapeHtml(itemsToText(e))} <span style="color:#666;font-family:ui-monospace,monospace;font-size:10.5px">(${mealKcalFromOption(e)} kcal)</span></li>`,
    )
    .join("");
  return `
<div class="meal">
  <div class="meal-h">
    <span><span class="meal-time">${escapeHtml(m.time)}</span> · ${escapeHtml(m.label)}</span>
    <span style="font-family:ui-monospace,monospace;color:#2563eb">${mealKcalFromOption(m.main)} kcal</span>
  </div>
  <h3 style="margin:6px 0 4px">${escapeHtml(m.main.title)}</h3>
  <ul>${mainItems}</ul>
  ${recipe}
  ${m.equivalents.length ? `<p style="font-size:11px;color:#666;margin:8px 0 2px">Opções equivalentes (substituem a refeição inteira):</p><ul>${eqs}</ul>` : ""}
</div>`;
}

export function templateToPrintHtml(
  t: DietTemplate | PlannerTemplate,
  extra?: { finalidade?: string },
): string {
  const tpl = toPlannerTemplate(t);
  const orient = (tpl.orientacoes ?? orientacoesFor(tpl)).trim();

  const meals = tpl.meals.map(renderMealHtml).join("");

  return `
<h1>${escapeHtml(tpl.name)}</h1>
<div class="meta">${escapeHtml(tpl.category)} · ${tpl.kcal} kcal · ${tpl.meals.length} refeições${extra?.finalidade ? ` · ${escapeHtml(extra.finalidade)}` : ""}</div>
<p>${escapeHtml(tpl.description)}</p>

<h2>Plano alimentar</h2>
${meals}

<h2>Orientações nutricionais</h2>
<div class="orientacoes">${escapeHtml(orient)}</div>`;
}

export function templateToWhatsText(
  t: DietTemplate | PlannerTemplate,
  extra?: { finalidade?: string },
): string {
  const tpl = toPlannerTemplate(t);
  const orient = (tpl.orientacoes ?? orientacoesFor(tpl)).trim();
  const head = `*${tpl.name}*\n_${tpl.category} · ${tpl.kcal} kcal_${extra?.finalidade ? `\nPaciente/uso: ${extra.finalidade}` : ""}\n`;
  const meals = tpl.meals
    .map((m) => {
      const items = m.main.items.map((i) => `   • ${i.name} — ${i.qty}${i.unit}`).join("\n");
      const recipe = m.main.recipe
        ? `\n  📝 _Modo de preparo:_\n${m.main.recipe.split("\n").map((l) => `     ${l}`).join("\n")}`
        : "";
      const eqs = m.equivalents.length
        ? "\n  _Opções equivalentes:_\n" +
          m.equivalents.map((e) => `     ◦ ${e.title} (${itemsToText(e)})`).join("\n")
        : "";
      return `\n*${m.time} · ${m.label}* _(${mealKcalFromOption(m.main)}kcal)_\n  ▸ *${m.main.title}*\n${items}${recipe}${eqs}`;
    })
    .join("");
  return `${head}\n📋 *PLANO ALIMENTAR*${meals}\n\n💡 *ORIENTAÇÕES NUTRICIONAIS*\n${orient}\n\n— Enviado via FitJourney`;
}

// ============ DIETAS DE PACIENTE (mock-data) ============

export function dietToPrintHtml(
  patient: Patient,
  variation: DietVariation,
  templateName: string,
  orientacoes: string,
): string {
  const meals = variation.meals
    .map((m) => {
      const items = m.items
        .map((i) => `<li>${escapeHtml(i.name)} — ${escapeHtml(i.qty)}</li>`)
        .join("");
      return `
<div class="meal">
  <div class="meal-h">
    <span><span class="meal-time">${escapeHtml(m.time)}</span> · ${escapeHtml(m.label)} — ${escapeHtml(m.title)}</span>
    <span style="font-family:ui-monospace,monospace;color:#2563eb">${m.kcal} kcal</span>
  </div>
  <ul>${items}</ul>
  <p style="font-size:10.5px;color:#666;margin:6px 0 0">P ${m.protein}g · C ${m.carbs}g · G ${m.fat}g</p>
</div>`;
    })
    .join("");

  return `
<h1>Plano alimentar — ${escapeHtml(patient.name)}</h1>
<div class="meta">${escapeHtml(templateName)} · ${escapeHtml(variation.label)} · Alvo ${variation.kcal} kcal · ${patient.weightKg}kg, ${patient.heightCm}cm, ${patient.age} anos</div>

<h2>Refeições</h2>
${meals}

<h2>Orientações nutricionais</h2>
<div class="orientacoes">${escapeHtml(orientacoes.trim())}</div>`;
}

export function dietToWhatsText(
  patient: Patient,
  variation: DietVariation,
  templateName: string,
  orientacoes: string,
): string {
  const meals = variation.meals
    .map((m) => {
      const items = m.items.map((i) => `   • ${i.name} (${i.qty})`).join("\n");
      return `\n*${m.time} · ${m.label}* — ${m.title} _(${m.kcal}kcal)_\n${items}`;
    })
    .join("");
  return `Olá, ${patient.name.split(" ")[0]}! 👋\nSegue seu plano alimentar:\n\n*${templateName} — ${variation.label}*\n_Alvo: ${variation.kcal} kcal_${meals}\n\n💡 *ORIENTAÇÕES NUTRICIONAIS*\n${orientacoes.trim()}\n\nQualquer dúvida me chame por aqui!\n— FitJourney`;
}
