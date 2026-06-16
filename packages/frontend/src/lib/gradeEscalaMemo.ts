import type { EscalaOcorrencia, FuncionarioComTurnos } from '@escala/shared';
import type { CelulaTroca } from '@/components/GradeEscala/ConfirmarTrocaDialog';

export const ESCALA_CELL_NOOP = () => {};

export function visibleDiaIndicesKey(indices: readonly number[]): string {
  return indices.join(',');
}

export function ocorrenciaCelulaEqual(
  a: EscalaOcorrencia | null | undefined,
  b: EscalaOcorrencia | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.tipo === b.tipo && a.turno === b.turno;
}

export function funcionarioDiasEqual(
  a: FuncionarioComTurnos,
  b: FuncionarioComTurnos,
  dias: readonly number[],
  visibleDiaIndices: readonly number[]
): boolean {
  if (a.id !== b.id || a.nome !== b.nome || a.categoria !== b.categoria) return false;

  for (const idx of visibleDiaIndices) {
    const dia = dias[idx];
    if ((a.turnos[dia] ?? null) !== (b.turnos[dia] ?? null)) return false;
    if ((a.turnosProjetados?.[dia] ?? null) !== (b.turnosProjetados?.[dia] ?? null)) return false;
    if ((a.observacoesDia?.[dia] ?? null) !== (b.observacoesDia?.[dia] ?? null)) return false;
    if ((a.statusPorDia?.[dia] ?? null) !== (b.statusPorDia?.[dia] ?? null)) return false;
    if (!ocorrenciaCelulaEqual(a.ocorrenciasPorDia?.[dia], b.ocorrenciasPorDia?.[dia])) return false;
  }

  return true;
}

export function trocaOrigemEqual(a: CelulaTroca | null | undefined, b: CelulaTroca | null | undefined) {
  return a?.funcionarioId === b?.funcionarioId && a?.dia === b?.dia;
}
