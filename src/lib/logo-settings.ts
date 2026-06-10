import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import type { LogoEffect } from "@/components/LogoOrbital";
import { supabase } from "@/integrations/supabase/client";

export type LogoSlot =
  | "landing-header"
  | "landing-footer"
  | "auth-form"
  | "auth-hero"
  | "sidebar"
  | "mobile-header";

export type LogoVariant = "orbital" | "video" | "static";

export type WordmarkPosition = "right" | "left" | "below" | "above";

export interface WordmarkConfig {
  show: boolean;
  position: WordmarkPosition;
  /** distância (px) entre logo e texto. */
  gap: number;
  /** tamanho do texto (px). */
  sizePx: number;
  /** offset fino do texto (px) — empurra para os lados / cima / baixo. */
  offsetX: number;
  offsetY: number;
}

export interface SlotConfig {
  sizePx: number;
  effect: LogoEffect;
  variant: LogoVariant;
  /** URL pública (storage) ou data URL de uma logo customizada. */
  customUrl?: string | null;
  paddingX: number;
  paddingY: number;
  marginX: number;
  marginY: number;
  /** Aura/pulse ambiente ao redor da logo (as "luzes"). */
  showAura: boolean;
  /** Configuração do wordmark "FitJourney" que aparece junto da logo. */
  wordmark: WordmarkConfig;
}

export const SLOT_META: Record<LogoSlot, { label: string; description: string; context: "landing" | "app" }> = {
  "landing-header": { label: "Header da Landing", description: "Topo da página inicial", context: "landing" },
  "landing-footer": { label: "Footer da Landing", description: "Rodapé da página inicial", context: "landing" },
  "auth-form": { label: "Tela de Login (formulário)", description: "Logo pequena ao lado do título", context: "app" },
  "auth-hero": { label: "Tela de Login (destaque)", description: "Logo grande central da página de auth", context: "app" },
  sidebar: { label: "Sidebar do App", description: "Menu lateral interno", context: "app" },
  "mobile-header": { label: "Header Mobile do App", description: "Topo mobile dentro do app", context: "app" },
};

const baseDefaults = { paddingX: 0, paddingY: 0, marginX: 0, marginY: 0, customUrl: null, showAura: true } as const;

function wm(partial: Partial<WordmarkConfig> = {}): WordmarkConfig {
  return { show: true, position: "right", gap: 12, sizePx: 17, offsetX: 0, offsetY: 0, ...partial };
}

export const DEFAULTS: Record<LogoSlot, SlotConfig> = {
  "landing-header": { sizePx: 64, effect: "halo", variant: "video", ...baseDefaults, wordmark: wm({ position: "right", gap: 12, sizePx: 20 }) },
  "landing-footer": { sizePx: 56, effect: "halo", variant: "orbital", ...baseDefaults, wordmark: wm({ position: "right", gap: 10, sizePx: 18 }) },
  "auth-form":      { sizePx: 56, effect: "halo", variant: "video",   ...baseDefaults, wordmark: wm({ position: "right", gap: 10, sizePx: 24 }) },
  "auth-hero":      { sizePx: 128, effect: "halo", variant: "video",  ...baseDefaults, wordmark: wm({ position: "below", gap: 12, sizePx: 24 }) },
  sidebar:          { sizePx: 96, effect: "halo", variant: "video",   ...baseDefaults, wordmark: wm({ position: "right", gap: 12, sizePx: 17 }) },
  "mobile-header":  { sizePx: 40, effect: "halo", variant: "video",   ...baseDefaults, wordmark: wm({ show: false, position: "right", gap: 8, sizePx: 14 }) },
};

export const EFFECT_OPTIONS: LogoEffect[] = [
  "none", "halo", "orbit", "aura", "sparkle", "ripple", "comet", "dust", "energy", "lines",
];

export const VARIANT_OPTIONS: { value: LogoVariant; label: string }[] = [
  { value: "orbital", label: "Estática + efeito" },
  { value: "video", label: "Vídeo animado" },
  { value: "static", label: "Só estática (sem efeito)" },
];

export const WORDMARK_POSITIONS: { value: WordmarkPosition; label: string }[] = [
  { value: "right", label: "À direita da logo" },
  { value: "left", label: "À esquerda da logo" },
  { value: "below", label: "Abaixo da logo" },
  { value: "above", label: "Acima da logo" },
];

