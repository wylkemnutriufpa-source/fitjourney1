// Tema claro/escuro — preferência do paciente, persistida em localStorage.
// Base do app é DARK (definido em :root). Quando o usuário escolhe "claro",
// aplicamos a classe `.light` no <html> que sobrescreve os tokens.

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
  const useLight = mode === "light" || (mode === "system" && !prefersDark);
  root.classList.toggle("light", useLight);
  // Compat: também removemos qualquer .dark legado.
  root.classList.remove("dark");
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
