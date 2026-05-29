import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getPatient, templates, type Meal } from "@/lib/mock-data";
import { Plus, Save, Printer, MessageCircle, X, ArrowRightLeft, Clock, ClipboardList } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendShareDialog } from "@/components/SendShareDialog";
import { dietToPrintHtml, dietToWhatsText } from "@/lib/diet-serializers";
import { printHTML } from "@/lib/share-utils";
import { orientacoesFor } from "@/lib/template-data";

/** Mapa mock-templates → ids do sistema, para puxar orientações específicas. */
const MOCK_TO_SYSTEM_ID: Record<string, string> = {
  "t-end-hc": "esp-endurance",
  "t-hyp-2": "esp-hipertrofia",
  "t-cut": "esp-cutting",
};


export const Route = createFileRoute("/patients/$id/diet")({
  head: () => ({ meta: [{ title: "Dieta — FitJourney" }] }),
  loader: ({ params }) => {
    const patient = getPatient(params.id);
    if (!patient) throw notFound();
    return { patient };
  },
  component: DietBuilder,
});

function DietBuilder() {
  const { patient: p } = Route.useLoaderData();
  const [templateId, setTemplateId] = useState(templates[0].id);
  const template = templates.find((t) => t.id === templateId)!;
  const [variationId, setVariationId] = useState(template.variations[0].id);
  const variation = template.variations.find((v) => v.id === variationId) ?? template.variations[0];
  const [openMeal, setOpenMeal] = useState<Meal | null>(null);
  const [tab, setTab] = useState<"refeicoes" | "orientacoes">("refeicoes");
  const [orientacoes, setOrientacoes] = useState<string>(() =>
    orientacoesFor({ id: MOCK_TO_SYSTEM_ID[templateId] ?? templateId, category: "Esportivo" }),
  );

  const [shareOpen, setShareOpen] = useState(false);

  const totals = variation.meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      p: acc.p + m.protein,
      c: acc.c + m.carbs,
      f: acc.f + m.fat,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );

  const printHtml = dietToPrintHtml(p, variation, template.name, orientacoes);
  const whatsText = dietToWhatsText(p, variation, template.name, orientacoes);

  return (
    <AppShell
      header={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printHTML({ title: `Plano — ${p.name}`, html: printHtml })}
          >
            <Printer className="size-3.5" />
            Imprimir / PDF
          </Button>
          <Button
            size="sm"
            onClick={() => setShareOpen(true)}
            className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
          >
            <MessageCircle className="size-3.5" />
            WhatsApp
          </Button>
          <Button size="sm">
            <Save className="size-3.5" />
            Salvar Dieta
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {p.name} · Alvo {p.tdee} kcal
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Montagem da Dieta</h1>
          </div>
        </div>

        {/* Tabs: Refeições / Orientações */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("refeicoes")}
            className={
              "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors " +
              (tab === "refeicoes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Refeições
            <span className="text-[10px] font-mono opacity-60">{variation.meals.length}</span>
          </button>
          <button
            onClick={() => setTab("orientacoes")}
            className={
              "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors " +
              (tab === "orientacoes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <ClipboardList className="size-3.5" />
            Orientações Nutricionais
          </button>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Template
                </p>
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    const t = templates.find((x) => x.id === e.target.value)!;
                    setVariationId(t.variations[0].id);
                  }}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">{template.description}</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Variação Calórica
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {template.variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariationId(v.id)}
                      className={
                        "px-3 py-1.5 text-xs font-medium rounded border " +
                        (variationId === v.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {v.label} · {v.kcal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tab === "refeicoes" && (
              <div className="relative border-l border-border ml-3 pl-8 space-y-6">
                {variation.meals.map((m, i) => (
                  <div key={m.id + i} className="relative">
                    <div
                      className={
                        "absolute -left-[37px] top-2 size-3 rounded-full ring-4 ring-background " +
                        (i === 0 ? "bg-primary" : "bg-border")
                      }
                    />
                    <button
                      onClick={() => setOpenMeal(m)}
                      className="w-full text-left bg-surface border border-border rounded-lg p-5 hover:border-primary/40 transition-colors group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Clock className="size-3" />
                            {m.time} · {m.label}
                          </p>
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {m.title}
                          </h4>
                        </div>
                        <span className="text-sm font-mono text-primary whitespace-nowrap">
                          {m.kcal} kcal
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        {m.items.map((it) => `${it.qty} ${it.name}`).join(" · ")}
                      </p>
                      <div className="flex gap-6 mt-4 pt-3 border-t border-border">
                        {[
                          ["Prot", m.protein],
                          ["Carbs", m.carbs],
                          ["Gord", m.fat],
                        ].map(([k, v]) => (
                          <div key={k as string} className="space-y-0.5">
                            <span className="text-[9px] font-mono uppercase text-muted-foreground">
                              {k}
                            </span>
                            <p className="text-xs font-bold font-mono">{v}g</p>
                          </div>
                        ))}
                        <div className="ml-auto text-[10px] font-mono uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <ArrowRightLeft className="size-3" />
                          {m.substitutions.length} substituições
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                <div className="relative">
                  <div className="absolute -left-[34px] top-2 size-2 rounded-full bg-border" />
                  <button className="w-full border border-dashed border-border rounded-lg py-6 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center gap-2">
                    <Plus className="size-3.5" />
                    Adicionar Refeição
                  </button>
                </div>
              </div>
            )}

            {tab === "orientacoes" && (
              <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Orientações Nutricionais
                    </p>
                    <h3 className="text-lg font-semibold mt-0.5">
                      Vai junto no PDF e no WhatsApp
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOrientacoes(defaultOrientacoes("Esportivo"))}
                  >
                    Restaurar padrão
                  </Button>
                </div>
                <Textarea
                  value={orientacoes}
                  onChange={(e) => setOrientacoes(e.target.value)}
                  className="min-h-[420px] font-mono text-xs leading-relaxed"
                  placeholder="Hidratação, mastigação, evitar ultraprocessados, horários, suplementação..."
                />
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="sticky top-24 space-y-4">
              <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Totais do dia
                </p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-primary uppercase">Kcal</span>
                  <span className="text-3xl font-bold font-mono text-primary">{totals.kcal}</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (totals.kcal / p.tdee) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground">
                  Alvo {p.tdee} · {totals.kcal > p.tdee ? "+" : ""}
                  {totals.kcal - p.tdee} kcal
                </p>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  {[
                    ["Prot", totals.p, "emerald-400"],
                    ["Carbs", totals.c, "primary"],
                    ["Gord", totals.f, "amber-400"],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <p className="text-[9px] font-mono uppercase text-muted-foreground">{k}</p>
                      <p className="text-sm font-bold font-mono mt-0.5">{v}g</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-dashed border-border rounded-lg p-4 text-[11px] text-muted-foreground font-mono leading-relaxed">
                Alterar a refeição principal atualiza automaticamente as variações equivalentes do template.
              </div>
            </div>
          </aside>
        </div>
      </div>

      {openMeal && <SubstitutionModal meal={openMeal} onClose={() => setOpenMeal(null)} />}
      <SendShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={`Enviar plano para ${p.name}`}
        defaultMessage={whatsText}
        printHtml={printHtml}
        printTitle={`Plano — ${p.name}`}
      />
    </AppShell>

  );
}

function SubstitutionModal({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start p-6 border-b border-border sticky top-0 bg-surface">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {meal.time} · {meal.label}
            </p>
            <h3 className="text-2xl font-bold mt-1">{meal.title}</h3>
            <p className="text-sm font-mono text-primary mt-1">
              {meal.kcal} kcal · P {meal.protein}g · C {meal.carbs}g · G {meal.fat}g
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 grid place-items-center rounded hover:bg-background text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
              Refeição Principal
            </p>
            <div className="bg-background border border-primary/30 rounded-lg p-4 space-y-2">
              {meal.items.map((it) => (
                <div key={it.name} className="flex justify-between text-sm">
                  <span>{it.name}</span>
                  <span className="font-mono text-muted-foreground">{it.qty}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Substituições Equivalentes ({meal.substitutions.length})
            </p>
            {meal.substitutions.map((sub, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-4 space-y-2 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Opção {String.fromCharCode(65 + i)}
                  </span>
                  <button className="text-[10px] font-mono uppercase text-primary hover:underline">
                    Aplicar
                  </button>
                </div>
                {sub.map((it) => (
                  <div key={it.name} className="flex justify-between text-sm">
                    <span>{it.name}</span>
                    <span className="font-mono text-muted-foreground">{it.qty}</span>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
