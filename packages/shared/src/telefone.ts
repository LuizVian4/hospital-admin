const nonDigits = /\D/g;

/**
 * Converte um telefone digitado para E.164.
 * Sem "+" trata como Brasil: 10 ou 11 dígitos locais, ou 12/13 já com 55.
 * Com "+" aceita outros países, de 10 a 15 dígitos.
 */
export function normalizeTelefone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(nonDigits, '');
  if (!digits) return null;

  if (!hasPlus && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  } else if (!hasPlus && digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    // Já inclui o código do Brasil.
  } else if (!(hasPlus && digits.length >= 10 && digits.length <= 15)) {
    return null;
  }

  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}
