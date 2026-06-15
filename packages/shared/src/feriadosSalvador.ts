export type FeriadoTipo = 'nacional' | 'estadual' | 'municipal';

export interface FeriadoSalvador {
  dia: number;
  mes: number;
  ano: number;
  nome: string;
  tipo: FeriadoTipo;
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function calcularPascoa(ano: number): { mes: number; dia: number } {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { mes, dia };
}

function somarDias(
  ano: number,
  mes: number,
  dia: number,
  delta: number
): { ano: number; mes: number; dia: number } {
  const d = new Date(ano, mes - 1, dia);
  d.setDate(d.getDate() + delta);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1, dia: d.getDate() };
}

function segundaQuintaJaneiro(ano: number): number {
  for (let d = 1; d <= 7; d++) {
    if (new Date(ano, 0, d).getDay() === 4) return d + 7;
  }
  return 8;
}

function feriadoFixo(
  ano: number,
  mes: number,
  dia: number,
  nome: string,
  tipo: FeriadoTipo
): FeriadoSalvador {
  return { ano, mes, dia, nome, tipo };
}

function feriadoMovel(
  ano: number,
  mesPascoa: number,
  diaPascoa: number,
  delta: number,
  nome: string,
  tipo: FeriadoTipo
): FeriadoSalvador {
  const { ano: a, mes, dia } = somarDias(ano, mesPascoa, diaPascoa, delta);
  return { ano: a, mes, dia, nome, tipo };
}

/** Feriados nacionais, estaduais (BA) e municipais de Salvador. */
export function getFeriadosSalvador(ano: number): FeriadoSalvador[] {
  const pascoa = calcularPascoa(ano);

  const fixos: FeriadoSalvador[] = [
    feriadoFixo(ano, 1, 1, 'Confraternização Universal', 'nacional'),
    feriadoFixo(ano, 1, segundaQuintaJaneiro(ano), 'Lavagem do Bonfim', 'municipal'),
    feriadoFixo(ano, 2, 2, 'Nossa Senhora dos Navegantes', 'municipal'),
    feriadoFixo(ano, 4, 21, 'Tiradentes', 'nacional'),
    feriadoFixo(ano, 5, 1, 'Dia do Trabalhador', 'nacional'),
    feriadoFixo(ano, 6, 24, 'São João', 'municipal'),
    feriadoFixo(ano, 7, 2, 'Independência da Bahia', 'estadual'),
    feriadoFixo(ano, 9, 7, 'Independência do Brasil', 'nacional'),
    feriadoFixo(ano, 10, 12, 'Nossa Senhora Aparecida', 'nacional'),
    feriadoFixo(ano, 11, 2, 'Finados', 'nacional'),
    feriadoFixo(ano, 11, 15, 'Proclamação da República', 'nacional'),
    feriadoFixo(ano, 12, 8, 'Nossa Senhora da Conceição da Praia', 'municipal'),
    feriadoFixo(ano, 12, 25, 'Natal', 'nacional'),
  ];

  const moveis: FeriadoSalvador[] = [
    feriadoMovel(ano, pascoa.mes, pascoa.dia, -48, 'Segunda-feira de Carnaval', 'municipal'),
    feriadoMovel(ano, pascoa.mes, pascoa.dia, -47, 'Terça-feira de Carnaval', 'municipal'),
    feriadoMovel(ano, pascoa.mes, pascoa.dia, -2, 'Sexta-feira Santa', 'nacional'),
    feriadoMovel(ano, pascoa.mes, pascoa.dia, 60, 'Corpus Christi', 'nacional'),
  ];

  return [...fixos, ...moveis].sort((a, b) =>
    a.mes !== b.mes ? a.mes - b.mes : a.dia - b.dia
  );
}

export function getFeriadosNoMes(mes: number, ano: number): FeriadoSalvador[] {
  return getFeriadosSalvador(ano).filter((f) => f.mes === mes);
}

export function getFeriadoNoDia(mes: number, ano: number, dia: number): FeriadoSalvador | null {
  return getFeriadosSalvador(ano).find((f) => f.mes === mes && f.dia === dia) ?? null;
}

/** Mapa dia do mês → nome do feriado (para uso na grade). */
export function mapFeriadosPorDia(mes: number, ano: number): Record<number, string> {
  const map: Record<number, string> = {};
  for (const f of getFeriadosNoMes(mes, ano)) {
    map[f.dia] = f.nome;
  }
  return map;
}

export const FERIADO_TIPO_LABEL: Record<FeriadoTipo, string> = {
  nacional: 'Nacional',
  estadual: 'Estadual (BA)',
  municipal: 'Municipal (Salvador)',
};
