// Nutri — "Plano do paciente". UMA entidade. Abre, edita, salva.
// Paciente vê. Fim. Sem draft, sem versão, sem republicar.
//
// Implementação: cada save INSERE nova linha publicada (saveEditedPlan).
// Histórico técnico fica no banco mas NÃO aparece na UI.
// Invariante de imutabilidade do snapshot preservada (nunca damos UPDATE).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoLoader } from "@/components/VideoLoader";
import { FoodPickerDialog } from "@/components/FoodPickerDialog";
import type { CatalogFood } from "@/lib/food-catalog";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Clock,
  Copy,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listPatientPlansForNutri,
  type PatientPlanFull,
} from "@/lib/plans/patient-plan.functions";
import { saveEditedPlan } from "@/lib/plans/plans.functions";
import { getPatientForNutritionist } from "@/lib/patients/patient-detail.functions";
import { EquivalentsBlock, toPlannerFoodItem } from "@/components/meal-editor";

export const Route = createFileRoute("/_authenticated/patients/$id/diet")({
  head: () => ({ meta: [{ title: "Plano do paciente — FitJourney" }] }),
  component: PatientPlanPage,
});

// ---------- Tipos locais (passthrough do snapshot) ----------
type EditItem = {
  id: string;
  foodKey: string;
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  scaleGroup: string;
  [k: string]: any;
};
type EditMeal = {
  id: string;
  time: string;
  label: string;
  main: {
    id: string;
    title: string;
    imageKey: string;
    items: EditItem[];
    [k: string]: any;
  };
  equivalents: any[];
  [k: string]: any;
};
type EditSnapshot = {
  id: string;
  name: string;
  kcal: number;
  meals: EditMeal[];
  [k: string]: any;
};

