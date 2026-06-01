import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listFoods, type FoodDTO } from "@/lib/foods.functions";
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
  orientacoesFor,
  type DietTemplate,
} from "@/lib/template-data";
import { TemplateMatcherPanel } from "@/components/TemplateMatcherPanel";

import { imgFor, allFoodKeys, foodImages } from "@/lib/food-images";
import { useMyTemplates, type MyTemplate } from "@/lib/my-templates-store";
import { SendShareDialog } from "@/components/SendShareDialog";
import { FoodPickerDialog } from "@/components/FoodPickerDialog";
import { templateToPrintHtml, templateToWhatsText } from "@/lib/diet-serializers";
import { printHTML, escapeHtml } from "@/lib/share-utils";
import {
  toPlannerTemplate,
  clonePlannerTemplate,
  updateMainItemWithScaling,
  mealKcalFromOption,
  createEmptyMeal,
  createEmptyFoodItem,
  createEmptyMealOption,
  createEmptyTemplate,
  templateKcal,
  type PlannerTemplate,
  type PlannerMeal,
  type PlannerMealOption,
  type PlannerFoodItem,
} from "@/lib/meal-planner";
import { detectMealKind, getSubstitutionsFor } from "@/lib/plans/substitution-rules";
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
  Printer,
  MessageCircle,
  UtensilsCrossed,
  ClipboardList,
  ChefHat,
  Repeat2,
  ChevronDown,
  Send,
  CheckCircle2,
} from "lucide-react";
import { RealPatientPicker } from "@/components/RealPatientPicker";
import { publishPlanToPatient, type PatientLite } from "@/lib/plans/plans.functions";


export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Templates — FitJourney" }] }),
  validateSearch: (search: Record<string, unknown>): { blank?: number } => ({
    blank: search.blank === "1" || search.blank === 1 ? 1 : undefined,
  }),
  component: TemplatesPage,
});

type Tab = "biblioteca" | "meus";

