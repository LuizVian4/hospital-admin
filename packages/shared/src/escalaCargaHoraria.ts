import type {
  CargaHoraria,
  FuncionarioComTurnos,
  GradeEscalaResponse,
  StatusEspecialItem,
  Turno,
} from './types';
import { HORAS_POR_TURNO } from './types';
import { getTurnoEfetivoNoDia } from './escalaTurno';
import { montarStatusPorDiaNaCompetencia, statusCobreMesInteiro } from './statusEspecial';

/** Cada dia com status especial (férias, licença etc.) equivale a um turno de 12h. */
export const HORAS_POR_DIA_STATUS_ESPECIAL = 12;

export type StatusCargaHoraria = 'atingiu' | 'devendo' | 'excedeu';

export interface ResumoCargaHorariaFuncionario {
  funcionarioId: number;
  nome: string;
  matricula: string;
  cargaContratada: CargaHoraria;
  horasContratadas: number;
  horasTrabalhadas: number;
  /** Equivalente em turnos de 12h (horas ÷ 12). */
  turnosTrabalhados: number;
  saldoHoras: number;
  status: StatusCargaHoraria;
}

export function horasContratadasDeCarga(carga: CargaHoraria): number {
  return carga === '144H' ? 144 : 180;
}

export function calcularHorasTurno(turno: Turno | null | undefined): number {
  if (!turno) return 0;
  return HORAS_POR_TURNO[turno] ?? 0;
}

export interface ContextoCargaHorariaCompetencia {
  competencia: { id: number; mes: number; ano: number };
  statusEspeciais: StatusEspecialItem[];
}

export function calcularHorasTrabalhadasFuncionario(
  func: FuncionarioComTurnos,
  dias: number[],
  contexto?: ContextoCargaHorariaCompetencia
): { horasTrabalhadas: number; turnosTrabalhados: number } {
  const statusPorDia = contexto
    ? montarStatusPorDiaNaCompetencia(
        contexto.statusEspeciais,
        func.id,
        contexto.competencia,
        dias
      )
    : (func.statusPorDia ?? {});

  const horasContratadas = horasContratadasDeCarga(func.cargaHoraria ?? '180H');

  if (statusCobreMesInteiro(statusPorDia, dias.length)) {
    return {
      horasTrabalhadas: horasContratadas,
      turnosTrabalhados: horasContratadas / 12,
    };
  }

  let horasTrabalhadas = 0;

  for (const dia of dias) {
    if (statusPorDia[dia]) {
      horasTrabalhadas += HORAS_POR_DIA_STATUS_ESPECIAL;
      continue;
    }

    const turno = getTurnoEfetivoNoDia(func, dia);
    const ocorrencia = func.ocorrenciasPorDia?.[dia];

    if (ocorrencia?.tipo !== 'FALTA') {
      horasTrabalhadas += calcularHorasTurno(turno);
    }

    if (ocorrencia?.tipo === 'PLANTAO_EXTRA') {
      horasTrabalhadas += calcularHorasTurno(ocorrencia.turno);
    }
  }

  return {
    horasTrabalhadas,
    turnosTrabalhados: horasTrabalhadas / 12,
  };
}

function resolverStatus(saldoHoras: number): StatusCargaHoraria {
  if (saldoHoras < 0) return 'devendo';
  if (saldoHoras > 0) return 'excedeu';
  return 'atingiu';
}

export function montarResumoCargaHoraria(
  escala: GradeEscalaResponse
): ResumoCargaHorariaFuncionario[] {
  const funcionarios: FuncionarioComTurnos[] = [];
  const vistos = new Set<number>();

  for (const grupo of escala.grupos) {
    for (const func of grupo.funcionarios) {
      if (vistos.has(func.id)) continue;
      vistos.add(func.id);
      funcionarios.push(func);
    }
  }

  return funcionarios
    .map((func) => {
      const cargaContratada = func.cargaHoraria ?? '180H';
      const horasContratadas = horasContratadasDeCarga(cargaContratada);
      const { horasTrabalhadas, turnosTrabalhados } = calcularHorasTrabalhadasFuncionario(
        func,
        escala.dias,
        {
          competencia: escala.competencia,
          statusEspeciais: escala.statusEspeciais ?? [],
        }
      );
      const saldoHoras = horasTrabalhadas - horasContratadas;

      return {
        funcionarioId: func.id,
        nome: func.nome,
        matricula: func.matricula,
        cargaContratada,
        horasContratadas,
        horasTrabalhadas,
        turnosTrabalhados,
        saldoHoras,
        status: resolverStatus(saldoHoras),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

export function labelStatusCargaHoraria(status: StatusCargaHoraria, saldoHoras: number): string {
  if (status === 'devendo') return `Devendo ${Math.abs(saldoHoras)}h`;
  if (status === 'excedeu') return `Excedeu ${saldoHoras}h`;
  return 'Atingiu';
}
