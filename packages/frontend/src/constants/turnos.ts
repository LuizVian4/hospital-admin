import type { StatusEspecial, Turno } from '@escala/shared';
import { statusParaTurno } from '@escala/shared';
import { cn } from '@/lib/utils';

export interface TurnoLegenda {
  sigla: Turno;
  desc: string;
  bg: string;
  text: string;
  cellClass: string;
}

export const TURNOS_LEGEND: TurnoLegenda[] = [
  { sigla: 'MT', desc: 'Manhã/Tarde', bg: 'bg-blue-100', text: 'text-blue-800', cellClass: 'turno-MT' },
  //{ sigla: 'M', desc: 'Manhã', bg: 'bg-green-100', text: 'text-green-800', cellClass: 'turno-M' },
//{ sigla: 'T', desc: 'Tarde', bg: 'bg-yellow-100', text: 'text-yellow-800', cellClass: 'turno-T' },
  { sigla: 'SN', desc: 'Noturno', bg: 'bg-purple-100', text: 'text-purple-800', cellClass: 'turno-SN' },
  //{ sigla: 'HC', desc: 'Comercial', bg: 'bg-slate-200', text: 'text-slate-700', cellClass: 'turno-HC' },
  { sigla: 'F', desc: 'Folga', bg: 'bg-gray-100', text: 'text-gray-700', cellClass: 'turno-F' },
  { sigla: 'FF', desc: 'Férias', bg: 'bg-orange-100', text: 'text-orange-800', cellClass: 'turno-FF' },
  { sigla: '/', desc: 'Plantão', bg: 'bg-white', text: 'text-slate-700', cellClass: 'turno-plantao' },
  { sigla: 'INSS', desc: 'Licença INSS', bg: 'bg-red-100', text: 'text-red-800', cellClass: 'turno-INSS' },
  { sigla: 'LG', desc: 'Licença gestacional', bg: 'bg-pink-100', text: 'text-pink-800', cellClass: 'turno-LG' },
];

export const COLUNAS_FIXAS = [
  { key: 'nome', label: 'NOME COMPLETO', width: 220 },
  { key: 'cat', label: 'CATEGORIA', width: 120 },
] as const;

export const LARGURA_COLUNA_DIA = 40;

/** Largura da coluna de nome quando ela rola junto com os dias (mobile). */
export const LARGURA_COLUNA_NOME_MOBILE = 160;

export const LARGURA_COLUNAS_FIXAS = COLUNAS_FIXAS.reduce((sum, col) => sum + col.width, 0);

export const LARGURA_COLUNAS_FIXAS_DESKTOP = LARGURA_COLUNAS_FIXAS;

export function stickyLeft(index: number): number {
  return COLUNAS_FIXAS.slice(0, index).reduce((sum, col) => sum + col.width, 0);
}

export function turnoCellClass(turno: Turno | null | undefined): string {
  if (!turno) return '';
  if (turno === '/') return 'turno-plantao';
  const safe = turno.replace(/\//g, '');
  return `turno-${safe}`;
}

export function colunaHojeClass(isHoje: boolean, parte: 'header' | 'dow' | 'cell' = 'cell'): string {
  if (!isHoje) return '';
  if (parte === 'header') return 'coluna-hoje-header';
  if (parte === 'dow') return 'coluna-hoje-dow';
  return 'coluna-hoje';
}

export function colunaCalendarioClass(opts: {
  isWeekend: boolean;
  feriadoNome?: string | null;
  isHoje?: boolean;
  parte?: 'header' | 'dow' | 'cell';
}): string {
  const { isWeekend, feriadoNome, isHoje, parte = 'cell' } = opts;

  if (isHoje) return colunaHojeClass(true, parte);

  const destaqueCalendario = isWeekend || Boolean(feriadoNome);

  if (destaqueCalendario) {
    if (parte === 'header') return 'coluna-fds-header';
    if (parte === 'dow') return 'coluna-fds-dow';
    return 'coluna-fds';
  }

  return '';
}

export function statusEspecialCellClass(status: StatusEspecial | null | undefined): string {
  if (!status) return '';
  const turno = statusParaTurno(status);
  const safe = turno.replace(/\//g, '');
  return cn('celula-status-especial', `celula-status-${safe}`, turnoCellClass(turno));
}
