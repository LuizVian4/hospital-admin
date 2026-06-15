import type { EscalaInicio, Turno } from './types';

/** Ciclo padrão para Téc. de Enfermagem: MT → F → SN → / → F */
export const PADRAO_TEC_ENFERMAGEM: Turno[] = ['MT', 'F', 'SN', '/', 'F'];

export interface GrupoEscala {
  id: number;
  label: string;
  descricao: string;
  indicePadrao: number;
  turnoInicio: Turno;
}

export function formatarPadraoRotacionado(padrao: Turno[], indicePadrao: number): string {
  return [...padrao.slice(indicePadrao), ...padrao.slice(0, indicePadrao)].join(' - ');
}

export function getGruposEscala(padrao: Turno[]): GrupoEscala[] {
  return padrao.map((turnoInicio, indicePadrao) => ({
    id: indicePadrao + 1,
    label: `Grupo ${indicePadrao + 1}`,
    descricao: formatarPadraoRotacionado(padrao, indicePadrao),
    indicePadrao,
    turnoInicio,
  }));
}

export const GRUPOS_ESCALA = getGruposEscala(PADRAO_TEC_ENFERMAGEM);

export interface AncoraPadrao {
  dia: number;
  indicePadrao: number;
  /** Offset em dias até o dia 1 do mês atual (0 se a âncora está no mês corrente) */
  offsetAteMesAtual: number;
}

