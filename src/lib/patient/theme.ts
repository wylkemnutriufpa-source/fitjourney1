// Tema claro/escuro — preferência do paciente, persistida em localStorage.
// Aplica classe `dark` no <html>. Sem dependência de cookie/SSR.

export type ThemeMode = "light" | "dark" | "system";

const KEY = "fitjourney.theme.v1";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(KEY) as ThemeMode | null;
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const useDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", useDark);
}

export function setTheme(mode: ThemeMode) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
  }
  applyTheme(mode);
}
