// Cache buster — runs once per page load no client.
// Garante que clientes (especialmente mobile: iPhone Safari, Xiaomi MIUI,
// Samsung Internet) nunca fiquem presos numa versão antiga do app por causa
// de service workers órfãos ou Cache Storage residual de deploys anteriores.
//
// É idempotente: se não houver SW nem cache, não faz nada.

const RAN_FLAG = "__fj_cache_bust_ran__";

export async function runCacheBuster(): Promise<void> {
  if (typeof window === "undefined") return;
  // Só roda no app publicado — em preview/dev pode interferir com HMR.
  if (!import.meta.env.PROD) return;
  // Evita rodar duas vezes na mesma sessão de página.
  if ((window as unknown as Record<string, unknown>)[RAN_FLAG]) return;
  (window as unknown as Record<string, unknown>)[RAN_FLAG] = true;

  try {
    // 1) Desregistra QUALQUER service worker remanescente.
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(regs.map((r) => r.unregister()));
    }
  } catch {
    /* silencia */
  }

  try {
    // 2) Limpa Cache Storage residual de PWAs antigas.
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* silencia */
  }
}
