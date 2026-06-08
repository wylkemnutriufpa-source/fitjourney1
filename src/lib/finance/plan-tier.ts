// Plano do nutricionista (Pro x Basic).
// TEMP: enquanto não existir coluna de tier, tratamos `admin` como Pro.
// Toda checagem de acesso a Protocolos deve passar por aqui — um único ponto
// para trocar pela regra real (subscription kind / flag) sem caçar pelo app.

import type { AppRole } from "@/lib/auth-context";

export function isProUser(roles: AppRole[]): boolean {
  return roles.includes("admin");
}
