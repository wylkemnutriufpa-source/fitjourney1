import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import type {
  PlannerTemplateV2,
  PlannerFoodItemV2,
  PlannerMealV2,
  ItemMeasureV2,
  ItemSubstitutionV2,
  ScaleGroupV2,
  DayIdV2,
} from "@/lib/v2/template.v2.types";
import { DAY_LABEL_V2 } from "@/lib/v2/template.v2.types";
import { espHipertrofiaV2Piloto } from "@/lib/v2/template-data.v2";
import { validateMatrix } from "@/lib/v2/matrix.v2";
import { buildSnapshotV2 } from "@/lib/v2/snapshot/build";
import { saveSnapshot } from "@/lib/v2/snapshot/storage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// haptics leves — silencioso em desktop / quando indisponível
function haptic(ms = 10) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      (navigator as Navigator).vibrate?.(ms);
    }
  } catch {
    /* ignore */
  }
}

// EDITOR V2 — Atelier do nutricionista (piloto, isolado).
// Estado interno (React). NUNCA persiste em storage.
// Única ponte com o preview: buildSnapshotV2 → saveSnapshot.

export const Route = createFileRoute("/_authenticated/templates-v2-editor")({
  component: TemplateV2Editor,
});

let _uid = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++_uid}`;

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

// --- Componente raiz -------------------------------------------------------

function TemplateV2Editor() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PlannerTemplateV2>(() =>
    deepClone(espHipertrofiaV2Piloto),
  );
  const [activeDayId, setActiveDayId] = useState<DayIdV2>(draft.days[0].id);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(
    draft.days[0].meals[0]?.id ?? null,
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const day = draft.days.find((d) => d.id === activeDayId)!;

  // ----- ações ------------------------------------------------------------

  const update = (next: PlannerTemplateV2) => setDraft(next);

  const updateDay = (mut: (d: typeof day) => void) => {
    const next = deepClone(draft);
    const idx = next.days.findIndex((d) => d.id === activeDayId);
    mut(next.days[idx]);
    update(next);
  };

  const addMeal = () => {
    const newMeal: PlannerMealV2 = {
      id: uid("m"),
      time: "12:00",
      label: "Nova refeição",
      items: [],
    };
    updateDay((d) => {
      d.meals.push(newMeal);
    });
    setExpandedMealId(newMeal.id);
  };

  const removeMeal = (mealId: string) => {
    updateDay((d) => {
      d.meals = d.meals.filter((m) => m.id !== mealId);
    });
  };

  const updateMeal = (mealId: string, mut: (m: PlannerMealV2) => void) => {
    updateDay((d) => {
      const m = d.meals.find((mm) => mm.id === mealId);
      if (m) mut(m);
    });
  };

  const addItem = (mealId: string) => {
    const newItem: PlannerFoodItemV2 = {
      id: uid("it"),
      foodKey: "novo_alimento",
      name: "Novo alimento",
      qty: 100,
      unit: "g",
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      scaleGroup: "mixed",
    };
    updateMeal(mealId, (m) => m.items.push(newItem));
    setExpandedItemId(newItem.id);
  };

  const removeItem = (mealId: string, itemId: string) => {
    updateMeal(mealId, (m) => {
      m.items = m.items.filter((it) => it.id !== itemId);
    });
  };

  const updateItem = (
    mealId: string,
    itemId: string,
    mut: (it: PlannerFoodItemV2) => void,
  ) => {
    updateMeal(mealId, (m) => {
      const it = m.items.find((i) => i.id === itemId);
      if (it) mut(it);
    });
  };

  // ----- snapshot ---------------------------------------------------------

  const generateSnapshot = () => {
    try {
      const snap = buildSnapshotV2(draft);
      saveSnapshot(snap);
      toast.success("Snapshot V2 gerado e salvo no storage.");
      void navigate({ to: "/my-plan-v2-preview" });
    } catch (e) {
      const err = e as { issues?: Array<{ path: (string | number)[]; message: string }>; message?: string };
      const msg =
        err.issues
          ?.map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" | ") ?? err.message ?? "Erro desconhecido";
      toast.error("Snapshot inválido", { description: msg });
    }
  };

  const downloadSnapshot = () => {
    try {
      const snap = buildSnapshotV2(draft);
      const blob = new Blob([JSON.stringify(snap, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${snap.id}.snapshot.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Falha ao gerar snapshot", {
        description: (e as Error).message,
      });
    }
  };

  // ----- totais do dia (info, NÃO entra no snapshot) ----------------------

  const dayKcal = useMemo(
    () =>
      day.meals.reduce(
        (sum, m) => sum + m.items.reduce((s, it) => s + it.kcal, 0),
        0,
      ),
    [day],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6 pb-24 sm:pb-6">
      <header className="space-y-2">
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <strong>PILOTO V2 — Editor isolado.</strong> Não toca produção. O
          preview lê apenas o Snapshot V2 serializado.
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate">{draft.name}</h1>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {draft.description}
            </p>
          </div>
        </div>
      </header>

      {/* Barra de ações sticky (mobile-first, desce naturalmente em desktop) */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/85 backdrop-blur border-b border-border">
        <div className="flex gap-2 justify-end flex-wrap">
          <button
            onClick={() => {
              haptic();
              downloadSnapshot();
            }}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-2 text-sm hover:bg-muted min-h-11"
          >
            <Download className="h-4 w-4" /> snapshot.json
          </button>
          <button
            onClick={() => {
              haptic(20);
              generateSnapshot();
            }}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 min-h-11"
          >
            Gerar Snapshot → Preview <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1.5">
        {draft.days.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              haptic();
              setActiveDayId(d.id);
              setExpandedMealId(null);
              setExpandedItemId(null);
            }}
            className={`rounded px-3 py-1.5 text-xs font-medium border min-h-9 ${
              d.id === activeDayId
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {DAY_LABEL_V2[d.id]}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between rounded border border-border bg-card px-3 py-2 text-sm">
        <span className="font-medium">{day.label}</span>
        <span className="text-muted-foreground">
          {day.meals.length} refeições · {dayKcal} kcal
        </span>
      </div>

      <div className="space-y-3">
        {day.meals.map((meal) => (
          <MealBlock
            key={meal.id}
            meal={meal}
            expanded={expandedMealId === meal.id}
            onToggle={() => {
              haptic();
              setExpandedMealId(expandedMealId === meal.id ? null : meal.id);
            }}
            onRemove={() => removeMeal(meal.id)}
            onChange={(mut) => updateMeal(meal.id, mut)}
            onAddItem={() => {
              haptic();
              addItem(meal.id);
            }}
            onRemoveItem={(itemId) => removeItem(meal.id, itemId)}
            onUpdateItem={(itemId, mut) => updateItem(meal.id, itemId, mut)}
            expandedItemId={expandedItemId}
            setExpandedItemId={setExpandedItemId}
          />
        ))}
        <button
          onClick={addMeal}
          className="hidden sm:inline-flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Adicionar refeição
        </button>
      </div>

      {/* FAB mobile — adicionar refeição sempre acessível */}
      <button
        onClick={() => {
          haptic(15);
          addMeal();
        }}
        aria-label="Adicionar refeição"
        className="sm:hidden fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg active:scale-95 transition-transform"
      >
        <Plus className="h-5 w-5" /> Refeição
      </button>
    </div>
  );
}

