import type { GrupoTurno } from '@escala/shared';

const TURNOS_COBERTURA = new Set(['MT', 'SN']);

function turnoNoDia(
  funcionario: GrupoTurno['funcionarios'][number],
  dia: number
): string | null {
  return funcionario.turnos[dia] ?? funcionario.turnosProjetados?.[dia] ?? null;
}

export function getDiasSemCoberturaMTSN(dias: number[], grupos: GrupoTurno[]): Set<number> {
  const semCobertura = new Set<number>();

  for (const dia of dias) {
    const temCobertura = grupos.some((grupo) =>
      grupo.funcionarios.some((func) => {
        const turno = turnoNoDia(func, dia);
        return turno != null && TURNOS_COBERTURA.has(turno);
      })
    );

    if (!temCobertura) {
      semCobertura.add(dia);
    }
  }

  return semCobertura;
}
