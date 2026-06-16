import type { EscalaInicio, Turno } from './types';

/** Dia fixo de início da escala em cada competência */
export const DIA_INICIO_ESCALA = 1;

/** Ciclo padrão para Téc. de Enfermagem: MT → F → SN → / → F */
export const PADRAO_TEC_ENFERMAGEM: Turno[] = ['MT', 'F', 'SN', '/', 'F'];

/** Ciclo padrão para Enfermeiro: MT → SN → / → F */
export const PADRAO_ENFERMEIRO: Turno[] = ['MT', 'SN', '/', 'F'];

export type TipoEscala = 'tecnico' | 'enfermeiro';

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
export const GRUPOS_ESCALA_ENFERMEIRO = getGruposEscala(PADRAO_ENFERMEIRO);

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
  if (cat === 'ENFERMEIRO') {
    return PADRAO_ENFERMEIRO;
  }
  return null;
}

export function isTecnicoEnfermagem(categoria: string): boolean {
  const cat = normalizarCategoria(categoria);
  return cat.includes('TEC') && cat.includes('ENFERM');
}

export function isEnfermeiro(categoria: string): boolean {
  return normalizarCategoria(categoria) === 'ENFERMEIRO';
}

export function pertenceTipoEscala(categoria: string, tipo: TipoEscala): boolean {
  return tipo === 'tecnico' ? isTecnicoEnfermagem(categoria) : isEnfermeiro(categoria);
}

export function getPadraoPorTipoEscala(tipo: TipoEscala): Turno[] {
  return tipo === 'tecnico' ? PADRAO_TEC_ENFERMAGEM : PADRAO_ENFERMEIRO;
}

export function getGruposPorTipoEscala(tipo: TipoEscala): GrupoEscala[] {
  return getGruposEscala(getPadraoPorTipoEscala(tipo));
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
  turnoInicio: Turno,
  turnos: Record<number, Turno | null> = {}
): AncoraPadrao {
  return {
    dia: DIA_INICIO_ESCALA,
    indicePadrao: resolverIndiceNoPadrao(padrao, DIA_INICIO_ESCALA, turnoInicio, {
      ...turnos,
      [DIA_INICIO_ESCALA]: turnoInicio,
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
    resolverIndiceNoPadrao(padrao, DIA_INICIO_ESCALA, config.turnoInicio, {
      [DIA_INICIO_ESCALA]: config.turnoInicio,
    });

  if (config.mesInicio === mesAtual && config.anoInicio === anoAtual) {
    return { dia: DIA_INICIO_ESCALA, indicePadrao, offsetAteMesAtual: 0 };
  }

  const dataInicio = new Date(config.anoInicio, config.mesInicio - 1, DIA_INICIO_ESCALA);
  const dia1MesAtual = new Date(anoAtual, mesAtual - 1, DIA_INICIO_ESCALA);
  const offsetAteMesAtual = Math.round(
    (dia1MesAtual.getTime() - dataInicio.getTime()) / 86400000
  );

  return { dia: DIA_INICIO_ESCALA, indicePadrao, offsetAteMesAtual };
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
  turnoInicio: Turno,
  dias: number[],
  indicePadrao?: number
): Record<number, Turno> {
  const ancora: AncoraPadrao =
    indicePadrao != null
      ? { dia: DIA_INICIO_ESCALA, indicePadrao, offsetAteMesAtual: 0 }
      : criarAncora(padrao, turnoInicio);

  const simulados: Record<number, Turno> = {};

  for (const dia of dias) {
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
