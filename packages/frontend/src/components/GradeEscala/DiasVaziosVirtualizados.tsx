import { memo } from 'react';
import { LARGURA_COLUNA_DIA, colunaCalendarioClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { CelulaEspacadorDias, DiaVazio } from './DiasVirtualizados';

export interface DiasVaziosVirtualizadosProps {
  visibleDiaIndices: number[];
  padStart: number;
  padEnd: number;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  diaClassName: string;
  dragHighlight?: boolean;
}

function DiasVaziosVirtualizadosComponent({
  visibleDiaIndices,
  padStart,
  padEnd,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  diaClassName,
  dragHighlight = false,
}: DiasVaziosVirtualizadosProps) {
  return (
    <>
      <CelulaEspacadorDias width={padStart} />
      {visibleDiaIndices.map((idx) => {
        const dia = dias[idx];
        const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
        return (
          <DiaVazio
            key={dia}
            width={LARGURA_COLUNA_DIA}
            className={cn(
              dragHighlight ? 'bg-primary/5' : diaClassName,
              colunaCalendarioClass({
                isWeekend,
                feriadoNome: feriadosPorDia[dia],
                isHoje: dia === hoje,
              })
            )}
          />
        );
      })}
      <CelulaEspacadorDias width={padEnd} />
    </>
  );
}

function diasVaziosPropsEqual(
  prev: DiasVaziosVirtualizadosProps,
  next: DiasVaziosVirtualizadosProps
): boolean {
  return (
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.padStart === next.padStart &&
    prev.padEnd === next.padEnd &&
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.diaClassName === next.diaClassName &&
    prev.dragHighlight === next.dragHighlight
  );
}

export const DiasVaziosVirtualizados = memo(
  DiasVaziosVirtualizadosComponent,
  diasVaziosPropsEqual
);
