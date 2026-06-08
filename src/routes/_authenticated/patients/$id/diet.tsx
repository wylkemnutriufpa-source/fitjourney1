// Nutri — "Plano do paciente". UMA entidade. Abre, edita, salva.
// Paciente vê. Fim. Sem draft, sem versão, sem republicar.
//
// Implementação: cada save INSERE nova linha publicada (saveEditedPlan).
// Histórico técnico fica no banco mas NÃO aparece na UI.
// Invariante de imutabilidade do snapshot preservada (nunca damos UPDATE).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  BookmarkPlus,
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
import { saveMyTemplate } from "@/lib/templates/templates.functions";
import { getPatientForNutritionist } from "@/lib/patients/patient-detail.functions";
import { EquivalentsBlock, toPlannerFoodItem } from "@/components/meal-editor";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";

export const Route = createFileRoute("/_authenticated/patients/$id/diet")({
  head: () => ({ meta: [{ title: "Plano do paciente — FitJourney" }] }),
  component: PatientPlanPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/patients" homeLabel="Lista de pacientes" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/patients" homeLabel="Lista de pacientes" />,
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

  function publishFromTemplate() {
    navigate({
      to: "/templates",
      search: { patientId: id, patientName },
    });
  }

  function publishWithAI() {
    navigate({
      to: "/templates",
      search: { blank: 1, patientId: id, patientName },
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
              <EmptyPlanState onTemplate={publishFromTemplate} onAI={publishWithAI} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyPlanState({
  onTemplate,
  onAI,
}: {
  readonly onTemplate: () => void;
  readonly onAI: () => void;
}) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-lg p-8 sm:p-10 text-center space-y-4">
      <div className="mx-auto size-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30">
        <Sparkles className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Sem plano publicado</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Crie o primeiro plano deste paciente. Você pode partir de um
          smart-template homologado ou montar com a IA FitJourney a partir da
          tabela de alimentos.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
        <Button onClick={onTemplate} variant="outline">
          <Sparkles className="size-3.5" />
          Plano com Smart-templates
        </Button>
        <Button onClick={onAI}>
          <Send className="size-3.5" />
          Plano com IA FitJourney
        </Button>
      </div>
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
  const [saveAsTpl, setSaveAsTpl] = useState<{ name: string; saving: boolean } | null>(null);
  const saveTemplateFn = useServerFn(saveMyTemplate);
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
    // Se o alimento tem medida caseira default, já abre o item com ela
    // selecionada — a dor relatada (ovo em gramas, banana em gramas) some
    // sem o nutri precisar trocar nada à mão.
    const defaultMeasure =
      food.householdMeasures?.find((m) => m.isDefault) ??
      food.householdMeasures?.[0];
    const baseItem: any = {
      id: newId,
      foodKey: food.foodKey,
      name: food.name,
      qty: food.qty,
      unit: food.unit,
      kcal: food.kcal,
      scaleGroup: food.scaleGroup,
      kcalPer100g: food.kcalPer100g,
      householdMeasures: food.householdMeasures,
    };
    if (defaultMeasure && food.kcalPer100g) {
      baseItem.householdMeasure = {
        label: defaultMeasure.measureName,
        grams: defaultMeasure.gramsEquivalent,
        measureId: defaultMeasure.id,
      };
      baseItem.qty = 1;
      baseItem.unit = "medida";
      baseItem.kcal = Math.round(
        (food.kcalPer100g * defaultMeasure.gramsEquivalent) / 100,
      );
    }
    updateMeal(mealId, (m) => ({
      ...m,
      main: {
        ...m.main,
        items: [...m.main.items, baseItem],
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
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try { navigator.vibrate([8, 30, 12]); } catch { /* ignore */ }
      }
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveAsTpl({ name: draft.name || "Modelo do plano", saving: false })}
              disabled={saving}
              title="Salvar este plano como um modelo reutilizável"
            >
              <BookmarkPlus className="size-3.5" />
              Salvar como modelo
            </Button>
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

      <Dialog open={!!saveAsTpl} onOpenChange={(o) => !o && setSaveAsTpl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como modelo</DialogTitle>
            <DialogDescription>
              Cria um modelo reutilizável a partir deste plano. O plano do paciente
              não é alterado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Nome do modelo</Label>
            <Input
              id="tpl-name"
              value={saveAsTpl?.name ?? ""}
              onChange={(e) =>
                setSaveAsTpl((s) => (s ? { ...s, name: e.target.value } : s))
              }
              placeholder="Ex.: Cutting 1800kcal — 5 refeições"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsTpl(null)} disabled={saveAsTpl?.saving}>
              Cancelar
            </Button>
            <Button
              disabled={!saveAsTpl?.name.trim() || saveAsTpl?.saving}
              onClick={async () => {
                if (!saveAsTpl) return;
                const name = saveAsTpl.name.trim();
                if (!name) return;
                setSaveAsTpl({ ...saveAsTpl, saving: true });
                try {
                  await saveTemplateFn({
                    data: {
                      name,
                      basedOn: `patient-plan:${plan.id}`,
                      template: { ...draft, name, kcal: Math.round(totalKcal) },
                    },
                  });
                  toast.success("Modelo salvo na sua biblioteca.");
                  setSaveAsTpl(null);
                } catch (e) {
                  toast.error(
                    `Não consegui salvar o modelo: ${(e as Error).message ?? "erro"}`,
                  );
                  setSaveAsTpl((s) => (s ? { ...s, saving: false } : s));
                }
              }}
            >
              {saveAsTpl?.saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="size-3.5" />
              )}
              Salvar modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <ConfirmDestroy
            onConfirm={onRemove}
            title="Remover refeição?"
            description={`A refeição "${meal.label || "sem nome"}" e todos os seus alimentos serão removidos. Esta ação pode ser desfeita descartando as alterações antes de salvar.`}
            confirmLabel="Remover refeição"
            ariaLabel="Remover refeição"
            className="shrink-0 h-9 w-9 md:h-9 md:w-9"
          />
          </div>
      </div>
      {/* sentinel-close-removed */}

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
        <AnimatePresence initial={false}>
        {meal.main.items.map((it, idx) => (
          <motion.li
            key={it.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-2 rounded-md border border-border/40 bg-background/40 p-2 md:space-y-0 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:grid md:grid-cols-[minmax(0,1fr)_72px_64px_auto_auto] md:items-center md:gap-2"
          >
            <Input
              value={it.name}
              onChange={(e) =>
                onUpdateItem(it.id, (x) => ({ ...x, name: e.target.value }))
              }
              className="text-sm h-11 md:h-9"
            />
            <div className="flex gap-2 md:contents">
              <Input
                type="number"
                inputMode="decimal"
                value={it.qty}
                onChange={(e) => {
                  const nextQty = Number(e.target.value) || 0;
                  onUpdateItem(it.id, (x) => {
                    const prevQty = Number(x.qty) || 0;
                    const prevKcal = Number(x.kcal) || 0;
                    // Escala kcal proporcionalmente. Vale p/ g, ml, unid, fatia:
                    // mantém a densidade kcal/qty que o item já tinha.
                    const nextKcal =
                      prevQty > 0 ? Math.round((prevKcal * nextQty) / prevQty) : prevKcal;
                    return { ...x, qty: nextQty, kcal: nextKcal };
                  });
                }}
                aria-label="Quantidade"
                className="flex-1 md:flex-none text-xs font-mono h-11 md:h-9"
              />
              <Input
                value={it.unit}
                onChange={(e) =>
                  onUpdateItem(it.id, (x) => ({ ...x, unit: e.target.value }))
                }
                aria-label="Unidade"
                className="w-20 md:w-auto text-xs font-mono h-11 md:h-9"
              />
            </div>
            <EquivalentsBlock
              base={toPlannerFoodItem(it)}
              value={(it as any).materializedEquivalents}
              onChange={(next) =>
                onUpdateItem(it.id, (x) => ({ ...x, materializedEquivalents: next }))
              }
              variant="inline"
              autoGenerateOnMount={newItemIds.has(it.id)}
            />
            <div className="flex items-center justify-end gap-1 md:gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onMoveItem(it.id, -1)}
                  disabled={idx === 0}
                  aria-label="Mover para cima"
                  className="h-11 w-11 md:h-7 md:w-7"
                >
                  <ArrowUp className="size-4 md:size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onMoveItem(it.id, 1)}
                  disabled={idx === meal.main.items.length - 1}
                  aria-label="Mover para baixo"
                  className="h-11 w-11 md:h-7 md:w-7"
                >
                  <ArrowDown className="size-4 md:size-3.5" />
                </Button>
                <ConfirmDestroy
                  onConfirm={() => onRemoveItem(it.id)}
                  title="Remover alimento?"
                  description={`"${it.name || "Item"}" será removido desta refeição.`}
                  confirmLabel="Remover alimento"
                  ariaLabel="Remover item"
                  className="h-11 w-11 md:h-7 md:w-7"
                />
                <ReplicateMenu
                  meals={allMeals}
                  currentMealId={meal.id}
                  onReplicate={(targetIds) => onReplicateItem(it.id, targetIds)}
                />
            </div>
          </motion.li>
        ))}
        </AnimatePresence>
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


// ============================================================
// ConfirmDestroy — botão destrutivo com confirmação (AlertDialog)
// Usado para "Remover refeição" e "Remover alimento" no editor.
// Protege contra cliques acidentais no mobile.
// ============================================================
function ConfirmDestroy({
  onConfirm,
  title,
  description,
  confirmLabel,
  ariaLabel,
  className,
}: {
  readonly onConfirm: () => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly ariaLabel: string;
  readonly className?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={ariaLabel}
          className={className}
        >
          <Trash2 className="size-4 md:size-3.5 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// MealSlot — escolhe entre render inline (desktop) ou Sheet (mobile).
// No mobile, a refeição vira uma linha resumo (toque grande); ao tocar,
// abre um Sheet full-height com a MealCard inteira (mesmos props, mesmo
// motor). Sem divergência de regras com o desktop.
// ============================================================
type MealSlotProps = ComponentProps<typeof MealCard>;

// Pequeno helper de haptic feedback. Silencioso em desktops/navegadores
// sem suporte. Use em ações destrutivas / confirmações / salvar.
function haptic(ms: number = 10) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
}

function MealSlot(props: MealSlotProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const { meal } = props;
  const kcal = meal.main.items.reduce((s, it) => s + kcalOf(it), 0);
  const itemCount = meal.main.items.length;

  // Snapshot inicial ao abrir, pra detectar se mudou algo na sessão.
  const [openSnapshot, setOpenSnapshot] = useState<string | null>(null);
  const currentSig = useMemo(
    () =>
      JSON.stringify({
        l: meal.label,
        t: meal.time,
        items: meal.main.items.map((i) => ({ k: i.foodKey, q: i.qty, u: i.unit })),
      }),
    [meal],
  );
  const sessionDirty = openSnapshot !== null && openSnapshot !== currentSig;

  const itemPreview = meal.main.items.slice(0, 3).map((i) => i.name);
  const extra = Math.max(0, itemCount - itemPreview.length);

  function handleOpen() {
    haptic(8);
    setOpenSnapshot(currentSig);
    setOpen(true);
  }
  function handleClose(force = false) {
    if (!force && sessionDirty) {
      haptic(15);
      setConfirmClose(true);
      return;
    }
    haptic(10);
    setOpen(false);
    setOpenSnapshot(null);
  }

  if (!isMobile) {
    return <MealCard {...props} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-4 text-left active:bg-surface/80 transition-colors min-h-[72px]"
      >
        <div className="flex flex-col items-center justify-center w-14 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {meal.time || "--:--"}
          </span>
          <span className="text-xs font-mono font-semibold text-primary mt-0.5">
            {Math.round(kcal)}
          </span>
          <span className="text-[9px] font-mono uppercase text-muted-foreground">
            kcal
          </span>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold truncate">
            {meal.label || "Sem nome"}
          </p>
          {itemCount === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sem alimentos</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {itemPreview.map((name, i) => (
                <span
                  key={i}
                  className="inline-block max-w-[120px] truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {name}
                </span>
              ))}
              {extra > 0 && (
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  +{extra}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="size-5 text-muted-foreground shrink-0" />
      </button>

      <Sheet
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
          else setOpen(true);
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[100dvh] max-h-[100dvh] p-0 flex flex-col gap-0 sm:max-w-none"
          onEscapeKeyDown={(e) => {
            if (sessionDirty) {
              e.preventDefault();
              setConfirmClose(true);
            }
          }}
          onPointerDownOutside={(e) => {
            if (sessionDirty) {
              e.preventDefault();
              setConfirmClose(true);
            }
          }}
        >
          {/* Sticky header com nome + kcal vivos */}
          <SheetHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur px-4 py-3 space-y-0">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base truncate">
                {meal.label || "Refeição"}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-muted-foreground">
                <Clock className="size-3" />
                <span>{meal.time || "--:--"}</span>
                <span className="text-border">·</span>
                <span className="font-semibold text-primary">
                  {Math.round(kcal)} kcal
                </span>
                <span className="text-border">·</span>
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
                {sessionDirty && (
                  <span className="ml-1 inline-block size-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleClose()}
              aria-label="Fechar"
              className="h-10 w-10 shrink-0"
            >
              <X className="size-5" />
            </Button>
          </SheetHeader>

          <div className="relative flex-1 overflow-y-auto p-4 pb-32">
            <MealCard {...props} />

            {/* FAB +Item */}
            <button
              type="button"
              onClick={() => {
                haptic(8);
                props.onAddItem();
              }}
              aria-label="Adicionar alimento"
              className="fixed bottom-24 right-4 z-20 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="size-6" />
            </button>
          </div>

          <div className="border-t border-border bg-background px-4 py-3">
            <Button
              type="button"
              onClick={() => {
                haptic(12);
                setOpen(false);
                setOpenSnapshot(null);
              }}
              className="w-full h-12 text-base"
            >
              Concluir refeição
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar sem concluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Você fez alterações nesta refeição. Elas continuam aplicadas no
              editor, mas você ainda precisa salvar o plano. Deseja fechar
              mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false);
                handleClose(true);
              }}
            >
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