export function normalizarCategoria(categoria: string): string {
  return categoria
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getPadraoEscala(categoria: string): Turno[] | null {
  const cat = normalizarCategoria(categoria);
  if (cat.includes('TEC') && cat.includes('ENFERM')) {
    return PADRAO_TEC_ENFERMAGEM;
  }
  return null;
}

export function resolverIndiceNoPadrao(
  padrao: Turno[],
  dia: number,
  turno: Turno,
  turnos: Record<number, Turno | null>
): number {
  const candidatos = padrao
    .map((t, i) => (t === turno ? i : -1))
    .filter((i) => i >= 0);

  if (candidatos.length === 1) return candidatos[0];

  const turnoAnterior = turnos[dia - 1];
  if (turnoAnterior) {
    for (const indice of candidatos) {
      const esperado =
        padrao[((indice - 1) % padrao.length + padrao.length) % padrao.length];
      if (esperado === turnoAnterior) return indice;
    }
  }

  const turnoPosterior = turnos[dia + 1];
  if (turnoPosterior) {
    for (const indice of candidatos) {
      const esperado = padrao[(indice + 1) % padrao.length];
      if (esperado === turnoPosterior) return indice;
    }
  }

  return candidatos[0];
}

export function criarAncora(
  padrao: Turno[],
  diaInicio: number,
  turnoInicio: Turno,
  turnos: Record<number, Turno | null> = {}
): AncoraPadrao {
  return {
    dia: diaInicio,
    indicePadrao: resolverIndiceNoPadrao(padrao, diaInicio, turnoInicio, {
      ...turnos,
      [diaInicio]: turnoInicio,
    }),
    offsetAteMesAtual: 0,
  };
}

export function ancoraFromEscalaInicio(
  padrao: Turno[],
  config: EscalaInicio,
  mesAtual: number,
  anoAtual: number
): AncoraPadrao {
  const indicePadrao =
    config.indicePadrao ??
    resolverIndiceNoPadrao(padrao, config.diaInicio, config.turnoInicio, {
      [config.diaInicio]: config.turnoInicio,
    });

  if (config.mesInicio === mesAtual && config.anoInicio === anoAtual) {
    return { dia: config.diaInicio, indicePadrao, offsetAteMesAtual: 0 };
  }

  const dataInicio = new Date(config.anoInicio, config.mesInicio - 1, config.diaInicio);
  const dia1MesAtual = new Date(anoAtual, mesAtual - 1, 1);
  const offsetAteMesAtual = Math.round(
    (dia1MesAtual.getTime() - dataInicio.getTime()) / 86400000
  );

  return { dia: config.diaInicio, indicePadrao, offsetAteMesAtual };
}

export function encontrarAncoraPadrao(
  padrao: Turno[],
  turnos: Record<number, Turno | null>,
  escalaInicio?: EscalaInicio | null,
  mesAtual?: number,
  anoAtual?: number,
  turnosMesAnterior?: Record<number, Turno | null>,
  diasNoMesAnterior?: number,
  inicioMesAnterior?: EscalaInicio | null
): AncoraPadrao | null {
  if (escalaInicio?.ativo && mesAtual != null && anoAtual != null) {
    return ancoraFromEscalaInicio(padrao, escalaInicio, mesAtual, anoAtual);
  }

  if (inicioMesAnterior?.ativo && mesAtual != null && anoAtual != null) {
    return ancoraFromEscalaInicio(padrao, inicioMesAnterior, mesAtual, anoAtual);
  }

  if (turnosMesAnterior && diasNoMesAnterior) {
    for (let d = diasNoMesAnterior; d >= 1; d--) {
      const t = turnosMesAnterior[d];
      if (t) {
        return {
          dia: d,
          indicePadrao: resolverIndiceNoPadrao(padrao, d, t, turnosMesAnterior),
          offsetAteMesAtual: diasNoMesAnterior - d + 1,
        };
      }
    }
  }

  return null;
}

export function calcularTurnoProjetado(
  padrao: Turno[],
  ancora: AncoraPadrao,
  diaAlvo: number
): Turno | null {
  const indice = calcularIndiceNoDia(padrao, ancora, diaAlvo);
  return padrao[indice];
}

export function calcularIndiceNoDia(
  padrao: Turno[],
  ancora: AncoraPadrao,
  diaAlvo: number
): number {
  const offset =
    ancora.offsetAteMesAtual === 0
      ? diaAlvo - ancora.dia
      : ancora.offsetAteMesAtual + (diaAlvo - 1);

  return (((ancora.indicePadrao + offset) % padrao.length) + padrao.length) % padrao.length;
}

export function simularMesAPartirDeAncora(
  padrao: Turno[],
  diaInicio: number,
  turnoInicio: Turno,
  dias: number[],
  indicePadrao?: number,
  apenasApartirDoInicio = false
): Record<number, Turno> {
  const ancora: AncoraPadrao =
    indicePadrao != null
      ? { dia: diaInicio, indicePadrao, offsetAteMesAtual: 0 }
      : criarAncora(padrao, diaInicio, turnoInicio);

  const simulados: Record<number, Turno> = {};

  for (const dia of dias) {
    if (apenasApartirDoInicio && dia < diaInicio) continue;

    const turno = calcularTurnoProjetado(padrao, ancora, dia);
    if (turno) simulados[dia] = turno;
  }

  return simulados;
}

export function projetarTurnosVazios(
  padrao: Turno[],
  turnosSalvos: Record<number, Turno | null>,
  dias: number[],
  mesAtual: number,
  anoAtual: number,
  escalaInicio?: EscalaInicio | null,
  turnosMesAnterior?: Record<number, Turno | null>,
  diasNoMesAnterior?: number,
  inicioMesAnterior?: EscalaInicio | null
): Record<number, Turno> {
  const ancora = encontrarAncoraPadrao(
    padrao,
    turnosSalvos,
    escalaInicio,
    mesAtual,
    anoAtual,
    turnosMesAnterior,
    diasNoMesAnterior,
    inicioMesAnterior
  );
  if (!ancora) return {};

  const projetados: Record<number, Turno> = {};
  for (const dia of dias) {
    if (dia in turnosSalvos) continue;

    const turno = calcularTurnoProjetado(padrao, ancora, dia);
    if (turno) projetados[dia] = turno;
  }

  return projetados;
}

/** @deprecated Use projetarTurnosVazios */
export function isDiaFuturo(dia: number, mes: number, ano: number, hoje = new Date()): boolean {
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const alvo = new Date(ano, mes - 1, dia);
  return alvo >= inicioHoje;
}

/** @deprecated Use projetarTurnosVazios */
export function projetarTurnosFuturos(
  padrao: Turno[],
  turnosSalvos: Record<number, Turno | null>,
  dias: number[],
  mes: number,
  ano: number,
  turnosMesAnterior?: Record<number, Turno | null>,
  diasNoMesAnterior?: number,
  escalaInicio?: EscalaInicio | null,
  hoje = new Date()
): Record<number, Turno> {
  const ancora = encontrarAncoraPadrao(
    padrao,
    turnosSalvos,
    escalaInicio,
    mes,
    ano,
    turnosMesAnterior,
    diasNoMesAnterior
  );
  if (!ancora) return {};

  const projetados: Record<number, Turno> = {};
  for (const dia of dias) {
    if (dia in turnosSalvos) continue;
    if (!isDiaFuturo(dia, mes, ano, hoje)) continue;

    const turno = calcularTurnoProjetado(padrao, ancora, dia);
    if (turno) projetados[dia] = turno;
  }

  return projetados;
}
