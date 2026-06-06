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
  ChevronRight,
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
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  // Modal pós-adição: aparece toda vez que um alimento é inserido.
  const [postAdd, setPostAdd] = useState<{
    mealId: string;
    itemId: string;
    itemName: string;
  } | null>(null);

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
    // Abre o modal pós-adição para decidir Replicar / Gerar equivalentes.
    setPostAdd({ mealId, itemId: newId, itemName: food.name });
  }

  function markNewItems(ids: string[]) {
    if (ids.length === 0) return;
    setNewItemIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function replicateItem(
    sourceMealId: string,
    itemId: string,
    targetMealIds: string[],
  ): string[] {
    if (targetMealIds.length === 0) return [];
    const source = draft.meals.find((m) => m.id === sourceMealId);
    const item = source?.main.items.find((it) => it.id === itemId);
    if (!item) return [];
    const cloneIds: Record<string, string> = {};
    for (const mid of targetMealIds) cloneIds[mid] = uid();
    patch({
      ...draft,
      meals: draft.meals.map((m) => {
        if (!targetMealIds.includes(m.id)) return m;
        const clone: EditItem = { ...item, id: cloneIds[m.id] };
        return { ...m, main: { ...m.main, items: [...m.main.items, clone] } };
      }),
    });
    toast.success(
      `"${item.name}" replicado em ${targetMealIds.length} ${targetMealIds.length === 1 ? "refeição" : "refeições"}.`,
    );
    return Object.values(cloneIds);
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
      {/* Toggle Edição ↔ Visualização */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <div className="text-xs text-muted-foreground">
          {mode === "edit"
            ? "Modo edição — você está editando o plano."
            : "Visualizando o plano como o paciente vê."}
        </div>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "edit"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Pencil className="size-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "preview"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Eye className="size-3.5" /> Visualizar plano
          </button>
        </div>
      </div>

      {/* Cabeçalho do plano */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        {mode === "edit" ? (
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Nome do plano
            </span>
            <Input
              value={draft.name ?? ""}
              onChange={(e) => patch({ ...draft, name: e.target.value })}
            />
          </label>
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Plano
            </span>
            <p className="text-lg font-semibold">{draft.name || "Sem nome"}</p>
          </div>
        )}
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
      {mode === "edit"
        ? draft.meals.map((meal) => (
            <MealSlot
              key={meal.id}
              meal={meal}
              allMeals={draft.meals}
              onChange={(fn) => updateMeal(meal.id, fn)}
              onRemove={() => removeMeal(meal.id)}
              onAddItem={() => setPicker({ mealId: meal.id })}
              onRemoveItem={(itemId) => removeItem(meal.id, itemId)}
              onUpdateItem={(itemId, fn) => updateItem(meal.id, itemId, fn)}
              onMoveItem={(itemId, dir) => moveItem(meal.id, itemId, dir)}
              onReplicateItem={(itemId, targetIds) =>
                replicateItem(meal.id, itemId, targetIds)
              }
              newItemIds={newItemIds}
            />
          ))
        : draft.meals.map((meal) => <PreviewMealCard key={meal.id} meal={meal} />)}

      {mode === "edit" && (
        <Button
          variant="outline"
          className="w-full"
          onClick={addMeal}
          type="button"
        >
          <Plus className="size-3.5" />
          Adicionar refeição
        </Button>
      )}


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

      {postAdd && (
        <PostAddDialog
          itemName={postAdd.itemName}
          meals={draft.meals}
          currentMealId={postAdd.mealId}
          onClose={() => setPostAdd(null)}
          onConfirm={({ replicateTo, generateEquivalents }) => {
            const replicatedIds = replicateItem(
              postAdd.mealId,
              postAdd.itemId,
              replicateTo,
            );
            if (generateEquivalents) {
              markNewItems([postAdd.itemId, ...replicatedIds]);
            }
            setPostAdd(null);
          }}
        />
      )}
    </section>
  );
}

function MealCard({
  meal,
  allMeals,
  onChange,
  onRemove,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onMoveItem,
  onReplicateItem,
  newItemIds,
}: {
  readonly meal: EditMeal;
  readonly allMeals: EditMeal[];
  readonly onChange: (fn: (m: EditMeal) => EditMeal) => void;
  readonly onRemove: () => void;
  readonly onAddItem: () => void;
  readonly onRemoveItem: (itemId: string) => void;
  readonly onUpdateItem: (
    itemId: string,
    fn: (it: EditItem) => EditItem,
  ) => void;
  readonly onMoveItem: (itemId: string, dir: -1 | 1) => void;
  readonly onReplicateItem: (itemId: string, targetMealIds: string[]) => void;
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
                <ReplicateMenu
                  meals={allMeals}
                  currentMealId={meal.id}
                  onReplicate={(targetIds) => onReplicateItem(it.id, targetIds)}
                />
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

// ============================================================
// Replicar alimento para outras refeições
// ============================================================
function ReplicateMenu({
  meals,
  currentMealId,
  onReplicate,
}: {
  readonly meals: EditMeal[];
  readonly currentMealId: string;
  readonly onReplicate: (targetMealIds: string[]) => void;
}) {
  const others = meals.filter((m) => m.id !== currentMealId);
  if (others.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Replicar em outras refeições"
          className="h-7 w-7"
        >
          <Copy className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Replicar em…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {others.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onSelect={(e) => {
              e.preventDefault();
              onReplicate([m.id]);
            }}
          >
            <span className="text-xs font-mono text-muted-foreground mr-2">
              {m.time}
            </span>
            <span className="truncate">{m.label}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onReplicate(others.map((m) => m.id));
          }}
        >
          Replicar em todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// Visualização (somente leitura) — espelha o que o paciente vê
// ============================================================
function PreviewMealCard({ meal }: { readonly meal: EditMeal }) {
  const kcal = meal.main.items.reduce((s, it) => s + kcalOf(it), 0);
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-mono text-muted-foreground">
            {meal.time}
          </span>
          <span className="text-sm font-semibold truncate">{meal.label}</span>
        </div>
        <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-mono font-semibold text-primary">
          {Math.round(kcal)} kcal
        </span>
      </div>
      {meal.main.title && (
        <p className="text-sm font-medium">{meal.main.title}</p>
      )}
      <ul className="space-y-1.5">
        {meal.main.items.map((it) => {
          const eq = (it as any).materializedEquivalents as
            | { options?: Array<{ name: string; qty: number; unit: string }> }
            | undefined;
          const hasOpts = (eq?.options?.length ?? 0) > 0;
          return (
            <li
              key={it.id}
              className="rounded-md border border-border/60 bg-background/60 px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{it.name}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {it.qty} {it.unit}
                </span>
              </div>
              {hasOpts && (
                <div className="mt-1.5 space-y-0.5 border-t border-dashed border-border/60 pt-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Substituições
                  </span>
                  {eq!.options!.map((o, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between gap-2 text-xs"
                    >
                      <span className="truncate">{o.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {o.qty} {o.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {meal.main.items.length === 0 && (
          <li className="text-xs text-muted-foreground italic">
            Sem alimentos.
          </li>
        )}
      </ul>
    </div>
  );
}

// ============================================================
// Modal pós-adição — escolher Replicar e/ou Gerar equivalentes
// ============================================================
function PostAddDialog({
  itemName,
  meals,
  currentMealId,
  onClose,
  onConfirm,
}: {
  readonly itemName: string;
  readonly meals: EditMeal[];
  readonly currentMealId: string;
  readonly onClose: () => void;
  readonly onConfirm: (args: {
    replicateTo: string[];
    generateEquivalents: boolean;
  }) => void;
}) {
  const others = meals.filter((m) => m.id !== currentMealId);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [generateEquivalents, setGenerateEquivalents] = useState(true);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = others.length > 0 && selected.size === others.length;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            "{itemName}" adicionado
          </DialogTitle>
          <DialogDescription>
            Replicar em outras refeições e/ou gerar substituições equivalentes.
            As opções podem ser combinadas.
          </DialogDescription>
        </DialogHeader>

        {others.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Replicar em
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    allSelected ? new Set() : new Set(others.map((m) => m.id)),
                  )
                }
                className="text-xs text-primary hover:underline"
              >
                {allSelected ? "Limpar tudo" : "Selecionar todas"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-border p-2">
              {others.map((m) => {
                const id = `rep-${m.id}`;
                return (
                  <label
                    key={m.id}
                    htmlFor={id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      id={id}
                      checked={selected.has(m.id)}
                      onCheckedChange={() => toggle(m.id)}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {m.time}
                    </span>
                    <span className="text-sm truncate">{m.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Não há outras refeições para replicar.
          </p>
        )}

        <div className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
          <div className="space-y-0.5">
            <Label htmlFor="gen-eq" className="text-sm">
              Gerar equivalentes
            </Label>
            <p className="text-xs text-muted-foreground">
              Plota substituições automáticas embaixo do item.
            </p>
          </div>
          <Switch
            id="gen-eq"
            checked={generateEquivalents}
            onCheckedChange={setGenerateEquivalents}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Pular
          </Button>
          <Button
            type="button"
            onClick={() =>
              onConfirm({
                replicateTo: Array.from(selected),
                generateEquivalents,
              })
            }
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

