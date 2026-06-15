import type { Turno } from './types';

const BULLET = '•';

export function parseObservacoesLista(text: string | undefined | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith(BULLET) ? line.slice(1).trim() : line));
}

export function serializarObservacoesLista(items: string[]): string {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `${BULLET} ${item}`)
    .join('\n');
}

export function appendObservacaoLista(existing: string | undefined | null, item: string): string {
  const trimmed = item.trim();
  if (!trimmed) return existing?.trim() ?? '';
  return serializarObservacoesLista([...parseObservacoesLista(existing), trimmed]);
}

export function isObservacaoTroca(item: string): boolean {
  return item.trim().toLowerCase().startsWith('troca:');
}

export function formatObservacaoTrocaCompetencia(
  nomeOrigem: string,
  diaOrigem: number,
  turnoOrigem: Turno,
  nomeDestino: string,
  diaDestino: number,
  turnoDestino: Turno
): string {
  return `Troca: ${nomeOrigem} (dia ${diaOrigem}, ${turnoOrigem}) ↔ ${nomeDestino} (dia ${diaDestino}, ${turnoDestino})`;
}