// --- MealBlock ------------------------------------------------------------

function MealBlock({
  meal,
  expanded,
  onToggle,
  onRemove,
  onChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  expandedItemId,
  setExpandedItemId,
}: {
  meal: PlannerMealV2;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (mut: (m: PlannerMealV2) => void) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, mut: (it: PlannerFoodItemV2) => void) => void;
  expandedItemId: string | null;
  setExpandedItemId: (id: string | null) => void;
}) {
  const totalKcal = meal.items.reduce((s, i) => s + i.kcal, 0);

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <header className="flex items-center gap-2 p-3">
        <button
          onClick={onToggle}
          className="p-1 hover:bg-muted rounded"
          aria-label="expandir"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <input
          value={meal.time}
          onChange={(e) => onChange((m) => (m.time = e.target.value))}
          className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
        />
        <input
          value={meal.label}
          onChange={(e) => onChange((m) => (m.label = e.target.value))}
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm font-medium"
        />
        <span className="text-xs text-muted-foreground shrink-0">
          {meal.items.length} itens · {totalKcal} kcal
        </span>
        <button
          onClick={onRemove}
          className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
          aria-label="remover refeição"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          <label className="block text-xs">
            <span className="text-muted-foreground">Observação da refeição</span>
            <input
              value={meal.notes ?? ""}
              onChange={(e) =>
                onChange((m) => (m.notes = e.target.value || undefined))
              }
              placeholder="Ex.: consumir até 30 min após o preparo."
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground">Imagem (heroKey)</span>
            <input
              value={meal.heroKey ?? ""}
              onChange={(e) =>
                onChange((m) => (m.heroKey = e.target.value || undefined))
              }
              placeholder="ex.: frango-grelhado"
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono"
            />
          </label>

          <div className="space-y-2">
            {meal.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                expanded={expandedItemId === item.id}
                onToggle={() =>
                  setExpandedItemId(
                    expandedItemId === item.id ? null : item.id,
                  )
                }
                onRemove={() => onRemoveItem(item.id)}
                onChange={(mut) => onUpdateItem(item.id, mut)}
              />
            ))}
            <button
              onClick={onAddItem}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-3 w-3" /> Adicionar alimento
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// --- ItemRow + ItemEditor -------------------------------------------------

