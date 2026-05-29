// Utilities para imprimir em PDF (via janela de impressão) e enviar via WhatsApp
// com a conta do próprio profissional (wa.me abre app/web do WhatsApp e o
// usuário escolhe o contato ou cola em uma conversa aberta).

/** Sanitiza um número de telefone para o formato wa.me (apenas dígitos, com DDI). */
export function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Se não tem DDI (começa com 55 = Brasil) e tem 10/11 dígitos, assume Brasil.
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

export function openWhatsApp({ phone, message }: { phone?: string; message: string }) {
  const text = encodeURIComponent(message);
  const ph = phone ? sanitizePhone(phone) : "";
  // Sem phone → wa.me/?text= deixa o usuário escolher o contato (envia do próprio WhatsApp).
  const url = ph ? `https://wa.me/${ph}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Abre uma janela com o HTML e dispara print() — usuário escolhe "Salvar como PDF". */
export function printHTML({ title, html }: { title: string; html: string }) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    alert("Habilite pop-ups para imprimir.");
    return;
  }
  w.document.write(`<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif;
         color: #111; margin: 32px; line-height: 1.45; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .12em; color: #555;
       margin: 24px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 4px; }
  p, li { font-size: 12.5px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 18px; }
  .meal { border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px 12px; margin: 8px 0; page-break-inside: avoid; }
  .meal-h { display: flex; justify-content: space-between; font-weight: 600; }
  .meal-time { color: #2563eb; font-family: ui-monospace, monospace; font-size: 11px; }
  ul { margin: 4px 0 0 18px; padding: 0; }
  .orientacoes { white-space: pre-wrap; background: #fafafa; border-left: 3px solid #2563eb;
                 padding: 10px 14px; border-radius: 4px; font-size: 12.5px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd;
            font-size: 10px; color: #888; }
  @media print { body { margin: 18mm; } }
</style>
</head>
<body>${html}
<div class="footer">FitJourney · Documento gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
<script>window.onload = () => { setTimeout(() => window.print(), 250); };</script>
</body></html>`);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export { escapeHtml };
