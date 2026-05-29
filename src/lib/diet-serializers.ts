// Serializadores: template / dieta → HTML (PDF) e texto (WhatsApp).
import { escapeHtml } from "./share-utils";
import type { DietTemplate } from "./template-data";
import { defaultOrientacoes } from "./template-data";
import type { Meal, Patient, DietVariation } from "./mock-data";

// ============ TEMPLATES ============

export function templateToPrintHtml(t: DietTemplate, extra?: { finalidade?: string }): string {
  const orient = (t.orientacoes ?? defaultOrientacoes(t.category)).trim();
  const meals = t.meals
    .map((m) => {
      const eqs = m.equivalents
        .map((e) => `<li>${escapeHtml(e.name)} — ${e.qty} ${escapeHtml(e.unit)}</li>`)
        .join("");
      return `
<div class="meal">
  <div class="meal-h">
    <span><span class="meal-time">${escapeHtml(m.time)}</span> · ${escapeHtml(m.label)}</span>
  </div>
  <h3>${escapeHtml(m.main.name)} — ${m.main.qty} ${escapeHtml(m.main.unit)}</h3>
  ${m.equivalents.length ? `<p style="font-size:11px;color:#666;margin:4px 0 2px">Substituições equivalentes:</p><ul>${eqs}</ul>` : ""}
</div>`;
    })
    .join("");

  return `
<h1>${escapeHtml(t.name)}</h1>
<div class="meta">${escapeHtml(t.category)} · ${t.kcal} kcal · ${t.meals.length} refeições${extra?.finalidade ? ` · ${escapeHtml(extra.finalidade)}` : ""}</div>
<p>${escapeHtml(t.description)}</p>

<h2>Plano alimentar</h2>
${meals}

<h2>Orientações nutricionais</h2>
<div class="orientacoes">${escapeHtml(orient)}</div>`;
}

export function templateToWhatsText(t: DietTemplate, extra?: { finalidade?: string }): string {
  const orient = (t.orientacoes ?? defaultOrientacoes(t.category)).trim();
  const head = `*${t.name}*\n_${t.category} · ${t.kcal} kcal_${extra?.finalidade ? `\nPaciente/uso: ${extra.finalidade}` : ""}\n`;
  const meals = t.meals
    .map((m) => {
      const eqs = m.equivalents.length
        ? "\n  _Substituições:_ " +
          m.equivalents.map((e) => `${e.name} (${e.qty}${e.unit})`).join("; ")
        : "";
      return `\n*${m.time} · ${m.label}*\n• ${m.main.name} — ${m.main.qty}${m.main.unit}${eqs}`;
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
