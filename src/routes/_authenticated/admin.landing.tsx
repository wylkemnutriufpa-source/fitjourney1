import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_LANDING_CONTENT,
  fetchLandingContent,
  saveLandingContent,
  uploadLandingAsset,
  type LandingContent,
} from "@/lib/landing/landing-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { VideoLoader } from "@/components/VideoLoader";
import {
  Save, Loader2, ArrowUp, ArrowDown, Trash2, Plus, Image as ImageIcon,
  Eye, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/landing")({
  component: AdminLandingEditor,
});

function move<T>(arr: T[], idx: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const j = idx + dir;
  if (j < 0 || j >= next.length) return next;
  [next[idx], next[j]] = [next[j], next[idx]];
  return next;
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function AdminLandingEditor() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchLandingContent()
      .then((c) => setContent(c))
      .finally(() => setLoading(false));
  }, []);

  function patch<K extends keyof LandingContent>(key: K, value: Partial<LandingContent[K]>) {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: { ...prev[key], ...value } };
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    try {
      await saveLandingContent(content);
      toast.success("Landing publicada", { description: "Já está no ar em fitjourney.com.br" });
      setDirty(false);
    } catch (e: any) {
      toast.error("Falha ao salvar", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Restaurar todo o conteúdo aos valores padrão? Isso descarta suas edições.")) return;
    setContent(DEFAULT_LANDING_CONTENT);
    setDirty(true);
  }

  if (loading || !content) {
    return (
      <div className="flex items-center justify-center py-20">
        <VideoLoader size="lg" label="Carregando editor…" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header de ações */}
      <div className="flex flex-wrap items-center gap-3 sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-medium">Editor da Landing Page</p>
          <p className="text-xs text-muted-foreground">
            Edições aplicadas ao salvar publicam ao vivo em <code>www.fitjourney.com.br</code>.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/" target="_blank" rel="noreferrer">
            <Eye className="size-4 mr-1.5" /> Ver landing <ExternalLink className="size-3.5 ml-1" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Restaurar padrão
        </Button>
        <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
          {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
          Salvar e publicar
        </Button>
      </div>

      {/* HERO */}
      <Section title="Hero (topo da página)">
        <Field label="Badge (faixa pequena acima do título)">
          <Input value={content.hero.badge}
            onChange={(e) => patch("hero", { badge: e.target.value })} />
        </Field>
        <Field label="Título — linha 1">
          <Input value={content.hero.title_line1}
            onChange={(e) => patch("hero", { title_line1: e.target.value })} />
        </Field>
        <Field label="Título — linha 2 (destaque dourado)">
          <Input value={content.hero.title_line2}
            onChange={(e) => patch("hero", { title_line2: e.target.value })} />
        </Field>
        <Field label="Descrição">
          <Textarea rows={3} value={content.hero.description}
            onChange={(e) => patch("hero", { description: e.target.value })} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Botão primário">
            <Input value={content.hero.cta_primary}
              onChange={(e) => patch("hero", { cta_primary: e.target.value })} />
          </Field>
          <Field label="Botão secundário">
            <Input value={content.hero.cta_secondary}
              onChange={(e) => patch("hero", { cta_secondary: e.target.value })} />
          </Field>
        </div>
        <Field label="Itens de confiança (linha de checks)">
          <StringList
            items={content.hero.trust_items}
            onChange={(items) => patch("hero", { trust_items: items })}
            placeholder="Ex: Sem cartão de crédito"
          />
        </Field>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-medium">Mídia do hero (lado direito)</p>
          <div className="flex gap-2 flex-wrap">
            {(["logo-orbital", "image", "video"] as const).map((t) => (
              <button
                key={t}
                onClick={() => patch("hero", { hero_media_type: t })}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  content.hero.hero_media_type === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {t === "logo-orbital" ? "Logo orbital (padrão)" : t === "image" ? "Imagem" : "Vídeo"}
              </button>
            ))}
          </div>
          {content.hero.hero_media_type !== "logo-orbital" && (
            <MediaUploader
              accept={content.hero.hero_media_type === "video" ? "video/*" : "image/*"}
              currentUrl={content.hero.hero_media_url}
              onUploaded={(url) => patch("hero", { hero_media_url: url })}
              onClear={() => patch("hero", { hero_media_url: "" })}
            />
          )}
        </div>
      </Section>

      {/* OBSTÁCULO */}
      <Section
        title="Seção 'Obstáculo invisível'"
        visible={content.obstacle.visible}
        onToggleVisible={(v) => patch("obstacle", { visible: v })}
      >
        <Field label="Eyebrow"><Input value={content.obstacle.eyebrow} onChange={(e) => patch("obstacle", { eyebrow: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Título linha 1"><Input value={content.obstacle.title_line1} onChange={(e) => patch("obstacle", { title_line1: e.target.value })} /></Field>
          <Field label="Título linha 2 (itálico dourado)"><Input value={content.obstacle.title_line2} onChange={(e) => patch("obstacle", { title_line2: e.target.value })} /></Field>
        </div>
        <Field label="Descrição"><Textarea rows={3} value={content.obstacle.description} onChange={(e) => patch("obstacle", { description: e.target.value })} /></Field>

        <p className="text-sm font-medium mt-2">Cards (3 obstáculos)</p>
        <div className="space-y-3">
          {content.obstacle.cards.map((c, i) => (
            <ItemCard
              key={c.id}
              onUp={() => patch("obstacle", { cards: move(content.obstacle.cards, i, -1) })}
              onDown={() => patch("obstacle", { cards: move(content.obstacle.cards, i, 1) })}
              onDelete={() => patch("obstacle", { cards: content.obstacle.cards.filter((_, j) => j !== i) })}
            >
              <Input value={c.title} placeholder="Título"
                onChange={(e) => {
                  const next = [...content.obstacle.cards];
                  next[i] = { ...c, title: e.target.value };
                  patch("obstacle", { cards: next });
                }} />
              <Textarea rows={2} value={c.desc} placeholder="Descrição"
                onChange={(e) => {
                  const next = [...content.obstacle.cards];
                  next[i] = { ...c, desc: e.target.value };
                  patch("obstacle", { cards: next });
                }} />
              <Textarea rows={2} value={c.consequence} placeholder="Consequência"
                onChange={(e) => {
                  const next = [...content.obstacle.cards];
                  next[i] = { ...c, consequence: e.target.value };
                  patch("obstacle", { cards: next });
                }} />
              <div className="flex gap-2">
                {(["primary", "gold"] as const).map((t) => (
                  <button key={t}
                    onClick={() => {
                      const next = [...content.obstacle.cards];
                      next[i] = { ...c, tone: t };
                      patch("obstacle", { cards: next });
                    }}
                    className={`px-2.5 py-1 text-xs rounded border ${
                      c.tone === t ? "bg-primary text-primary-foreground border-primary" : "border-border"
                    }`}
                  >
                    {t === "primary" ? "Verde" : "Dourado"}
                  </button>
                ))}
              </div>
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("obstacle", {
              cards: [...content.obstacle.cards, { id: genId("c"), title: "Novo obstáculo", desc: "", consequence: "", tone: "primary" }],
            })}
          >
            <Plus className="size-4 mr-1" /> Adicionar card
          </Button>
        </div>
        <Field label="Texto do rodapé"><Textarea rows={2} value={content.obstacle.footer_text} onChange={(e) => patch("obstacle", { footer_text: e.target.value })} /></Field>
      </Section>

      {/* FEATURES */}
      <Section
        title="Seção 'Recursos' (grid de features)"
        visible={content.features.visible}
        onToggleVisible={(v) => patch("features", { visible: v })}
      >
        <Field label="Eyebrow"><Input value={content.features.eyebrow} onChange={(e) => patch("features", { eyebrow: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Título linha 1"><Input value={content.features.title_line1} onChange={(e) => patch("features", { title_line1: e.target.value })} /></Field>
          <Field label="Título linha 2 (destaque)"><Input value={content.features.title_line2} onChange={(e) => patch("features", { title_line2: e.target.value })} /></Field>
        </div>
        <Field label="Descrição"><Textarea rows={2} value={content.features.description} onChange={(e) => patch("features", { description: e.target.value })} /></Field>
        <p className="text-sm font-medium mt-2">Features ({content.features.items.length})</p>
        <div className="space-y-3">
          {content.features.items.map((f, i) => (
            <ItemCard key={f.id}
              onUp={() => patch("features", { items: move(content.features.items, i, -1) })}
              onDown={() => patch("features", { items: move(content.features.items, i, 1) })}
              onDelete={() => patch("features", { items: content.features.items.filter((_, j) => j !== i) })}
            >
              <div className="grid sm:grid-cols-3 gap-2">
                <Input placeholder="Ícone (Brain, Shield, Users...)" value={f.icon}
                  onChange={(e) => { const n = [...content.features.items]; n[i] = { ...f, icon: e.target.value }; patch("features", { items: n }); }} />
                <Input placeholder="Título" value={f.title}
                  onChange={(e) => { const n = [...content.features.items]; n[i] = { ...f, title: e.target.value }; patch("features", { items: n }); }} />
                <Input placeholder="Tag (Core, Novo...)" value={f.tag}
                  onChange={(e) => { const n = [...content.features.items]; n[i] = { ...f, tag: e.target.value }; patch("features", { items: n }); }} />
              </div>
              <Textarea rows={2} placeholder="Descrição" value={f.desc}
                onChange={(e) => { const n = [...content.features.items]; n[i] = { ...f, desc: e.target.value }; patch("features", { items: n }); }} />
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("features", {
              items: [...content.features.items, { id: genId("f"), icon: "Sparkles", title: "Nova feature", tag: "Novo", desc: "" }],
            })}>
            <Plus className="size-4 mr-1" /> Adicionar feature
          </Button>
        </div>
      </Section>

      {/* PRICING */}
      <Section
        title="Seção 'Planos & Preços'"
        visible={content.pricing.visible}
        onToggleVisible={(v) => patch("pricing", { visible: v })}
      >
        <Field label="Eyebrow"><Input value={content.pricing.eyebrow} onChange={(e) => patch("pricing", { eyebrow: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Título linha 1"><Input value={content.pricing.title_line1} onChange={(e) => patch("pricing", { title_line1: e.target.value })} /></Field>
          <Field label="Título linha 2 (destaque)"><Input value={content.pricing.title_line2} onChange={(e) => patch("pricing", { title_line2: e.target.value })} /></Field>
        </div>
        <Field label="Descrição"><Textarea rows={2} value={content.pricing.description} onChange={(e) => patch("pricing", { description: e.target.value })} /></Field>

        <div className="space-y-3">
          {content.pricing.plans.map((p, i) => (
            <ItemCard key={p.id}
              onUp={() => patch("pricing", { plans: move(content.pricing.plans, i, -1) })}
              onDown={() => patch("pricing", { plans: move(content.pricing.plans, i, 1) })}
              onDelete={() => patch("pricing", { plans: content.pricing.plans.filter((_, j) => j !== i) })}
            >
              <div className="grid sm:grid-cols-3 gap-2">
                <Input placeholder="Nome (Basic, Pro...)" value={p.name}
                  onChange={(e) => { const n = [...content.pricing.plans]; n[i] = { ...p, name: e.target.value }; patch("pricing", { plans: n }); }} />
                <Input placeholder="Preço (R$ 39,90)" value={p.price}
                  onChange={(e) => { const n = [...content.pricing.plans]; n[i] = { ...p, price: e.target.value }; patch("pricing", { plans: n }); }} />
                <Input placeholder="Período (/mês)" value={p.period}
                  onChange={(e) => { const n = [...content.pricing.plans]; n[i] = { ...p, period: e.target.value }; patch("pricing", { plans: n }); }} />
              </div>
              <div className="flex items-center gap-3">
                <Label className="flex items-center gap-2 text-sm">
                  <Switch checked={p.popular}
                    onCheckedChange={(v) => { const n = [...content.pricing.plans]; n[i] = { ...p, popular: v }; patch("pricing", { plans: n }); }}
                  />
                  Plano popular (badge dourada)
                </Label>
              </div>
              <Input placeholder="Texto do botão" value={p.cta}
                onChange={(e) => { const n = [...content.pricing.plans]; n[i] = { ...p, cta: e.target.value }; patch("pricing", { plans: n }); }} />
              <Field label="Features do plano">
                <StringList items={p.features}
                  onChange={(items) => { const n = [...content.pricing.plans]; n[i] = { ...p, features: items }; patch("pricing", { plans: n }); }}
                  placeholder="Ex: Pacientes ilimitados"
                />
              </Field>
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("pricing", {
              plans: [...content.pricing.plans, { id: genId("plan"), name: "Novo plano", price: "R$ 0,00", period: "/mês", popular: false, cta: "Assinar", features: [] }],
            })}>
            <Plus className="size-4 mr-1" /> Adicionar plano
          </Button>
        </div>
      </Section>

      {/* STATS */}
      <Section
        title="Estatísticas (numbers no hero)"
        visible={content.stats.visible}
        onToggleVisible={(v) => patch("stats", { visible: v })}
      >
        <div className="space-y-3">
          {content.stats.items.map((s, i) => (
            <ItemCard key={s.id}
              onUp={() => patch("stats", { items: move(content.stats.items, i, -1) })}
              onDown={() => patch("stats", { items: move(content.stats.items, i, 1) })}
              onDelete={() => patch("stats", { items: content.stats.items.filter((_, j) => j !== i) })}
            >
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Valor (500+, 99.9%)" value={s.value}
                  onChange={(e) => { const n = [...content.stats.items]; n[i] = { ...s, value: e.target.value }; patch("stats", { items: n }); }} />
                <Input placeholder="Rótulo" value={s.label}
                  onChange={(e) => { const n = [...content.stats.items]; n[i] = { ...s, label: e.target.value }; patch("stats", { items: n }); }} />
              </div>
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("stats", { items: [...content.stats.items, { id: genId("s"), value: "100+", label: "Novo" }] })}>
            <Plus className="size-4 mr-1" /> Adicionar estatística
          </Button>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section
        title="Depoimentos"
        visible={content.testimonials.visible}
        onToggleVisible={(v) => patch("testimonials", { visible: v })}
      >
        <Field label="Eyebrow"><Input value={content.testimonials.eyebrow} onChange={(e) => patch("testimonials", { eyebrow: e.target.value })} /></Field>
        <Field label="Título"><Input value={content.testimonials.title} onChange={(e) => patch("testimonials", { title: e.target.value })} /></Field>
        <div className="space-y-3">
          {content.testimonials.items.map((t, i) => (
            <ItemCard key={t.id}
              onUp={() => patch("testimonials", { items: move(content.testimonials.items, i, -1) })}
              onDown={() => patch("testimonials", { items: move(content.testimonials.items, i, 1) })}
              onDelete={() => patch("testimonials", { items: content.testimonials.items.filter((_, j) => j !== i) })}
            >
              <div className="grid sm:grid-cols-3 gap-2">
                <Input placeholder="Nome" value={t.name}
                  onChange={(e) => { const n = [...content.testimonials.items]; n[i] = { ...t, name: e.target.value }; patch("testimonials", { items: n }); }} />
                <Input placeholder="Cargo / especialidade" value={t.role}
                  onChange={(e) => { const n = [...content.testimonials.items]; n[i] = { ...t, role: e.target.value }; patch("testimonials", { items: n }); }} />
                <Input placeholder="Iniciais (AC)" maxLength={3} value={t.avatar}
                  onChange={(e) => { const n = [...content.testimonials.items]; n[i] = { ...t, avatar: e.target.value }; patch("testimonials", { items: n }); }} />
              </div>
              <Textarea rows={3} placeholder="Depoimento" value={t.text}
                onChange={(e) => { const n = [...content.testimonials.items]; n[i] = { ...t, text: e.target.value }; patch("testimonials", { items: n }); }} />
              <Input type="number" min={1} max={5} value={t.rating}
                onChange={(e) => { const n = [...content.testimonials.items]; n[i] = { ...t, rating: Number(e.target.value) }; patch("testimonials", { items: n }); }} />
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("testimonials", {
              items: [...content.testimonials.items, { id: genId("t"), name: "Dr(a). Nome", role: "Especialidade", rating: 5, avatar: "XX", text: "" }],
            })}>
            <Plus className="size-4 mr-1" /> Adicionar depoimento
          </Button>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        title="FAQ"
        visible={content.faq.visible}
        onToggleVisible={(v) => patch("faq", { visible: v })}
      >
        <Field label="Eyebrow"><Input value={content.faq.eyebrow} onChange={(e) => patch("faq", { eyebrow: e.target.value })} /></Field>
        <Field label="Título"><Input value={content.faq.title} onChange={(e) => patch("faq", { title: e.target.value })} /></Field>
        <div className="space-y-3">
          {content.faq.items.map((q, i) => (
            <ItemCard key={q.id}
              onUp={() => patch("faq", { items: move(content.faq.items, i, -1) })}
              onDown={() => patch("faq", { items: move(content.faq.items, i, 1) })}
              onDelete={() => patch("faq", { items: content.faq.items.filter((_, j) => j !== i) })}
            >
              <Input placeholder="Pergunta" value={q.q}
                onChange={(e) => { const n = [...content.faq.items]; n[i] = { ...q, q: e.target.value }; patch("faq", { items: n }); }} />
              <Textarea rows={3} placeholder="Resposta" value={q.a}
                onChange={(e) => { const n = [...content.faq.items]; n[i] = { ...q, a: e.target.value }; patch("faq", { items: n }); }} />
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("faq", { items: [...content.faq.items, { id: genId("q"), q: "Nova pergunta?", a: "" }] })}>
            <Plus className="size-4 mr-1" /> Adicionar pergunta
          </Button>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section
        title="CTA final (antes do rodapé)"
        visible={content.final_cta.visible}
        onToggleVisible={(v) => patch("final_cta", { visible: v })}
      >
        <Field label="Título"><Input value={content.final_cta.title} onChange={(e) => patch("final_cta", { title: e.target.value })} /></Field>
        <Field label="Descrição"><Textarea rows={2} value={content.final_cta.description} onChange={(e) => patch("final_cta", { description: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Botão primário"><Input value={content.final_cta.cta_primary} onChange={(e) => patch("final_cta", { cta_primary: e.target.value })} /></Field>
          <Field label="Botão secundário"><Input value={content.final_cta.cta_secondary} onChange={(e) => patch("final_cta", { cta_secondary: e.target.value })} /></Field>
        </div>
      </Section>

      {/* TRUST BADGES */}
      <Section
        title="Trust badges (linha de selos)"
        visible={content.trust_badges.visible}
        onToggleVisible={(v) => patch("trust_badges", { visible: v })}
      >
        <div className="space-y-3">
          {content.trust_badges.items.map((b, i) => (
            <ItemCard key={b.id}
              onUp={() => patch("trust_badges", { items: move(content.trust_badges.items, i, -1) })}
              onDown={() => patch("trust_badges", { items: move(content.trust_badges.items, i, 1) })}
              onDelete={() => patch("trust_badges", { items: content.trust_badges.items.filter((_, j) => j !== i) })}
            >
              <Input placeholder="Rótulo" value={b.label}
                onChange={(e) => { const n = [...content.trust_badges.items]; n[i] = { ...b, label: e.target.value }; patch("trust_badges", { items: n }); }} />
            </ItemCard>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => patch("trust_badges", { items: [...content.trust_badges.items, { id: genId("tb"), label: "Novo selo" }] })}>
            <Plus className="size-4 mr-1" /> Adicionar selo
          </Button>
        </div>
      </Section>

      {/* Floating save bar para mobile */}
      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40">
          <div className="glass border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Alterações não salvas</span>
            <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1 sm:flex-none">
              {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
              Publicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Subcomponentes ─── */

function Section({
  title, children, visible, onToggleVisible,
}: {
  title: string;
  children: React.ReactNode;
  visible?: boolean;
  onToggleVisible?: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <button onClick={() => setOpen(!open)} className="flex-1 text-left font-semibold">
          {open ? "▾" : "▸"} {title}
        </button>
        {typeof visible === "boolean" && onToggleVisible && (
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={visible} onCheckedChange={onToggleVisible} />
            {visible ? "Visível" : "Oculta"}
          </Label>
        )}
      </header>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function ItemCard({
  children, onUp, onDown, onDelete,
}: {
  children: React.ReactNode;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/10">
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="size-7" onClick={onUp}><ArrowUp className="size-3.5" /></Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={onDown}><ArrowDown className="size-3.5" /></Button>
        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={onDelete}><Trash2 className="size-3.5" /></Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StringList({
  items, onChange, placeholder,
}: { items: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {items.map((s, i) => (
        <div key={i} className="flex gap-2">
          <Input value={s} placeholder={placeholder}
            onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} />
          <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => onChange(move(items, i, -1))}><ArrowUp className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => onChange(move(items, i, 1))}><ArrowDown className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-9 shrink-0 text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="size-4 mr-1" /> Adicionar item
      </Button>
    </div>
  );
}

function MediaUploader({
  accept, currentUrl, onUploaded, onClear,
}: {
  accept: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLandingAsset(file);
      onUploaded(url);
      toast.success("Mídia carregada");
    } catch (e: any) {
      toast.error("Falha no upload", { description: e?.message });
    } finally {
      setUploading(false);
    }
  }

  const isVideo = accept.startsWith("video");
  return (
    <div className="space-y-2">
      {currentUrl && (
        <div className="rounded-lg overflow-hidden border border-border max-w-md">
          {isVideo ? (
            <video src={currentUrl} controls className="w-full" />
          ) : (
            <img src={currentUrl} alt="Preview" className="w-full" />
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <ImageIcon className="size-4 mr-1.5" />}
          {currentUrl ? "Trocar" : "Enviar arquivo"}
        </Button>
        {currentUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="size-4 mr-1.5" /> Remover
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Ou cole uma URL: <Input className="mt-1" placeholder="https://..." value={currentUrl} onChange={(e) => onUploaded(e.target.value)} />
      </p>
    </div>
  );
}
