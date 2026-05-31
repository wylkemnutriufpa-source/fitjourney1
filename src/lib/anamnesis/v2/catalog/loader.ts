// Loader do catálogo. Hoje retorna a fonte hardcoded.
// Amanhã: lê de question_catalogs by version (Fase 2) — assinatura preservada.

import { CATALOG } from "./catalog";
import { CATALOG_VERSION } from "./catalog.version";
import type { CatalogManifest } from "./types";

export function loadCatalog(version?: string): CatalogManifest {
  if (version && version !== CATALOG_VERSION) {
    // Futuro: buscar versão antiga em tabela. Hoje só temos a corrente.
    throw new Error(
      `Catalog version "${version}" not available. Active: ${CATALOG_VERSION}`,
    );
  }
  return CATALOG;
}

export { CATALOG_VERSION };
