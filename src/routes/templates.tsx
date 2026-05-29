import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  templates as systemTemplates,
  categories,
  type DietTemplate,
  type MealSlot,
  type FoodItem,
} from "@/lib/template-data";
import { imgFor } from "@/lib/food-images";
import { useMyTemplates, type MyTemplate } from "@/lib/my-templates-store";
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Pencil,
  ImageOff,
  Library,
  FolderHeart,
  X,
} from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates — FitJourney" }] }),
  component: TemplatesPage,
});

type Tab = "biblioteca" | "meus";

function TemplatesPage() {
  const [tab, setTab] = useState<Tab>("biblioteca");
  const [category, setCategory] = useState<DietTemplate["category"] | "Todos">("Todos");
  const [editing, setEditing] = useState<{ tpl: DietTemplate; isMine: boolean } | null>(null);
  const { list: myList, save: saveMine, remove: removeMine } = useMyTemplates();

  const filteredSystem = useMemo(
    () =>
      category === "Todos"
        ? systemTemplates
        : systemTemplates.filter((t) => t.category === category),
    [category],
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Biblioteca de Protocolos
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Templates de Dieta</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Clique em um template para abrir o canvas editável. Tudo é editável — quando você
              salva, vira um novo template em <strong>Meus Templates</strong> sem alterar o
              modelo original do sistema.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-1 w-fit">
          <TabBtn active={tab === "biblioteca"} onClick={() => setTab("biblioteca")}>
            <Library className="size-3.5" />
            Biblioteca do Sistema
            <span className="text-[10px] font-mono opacity-60">{systemTemplates.length}</span>
          </TabBtn>
          <TabBtn active={tab === "meus"} onClick={() => setTab("meus")}>
            <FolderHeart className="size-3.5" />
            Meus Templates
            <span className="text-[10px] font-mono opacity-60">{myList.length}</span>
          </TabBtn>
        </div>

        {tab === "biblioteca" && (
          <>
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {(["Todos", ...categories] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors " +
                    (category === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40")
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSystem.map((t) => (
                <TemplateCard
                  key={t.id}
                  tpl={t}
                  onOpen={() => setEditing({ tpl: t, isMine: false })}
                />
              ))}
            </div>
          </>
        )}

        {tab === "meus" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myList.length === 0 && (
              <div className="col-span-full border border-dashed border-border rounded-lg p-10 text-center">
                <FolderHeart className="size-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não salvou nenhum template. Abra um da biblioteca, edite e clique
                  em <strong>Salvar em Meus Templates</strong>.
                </p>
              </div>
            )}
            {myList.map((t) => (
              <TemplateCard
                key={t.id}
                tpl={t}
                mine
                onOpen={() => setEditing({ tpl: t, isMine: true })}
                onDelete={() => removeMine(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <TemplateEditor
          original={editing.tpl}
          isMine={editing.isMine}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            saveMine(t);
            setEditing(null);
            setTab("meus");
          }}
          existingMine={editing.isMine ? (editing.tpl as MyTemplate) : undefined}
        />
      )}
    </AppShell>
  );
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function TemplateCard({
  tpl,
  onOpen,
  mine = false,
  onDelete,
}: {
  tpl: DietTemplate;
  onOpen: () => void;
  mine?: boolean;
  onDelete?: () => void;
}) {
  const hero = imgFor(tpl.meals[0]?.main.foodKey || "");
  return (
    <div className="group bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all flex flex-col">
      <button onClick={onOpen} className="text-left">
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {hero ? (
            <img
              src={hero}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <Badge className="absolute top-3 left-3" variant="secondary">
            {tpl.category}
          </Badge>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-80">
              {tpl.meals.length} refeições · {tpl.kcal} kcal
            </p>
            <h3 className="font-bold text-lg leading-tight">{tpl.name}</h3>
          </div>
        </div>
      </button>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {tpl.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-background border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <Button size="sm" variant="outline" onClick={onOpen}>
            <Pencil className="size-3.5" /> Abrir & Editar
          </Button>
          {mine && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// EDITOR — modal/canvas com refeições editáveis
// ====================================================================

function cloneTemplate(t: DietTemplate): DietTemplate {
  // deep clone seguro p/ objetos puros
  return JSON.parse(JSON.stringify(t));
}

function TemplateEditor({
  original,
  isMine,
  existingMine,
  onClose,
  onSave,
}: {
  original: DietTemplate;
  isMine: boolean;
  existingMine?: MyTemplate;
  onClose: () => void;
  onSave: (t: MyTemplate) => void;
}) {
  const [draft, setDraft] = useState<DietTemplate>(() => cloneTemplate(original));
  const [name, setName] = useState(
    isMine ? original.name : `${original.name} (cópia)`,
  );
  const [finalidade, setFinalidade] = useState(existingMine?.finalidade ?? "");
  const [observacoes, setObservacoes] = useState(existingMine?.observacoes ?? "");

  function updateMeal(mealId: string, fn: (m: MealSlot) => MealSlot) {
    setDraft((d) => ({
      ...d,
      meals: d.meals.map((m) => (m.id === mealId ? fn(m) : m)),
    }));
  }

  /** Escala equivalentes proporcionalmente ao novo qty do main */
  function changeMainQty(mealId: string, newQty: number) {
    updateMeal(mealId, (m) => {
      const ratio = m.main.qty > 0 ? newQty / m.main.qty : 1;
      return {
        ...m,
        main: { ...m.main, qty: round(newQty) },
        equivalents: m.equivalents.map((e) => ({
          ...e,
          qty: round(e.qty * ratio),
        })),
      };
    });
  }

  function removeEquivalent(mealId: string, itemId: string) {
    updateMeal(mealId, (m) => ({
      ...m,
      equivalents: m.equivalents.filter((e) => e.id !== itemId),
    }));
  }

  function removeMeal(mealId: string) {
    setDraft((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== mealId) }));
  }

  function addMeal() {
    setDraft((d) => ({
      ...d,
      meals: [
        ...d.meals,
        {
          id: `m-new-${Date.now()}`,
          time: "12:00",
          label: "Nova refeição",
          main: {
            id: `it-new-${Date.now()}`,
            foodKey: "frango-grelhado",
            name: "Frango grelhado",
            qty: 150,
            unit: "g",
          },
          equivalents: [],
        },
      ],
    }));
  }

  function save() {
    const toSave: MyTemplate = {
      ...draft,
      id: isMine ? draft.id : `mine-${Date.now()}`,
      name: name.trim() || draft.name,
      basedOn: isMine ? (existingMine?.basedOn ?? original.id) : original.id,
      savedAt: new Date().toISOString(),
      finalidade: finalidade.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };
    onSave(toSave);
  }

  const totalKcal = draft.kcal; // placeholder — futuro: somar via tabela TACO

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="mb-1">
                {draft.category}
              </Badge>
              <DialogTitle className="text-xl">
                {isMine ? "Editando · " : "Editor · "}
                {original.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tudo editável. Ao salvar, vira um novo item em <strong>Meus Templates</strong>{" "}
                — o template original do sistema não é alterado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0">
          {/* Canvas refeições */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Esqueleto da dieta</h3>
              <Button size="sm" variant="outline" onClick={addMeal}>
                <Plus className="size-3.5" /> Refeição
              </Button>
            </div>

            {draft.meals.map((m) => (
              <MealEditor
                key={m.id}
                meal={m}
                onChange={(fn) => updateMeal(m.id, fn)}
                onChangeMainQty={(q) => changeMainQty(m.id, q)}
                onRemoveEquivalent={(itemId) => removeEquivalent(m.id, itemId)}
                onRemove={() => removeMeal(m.id)}
              />
            ))}
          </div>

          {/* Sidebar metadata */}
          <aside className="border-l border-border bg-muted/30 p-6 space-y-4">
            <div>
              <Label htmlFor="t-name" className="text-xs">
                Nome
              </Label>
              <Input
                id="t-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="t-fin" className="text-xs">
                Finalidade / paciente
              </Label>
              <Input
                id="t-fin"
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
                placeholder="Ex: Ricardo M. — pré-temporada"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="t-obs" className="text-xs">
                Observações
              </Label>
              <Textarea
                id="t-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Onde usou, ajustes feitos, intercorrências..."
                className="mt-1 min-h-[120px]"
              />
            </div>
            <div className="border-t border-border pt-4 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Resumo
              </p>
              <p className="text-2xl font-bold">{totalKcal} kcal</p>
              <p className="text-xs text-muted-foreground">{draft.meals.length} refeições</p>
            </div>
          </aside>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>
            {isMine ? <Save className="size-4" /> : <Copy className="size-4" />}
            {isMine ? "Salvar alterações" : "Salvar em Meus Templates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MealEditor({
  meal,
  onChange,
  onChangeMainQty,
  onRemoveEquivalent,
  onRemove,
}: {
  meal: MealSlot;
  onChange: (fn: (m: MealSlot) => MealSlot) => void;
  onChangeMainQty: (q: number) => void;
  onRemoveEquivalent: (itemId: string) => void;
  onRemove: () => void;
}) {
  const heroUrl = imgFor(meal.main.foodKey);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="grid grid-cols-[120px_1fr] gap-0">
        {/* Imagem */}
        <div className="relative aspect-square bg-muted">
          {heroUrl ? (
            <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-3 space-y-3">
          {/* Linha topo: hora + label */}
          <div className="flex items-center gap-2">
            <Input
              value={meal.time}
              onChange={(e) => onChange((m) => ({ ...m, time: e.target.value }))}
              className="h-7 w-20 text-xs font-mono"
            />
            <Input
              value={meal.label}
              onChange={(e) => onChange((m) => ({ ...m, label: e.target.value }))}
              className="h-7 flex-1 text-sm font-medium"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Remover refeição"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {/* Main item */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md p-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-primary px-1">
              Principal
            </span>
            <Input
              value={meal.main.name}
              onChange={(e) =>
                onChange((m) => ({ ...m, main: { ...m.main, name: e.target.value } }))
              }
              className="h-7 flex-1 text-sm"
            />
            <Input
              type="number"
              value={meal.main.qty}
              onChange={(e) => onChangeMainQty(Number(e.target.value) || 0)}
              className="h-7 w-20 text-sm text-right"
            />
            <Input
              value={meal.main.unit}
              onChange={(e) =>
                onChange((m) => ({ ...m, main: { ...m.main, unit: e.target.value } }))
              }
              className="h-7 w-16 text-xs"
            />
          </div>

          {/* Equivalentes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Equivalentes ({meal.equivalents.length})
              </p>
              <button
                className="text-[10px] text-primary hover:underline"
                onClick={() =>
                  onChange((m) => ({
                    ...m,
                    equivalents: [
                      ...m.equivalents,
                      {
                        id: `eq-${Date.now()}`,
                        foodKey: "iogurte-natural",
                        name: "Novo equivalente",
                        qty: 100,
                        unit: "g",
                      },
                    ],
                  }))
                }
              >
                + adicionar
              </button>
            </div>
            <div className="space-y-1">
              {meal.equivalents.map((eq) => (
                <EquivalentRow
                  key={eq.id}
                  item={eq}
                  onChange={(updated) =>
                    onChange((m) => ({
                      ...m,
                      equivalents: m.equivalents.map((e) => (e.id === eq.id ? updated : e)),
                    }))
                  }
                  onRemove={() => onRemoveEquivalent(eq.id)}
                />
              ))}
              {meal.equivalents.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  Sem equivalentes nesta refeição.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EquivalentRow({
  item,
  onChange,
  onRemove,
}: {
  item: FoodItem;
  onChange: (it: FoodItem) => void;
  onRemove: () => void;
}) {
  const img = imgFor(item.foodKey);
  return (
    <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-md p-1.5">
      <div className="size-8 rounded bg-muted overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <ImageOff className="size-3" />
          </div>
        )}
      </div>
      <Input
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="h-7 flex-1 text-xs"
      />
      <Input
        type="number"
        value={item.qty}
        onChange={(e) => onChange({ ...item, qty: Number(e.target.value) || 0 })}
        className="h-7 w-16 text-xs text-right"
      />
      <Input
        value={item.unit}
        onChange={(e) => onChange({ ...item, unit: e.target.value })}
        className="h-7 w-14 text-xs"
      />
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive p-1"
        title="Remover"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function round(n: number) {
  // arredonda para 1 casa quando < 10, inteiro acima
  if (!isFinite(n)) return 0;
  return n < 10 ? Math.round(n * 10) / 10 : Math.round(n);
}
