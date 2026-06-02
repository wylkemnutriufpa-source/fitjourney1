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
import { uploadLandingAsset } from "@/lib/landing/landing-content";

export const Route = createFileRoute("/_authenticated/admin/logos")({
  component: LogosAdminPage,
});

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB (imagem — igual avatar)
const MAX_VIDEO_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_VIDEO_DURATION_S = 6;
const MAX_DIMENSION = 1024;
const MIN_DIMENSION = 32;
const MAX_ASPECT_RATIO = 6;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);base64/.exec(meta)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}


function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível decodificar a imagem"));
    img.src = src;
  });
}

/** Comprime/redimensiona via canvas, preservando proporção e transparência (PNG). */
async function compressImage(file: File): Promise<{ dataUrl: string; width: number; height: number; bytes: number }> {
  const originalUrl = await readAsDataUrl(file);
  if (file.type === "image/svg+xml") {
    return { dataUrl: originalUrl, width: 0, height: 0, bytes: file.size };
  }
  const img = await loadImage(originalUrl);
  const { width: w0, height: h0 } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(w0, h0));
  const width = Math.round(w0 * scale);
  const height = Math.round(h0 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível neste navegador");
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/png");
  const bytes = Math.ceil((dataUrl.length - "data:image/png;base64,".length) * 0.75);
  return { dataUrl, width, height, bytes };
}