const STORAGE_KEY = "fj_logo_settings_v2";
const EVENT_NAME = "fj:logo-settings-change";

type SettingsMap = Partial<Record<LogoSlot, SlotConfig>>;

function readAll(): SettingsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

function writeAll(all: SettingsMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (e) {
    console.warn("[logo-settings] write failed", e);
  }
}

// ===== Sync com DB (landing_content.content.logos) =====
let _dbSyncPromise: Promise<void> | null = null;

function syncFromDb(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (_dbSyncPromise) return _dbSyncPromise;
  _dbSyncPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("landing_content")
        .select("content")
        .eq("singleton", true)
        .maybeSingle();
      if (error) throw error;
      const remote = (data?.content as Record<string, unknown> | null)?.logos as SettingsMap | undefined;
      if (remote && typeof remote === "object") {
        writeAll(remote);
      }
    } catch (e) {
      console.warn("[logo-settings] DB sync failed", e);
    }
  })();
  return _dbSyncPromise;
}

async function pushToDb(all: SettingsMap): Promise<void> {
  const { data, error: readErr } = await supabase
    .from("landing_content")
    .select("content")
    .eq("singleton", true)
    .maybeSingle();
  if (readErr) throw readErr;
  const current = (data?.content as Record<string, unknown> | null) ?? {};
  const merged = { ...current, logos: all };
  const { error } = await supabase
    .from("landing_content")
    .update({ content: merged as never })
    .eq("singleton", true);
  if (error) throw error;
}

function mergeConfig(slot: LogoSlot, partial?: Partial<SlotConfig>): SlotConfig {
  const def = DEFAULTS[slot];
  const merged: SlotConfig = {
    ...def,
    ...(partial ?? {}),
    wordmark: { ...def.wordmark, ...(partial?.wordmark ?? {}) },
  };
  return merged;
}

export function getLogoSettings(slot: LogoSlot): SlotConfig {
  const all = readAll();
  return mergeConfig(slot, all[slot]);
}

// useLayoutEffect no client, useEffect no SSR (evita warning).
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useLogoSettings(slot: LogoSlot): SlotConfig {
  // SSR/primeiro render: defaults idênticos client+server (sem hydration mismatch).
  // useLayoutEffect aplica o cache do localStorage antes do browser pintar.
  const [cfg, setCfg] = useState<SlotConfig>(() => mergeConfig(slot));
  useIsoLayoutEffect(() => {
    setCfg(getLogoSettings(slot));
  }, [slot]);
  useEffect(() => {
    const refresh = () => setCfg(getLogoSettings(slot));
    syncFromDb().then(refresh);
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slot]);
  return cfg;
}

/** Indica se o hook já leu localStorage (útil para esconder o logo até o
 * tamanho real estar resolvido — evita flash de "logo pequena → cresce"
 * na recarga). */
export function useLogoSettingsReady(): boolean {
  const [ready, setReady] = useState(false);
  useIsoLayoutEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

/**
 * Editor admin. Mudanças aplicam imediatamente no preview local (localStorage),
 * mas só vão pro servidor quando `save()` é chamado. `dirty` indica alterações
 * pendentes desde o último save.
 */
export function useLogoSettingsEditor() {
  const [all, setAll] = useState<SettingsMap>(() => readAll());
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(readAll()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const next = readAll();
      setAll(next);
    };
    syncFromDb().then(() => {
      const next = readAll();
      setAll(next);
      setSavedSnapshot(JSON.stringify(next));
    });
    window.addEventListener(EVENT_NAME, refresh);
    return () => window.removeEventListener(EVENT_NAME, refresh);
  }, []);

  const update = useCallback((slot: LogoSlot, patch: Partial<SlotConfig>) => {
    const current = readAll();
    const base = mergeConfig(slot, current[slot]);
    const nextSlot: SlotConfig = {
      ...base,
      ...patch,
      wordmark: { ...base.wordmark, ...(patch.wordmark ?? {}) },
    };
    const next = { ...current, [slot]: nextSlot };
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

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const current = readAll();
      await pushToDb(current);
      setSavedSnapshot(JSON.stringify(current));
    } finally {
      setSaving(false);
    }
  }, []);

  const get = useCallback((slot: LogoSlot): SlotConfig => mergeConfig(slot, all[slot]), [all]);

  const dirty = JSON.stringify(all) !== savedSnapshot;

  return { get, update, reset, save, dirty, saving };
}
