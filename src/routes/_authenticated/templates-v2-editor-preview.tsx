import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, MoreVertical, X, Pencil, Image as ImageIcon } from "lucide-react";

// MOCKUP VISUAL ESTÁTICO — Template Builder V2.
// ZERO lógica real. ZERO persistência. ZERO schema. ZERO motor.
// Só serve para o nutricionista validar a EXPERIÊNCIA de edição.
// Rota oculta, sem link em nav. Acesso manual.

export const Route = createFileRoute("/_authenticated/templates-v2-editor-preview")({
  component: EditorMockup,
});

type MealMock = {
  id: string;
  time: string;
  label: string;
  items: { id: string; name: string; qty: string; kcal: number }[];
};

const MOCK_MEALS: MealMock[] = [
  {
    id: "m1", time: "07:00", label: "Café da manhã",
    items: [
      { id: "i1", name: "Pão francês", qty: "50 g", kcal: 135 },
      { id: "i2", name: "Ovo inteiro", qty: "2 un", kcal: 140 },
      { id: "i3", name: "Mamão", qty: "150 g", kcal: 60 },
    ],
  },
  {
    id: "m2", time: "12:30", label: "Almoço",
    items: [
      { id: "i4", name: "Frango grelhado", qty: "180 g", kcal: 297 },
      { id: "i5", name: "Arroz integral", qty: "120 g", kcal: 156 },
      { id: "i6", name: "Feijão preto", qty: "80 g", kcal: 60 },
      { id: "i7", name: "Salada verde", qty: "livre", kcal: 0 },
    ],
  },
  { id: "m3", time: "16:00", label: "Lanche da tarde", items: [] },
  { id: "m4", time: "20:00", label: "Jantar", items: [] },
  { id: "m5", time: "22:00", label: "Ceia", items: [] },
];

