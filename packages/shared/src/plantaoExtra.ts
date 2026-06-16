import type { Turno } from './types';

const TURNOS_PLANTAO_EXTRA = ['MT', 'SN'] as const;

export function isTurnoFolgaOuPlantao(turno: Turno | null | undefined): boolean {
  if (turno == null || turno === '') return true;
  return turno === 'F' || turno === '/';
}

/** Turnos MT/SN permitidos como plantão extra conforme o turno da escala no dia. */
export function getTurnosPlantaoExtraPermitidos(
  turnoBase: Turno | null | undefined
): Turno[] {
  const base = turnoBase ?? null;
  if (base === 'MT') return ['SN'];
  if (base === 'SN') return ['MT'];
  if (isTurnoFolgaOuPlantao(base)) return [...TURNOS_PLANTAO_EXTRA];
  return [...TURNOS_PLANTAO_EXTRA];
}

export function getTurnoPlantaoExtraSugerido(turnoBase: Turno | null | undefined): Turno | '' {
  const permitidos = getTurnosPlantaoExtraPermitidos(turnoBase);
  return permitidos.length === 1 ? permitidos[0] : '';
}

export function validarTurnoPlantaoExtra(
  turnoBase: Turno | null | undefined,
  turnoExtra: Turno | null | undefined
): string | null {
  if (!turnoExtra || (turnoExtra !== 'MT' && turnoExtra !== 'SN')) {
    return 'Selecione o turno extra (MT ou SN)';
  }
  const permitidos = getTurnosPlantaoExtraPermitidos(turnoBase);
  if (!permitidos.includes(turnoExtra)) {
    if (turnoBase === 'MT') return 'Com turno MT na escala, o extra deve ser SN';
    if (turnoBase === 'SN') return 'Com turno SN na escala, o extra deve ser MT';
    return 'Turno extra inválido para este dia';
  }
  return null;
}

/** Texto da célula quando há plantão extra registrado. */
export function formatarExibicaoComPlantaoExtra(
  turnoBase: Turno | null | undefined,
  turnoExtra: Turno | null | undefined
): string {
  if (!turnoExtra) return turnoBase ?? '·';

  const base = turnoBase ?? null;

  const parMtSn = base === 'MT' || base === 'SN';
  if (parMtSn) return 'MT + SN';

  if (isTurnoFolgaOuPlantao(base)) return turnoExtra;

  return turnoExtra;
}