function LogosAdminPage() {
  const { get, update, reset } = useLogoSettingsEditor();
  const [errorBySlot, setErrorBySlot] = useState<Partial<Record<LogoSlot, string>>>({});
  const [infoBySlot, setInfoBySlot] = useState<Partial<Record<LogoSlot, string>>>({});
  const slots = Object.keys(SLOT_META) as LogoSlot[];

  async function handleUpload(slot: LogoSlot, file: File) {
    setErrorBySlot((s) => ({ ...s, [slot]: undefined }));
    setInfoBySlot((s) => ({ ...s, [slot]: undefined }));

    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setErrorBySlot((s) => ({
        ...s,
        [slot]: "Arquivo precisa ser imagem (PNG, JPG, WebP, SVG) ou vídeo curto (MP4, WebM).",
      }));
      return;
    }

    // ===== VÍDEO (boomerang curto) =====
    if (isVideo) {
      if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
        setErrorBySlot((s) => ({
          ...s,
          [slot]: `Vídeo muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: 4 MB.`,
        }));
        return;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        const duration = await new Promise<number>((resolve, reject) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.muted = true;
          v.onloadedmetadata = () => resolve(v.duration || 0);
          v.onerror = () => reject(new Error("Não foi possível ler o vídeo."));
          v.src = dataUrl;
        });
        if (duration > MAX_VIDEO_DURATION_S + 0.5) {
          setErrorBySlot((s) => ({
            ...s,
            [slot]: `Vídeo longo demais (${duration.toFixed(1)}s). Máximo: ${MAX_VIDEO_DURATION_S}s — use um clipe curto estilo boomerang.`,
          }));
          return;
        }
        setInfoBySlot((s) => ({ ...s, [slot]: "Enviando vídeo…" }));
        const publicUrl = await uploadLandingAsset(file);
        update(slot, { customUrl: publicUrl, variant: "orbital" });
        setInfoBySlot((s) => ({
          ...s,
          [slot]: `Pronto: vídeo ${duration.toFixed(1)}s · ${(file.size / 1024).toFixed(0)} KB. Salvo no servidor — reflete em todo o sistema.`,
        }));
      } catch (e: any) {
        setErrorBySlot((s) => ({ ...s, [slot]: e?.message ?? "Falha ao processar vídeo." }));
      }
      return;
    }

    // ===== IMAGEM =====
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorBySlot((s) => ({
        ...s,
        [slot]: `Imagem muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: 4 MB.`,
      }));
      return;
    }

    try {
      const { dataUrl, width, height, bytes } = await compressImage(file);

      if (width > 0 && height > 0) {
        if (Math.min(width, height) < MIN_DIMENSION) {
          setErrorBySlot((s) => ({
            ...s,
            [slot]: `Imagem pequena demais (${width}×${height}px). Mínimo: ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
          }));
          return;
        }
        const ratio = Math.max(width, height) / Math.min(width, height);
        if (ratio > MAX_ASPECT_RATIO) {
          setErrorBySlot((s) => ({
            ...s,
            [slot]: `Proporção muito alongada (${ratio.toFixed(1)}:1). Use uma logo mais quadrada (até ${MAX_ASPECT_RATIO}:1).`,
          }));
          return;
        }
      }

      setInfoBySlot((s) => ({ ...s, [slot]: "Enviando imagem…" }));
      const blob = dataUrlToBlob(dataUrl);
      const ext = (blob.type.split("/")[1] || "png").replace("svg+xml", "svg");
      const uploadFile = new File([blob], `logo.${ext}`, { type: blob.type });
      const publicUrl = await uploadLandingAsset(uploadFile);
      update(slot, { customUrl: publicUrl, variant: "orbital" });

      const compressedKb = (bytes / 1024).toFixed(0);
      const originalKb = (file.size / 1024).toFixed(0);
      setInfoBySlot((s) => ({
        ...s,
        [slot]:
          width > 0
            ? `Pronto: ${width}×${height}px · ${compressedKb} KB (original ${originalKb} KB). Salvo no servidor — reflete em todo o sistema.`
            : `Pronto: SVG ${originalKb} KB. Salvo no servidor.`,
      }));
    } catch (e: any) {
      setErrorBySlot((s) => ({
        ...s,
        [slot]: e?.message ?? "Falha ao processar a imagem.",
      }));
    }
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Logos — Tamanho, Efeitos, Upload & Espaçamento</h2>
          <p className="text-sm text-muted-foreground">
            Ajuste cada logo com preview ao vivo no contexto real (landing / app). Salvo no servidor — reflete em todo o sistema (incluindo o app do paciente em qualquer dispositivo).
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
          const info = infoBySlot[slot];
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
              info={info}
              onUpload={handleUpload}
              onUpdate={(patch) => update(slot, patch)}
              onResetSlot={() => {
                reset(slot);
                setErrorBySlot((s) => ({ ...s, [slot]: undefined }));
                setInfoBySlot((s) => ({ ...s, [slot]: `Slot "${meta.label}" restaurado ao padrão.` }));
              }}
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
  info?: string;
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
  info,
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
          className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary transition inline-flex items-center gap-1.5"
          title={`Restaurar "${label}" ao padrão (não afeta outros slots)`}
        >
          <RotateCcw className="size-3" /> Resetar este slot
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
                  /^data:video\//i.test(cfg.customUrl) || /\.(mp4|webm)(\?|$)/i.test(cfg.customUrl) ? (
                    <video
                      src={cfg.customUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="size-full object-contain"
                    />
                  ) : (
                    <img src={cfg.customUrl} alt="" className="size-full object-contain" />
                  )
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
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(slot, f);
                e.target.value = "";
              }}
            />
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1.5">
                {error}
              </div>
            )}
            {info && !error && (
              <div className="text-xs text-primary bg-primary/10 border border-primary/30 rounded px-2 py-1.5">
                {info}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              <strong>Imagem:</strong> PNG/JPG/WebP/SVG até 4 MB (auto-comprime, proporção até {MAX_ASPECT_RATIO}:1).
              <br />
              <strong>Vídeo boomerang:</strong> MP4/WebM até 4 MB e {MAX_VIDEO_DURATION_S}s — roda em loop automático sem som.
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
            {cfg.customUrl && cfg.variant === "video" && !(/^data:video\//i.test(cfg.customUrl) || /\.(mp4|webm)(\?|$)/i.test(cfg.customUrl)) && (
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Logo customizada (imagem) usa a versão estática mesmo com variante "vídeo". Para animar, faça upload de um vídeo curto.
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
