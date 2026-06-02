import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { LogoOrbital } from "@/components/LogoOrbital";
import {
  useLogoSettingsEditor,
  SLOT_META,
  EFFECT_OPTIONS,
  VARIANT_OPTIONS,
  DEFAULTS,
  type LogoSlot,
  type LogoVariant,
  type SlotConfig,
} from "@/lib/logo-settings";
import type { LogoEffect } from "@/components/LogoOrbital";
import { RotateCcw, Upload, Trash2, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/logos")({
  component: LogosAdminPage,
});

const MAX_UPLOAD_BYTES = 800 * 1024; // 800 KB — armazenado em localStorage como data URL

function LogosAdminPage() {
  const { get, update, reset } = useLogoSettingsEditor();
  const [errorBySlot, setErrorBySlot] = useState<Partial<Record<LogoSlot, string>>>({});
  const slots = Object.keys(SLOT_META) as LogoSlot[];

  async function handleUpload(slot: LogoSlot, file: File) {
    setErrorBySlot((s) => ({ ...s, [slot]: undefined }));
    if (!file.type.startsWith("image/")) {
      setErrorBySlot((s) => ({ ...s, [slot]: "Arquivo precisa ser uma imagem." }));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorBySlot((s) => ({
        ...s,
        [slot]: `Imagem muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: ${MAX_UPLOAD_BYTES / 1024} KB.`,
      }));
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    update(slot, { customUrl: dataUrl, variant: "orbital" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Logos — Tamanho, Efeitos, Upload & Espaçamento</h2>
          <p className="text-sm text-muted-foreground">
            Ajuste cada logo com preview ao vivo no contexto real (landing / app). Configurações salvas no navegador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="text-xs font-mono uppercase tracking-widest px-3 py-2 rounded-md border border-border hover:border-primary/60 hover:text-primary transition inline-flex items-center gap-2"
        >
          <RotateCcw className="size-3" /> Resetar tudo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot) => {
          const cfg = get(slot);
          const meta = SLOT_META[slot];
          const def = DEFAULTS[slot];
          const err = errorBySlot[slot];
          return (
            <SlotCard
              key={slot}
              slot={slot}
              cfg={cfg}
              label={meta.label}
              description={meta.description}
              context={meta.context}
              def={def}
              error={err}
              onUpload={handleUpload}
              onUpdate={(patch) => update(slot, patch)}
              onResetSlot={() => reset(slot)}
              onClearCustom={() => update(slot, { customUrl: null })}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SlotCardProps {
  slot: LogoSlot;
  cfg: SlotConfig;
  label: string;
  description: string;
  context: "landing" | "app";
  def: SlotConfig;
  error?: string;
  onUpload: (slot: LogoSlot, f: File) => void;
  onUpdate: (patch: Partial<SlotConfig>) => void;
  onResetSlot: () => void;
  onClearCustom: () => void;
}

function SlotCard({
  slot,
  cfg,
  label,
  description,
  context,
  def,
  error,
  onUpload,
  onUpdate,
  onResetSlot,
  onClearCustom,
}: SlotCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary">{slot}</div>
          <div className="font-semibold mt-0.5">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <button
          type="button"
          onClick={onResetSlot}
          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          title="Restaurar padrão desta seção"
        >
          <RotateCcw className="size-3" /> padrão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* PREVIEW LADO A LADO — preview cru + contexto real */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PreviewBox label="Preview isolado">
              <LogoOrbital slot={slot} />
            </PreviewBox>
            <PreviewBox label={context === "landing" ? "No contexto da landing" : "No contexto do app"}>
              <ContextMock slot={slot} />
            </PreviewBox>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="space-y-3">
          {/* Upload */}
          <div className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Logo customizada
            </div>
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-md bg-background border border-border grid place-items-center overflow-hidden shrink-0">
                {cfg.customUrl ? (
                  <img src={cfg.customUrl} alt="" className="size-full object-contain" />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-mono uppercase tracking-widest px-2 py-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary inline-flex items-center gap-1.5"
              >
                <Upload className="size-3" /> Upload
              </button>
              {cfg.customUrl && (
                <button
                  type="button"
                  onClick={onClearCustom}
                  className="text-xs font-mono uppercase tracking-widest px-2 py-1.5 rounded-md border border-border hover:border-destructive/60 hover:text-destructive inline-flex items-center gap-1.5"
                >
                  <Trash2 className="size-3" /> Remover
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(slot, f);
                e.target.value = "";
              }}
            />
            {error && <div className="text-xs text-destructive">{error}</div>}
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              PNG/SVG/JPG até 800 KB. Salva localmente no seu navegador.
            </p>
          </div>

          <SliderRow
            label="Tamanho"
            value={cfg.sizePx}
            min={16}
            max={320}
            step={2}
            suffix="px"
            onChange={(v) => onUpdate({ sizePx: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <SliderRow label="Padding X" value={cfg.paddingX} min={0} max={64} step={1} suffix="px" onChange={(v) => onUpdate({ paddingX: v })} />
            <SliderRow label="Padding Y" value={cfg.paddingY} min={0} max={64} step={1} suffix="px" onChange={(v) => onUpdate({ paddingY: v })} />
            <SliderRow label="Margin X" value={cfg.marginX} min={0} max={64} step={1} suffix="px" onChange={(v) => onUpdate({ marginX: v })} />
            <SliderRow label="Margin Y" value={cfg.marginY} min={0} max={64} step={1} suffix="px" onChange={(v) => onUpdate({ marginY: v })} />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
              Variante
            </label>
            <select
              value={cfg.variant}
              onChange={(e) => onUpdate({ variant: e.target.value as LogoVariant })}
              className="w-full text-sm px-2 py-1.5 rounded-md border border-border bg-background"
            >
              {VARIANT_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            {cfg.customUrl && cfg.variant === "video" && (
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Logo customizada usa a versão estática mesmo com variante "vídeo".
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
              Efeito
            </label>
            <select
              value={cfg.effect}
              onChange={(e) => onUpdate({ effect: e.target.value as LogoEffect })}
              disabled={cfg.variant === "static"}
              className="w-full text-sm px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-40"
            >
              {EFFECT_OPTIONS.map((eff) => (
                <option key={eff} value={eff}>{eff}</option>
              ))}
            </select>
          </div>

          <div className="text-[10px] font-mono text-muted-foreground/70">
            padrão: {def.sizePx}px · {def.variant} · {def.effect}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border/60 overflow-hidden">
      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-card/50">
        {label}
      </div>
      <div className="min-h-[180px] grid place-items-center p-4">{children}</div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-between">
        <span>{label}</span>
        <span className="text-foreground tabular-nums">{value}{suffix}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

/** Mock minimalista do contexto onde cada logo aparece de fato. */
function ContextMock({ slot }: { slot: LogoSlot }) {
  if (slot === "landing-header") {
    return (
      <div className="w-full max-w-md rounded-md border border-border bg-background/80 px-3 py-2 flex items-center gap-3">
        <LogoOrbital slot={slot} />
        <span className="fj-wordmark text-sm">FitJourney</span>
        <div className="ml-auto flex gap-2 text-[10px] font-mono uppercase text-muted-foreground">
          <span>Sobre</span><span>Preços</span><span>Login</span>
        </div>
      </div>
    );
  }
  if (slot === "landing-footer") {
    return (
      <div className="w-full max-w-md rounded-md border border-border bg-background/80 p-3 flex items-center gap-3">
        <LogoOrbital slot={slot} />
        <div className="text-[10px] font-mono uppercase text-muted-foreground">© FitJourney 2026</div>
      </div>
    );
  }
  if (slot === "auth-form") {
    return (
      <div className="w-full max-w-xs rounded-md border border-border bg-background/80 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <LogoOrbital slot={slot} />
          <span className="text-sm font-semibold">Entrar</span>
        </div>
        <div className="h-6 rounded bg-muted/40" />
        <div className="h-6 rounded bg-muted/40" />
      </div>
    );
  }
  if (slot === "auth-hero") {
    return (
      <div className="w-full max-w-sm rounded-md border border-border bg-background/80 p-6 flex flex-col items-center gap-3">
        <LogoOrbital slot={slot} />
        <span className="text-sm font-semibold">FitJourney</span>
      </div>
    );
  }
  if (slot === "sidebar") {
    return (
      <div className="w-full max-w-[220px] rounded-md border border-border bg-sidebar/60 p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <LogoOrbital slot={slot} />
          <span className="fj-wordmark text-sm">FitJourney</span>
        </div>
        <div className="space-y-1">
          <div className="h-4 rounded bg-muted/40" />
          <div className="h-4 rounded bg-muted/40" />
          <div className="h-4 rounded bg-muted/40" />
        </div>
      </div>
    );
  }
  // mobile-header
  return (
    <div className="w-full max-w-sm rounded-md border border-border bg-background/80 px-3 py-2 flex items-center gap-2">
      <div className="size-6 rounded border border-border" />
      <LogoOrbital slot={slot} />
      <span className="text-xs text-muted-foreground ml-auto">/dashboard</span>
    </div>
  );
}
