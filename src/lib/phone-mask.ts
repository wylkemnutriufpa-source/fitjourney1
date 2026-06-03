// Máscara e normalização de telefone WhatsApp BR.
// Formato visível: +55 (11) 99999-9999
// Aceita digitação livre, mantém o cursor previsível, e expõe os dígitos
// para envio (formato E.164: +5511999999999).

export function maskPhoneBR(input: string): string {
  // Extrai só dígitos
  const raw = input.replace(/\D/g, "");
  if (!raw) return "";

  // Garante DDI 55 quando o usuário começa direto com DDD
  let digits = raw;
  if (!digits.startsWith("55") && digits.length >= 10 && digits.length <= 11) {
    digits = "55" + digits;
  }

  // Trunca em 13 dígitos (55 + 11)
  digits = digits.slice(0, 13);

  const ddi = digits.slice(0, 2);
  const ddd = digits.slice(2, 4);
  const part1 = digits.slice(4, 9);
  const part2 = digits.slice(9, 13);

  if (digits.length <= 2) return `+${ddi}`;
  if (digits.length <= 4) return `+${ddi} (${ddd}`;
  if (digits.length <= 9) return `+${ddi} (${ddd}) ${part1}`;
  return `+${ddi} (${ddd}) ${part1}-${part2}`;
}

// E.164 sem pontuação: +5511999999999
export function normalizePhoneE164(input: string): string {
  const raw = input.replace(/\D/g, "");
  if (!raw) return "";
  const digits = raw.startsWith("55") || raw.length > 11 ? raw : `55${raw}`;
  return `+${digits.slice(0, 13)}`;
}

export function isValidPhoneBR(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  // 12 (fixo: 55+DDD+8) ou 13 (celular: 55+DDD+9) dígitos
  return digits.length === 12 || digits.length === 13;
}