function normalizeTitle(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Gera opções equivalentes automáticas para a refeição a partir do alimento
 * recém adicionado, usando o motor curado de substituições. Evita duplicar
 * opções já existentes (comparando títulos normalizados) e o próprio item.
 */
function buildAutoEquivalents(meal: PlannerMeal, food: PlannerFoodItem): PlannerMealOption[] {
  const kind = detectMealKind(meal.label, meal.time);
  const subs = getSubstitutionsFor(food.name, kind, food.kcal || 0);
  if (subs.length === 0) return [];
  const taken = new Set<string>([
    normalizeTitle(food.name),
    ...meal.equivalents.map((e) => normalizeTitle(e.title)),
    ...meal.equivalents.flatMap((e) => e.items.map((i) => normalizeTitle(i.name))),
  ]);
  const out: PlannerMealOption[] = [];
  for (const s of subs) {
    const key = normalizeTitle(s.name);
    if (taken.has(key)) continue;
    taken.add(key);
    out.push(
      createEmptyMealOption({
        title: s.name,
        imageKey: meal.main.imageKey || meal.heroKey || "iogurte-natural",
        items: [
          createEmptyFoodItem({
            foodKey: food.foodKey,
            name: s.name,
            qty: s.qty,
            unit: s.unit,
            kcal: s.kcal ?? 0,
            scaleGroup: food.scaleGroup,
          }),
        ],
      }),
    );
  }
  return out;
}

function TemplatesPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<Tab>("biblioteca");
  const [category, setCategory] = useState<DietTemplate["category"] | "Todos">("Todos");
  const [editing, setEditing] = useState<{ tpl: PlannerTemplate; isMine: boolean; mine?: MyTemplate } | null>(null);
  const { list: myList, save: saveMine, remove: removeMine } = useMyTemplates();

  // Entrada "?blank=1" abre direto o editor com esqueleto vazio.
  const blankHandled = useRef(false);
  useEffect(() => {
    if (search.blank === 1 && !blankHandled.current && !editing) {
      blankHandled.current = true;
      setEditing({ tpl: createEmptyTemplate(), isMine: false });
    }
  }, [search.blank, editing]);

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
              Clique em uma refeição para abrir o canvas: cada alimento aparece desacoplado
              (pão, ovo, café…) com sua gramatura e kcal. Ao adicionar um alimento, opções
              equivalentes coerentes com a refeição entram automaticamente.
            </p>
          </div>
          <Button
            onClick={() => setEditing({ tpl: createEmptyTemplate(), isMine: false })}
            className="gap-1.5"
          >
            <Plus className="size-3.5" /> Plano do zero
          </Button>
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
            <TemplateMatcherPanel
              onPickTemplate={(id) => {
                const t = systemTemplates.find((x) => x.id === id);
                if (t) setEditing({ tpl: toPlannerTemplate(t), isMine: false });
              }}
            />

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSystem.map((t) => {
                const planner = toPlannerTemplate(t);
                return (
                  <TemplateCard
                    key={t.id}
                    tpl={planner}
                    onOpen={() => setEditing({ tpl: planner, isMine: false })}
                  />
                );
              })}
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
                onOpen={() => setEditing({ tpl: t, isMine: true, mine: t })}
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
          existingMine={editing.mine}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            saveMine(t);
            setEditing(null);
            setTab("meus");
          }}
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
  tpl: PlannerTemplate;
  onOpen: () => void;
  mine?: boolean;
  onDelete?: () => void;
}) {
  const hero = imgFor(tpl.meals[0]?.main.imageKey || "");
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
// EDITOR
// ====================================================================

function TemplateEditor({
  original,
  isMine,
  existingMine,
  onClose,
  onSave,
}: {
  original: PlannerTemplate;
  isMine: boolean;
  existingMine?: MyTemplate;
  onClose: () => void;
  onSave: (t: MyTemplate) => void;
}) {
  const [draft, setDraft] = useState<PlannerTemplate>(() => clonePlannerTemplate(original));
  const [name, setName] = useState(
    isMine ? original.name : `${original.name} (cópia)`,
  );
  const [finalidade, setFinalidade] = useState(existingMine?.finalidade ?? "");
  const [observacoes, setObservacoes] = useState(existingMine?.observacoes ?? "");
  const [orientacoes, setOrientacoes] = useState<string>(
    draft.orientacoes ?? orientacoesFor(draft),
  );

  const [editorTab, setEditorTab] = useState<"refeicoes" | "orientacoes">("refeicoes");
  const [shareOpen, setShareOpen] = useState(false);
  const [orientShareOpen, setOrientShareOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyPatient, setApplyPatient] = useState<PatientLite | null>(null);
  const [applyDone, setApplyDone] = useState<string | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const publishPlan = useServerFn(publishPlanToPatient);

  function setMeals(updater: (meals: PlannerMeal[]) => PlannerMeal[]) {
    setDraft((d) => {
      const meals = updater(d.meals);
      return { ...d, meals, kcal: templateKcal(meals) };
    });
  }

  function updateMeal(mealId: string, fn: (m: PlannerMeal) => PlannerMeal) {
    setMeals((meals) => meals.map((m) => (m.id === mealId ? fn(m) : m)));
  }

  function removeMeal(mealId: string) {
    setMeals((meals) => meals.filter((m) => m.id !== mealId));
  }

  function addMeal() {
    setMeals((meals) => [...meals, createEmptyMeal()]);
  }

  function save() {
    const toSave: MyTemplate = {
      ...draft,
      id: isMine ? draft.id : `mine-${Date.now()}`,
      name: name.trim() || draft.name,
      orientacoes: orientacoes.trim() || undefined,
      basedOn: isMine ? (existingMine?.basedOn ?? original.id) : original.id,
      savedAt: new Date().toISOString(),
      finalidade: finalidade.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };
    onSave(toSave);
  }

  const totalKcal = draft.kcal;
  const currentForShare: PlannerTemplate = { ...draft, name: name || draft.name, orientacoes };

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
                Cada alimento é editável de forma independente. Alterar a gramatura do principal
                escala todas as substituições proporcionalmente.
              </DialogDescription>
              {!isMine && (
                <p className="mt-2 text-[11px] text-primary bg-primary/5 border border-primary/20 rounded px-2 py-1.5 inline-flex items-center gap-1.5">
                  <FolderHeart className="size-3" />
                  Suas edições são salvas em <strong>Meus Templates</strong> — o template
                  original do sistema não é alterado.
                </p>
              )}

            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  printHTML({
                    title: currentForShare.name,
                    html: templateToPrintHtml(currentForShare, { finalidade }),
                  })
                }
              >
                <Printer className="size-3.5" /> PDF
              </Button>
              <Button
                size="sm"
                onClick={() => setShareOpen(true)}
                className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 border border-border rounded-lg p-1 w-fit mt-3">
            <TabBtn
              active={editorTab === "refeicoes"}
              onClick={() => setEditorTab("refeicoes")}
            >
              <UtensilsCrossed className="size-3.5" /> Refeições
              <span className="text-[10px] font-mono opacity-60">{draft.meals.length}</span>
            </TabBtn>
            <TabBtn
              active={editorTab === "orientacoes"}
              onClick={() => setEditorTab("orientacoes")}
            >
              <ClipboardList className="size-3.5" /> Orientações Nutricionais
            </TabBtn>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0">
          <div className="p-6 space-y-4">
            {editorTab === "refeicoes" && (
              <>
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
                    onRemove={() => removeMeal(m.id)}
                  />
                ))}
              </>
            )}

            {editorTab === "orientacoes" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold">Orientações Nutricionais</h3>
                    <p className="text-xs text-muted-foreground">
                      Texto livre que vai junto no PDF e no WhatsApp do plano — ou enviado isolado abaixo.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOrientacoes(orientacoesFor(draft))}
                  >
                    Restaurar padrão
                  </Button>
                </div>
                <Textarea
                  value={orientacoes}
                  onChange={(e) => setOrientacoes(e.target.value)}
                  className="min-h-[420px] font-mono text-xs leading-relaxed"
                />
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground flex-1">
                    Enviar somente as orientações:
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      printHTML({
                        title: `Orientações — ${name || draft.name}`,
                        html: `<h1>Orientações Nutricionais</h1><div class="meta">${escapeHtml(name || draft.name)}${finalidade ? ` · ${escapeHtml(finalidade)}` : ""}</div><div class="orientacoes">${escapeHtml(orientacoes.trim())}</div>`,
                      })
                    }
                    disabled={!orientacoes.trim()}
                  >
                    <Printer className="size-3.5" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setOrientShareOpen(true)}
                    disabled={!orientacoes.trim()}
                    className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
                  >
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="border-l border-border bg-muted/30 p-6 space-y-4">
            <div>
              <Label htmlFor="t-name" className="text-xs">Nome</Label>
              <Input
                id="t-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="t-fin" className="text-xs">Finalidade / paciente</Label>
              <Input
                id="t-fin"
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
                placeholder="Ex: Ricardo M. — pré-temporada"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="t-obs" className="text-xs">Observações</Label>
              <Textarea
                id="t-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Onde usou, ajustes feitos..."
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="outline"
            onClick={() => {
              setApplyDone(null);
              setApplyPatient(null);
              setApplyOpen(true);
            }}
          >
            <Send className="size-4" /> Aplicar a paciente
          </Button>
          <Button onClick={save}>
            {isMine ? <Save className="size-4" /> : <Copy className="size-4" />}
            {isMine ? "Salvar alterações" : "Salvar em Meus Templates"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <SendShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={`Enviar "${name}" via WhatsApp`}
        defaultMessage={templateToWhatsText(currentForShare, { finalidade })}
        printHtml={templateToPrintHtml(currentForShare, { finalidade })}
        printTitle={name}
      />

      <SendShareDialog
        open={orientShareOpen}
        onOpenChange={setOrientShareOpen}
        title={`Enviar orientações de "${name}" via WhatsApp`}
        defaultMessage={`*Orientações Nutricionais*\n_${name || draft.name}${finalidade ? ` · ${finalidade}` : ""}_\n\n${orientacoes.trim()}\n\n— Enviado via FitJourney`}
        printHtml={`<h1>Orientações Nutricionais</h1><div class="meta">${escapeHtml(name || draft.name)}${finalidade ? ` · ${escapeHtml(finalidade)}` : ""}</div><div class="orientacoes">${escapeHtml(orientacoes.trim())}</div>`}
        printTitle={`Orientações — ${name || draft.name}`}
      />

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar template a paciente</DialogTitle>
            <DialogDescription>
              Escolha o paciente. O snapshot atual ({draft.meals.length} refeições · {totalKcal} kcal) será salvo no plano dele.
            </DialogDescription>
          </DialogHeader>

          {applyDone ? (
            <div className="py-4 flex items-center gap-3 text-sm">
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span>Plano publicado para <strong>{applyDone}</strong>.</span>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              <RealPatientPicker value={applyPatient} onChange={setApplyPatient} />
              <p className="text-[11px] text-muted-foreground">
                Snapshot atual (com suas edições) é congelado no banco como plano publicado. Imutável após publicar.
              </p>
              {applyError && (
                <p className="text-[11px] text-destructive">{applyError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {applyDone ? (
              <Button onClick={() => { setApplyOpen(false); setApplyDone(null); setApplyPatient(null); }}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancelar</Button>
                <Button
                  disabled={!applyPatient || applyBusy}
                  onClick={async () => {
                    if (!applyPatient) return;
                    setApplyBusy(true);
                    setApplyError(null);
                    try {
                      await publishPlan({
                        data: {
                          patientId: applyPatient.id,
                          snapshot: JSON.parse(JSON.stringify(currentForShare)),
                        },
                      });
                      setApplyDone(applyPatient.fullName);
                    } catch (e: any) {
                      setApplyError(e?.message ?? "Falha ao publicar plano.");
                    } finally {
                      setApplyBusy(false);
                    }
                  }}
                >
                  <Send className="size-4" /> {applyBusy ? "Publicando..." : "Publicar plano"}
                </Button>
              </>
            )}
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// ====================================================================
// MEAL EDITOR — refeição com itens desacoplados + scaling
// ====================================================================

function MealEditor({
  meal,
  onChange,
  onRemove,
}: {
  meal: PlannerMeal;
  onChange: (fn: (m: PlannerMeal) => PlannerMeal) => void;
  onRemove: () => void;
}) {
  const heroUrl = imgFor(meal.heroKey || meal.main.imageKey);
  const kcal = mealKcalFromOption(meal.main);
  const [pickerOpen, setPickerOpen] = useState(false);

  function changeMainItem(itemId: string, updater: (i: PlannerFoodItem) => PlannerFoodItem) {
    onChange((m) => updateMainItemWithScaling(m, itemId, updater));
  }

  function updateMainOption(updater: (o: PlannerMealOption) => PlannerMealOption) {
    onChange((m) => ({ ...m, main: updater(m.main) }));
  }

  function addMainItemFromCatalog(food: PlannerFoodItem) {
    onChange((m) => {
      const nextMain = { ...m.main, items: [...m.main.items, food] };
      const auto = buildAutoEquivalents(m, food);
      return {
        ...m,
        main: nextMain,
        equivalents: [...m.equivalents, ...auto],
      };
    });
  }

  function removeMainItem(itemId: string) {
    updateMainOption((o) => ({ ...o, items: o.items.filter((i) => i.id !== itemId) }));
  }

  function addEquivalent() {
    onChange((m) => ({
      ...m,
      equivalents: [
        ...m.equivalents,
        createEmptyMealOption({ title: "Nova opção equivalente" }),
      ],
    }));
  }

  function updateEquivalent(eqId: string, updater: (o: PlannerMealOption) => PlannerMealOption) {
    onChange((m) => ({
      ...m,
      equivalents: m.equivalents.map((e) => (e.id === eqId ? updater(e) : e)),
    }));
  }

  function removeEquivalent(eqId: string) {
    onChange((m) => ({ ...m, equivalents: m.equivalents.filter((e) => e.id !== eqId) }));
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="grid grid-cols-[140px_1fr] gap-0">
        <div className="relative aspect-square bg-muted">
          {heroUrl ? (
            <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-white text-[10px] font-mono">{kcal} kcal</p>
          </div>
        </div>

        <div className="p-3 space-y-3">
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

          {/* Título da opção principal */}
          <Input
            value={meal.main.title}
            onChange={(e) => updateMainOption((o) => ({ ...o, title: e.target.value }))}
            className="h-7 text-sm font-medium"
            placeholder="Título da refeição principal"
          />

          {/* Itens desacoplados */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                Alimentos da refeição ({meal.main.items.length})
              </p>
              <button
                onClick={() => setPickerOpen(true)}
                className="text-[10px] text-primary hover:underline"
              >
                + alimento
              </button>
            </div>
            {meal.main.items.map((item) => (
              <FoodItemRow
                key={item.id}
                item={item}
                primary
                onChange={(updated) => changeMainItem(item.id, () => updated)}
                onRemove={() => removeMainItem(item.id)}
              />
            ))}
            {meal.main.items.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">Sem alimentos.</p>
            )}
          </div>

          {/* Receita */}
          <RecipeEditor
            value={meal.main.recipe ?? ""}
            onChange={(v) => updateMainOption((o) => ({ ...o, recipe: v || undefined }))}
          />

          {/* Equivalentes (substituem a refeição inteira) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
                <Repeat2 className="size-3" /> Opções equivalentes ({meal.equivalents.length})
              </p>
              <button
                className="text-[10px] text-primary hover:underline"
                onClick={addEquivalent}
              >
                + opção
              </button>
            </div>
            <div className="space-y-2">
              {meal.equivalents.map((eq) => (
                <EquivalentOptionEditor
                  key={eq.id}
                  option={eq}
                  onChange={(fn) => updateEquivalent(eq.id, fn)}
                  onRemove={() => removeEquivalent(eq.id)}
                />
              ))}
              {meal.equivalents.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  Sem equivalentes. Adicione opções que o paciente pode usar no lugar desta refeição.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <FoodPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(f) =>
          addMainItemFromCatalog(
            createEmptyFoodItem({
              foodKey: f.foodKey,
              name: f.name,
              qty: f.qty,
              unit: f.unit,
              kcal: f.kcal,
              scaleGroup: f.scaleGroup,
            }),
          )
        }
      />
    </div>
  );
}

function normalizeFoodLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(cozido|cozida|grelhado|grelhada|preto|preta|de galinha|hidratada)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCatalogFood(foods: FoodDTO[] | undefined, item: PlannerFoodItem) {
  if (!foods?.length) return null;

  const itemName = normalizeFoodLabel(item.name);
  const exactName = foods.find((food) => normalizeFoodLabel(food.name) === itemName);
  if (exactName) return exactName;

  const aliasMatchers: Array<[RegExp, (foodName: string) => boolean]> = [
    [/arroz integral/, (foodName) => foodName.includes("arroz integral")],
    [/\barroz\b/, (foodName) => foodName.includes("arroz branco")],
    [/feijao preto/, (foodName) => foodName.includes("feijao preto")],
    [/\bfeijao\b/, (foodName) => foodName.includes("feijao carioca")],
    [/salada|folhas|alface/, (foodName) => foodName.includes("alface")],
    [/fruta sobremesa|\bmaca\b/, (foodName) => foodName.includes("maca")],
    [/\bleite\b/, (foodName) => foodName.includes("leite vaca integral")],
    [/iogurte/, (foodName) => foodName.includes("iogurte natural integral")],
    [/aveia/, (foodName) => foodName.includes("aveia")],
    [/banana|fruta picada/, (foodName) => foodName.includes("banana")],
    [/frango desfiado|frango grelhado|\bfrango\b/, (foodName) => foodName.includes("peito frango")],
    [/tilapia|\bpeixe\b/, (foodName) => foodName.includes("tilapia")],
    [/queijo branco|queijo minas/, (foodName) => foodName.includes("queijo minas")],
    [/pao integral/, (foodName) => foodName.includes("pao integral")],
    [/pao frances|\bpao\b/, (foodName) => foodName.includes("pao frances")],
    [/macarrao/, (foodName) => foodName.includes("macarrao cozido")],
    [/\bovo\b/, (foodName) => /\bovo\b/.test(foodName)],
    [/goma de tapioca|\btapioca\b/, (foodName) => foodName.includes("goma tapioca")],
    [/\bcuscuz\b/, (foodName) => foodName.includes("cuscuz")],
    [/\bcafe\b/, (foodName) => foodName.includes("cafe")],
    [/\bcha\b/, (foodName) => foodName.includes("cha")],
  ];

  for (const [itemPattern, matchesFood] of aliasMatchers) {
    if (itemPattern.test(itemName)) {
      const alias = foods.find((food) => matchesFood(normalizeFoodLabel(food.name)));
      if (alias) return alias;
    }
  }

  const keyMatches = item.foodKey ? foods.filter((food) => food.foodKey === item.foodKey) : [];
  if (keyMatches.length === 1) return keyMatches[0];

  const itemTokens = itemName.split(" ").filter((token) => token.length >= 4);
  return (
    keyMatches.find((food) => {
      const foodName = normalizeFoodLabel(food.name);
      return itemTokens.some((token) => foodName.includes(token));
    }) ?? null
  );
}

function gramsForCurrentPortion(item: PlannerFoodItem, food: FoodDTO) {
  if (item.unit === "g" || item.unit === "ml") return item.qty;
  const defaultMeasure = food.householdMeasures.find((measure) => measure.isDefault) ?? food.householdMeasures[0];
  return item.qty * (defaultMeasure?.gramsEquivalent ?? food.qty);
}

function nutritionForCurrentPortion(item: PlannerFoodItem, food: FoodDTO) {
  const grams = gramsForCurrentPortion(item, food);
  const factor = grams / 100;
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    grams: round(grams),
    kcal: Math.round(food.kcalPer100g * factor),
    protein: round(food.proteinPer100g * factor),
    carbs: round(food.carbPer100g * factor),
    fat: round(food.fatPer100g * factor),
    fiber: round(food.fiberPer100g * factor),
  };
}

function withCatalogKcal(
  item: PlannerFoodItem,
  food: FoodDTO | null,
  previous?: PlannerFoodItem,
) {
  if (food) {
    return { ...item, kcal: nutritionForCurrentPortion(item, food).kcal };
  }
  // Sem ficha no catálogo: escala kcal proporcionalmente à mudança de qty,
  // desde que a unidade não tenha mudado. Caso contrário mantém kcal.
  if (
    previous &&
    previous.unit === item.unit &&
    previous.qty > 0 &&
    item.qty !== previous.qty
  ) {
    const ratio = item.qty / previous.qty;
    return { ...item, kcal: Math.round(item.kcal * ratio) };
  }
  return item;
}

const FOOD_INFO_POPOVER_EVENT = "fitjourney-food-info-popover";

function FoodInfoPopover({
  item,
  match,
  onApplyMeasure,
}: {
  item: PlannerFoodItem;
  match: FoodDTO | null;
  onApplyMeasure: (grams: number, measureName: string) => void;
}) {
  const measures = match?.householdMeasures ?? [];
  const currentNutrition = match ? nutritionForCurrentPortion(item, match) : null;

  return (
    <PopoverContent side="right" align="start" sideOffset={8} className="w-72 p-3">
      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Informações do alimento
          </p>
          <p className="text-sm font-medium leading-tight">{item.name}</p>
        </div>

        {match && currentNutrition ? (
          <div className="text-[11px] text-muted-foreground border-t border-border pt-2 space-y-1">
            <p>Porção atual: {currentNutrition.grams} g equivalentes</p>
            <p className="font-mono text-foreground">
              {currentNutrition.kcal} kcal · P {currentNutrition.protein}g · C {currentNutrition.carbs}g · G{" "}
              {currentNutrition.fat}g
            </p>
            <p className="text-[10px]">
              Base TACO/IBGE por 100g apenas como referência técnica.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic border-t border-border pt-2">
            Sem ficha no catálogo TACO. Editando manualmente.
          </p>
        )}

        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            Medidas caseiras
          </p>
          {measures.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              Nenhuma medida cadastrada.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {measures.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onApplyMeasure(m.gramsEquivalent, m.measureName)}
                  className="text-left text-xs border border-border rounded px-2 py-1 hover:border-primary/50 hover:bg-primary/5 flex items-center justify-between gap-2"
                >
                  <span>{m.measureName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {m.gramsEquivalent} g
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Clique em uma medida para aplicar na quantidade.
          </p>
        </div>
      </div>
    </PopoverContent>
  );
}

function FoodItemRow({
  item,
  onChange,
  onRemove,
  primary = false,
}: {
  item: PlannerFoodItem;
  onChange: (i: PlannerFoodItem) => void;
  onRemove: () => void;
  primary?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const listFoodsFn = useServerFn(listFoods);
  const { data: foods } = useQuery({
    queryKey: ["foods-catalog"],
    queryFn: () => listFoodsFn(),
    staleTime: 5 * 60_000,
  });
  const catalogMatch = useMemo(() => findCatalogFood(foods, item), [foods, item.foodKey, item.name]);

  useEffect(() => {
    if (editing) nameInputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    const closeOtherPopover = (event: Event) => {
      const activeItemId = (event as CustomEvent<string>).detail;
      if (activeItemId !== item.id) setInfoOpen(false);
    };
    window.addEventListener(FOOD_INFO_POPOVER_EVENT, closeOtherPopover);
    return () => window.removeEventListener(FOOD_INFO_POPOVER_EVENT, closeOtherPopover);
  }, [item.id]);

  function setFoodInfoOpen(open: boolean) {
    if (open) {
      window.dispatchEvent(new CustomEvent(FOOD_INFO_POPOVER_EVENT, { detail: item.id }));
    }
    setInfoOpen(open);
  }

  function applyMeasure(grams: number, measureName: string) {
    onChange(withCatalogKcal({
      ...item,
      qty: grams,
      unit: "g",
    }, catalogMatch, item));
    setInfoOpen(false);
  }

  function updatePortion(patch: Partial<PlannerFoodItem>) {
    onChange(withCatalogKcal({ ...item, ...patch }, catalogMatch, item));
  }

  const baseClass =
    "flex items-center gap-2 rounded-md p-1.5 border " +
    (primary ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border");

  if (!editing) {
    return (
      <div
        className={baseClass + " group cursor-default select-none"}
        onDoubleClick={() => setEditing(true)}
        title="Duplo clique para editar"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{item.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono">
            {item.qty} {item.unit} · {item.kcal} kcal
          </p>
        </div>
        <Popover open={infoOpen} onOpenChange={setFoodInfoOpen}>
          <PopoverTrigger asChild>
            <button
              className="text-muted-foreground hover:text-primary p-1 opacity-60 group-hover:opacity-100 transition-opacity"
              title="Ver medidas caseiras"
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronDown className="size-3.5" />
            </button>
          </PopoverTrigger>
          <FoodInfoPopover item={item} match={catalogMatch} onApplyMeasure={applyMeasure} />
        </Popover>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="text-muted-foreground hover:text-primary p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Editar"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-destructive p-1 opacity-60 group-hover:opacity-100 transition-opacity"
          title="Remover"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <Input
        ref={nameInputRef}
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            setEditing(false);
          }
        }}
        className="h-7 flex-1 text-xs"
      />
      <Input
        type="number"
        value={item.qty}
        onChange={(e) => updatePortion({ qty: Number(e.target.value) || 0 })}
        className="h-7 w-16 text-xs text-right"
      />
      <Input
        value={item.unit}
        onChange={(e) => updatePortion({ unit: e.target.value })}
        className="h-7 w-14 text-xs"
      />
      <Input
        type="number"
        value={item.kcal}
        onChange={(e) => onChange({ ...item, kcal: Number(e.target.value) || 0 })}
        className="h-7 w-16 text-xs text-right font-mono text-primary"
        title="kcal"
      />
      <button
        onClick={() => setEditing(false)}
        className="text-primary hover:text-primary/80 p-1"
        title="Concluir edição"
      >
        <Save className="size-3.5" />
      </button>
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


function RecipeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(Boolean(value));
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
      >
        <ChefHat className="size-3" /> Adicionar modo de preparo
      </button>
    );
  }
  return (
    <div className="border border-dashed border-border rounded-md p-2 bg-muted/20">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
          <ChefHat className="size-3" /> Modo de preparo
        </p>
        <button
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="text-[10px] text-muted-foreground hover:text-destructive"
        >
          remover
        </button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] text-xs font-mono leading-relaxed"
        placeholder="1. Bata a goma com o ovo...&#10;2. Despeje na frigideira..."
      />
    </div>
  );
}

function EquivalentOptionEditor({
  option,
  onChange,
  onRemove,
}: {
  option: PlannerMealOption;
  onChange: (fn: (o: PlannerMealOption) => PlannerMealOption) => void;
  onRemove: () => void;
}) {
  const img = imgFor(option.imageKey);
  const kcal = mealKcalFromOption(option);
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function addItemFromCatalog(item: PlannerFoodItem) {
    onChange((o) => ({ ...o, items: [...o.items, item] }));
  }
  function changeItem(id: string, updated: PlannerFoodItem) {
    onChange((o) => ({ ...o, items: o.items.map((i) => (i.id === id ? updated : i)) }));
  }
  function removeItem(id: string) {
    onChange((o) => ({ ...o, items: o.items.filter((i) => i.id !== id) }));
  }

  return (
    <div className="border border-border rounded-md bg-muted/20 overflow-hidden">
      <div className="flex items-center gap-2 p-1.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="size-9 rounded bg-muted overflow-hidden flex-shrink-0"
          title={expanded ? "Recolher" : "Expandir"}
        >
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground">
              <ImageOff className="size-3" />
            </div>
          )}
        </button>
        <Input
          value={option.title}
          onChange={(e) => onChange((o) => ({ ...o, title: e.target.value }))}
          className="h-7 flex-1 text-xs"
        />
        <span className="text-[10px] font-mono text-primary px-1">{kcal} kcal</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] text-primary hover:underline px-1"
        >
          {expanded ? "−" : `${option.items.length} itens`}
        </button>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive p-1"
          title="Remover opção"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-2 pb-2 space-y-1.5 border-t border-border pt-2">
          {option.items.map((it) => (
            <FoodItemRow
              key={it.id}
              item={it}
              onChange={(u) => changeItem(it.id, u)}
              onRemove={() => removeItem(it.id)}
            />
          ))}
          <button
            onClick={() => setPickerOpen(true)}
            className="text-[10px] text-primary hover:underline"
          >
            + alimento
          </button>
        </div>
      )}
      <FoodPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(f) =>
          addItemFromCatalog(
            createEmptyFoodItem({
              foodKey: f.foodKey,
              name: f.name,
              qty: f.qty,
              unit: f.unit,
              kcal: f.kcal,
              scaleGroup: f.scaleGroup,
            }),
          )
        }
      />
    </div>
  );
}