function uid() {
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneSnapshot(s: any): EditSnapshot {
  return JSON.parse(JSON.stringify(s ?? {}));
}

function kcalOf(item: Pick<EditItem, "kcal">) {
  const value = Number(item.kcal);
  return Number.isFinite(value) ? value : 0;
}

function PatientPlanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchPlans = useServerFn(listPatientPlansForNutri);
  const fetchDetail = useServerFn(getPatientForNutritionist);
  const saveFn = useServerFn(saveEditedPlan);

  const { data: detail } = useQuery({
    queryKey: ["patient-detail", id],
    queryFn: () => fetchDetail({ data: { patientId: id } }),
    staleTime: 30_000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["patient-plans", id],
    queryFn: () => fetchPlans({ data: { patientId: id } }),
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  const patientName = detail?.fullName ?? "Paciente";

  function publishNew() {
    navigate({
      to: "/templates",
      search: { patientId: id, patientName },
    });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <Link
            to="/patients/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Voltar ao perfil
          </Link>
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {patientName}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Plano do paciente
              </h1>
            </div>
          </div>
        </div>

        {isLoading && <VideoLoader size="md" label="Carregando plano…" />}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            Erro ao carregar plano: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {data.active ? (
              <PlanEditor
                key={data.active.id}
                plan={data.active}
                onSave={async (snapshot) => {
                  await saveFn({ data: { patientId: id, snapshot } });
                  await qc.invalidateQueries({ queryKey: ["patient-plans", id] });
                  toast.success("Plano salvo. O paciente já está vendo a nova versão.");
                }}
              />
            ) : (
              <EmptyPlanState onPublish={publishNew} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyPlanState({ onPublish }: { readonly onPublish: () => void }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-lg p-8 sm:p-10 text-center space-y-4">
      <div className="mx-auto size-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30">
        <Sparkles className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Sem plano publicado</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Crie o primeiro plano deste paciente a partir de um template. Depois,
          você poderá editar tudo direto aqui.
        </p>
      </div>
      <Button onClick={onPublish}>
        <Send className="size-3.5" />
        Criar a partir de um template
      </Button>
    </div>
  );
}

// ============================================================
// EDITOR
// ============================================================
function PlanEditor({
  plan,
  onSave,
}: {
  readonly plan: PatientPlanFull;
  readonly onSave: (snapshot: EditSnapshot) => Promise<void>;
}) {
  const initial = useMemo(() => cloneSnapshot(plan.snapshot), [plan]);
  const [draft, setDraft] = useState<EditSnapshot>(initial);
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<{ mealId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  // Itens recém-adicionados nesta sessão: disparam auto-geração de substituições.
  const [newItemIds, setNewItemIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDraft(initial);
    setDirty(false);
  }, [initial]);

  function patch(next: EditSnapshot) {
    setDraft(next);
    setDirty(true);
  }

  function updateMeal(mealId: string, fn: (m: EditMeal) => EditMeal) {
    patch({
      ...draft,
      meals: draft.meals.map((m) => (m.id === mealId ? fn(m) : m)),
    });
  }

  function removeMeal(mealId: string) {
    patch({ ...draft, meals: draft.meals.filter((m) => m.id !== mealId) });
  }

  function addMeal() {
    const newMeal: EditMeal = {
      id: uid(),
      time: "12:00",
      label: "Nova refeição",
      main: {
        id: uid(),
        title: "Refeição",
        imageKey: "generic",
        items: [],
      },
      equivalents: [],
    };
    patch({ ...draft, meals: [...draft.meals, newMeal] });
  }

  function removeItem(mealId: string, itemId: string) {
    updateMeal(mealId, (m) => ({
      ...m,
      main: {
        ...m.main,
        items: m.main.items.filter((it) => it.id !== itemId),
      },
    }));
  }

  function updateItem(
    mealId: string,
    itemId: string,
    fn: (it: EditItem) => EditItem,
  ) {
    updateMeal(mealId, (m) => ({
      ...m,
      main: {
        ...m.main,
        items: m.main.items.map((it) => (it.id === itemId ? fn(it) : it)),
      },
    }));
  }

  function moveItem(mealId: string, itemId: string, dir: -1 | 1) {
    updateMeal(mealId, (m) => {
      const items = m.main.items;
      const idx = items.findIndex((it) => it.id === itemId);
      if (idx < 0) return m;
      const target = idx + dir;
      if (target < 0 || target >= items.length) return m;
      const next = items.slice();
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...m, main: { ...m.main, items: next } };
    });
  }

  function addFoodToMeal(mealId: string, food: CatalogFood) {
    const newId = uid();
    setNewItemIds((prev) => {
      const next = new Set(prev);
      next.add(newId);
      return next;
    });
    updateMeal(mealId, (m) => ({
      ...m,
      main: {
        ...m.main,
        items: [
          ...m.main.items,
          {
            id: newId,
            foodKey: food.foodKey,
            name: food.name,
            qty: food.qty,
            unit: food.unit,
            kcal: food.kcal,
            scaleGroup: food.scaleGroup,
          },
        ],
      },
    }));
  }

  function replicateItem(sourceMealId: string, itemId: string, targetMealIds: string[]) {
    if (targetMealIds.length === 0) return;
    const source = draft.meals.find((m) => m.id === sourceMealId);
    const item = source?.main.items.find((it) => it.id === itemId);
    if (!item) return;
    patch({
      ...draft,
      meals: draft.meals.map((m) => {
        if (!targetMealIds.includes(m.id)) return m;
        const clone: EditItem = { ...item, id: uid() };
        return { ...m, main: { ...m.main, items: [...m.main.items, clone] } };
      }),
    });
    toast.success(
      `"${item.name}" replicado em ${targetMealIds.length} ${targetMealIds.length === 1 ? "refeição" : "refeições"}.`,
    );
  }

  const totalKcal = useMemo(() => {
    return draft.meals.reduce(
      (acc, m) =>
        acc +
        m.main.items.reduce(
          (s, it) => s + kcalOf(it),
          0,
        ),
      0,
    );
  }, [draft]);

  async function handleSave() {
    setSaving(true);
    try {
      const snapshotToPersist: EditSnapshot = {
        ...draft,
        kcal: Math.round(totalKcal),
      };
      await onSave(snapshotToPersist);
      setDirty(false);
    } catch (e) {
      toast.error(
        `Não consegui salvar: ${(e as Error).message ?? "erro desconhecido"}`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 pb-28">
      {/* Cabeçalho do plano */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Nome do plano
          </span>
          <Input
            value={draft.name ?? ""}
            onChange={(e) => patch({ ...draft, name: e.target.value })}
          />
        </label>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Total
          </span>
          <span className="text-2xl font-bold font-mono text-primary">
            {Math.round(totalKcal)} kcal
          </span>
        </div>
      </div>

      {/* Refeições */}
      {draft.meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          onChange={(fn) => updateMeal(meal.id, fn)}
          onRemove={() => removeMeal(meal.id)}
          onAddItem={() => setPicker({ mealId: meal.id })}
          onRemoveItem={(itemId) => removeItem(meal.id, itemId)}
          onUpdateItem={(itemId, fn) => updateItem(meal.id, itemId, fn)}
          onMoveItem={(itemId, dir) => moveItem(meal.id, itemId, dir)}
          newItemIds={newItemIds}
        />
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={addMeal}
        type="button"
      >
        <Plus className="size-3.5" />
        Adicionar refeição
      </Button>

      {/* Barra fixa de salvar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {dirty ? "Alterações não salvas" : "Tudo salvo"}
          </div>
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Salvar alterações
          </Button>
        </div>
      </div>

      {picker && (
        <FoodPickerDialog
          open={!!picker}
          onOpenChange={(o) => !o && setPicker(null)}
          onPick={(food) => {
            addFoodToMeal(picker.mealId, food);
            setPicker(null);
          }}
        />
      )}
    </section>
  );
}

function MealCard({
  meal,
  onChange,
  onRemove,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onMoveItem,
  newItemIds,
}: {
  readonly meal: EditMeal;
  readonly onChange: (fn: (m: EditMeal) => EditMeal) => void;
  readonly onRemove: () => void;
  readonly onAddItem: () => void;
  readonly onRemoveItem: (itemId: string) => void;
  readonly onUpdateItem: (
    itemId: string,
    fn: (it: EditItem) => EditItem,
  ) => void;
  readonly onMoveItem: (itemId: string, dir: -1 | 1) => void;
  readonly newItemIds: Set<string>;
}) {
  const kcal = meal.main.items.reduce((s, it) => s + kcalOf(it), 0);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Clock className="size-3.5 mt-2 text-muted-foreground shrink-0" />
        <div className="grid grid-cols-[80px_1fr] gap-2 flex-1">
          <Input
            value={meal.time}
            onChange={(e) =>
              onChange((m) => ({ ...m, time: e.target.value }))
            }
            placeholder="08:00"
            className="text-xs font-mono"
          />
          <Input
            value={meal.label}
            onChange={(e) =>
              onChange((m) => ({ ...m, label: e.target.value }))
            }
            placeholder="Café da manhã"
            className="text-xs"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-mono font-semibold text-primary">
            {Math.round(kcal)} kcal
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remover refeição"
            className="shrink-0"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <Input
        value={meal.main.title}
        onChange={(e) =>
          onChange((m) => ({
            ...m,
            main: { ...m.main, title: e.target.value },
          }))
        }
        placeholder="Título da refeição"
        className="font-medium"
      />

      <ul className="space-y-3">
        {meal.main.items.map((it, idx) => (
          <li
            key={it.id}
            className="grid grid-cols-[minmax(0,1fr)_72px_64px_auto_auto] items-center gap-2"
          >
            <Input
              value={it.name}
              onChange={(e) =>
                onUpdateItem(it.id, (x) => ({ ...x, name: e.target.value }))
              }
              className="text-sm"
            />
            <Input
              type="number"
              inputMode="decimal"
              value={it.qty}
              onChange={(e) =>
                onUpdateItem(it.id, (x) => ({
                  ...x,
                  qty: Number(e.target.value) || 0,
                }))
              }
              className="text-xs font-mono"
            />
            <Input
              value={it.unit}
              onChange={(e) =>
                onUpdateItem(it.id, (x) => ({ ...x, unit: e.target.value }))
              }
              className="text-xs font-mono"
            />
            <EquivalentsBlock
              base={toPlannerFoodItem(it)}
              value={(it as any).materializedEquivalents}
              onChange={(next) =>
                onUpdateItem(it.id, (x) => ({ ...x, materializedEquivalents: next }))
              }
              variant="inline"
              autoGenerateOnMount={newItemIds.has(it.id)}
            />
            <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onMoveItem(it.id, -1)}
                  disabled={idx === 0}
                  aria-label="Mover para cima"
                  className="h-7 w-7"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onMoveItem(it.id, 1)}
                  disabled={idx === meal.main.items.length - 1}
                  aria-label="Mover para baixo"
                  className="h-7 w-7"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveItem(it.id)}
                  aria-label="Remover item"
                  className="h-7 w-7"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-start border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
        >
          <Plus className="size-3.5" />
          Adicionar alimento
        </Button>
      </div>
    </div>
  );
}
