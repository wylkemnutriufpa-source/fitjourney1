// Canonical domain para links públicos (convite, share, etc.).
// Sempre usar este origin em links que vão sair do app (WhatsApp,
// email, cópia para área de transferência), mesmo quando o nutri
// está navegando por URL de preview/publish do Lovable.
export const PUBLIC_ORIGIN = "https://www.fitjourney.com.br";

export function publicUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_ORIGIN}${p}`;
}
