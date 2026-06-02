import { useEffect, useState, useCallback } from "react";
import type { LogoEffect } from "@/components/LogoOrbital";

export type LogoSlot =
  | "landing-header"
  | "landing-footer"
  | "auth-form"
  | "auth-hero"
  | "sidebar"
  | "mobile-header";

export type LogoVariant = "orbital" | "video" | "static";

export interface SlotConfig {
  sizePx: number;
  effect: LogoEffect;
  variant: LogoVariant;
  /** Data URL ou URL de uma logo customizada (opcional). Quando definida, substitui a estática. */
  customUrl?: string | null;
  /** Espaçamento interno (padding) em px ao redor da logo */
  paddingX: number;
  paddingY: number;
  /** Espaçamento externo (margin) em px */
  marginX: number;
  marginY: number;
}

export const SLOT_META: Record<LogoSlot, { label: string; description: string; context: "landing" | "app" }> = {
  "landing-header": { label: "Header da Landing", description: "Topo da página inicial", context: "landing" },
  "landing-footer": { label: "Footer da Landing", description: "Rodapé da página inicial", context: "landing" },
  "auth-form": { label: "Tela de Login (formulário)", description: "Logo pequena ao lado do título", context: "app" },
  "auth-hero": { label: "Tela de Login (destaque)", description: "Logo grande central da página de auth", context: "app" },
  sidebar: { label: "Sidebar do App", description: "Menu lateral interno", context: "app" },
  "mobile-header": { label: "Header Mobile do App", description: "Topo mobile dentro do app", context: "app" },
};

const baseDefaults = { paddingX: 0, paddingY: 0, marginX: 0, marginY: 0, customUrl: null } as const;

export const DEFAULTS: Record<LogoSlot, SlotConfig> = {
  "landing-header": { sizePx: 56, effect: "halo", variant: "orbital", ...baseDefaults },
  "landing-footer": { sizePx: 56, effect: "halo", variant: "orbital", ...baseDefaults },
  "auth-form": { sizePx: 56, effect: "halo", variant: "video", ...baseDefaults },
  "auth-hero": { sizePx: 128, effect: "halo", variant: "video", ...baseDefaults },
  sidebar: { sizePx: 96, effect: "halo", variant: "video", ...baseDefaults },
  "mobile-header": { sizePx: 40, effect: "halo", variant: "video", ...baseDefaults },
};

export const EFFECT_OPTIONS: LogoEffect[] = [
  "halo",
  "orbit",
  "aura",
  "sparkle",
  "ripple",
  "comet",
  "dust",
  "energy",
  "lines",
];

export const VARIANT_OPTIONS: { value: LogoVariant; label: string }[] = [
  { value: "orbital", label: "Estática + efeito" },
  { value: "video", label: "Vídeo animado" },
  { value: "static", label: "Só estática (sem efeito)" },
];

const STORAGE_KEY = "fj_logo_settings_v2";
const EVENT_NAME = "fj:logo-settings-change";

function readAll(): Partial<Record<LogoSlot, SlotConfig>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

function writeAll(all: Partial<Record<LogoSlot, SlotConfig>>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (e) {
    console.warn("[logo-settings] write failed", e);
  }
}

export function getLogoSettings(slot: LogoSlot): SlotConfig {
  const all = readAll();
  return { ...DEFAULTS[slot], ...(all[slot] ?? {}) };
}

export function useLogoSettings(slot: LogoSlot): SlotConfig {
  const [cfg, setCfg] = useState<SlotConfig>(() => getLogoSettings(slot));
  useEffect(() => {
    const refresh = () => setCfg(getLogoSettings(slot));
    refresh();
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slot]);
  return cfg;
}

export function useLogoSettingsEditor() {
  const [all, setAll] = useState<Partial<Record<LogoSlot, SlotConfig>>>(() => readAll());
  useEffect(() => {
    const refresh = () => setAll(readAll());
    window.addEventListener(EVENT_NAME, refresh);
    return () => window.removeEventListener(EVENT_NAME, refresh);
  }, []);

  const update = useCallback((slot: LogoSlot, patch: Partial<SlotConfig>) => {
    const current = readAll();
    const next = { ...current, [slot]: { ...DEFAULTS[slot], ...(current[slot] ?? {}), ...patch } };
    writeAll(next);
    setAll(next);
  }, []);

  const reset = useCallback((slot?: LogoSlot) => {
    if (!slot) {
      writeAll({});
      setAll({});
      return;
    }
    const current = readAll();
    delete current[slot];
    writeAll(current);
    setAll({ ...current });
  }, []);

  const get = useCallback((slot: LogoSlot): SlotConfig => {
    return { ...DEFAULTS[slot], ...(all[slot] ?? {}) };
  }, [all]);

  return { get, update, reset };
}
