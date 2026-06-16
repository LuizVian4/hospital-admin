import type { VirtualItem } from '@tanstack/react-virtual';
import type { FuncionarioComTurnos } from '@escala/shared';
import { LARGURA_COLUNAS_FIXAS, statusEspecialCellClass, colunaCalendarioClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';
import { DiasVirtualizados, DiaVazio } from './DiasVirtualizados';

interface LinhaIndisponivelProps {
  funcionario: FuncionarioComTurnos;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
  virtualColumns: VirtualItem[];
  diasPadStart: number;
  diasPadEnd: number;
}

export function LinhaIndisponivel({
  funcionario,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
  virtualColumns,
  diasPadStart,
  diasPadEnd,
}: LinhaIndisponivelProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-sky-50/30' : 'bg-sky-50/50';

  return (
    <tr className={cn('group transition-colors', rowBg)}>
      <td
        colSpan={2}
        className={cn(
          'border-b border-r px-2 py-1.5 text-xs sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] font-medium text-foreground',
          rowBg
        )}
        style={{
          minWidth: LARGURA_COLUNAS_FIXAS,
          width: LARGURA_COLUNAS_FIXAS,
          maxWidth: LARGURA_COLUNAS_FIXAS,
        }}
      >
        <span className="truncate min-w-0">
          <FuncionarioInfoPopover funcionario={funcionario} />
        </span>
      </td>
      <DiasVirtualizados
        virtualColumns={virtualColumns}
        padStart={diasPadStart}
        padEnd={diasPadEnd}
        dias={dias}
        renderDia={(dia, idx, width) => {
          const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
          const isHoje = dia === hoje;
          const feriadoNome = feriadosPorDia[dia] ?? null;
          const status = funcionario.statusPorDia?.[dia];
          const turno = funcionario.turnos[dia] ?? funcionario.turnosProjetados?.[dia] ?? null;

          return (
            <DiaVazio
              width={width}
              title={status ? `Status especial: ${status}` : feriadoNome ?? undefined}
              className={cn(
                rowBg,
                status ? statusEspecialCellClass(status) : 'text-muted-foreground/30',
                colunaCalendarioClass({ isWeekend, feriadoNome, isHoje })
              )}
            >
              {status ? (turno ?? '·') : '·'}
            </DiaVazio>
          );
        }}
      />
    </tr>
  );
}