function EditorMockup() {
  const [openMeals, setOpenMeals] = useState<Record<string, boolean>>({ m1: true, m2: true });
  const [openItem, setOpenItem] = useState<string | null>("i4"); // frango aberto por padrão

  const toggleMeal = (id: string) =>
    setOpenMeals((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <div className="rounded-md border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
        <strong>MOCKUP VISUAL — Template Builder V2.</strong> Nenhum botão salva nada.
        Nenhum dado é persistido. Serve apenas para validar a UX de edição
        antes de aprovar a implementação real.
      </div>

      {/* Header do template */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Esportivo — Hipertrofia (V2)</h1>
          <p className="text-sm text-muted-foreground">
            Meta: 2800 kcal · P 180 / C 320 / G 80
          </p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5">esportivo</span>
            <span className="rounded-full bg-muted px-2 py-0.5">hipertrofia</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm">Salvar rascunho</button>
          <button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm">
            Publicar
          </button>
        </div>
      </div>

      {/* Lista de refeições */}
      {MOCK_MEALS.map((meal) => {
        const open = !!openMeals[meal.id];
        return (
          <section key={meal.id} className="rounded-lg border border-border bg-card">
            <header
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
              onClick={() => toggleMeal(meal.id)}
            >
              <div className="flex items-center gap-2">
                {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span className="font-medium">
                  {meal.time} — {meal.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({meal.items.length} {meal.items.length === 1 ? "item" : "itens"})
                </span>
              </div>
              <button
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="size-3" /> item
              </button>
            </header>

            {open && (
              <ul className="border-t divide-y">
                {meal.items.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground italic">
                    Nenhum item. Clique em <strong>+ item</strong> para adicionar.
                  </li>
                )}
                {meal.items.map((item) => {
                  const expanded = openItem === item.id;
                  return (
                    <li key={item.id}>
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20"
                        onClick={() => setOpenItem(expanded ? null : item.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            · {item.qty} · {item.kcal} kcal
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="rounded-md p-1 hover:bg-muted">
                            <Pencil className="size-4" />
                          </button>
                          <button className="rounded-md p-1 hover:bg-muted">
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                      </div>

                      {expanded && <ItemEditorMock name={item.name} qty={item.qty} kcal={item.kcal} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <button className="w-full rounded-md border border-dashed py-3 text-sm text-muted-foreground hover:bg-muted/30">
        + adicionar refeição
      </button>
    </div>
  );
}

function ItemEditorMock({ name, qty, kcal }: { name: string; qty: string; kcal: number }) {
  return (
    <div className="border-t bg-muted/10 p-4 space-y-4">
      {/* Básicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Field label="Nome" defaultValue={name} className="col-span-2" />
        <Field label="Quantidade" defaultValue={qty.split(" ")[0]} />
        <Field label="Unidade" defaultValue={qty.split(" ")[1] ?? "g"} />
        <div className="col-span-2 md:col-span-4">
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Grupo</p>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1"><input type="radio" name={`g-${name}`} /> carb</label>
            <label className="flex items-center gap-1"><input type="radio" name={`g-${name}`} defaultChecked /> protein</label>
            <label className="flex items-center gap-1"><input type="radio" name={`g-${name}`} /> fat</label>
            <label className="flex items-center gap-1"><input type="radio" name={`g-${name}`} /> mixed</label>
          </div>
        </div>
        <Field label="P (g)" defaultValue="40" />
        <Field label="C (g)" defaultValue="0" />
        <Field label="G (g)" defaultValue="12" />
        <Field label="kcal" defaultValue={String(kcal)} />
      </div>

      {/* Medidas caseiras */}
      <Section title="Medidas caseiras" action="+ adicionar">
        <div className="flex flex-wrap gap-2">
          <Chip>1 filé médio (≈150 g)</Chip>
          <Chip>1 filé grande (≈200 g)</Chip>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded-md border px-2 py-1 text-sm"
            placeholder="digite uma medida livre..."
          />
          <button className="rounded-md border px-3 py-1 text-sm">salvar</button>
        </div>
      </Section>

      {/* Substituições */}
      <Section title="Substituições" action="+ buscar no catálogo">
        <ul className="text-sm space-y-1">
          <li className="flex items-center justify-between rounded-md border px-2 py-1">
            <span>Patinho 130 g · 180 kcal · <em className="text-muted-foreground">protein</em></span>
            <div className="flex gap-1">
              <button className="rounded p-1 hover:bg-muted"><Pencil className="size-3" /></button>
              <button className="rounded p-1 hover:bg-muted"><X className="size-3" /></button>
            </div>
          </li>
          <li className="flex items-center justify-between rounded-md border px-2 py-1">
            <span>Tilápia 200 g · 200 kcal · <em className="text-muted-foreground">protein</em></span>
            <div className="flex gap-1">
              <button className="rounded p-1 hover:bg-muted"><Pencil className="size-3" /></button>
              <button className="rounded p-1 hover:bg-muted"><X className="size-3" /></button>
            </div>
          </li>
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">
          Matriz V2 só permite protein ↔ protein (ou mixed).
        </p>
      </Section>

      {/* Observações */}
      <Section title="Observações">
        <textarea
          className="w-full rounded-md border px-2 py-1 text-sm"
          rows={2}
          defaultValue="Peso cru. Grelhar sem óleo."
        />
      </Section>

      {/* Imagem */}
      <Section title="Imagem">
        <div className="flex items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-md border bg-muted">
            <ImageIcon className="size-6 text-muted-foreground" />
          </div>
          <button className="rounded-md border px-3 py-1 text-sm">trocar imagem</button>
        </div>
      </Section>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <button className="rounded-md border px-3 py-1.5 text-sm">cancelar</button>
        <button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm">
          salvar item
        </button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, className = "" }: { label: string; defaultValue: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">{label}</p>
      <input className="w-full rounded-md border px-2 py-1 text-sm" defaultValue={defaultValue} />
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
        {action && (
          <button className="text-xs text-primary hover:underline">{action}</button>
        )}
      </div>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
      {children}
      <button className="hover:text-destructive"><X className="size-3" /></button>
    </span>
  );
}
