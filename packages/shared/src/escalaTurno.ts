import type { FuncionarioComTurnos, Turno } from './types';
import { getTurnosPlantaoExtraPermitidos } from './plantaoExtra';

/** Turno salvo ou projetado no dia. */
export function getTurnoEfetivoNoDia(
  funcionario: Pick<FuncionarioComTurnos, 'turnos' | 'turnosProjetados'>,
  dia: number
): Turno | null {
  const turno = funcionario.turnos[dia];
  if (turno != null && turno !== '') return turno;
  const projetado = funcionario.turnosProjetados?.[dia];
  return projetado != null && projetado !== '' ? projetado : null;
}

export function funcionarioPossuiTurnoNoDia(
  funcionario: FuncionarioComTurnos,
  dia: number,
  turno: Turno
): boolean {
  return getTurnoEfetivoNoDia(funcionario, dia) === turno;
}

/** Pode cobrir o turno (plantão extra) sem tê-lo na escala do dia. */
export function funcionarioElegivelCobrirTurno(
  funcionario: FuncionarioComTurnos,
  dia: number,
  turnoCobertura: Turno
): boolean {
  if (funcionario.statusPorDia?.[dia]) return false;
  if (funcionarioPossuiTurnoNoDia(funcionario, dia, turnoCobertura)) return false;
  const turnoBase = getTurnoEfetivoNoDia(funcionario, dia);
  return getTurnosPlantaoExtraPermitidos(turnoBase).includes(turnoCobertura);
}