function ItemRow({
  item,
  expanded,
  onToggle,
  onRemove,
  onChange,
}: {
  item: PlannerFoodItemV2;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (mut: (it: PlannerFoodItemV2) => void) => void;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background">
      <div className="flex items-center gap-2 p-2">
        <button onClick={onToggle} className="p-1 hover:bg-muted rounded">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {item.qty} {item.unit} · {item.kcal} kcal
        </span>
        <button
          onClick={onRemove}
          className="p-1 text-destructive hover:bg-destructive/10 rounded"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && <ItemEditor item={item} onChange={onChange} />}
    </div>
  );
}

function ItemEditor({
  item,
  onChange,
}: {
  item: PlannerFoodItemV2;
  onChange: (mut: (it: PlannerFoodItemV2) => void) => void;
}) {
  return (
    <div className="border-t border-border/60 p-3 space-y-3">
      {/* Base */}
      <div className="grid grid-cols-12 gap-2 text-xs">
        <Field label="Nome" className="col-span-5">
          <input
            value={item.name}
            onChange={(e) => onChange((it) => (it.name = e.target.value))}
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </Field>
        <Field label="foodKey" className="col-span-3">
          <input
            value={item.foodKey}
            onChange={(e) => onChange((it) => (it.foodKey = e.target.value))}
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono"
          />
        </Field>
        <Field label="Grupo" className="col-span-2">
          <select
            value={item.scaleGroup}
            onChange={(e) =>
              onChange((it) => (it.scaleGroup = e.target.value as ScaleGroupV2))
            }
            className="w-full rounded border border-border bg-background px-1 py-1 text-sm"
          >
            <option value="protein">proteína</option>
            <option value="carb">carbo</option>
            <option value="fat">gordura</option>
            <option value="mixed">misto</option>
          </select>
        </Field>
        <Field label="Qtd" className="col-span-1">
          <input
            type="number"
            value={item.qty}
            onChange={(e) =>
              onChange((it) => (it.qty = Number(e.target.value) || 0))
            }
            className="w-full rounded border border-border bg-background px-1 py-1 text-sm"
          />
        </Field>
        <Field label="Un" className="col-span-1">
          <input
            value={item.unit}
            onChange={(e) => onChange((it) => (it.unit = e.target.value))}
            className="w-full rounded border border-border bg-background px-1 py-1 text-sm"
          />
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        <Field label="kcal">
          <input
            type="number"
            value={item.kcal}
            onChange={(e) =>
              onChange((it) => (it.kcal = Number(e.target.value) || 0))
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </Field>
        <Field label="prot (g)">
          <input
            type="number"
            step="0.1"
            value={item.proteinG}
            onChange={(e) =>
              onChange((it) => (it.proteinG = Number(e.target.value) || 0))
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </Field>
        <Field label="carb (g)">
          <input
            type="number"
            step="0.1"
            value={item.carbG}
            onChange={(e) =>
              onChange((it) => (it.carbG = Number(e.target.value) || 0))
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </Field>
        <Field label="gord (g)">
          <input
            type="number"
            step="0.1"
            value={item.fatG}
            onChange={(e) =>
              onChange((it) => (it.fatG = Number(e.target.value) || 0))
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </Field>
      </div>

      <NotesField item={item} onChange={onChange} />
      <MeasuresEditor item={item} onChange={onChange} />
      <SubstitutionsEditor item={item} onChange={onChange} />
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function NotesField({
  item,
  onChange,
}: {
  item: PlannerFoodItemV2;
  onChange: (mut: (it: PlannerFoodItemV2) => void) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground">Observação do alimento</span>
      <textarea
        value={item.notes ?? ""}
        onChange={(e) =>
          onChange((it) => (it.notes = e.target.value || undefined))
        }
        rows={2}
        placeholder="Ex.: preferir grelhado, evitar frituras."
        className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
      />
    </label>
  );
}

// --- MeasuresEditor -------------------------------------------------------

function MeasuresEditor({
  item,
  onChange,
}: {
  item: PlannerFoodItemV2;
  onChange: (mut: (it: PlannerFoodItemV2) => void) => void;
}) {
  const measures = item.measures ?? [];

  const add = () => {
    onChange((it) => {
      it.measures = [...(it.measures ?? []), { label: "", fromCatalog: false }];
    });
  };
  const remove = (idx: number) => {
    onChange((it) => {
      it.measures = (it.measures ?? []).filter((_, i) => i !== idx);
      if (it.measures.length === 0) it.measures = undefined;
    });
  };
  const upd = (idx: number, mut: (m: ItemMeasureV2) => void) => {
    onChange((it) => {
      if (!it.measures) return;
      mut(it.measures[idx]);
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          Medidas caseiras
        </span>
        <button
          onClick={add}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> medida
        </button>
      </div>
      {measures.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Nenhuma medida adicionada.
        </p>
      )}
      {measures.map((m, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <input
            value={m.label}
            onChange={(e) => upd(idx, (mm) => (mm.label = e.target.value))}
            placeholder="ex.: 1 filé médio"
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
          />
          <input
            type="number"
            value={m.gramsEquivalent ?? ""}
            onChange={(e) =>
              upd(idx, (mm) => {
                const v = e.target.value;
                mm.gramsEquivalent = v === "" ? undefined : Number(v);
              })
            }
            placeholder="g"
            className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
          />
          <button
            onClick={() => remove(idx)}
            className="p-1 text-destructive hover:bg-destructive/10 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// --- SubstitutionsEditor (com guarda matriz) ------------------------------

function SubstitutionsEditor({
  item,
  onChange,
}: {
  item: PlannerFoodItemV2;
  onChange: (mut: (it: PlannerFoodItemV2) => void) => void;
}) {
  const subs = item.substitutions ?? [];

  const add = () => {
    const newSub: ItemSubstitutionV2 = {
      foodKey: "novo_alimento",
      name: "Nova substituição",
      qty: 100,
      unit: "g",
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      scaleGroup: item.scaleGroup,
    };
    onChange((it) => {
      it.substitutions = [...(it.substitutions ?? []), newSub];
    });
  };
  const remove = (idx: number) => {
    onChange((it) => {
      it.substitutions = (it.substitutions ?? []).filter((_, i) => i !== idx);
      if (it.substitutions.length === 0) it.substitutions = undefined;
    });
  };
  const upd = (idx: number, mut: (s: ItemSubstitutionV2) => void) => {
    onChange((it) => {
      if (!it.substitutions) return;
      mut(it.substitutions[idx]);
    });
  };

  const tryChangeGroup = (idx: number, group: ScaleGroupV2) => {
    const result = validateMatrix(item.scaleGroup, group);
    if (!result.ok) {
      toast.error("Substituição bloqueada pela matriz", {
        description: result.reason,
      });
      return;
    }
    upd(idx, (s) => (s.scaleGroup = group));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          Substituições <span className="normal-case text-[10px]">(matriz: {item.scaleGroup})</span>
        </span>
        <button
          onClick={add}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> substituição
        </button>
      </div>
      {subs.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Nenhuma substituição.
        </p>
      )}
      {subs.map((s, idx) => {
        const matrix = validateMatrix(item.scaleGroup, s.scaleGroup);
        return (
          <div
            key={idx}
            className={`rounded border p-2 space-y-1.5 ${
              matrix.ok
                ? "border-border/60 bg-background"
                : "border-destructive/60 bg-destructive/5"
            }`}
          >
            {!matrix.ok && (
              <p className="flex items-center gap-1 text-[11px] text-destructive">
                <AlertTriangle className="h-3 w-3" /> {matrix.reason}
              </p>
            )}
            <div className="grid grid-cols-12 gap-1.5 text-xs">
              <input
                value={s.name}
                onChange={(e) => upd(idx, (ss) => (ss.name = e.target.value))}
                placeholder="nome"
                className="col-span-5 rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <input
                value={s.foodKey}
                onChange={(e) =>
                  upd(idx, (ss) => (ss.foodKey = e.target.value))
                }
                placeholder="foodKey"
                className="col-span-3 rounded border border-border bg-background px-2 py-1 text-sm font-mono"
              />
              <select
                value={s.scaleGroup}
                onChange={(e) =>
                  tryChangeGroup(idx, e.target.value as ScaleGroupV2)
                }
                className="col-span-2 rounded border border-border bg-background px-1 py-1 text-sm"
              >
                <option value="protein">prot</option>
                <option value="carb">carb</option>
                <option value="fat">gord</option>
                <option value="mixed">misto</option>
              </select>
              <input
                type="number"
                value={s.qty}
                onChange={(e) =>
                  upd(idx, (ss) => (ss.qty = Number(e.target.value) || 0))
                }
                className="col-span-1 rounded border border-border bg-background px-1 py-1 text-sm"
              />
              <input
                value={s.unit}
                onChange={(e) => upd(idx, (ss) => (ss.unit = e.target.value))}
                className="col-span-1 rounded border border-border bg-background px-1 py-1 text-sm"
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              <NumField
                label="kcal"
                value={s.kcal}
                onChange={(v) => upd(idx, (ss) => (ss.kcal = v))}
              />
              <NumField
                label="P"
                value={s.proteinG}
                onChange={(v) => upd(idx, (ss) => (ss.proteinG = v))}
              />
              <NumField
                label="C"
                value={s.carbG}
                onChange={(v) => upd(idx, (ss) => (ss.carbG = v))}
              />
              <NumField
                label="G"
                value={s.fatG}
                onChange={(v) => upd(idx, (ss) => (ss.fatG = v))}
              />
              <input
                value={s.note ?? ""}
                onChange={(e) =>
                  upd(idx, (ss) => (ss.note = e.target.value || undefined))
                }
                placeholder="obs."
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => remove(idx)}
                className="text-xs text-destructive hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> remover
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-muted-foreground text-[10px] w-6">{label}</span>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="flex-1 rounded border border-border bg-background px-1 py-1 text-sm"
      />
    </label>
  );
}
