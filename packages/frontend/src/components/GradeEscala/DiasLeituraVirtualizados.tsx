import { memo } from 'react';
import type { StatusEspecial, Turno } from '@escala/shared';
import { LARGURA_COLUNA_DIA, colunaCalendarioClass, statusEspecialCellClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { CelulaEspacadorDias, DiaVazio } from './DiasVirtualizados';

export interface DiaLeituraDados {
  status: StatusEspecial | null | undefined;
  turno: Turno | null;
}

export interface DiasLeituraVirtualizadosProps {
  visibleDiaIndices: number[];
  padStart: number;
  padEnd: number;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowBg: string;
  dadosPorDia: Record<number, DiaLeituraDados>;
}

function DiasLeituraVirtualizadosComponent({
  visibleDiaIndices,
  padStart,
  padEnd,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowBg,
  dadosPorDia,
}: DiasLeituraVirtualizadosProps) {
  return (
    <>
      <CelulaEspacadorDias width={padStart} />
      {visibleDiaIndices.map((idx) => {
        const dia = dias[idx];
        const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
        const isHoje = dia === hoje;
        const feriadoNome = feriadosPorDia[dia] ?? null;
        const { status, turno } = dadosPorDia[dia] ?? { status: null, turno: null };

        return (
          <DiaVazio
            key={dia}
            width={LARGURA_COLUNA_DIA}
            title={status ? `Status especial: ${status}` : feriadoNome ?? undefined}
            className={cn(
              'text-center text-xs h-9',
              rowBg,
              status ? statusEspecialCellClass(status) : 'text-muted-foreground/30',
              colunaCalendarioClass({ isWeekend, feriadoNome, isHoje })
            )}
          >
            {status ? (turno ?? '·') : '·'}
          </DiaVazio>
        );
      })}
      <CelulaEspacadorDias width={padEnd} />
    </>
  );
}

function diasLeituraPropsEqual(
  prev: DiasLeituraVirtualizadosProps,
  next: DiasLeituraVirtualizadosProps
): boolean {
  return (
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.padStart === next.padStart &&
    prev.padEnd === next.padEnd &&
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.rowBg === next.rowBg &&
    prev.dadosPorDia === next.dadosPorDia
  );
}

export const DiasLeituraVirtualizados = memo(
  DiasLeituraVirtualizadosComponent,
  diasLeituraPropsEqual
);

export function buildDadosLeituraPorDia(
  funcionario: {
    turnos: Record<number, Turno | null | undefined>;
    turnosProjetados?: Record<number, Turno | null | undefined>;
    statusPorDia?: Record<number, StatusEspecial | null | undefined>;
  },
  visibleDiaIndices: readonly number[],
  dias: readonly number[]
): Record<number, DiaLeituraDados> {
  const dados: Record<number, DiaLeituraDados> = {};
  for (const idx of visibleDiaIndices) {
    const dia = dias[idx];
    dados[dia] = {
      status: funcionario.statusPorDia?.[dia],
      turno: funcionario.turnos[dia] ?? funcionario.turnosProjetados?.[dia] ?? null,
    };
  }
  return dados;
}
