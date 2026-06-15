import type { Funcionario, Turno } from '@escala/shared';
import { TURNOS_DISPONIVEIS } from '@escala/shared';

const TURNOS_VALIDOS = new Set<string>(TURNOS_DISPONIVEIS);

export function excelSerialToDate(serial: number): string | undefined {
  if (!serial || serial < 1) return undefined;
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  return date.toISOString().split('T')[0];
}

export function parseDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return excelSerialToDate(value);
  const str = String(value).trim();
  if (!str) return undefined;
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    if (num > 30000) return excelSerialToDate(num);
  }
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0];
  return undefined;
}

export function normalizeTurno(value: unknown): Turno | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (TURNOS_VALIDOS.has(str)) return str as Turno;
  return null;
}

export function normalizeContrato(value: unknown): string {
  if (!value) return 'EFETIVO';
  const str = String(value).trim().toUpperCase();
  if (str.includes('PROVIS')) return 'PROVISÓRIO';
  if (str.includes('TEMP')) return 'Temporário';
  return 'EFETIVO';
}

export function normalizeCargaHoraria(value: unknown): '180H' | '144H' {
  const str = String(value || '180H').trim().toUpperCase();
  return str.includes('144') ? '144H' : '180H';
}

export function getDiasSemana(mes: number, ano: number, totalDias?: number): string[] {
  const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const result: string[] = [];
  const total = totalDias ?? getDiasNoMes(mes, ano);
  for (let d = 1; d <= total; d++) {
    const date = new Date(ano, mes - 1, d);
    result.push(dias[date.getDay()]);
  }
  return result;
}

export function getDiasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

export function mapFuncionario(row: {
  id: number;
  matricula: string;
  nome: string;
  coren: string | null;
  categoria: string | null;
  tipoContrato: string | null;
  dataAdmissao: string | null;
  cargaHoraria: string | null;
  setorId: number | null;
  ativo: boolean | null;
}): Funcionario {
  return {
    id: row.id,
    matricula: row.matricula,
    nome: row.nome,
    coren: row.coren ?? undefined,
    categoria: row.categoria ?? 'TÉC. DE ENFERMAGEM',
    tipoContrato: (row.tipoContrato ?? 'EFETIVO') as Funcionario['tipoContrato'],
    dataAdmissao: row.dataAdmissao ?? undefined,
    cargaHoraria: (row.cargaHoraria ?? '180H') as Funcionario['cargaHoraria'],
    setorId: row.setorId ?? null,
    ativo: row.ativo ?? true,
  };
}

export function getEscalaFingerprint(
  turnos: Record<number, Turno | null>,
  dias: number[],
  turnosProjetados?: Record<number, Turno>
): string {
  return dias.map((d) => turnos[d] ?? turnosProjetados?.[d] ?? '-').join('|');
}

export function agruparPorEscalaIgual<
  T extends {
    nome: string;
    turnos: Record<number, Turno | null>;
    turnosProjetados?: Record<number, Turno>;
  },
>(funcionarios: T[], dias: number[]): { funcionarios: T[] }[] {
  const grupos = new Map<string, T[]>();
  const ordem: string[] = [];

  for (const f of funcionarios) {
    const key = getEscalaFingerprint(f.turnos, dias, f.turnosProjetados);
    if (!grupos.has(key)) {
      grupos.set(key, []);
      ordem.push(key);
    }
    grupos.get(key)!.push(f);
  }

  const compararNomes = (a: T, b: T) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });

  return ordem
    .map((key) => ({
      funcionarios: grupos.get(key)!.sort(compararNomes),
    }))
    .sort((a, b) => compararNomes(a.funcionarios[0], b.funcionarios[0]));
}
