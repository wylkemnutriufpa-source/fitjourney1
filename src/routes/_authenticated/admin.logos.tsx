import { createFileRoute } from "@tanstack/react-router";
import { LogoOrbital } from "@/components/LogoOrbital";
import {
  useLogoSettingsEditor,
  SLOT_META,
  EFFECT_OPTIONS,
  VARIANT_OPTIONS,
  DEFAULTS,
  type LogoSlot,
  type LogoVariant,
} from "@/lib/logo-settings";
import type { LogoEffect } from "@/components/LogoOrbital";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/logos")({
  component: LogosAdminPage,
});

function LogosAdminPage() {
  const { get, update, reset } = useLogoSettingsEditor();
  const slots = Object.keys(SLOT_META) as LogoSlot[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Logos — Tamanho & Efeitos</h2>
          <p className="text-sm text-muted-foreground">
            Ajuste tamanho, variante e efeito de cada logo em cada seção. Mudanças salvas no navegador (preview instantâneo).
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {slots.map((slot) => {
          const cfg = get(slot);
          const meta = SLOT_META[slot];
          const def = DEFAULTS[slot];
          return (
            <div
              key={slot}
              className="rounded-xl border border-border bg-card/40 p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
                    {slot}
                  </div>
                  <div className="font-semibold mt-0.5">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">{meta.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => reset(slot)}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  title="Restaurar padrão desta seção"
                >
                  <RotateCcw className="size-3" /> padrão
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-5 items-center">
                <div className="grid place-items-center min-h-[180px] rounded-lg bg-background/60 border border-border/60 p-4">
                  <LogoOrbital
                    key={`${cfg.variant}-${cfg.effect}-${cfg.sizePx}`}
                    sizePx={cfg.sizePx}
                    effect={cfg.effect}
                    {...({} as any)}
                  />
                </div>
                <div className="space-y-3 w-[220px]">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Tamanho: <span className="text-foreground">{cfg.sizePx}px</span>
                    </label>
                    <input
                      type="range"
                      min={24}
                      max={240}
                      step={2}
                      value={cfg.sizePx}
                      onChange={(e) => update(slot, { sizePx: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                      Variante
                    </label>
                    <select
                      value={cfg.variant}
                      onChange={(e) => update(slot, { variant: e.target.value as LogoVariant })}
                      className="w-full text-sm px-2 py-1.5 rounded-md border border-border bg-background"
                    >
                      {VARIANT_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                      Efeito
                    </label>
                    <select
                      value={cfg.effect}
                      onChange={(e) => update(slot, { effect: e.target.value as LogoEffect })}
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
        })}
      </div>
    </div>
  );
}
