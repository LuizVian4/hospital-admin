import type { StatusEspecial, StatusEspecialItem, Turno } from './types';

export const STATUS_ESPECIAIS_OPCOES: StatusEspecial[] = [
  'FÉRIAS',
  'LICENÇA GESTACIONAL',
  'LICENÇA INSS',
];

export function normalizarStatusEspecial(status: string): StatusEspecial {
  const upper = status.toUpperCase().trim();
  if (upper.includes('FÉRIAS') || upper.includes('FERIAS')) return 'FÉRIAS';
  if (upper.includes('GESTACIONAL')) return 'LICENÇA GESTACIONAL';
  if (upper.includes('INSS')) return 'LICENÇA INSS';
  return status as StatusEspecial;
}

export function statusParaTurno(status: StatusEspecial | string): Turno {
  const norm = normalizarStatusEspecial(status);
  if (norm === 'FÉRIAS') return 'FF';
  if (norm === 'LICENÇA GESTACIONAL') return 'LG';
  return 'INSS';
}

export function ultimoDiaDoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

export function limitesMes(mes: number, ano: number): { inicio: string; fim: string } {
  const ultimo = ultimoDiaDoMes(mes, ano);
  const m = String(mes).padStart(2, '0');
  return {
    inicio: `${ano}-${m}-01`,
    fim: `${ano}-${m}-${String(ultimo).padStart(2, '0')}`,
  };
}

export function intervaloSobrepoeMes(
  dataInicio: string,
  dataFim: string,
  mes: number,
  ano: number
): boolean {
  const { inicio, fim } = limitesMes(mes, ano);
  return dataInicio <= fim && dataFim >= inicio;
}

/** Status especial ativo em todos os dias do mês (ex.: férias no mês inteiro). */
export function statusCobreMesInteiro(
  statusPorDia: Record<number, StatusEspecial> | undefined,
  totalDias: number
): boolean {
  if (!statusPorDia || totalDias <= 0) return false;
  return Object.keys(statusPorDia).length >= totalDias;
}

export function diasAfetadosNoMes(
  dataInicio: string,
  dataFim: string,
  mes: number,
  ano: number,
  maxDias?: number
): number[] {
  const { inicio: inicioMes, fim: fimMes } = limitesMes(mes, ano);
  const inicio = dataInicio > inicioMes ? dataInicio : inicioMes;
  const fim = dataFim < fimMes ? dataFim : fimMes;
  if (inicio > fim) return [];

  const dias: number[] = [];
  const total = maxDias ?? ultimoDiaDoMes(mes, ano);
  const m = String(mes).padStart(2, '0');

  for (let d = 1; d <= total; d++) {
    const iso = `${ano}-${m}-${String(d).padStart(2, '0')}`;
    if (iso >= inicio && iso <= fim) dias.push(d);
  }

  return dias;
}

/** Dias com status especial dentro do período da competência (interseção mês/ano + datas do status). */
export function montarStatusPorDiaNaCompetencia(
  statuses: StatusEspecialItem[],
  funcionarioId: number,
  competencia: { id: number; mes: number; ano: number },
  dias: number[]
): Record<number, StatusEspecial> {
  const porDia: Record<number, StatusEspecial> = {};

  for (const item of statuses) {
    if (item.funcionario.id !== funcionarioId) continue;
    if (item.competenciaId != null && item.competenciaId !== competencia.id) continue;
    if (!intervaloSobrepoeMes(item.dataInicio, item.dataFim, competencia.mes, competencia.ano)) {
      continue;
    }

    for (const dia of diasAfetadosNoMes(
      item.dataInicio,
      item.dataFim,
      competencia.mes,
      competencia.ano,
      dias.length
    )) {
      if (!dias.includes(dia)) continue;
      porDia[dia] = item.status;
    }
  }

  return porDia;
}
