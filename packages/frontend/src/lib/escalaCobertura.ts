import type { GrupoTurno } from '@escala/shared';

export const MIN_TECNICOS_POR_TURNO = 4;

const TURNOS_COBERTURA = new Set(['MT', 'SN']);

function turnoNoDia(
  funcionario: GrupoTurno['funcionarios'][number],
  dia: number
): string | null {
  return funcionario.turnos[dia] ?? funcionario.turnosProjetados?.[dia] ?? null;
}

export interface ContagemCoberturaDia {
  mt: number;
  sn: number;
}

export function contarCoberturaNoDia(
  dia: number,
  grupos: GrupoTurno[]
): ContagemCoberturaDia {
  let mt = 0;
  let sn = 0;

  for (const grupo of grupos) {
    for (const func of grupo.funcionarios) {
      const turno = turnoNoDia(func, dia);
      if (turno != null && TURNOS_COBERTURA.has(turno)) {
        if (turno === 'MT') mt++;
        else if (turno === 'SN') sn++;
      }
    }
  }

  return { mt, sn };
}

/** Dias sem ao menos 1 técnico em MT e 1 técnico em SN. */
export function getDiasSemCoberturaMTSN(dias: number[], grupos: GrupoTurno[]): Set<number> {
  const semCobertura = new Set<number>();

  for (const dia of dias) {
    const { mt, sn } = contarCoberturaNoDia(dia, grupos);
    if (mt < 1 || sn < 1) {
      semCobertura.add(dia);
    }
  }

  return semCobertura;
}

/** Dias com menos de `minimo` técnicos em MT. */
export function getDiasComPoucosTecnicosMT(
  dias: number[],
  grupos: GrupoTurno[],
  minimo = MIN_TECNICOS_POR_TURNO
): Set<number> {
  const poucos = new Set<number>();

  for (const dia of dias) {
    const { mt } = contarCoberturaNoDia(dia, grupos);
    if (mt < minimo) {
      poucos.add(dia);
    }
  }

  return poucos;
}

/** Dias com menos de `minimo` técnicos em SN. */
export function getDiasComPoucosTecnicosSN(
  dias: number[],
  grupos: GrupoTurno[],
  minimo = MIN_TECNICOS_POR_TURNO
): Set<number> {
  const poucos = new Set<number>();

  for (const dia of dias) {
    const { sn } = contarCoberturaNoDia(dia, grupos);
    if (sn < minimo) {
      poucos.add(dia);
    }
  }

  return poucos;
}
