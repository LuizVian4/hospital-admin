import type { FuncionarioComTurnos } from '@escala/shared';
import { COLUNAS_FIXAS, statusEspecialCellClass, colunaCalendarioClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';

interface LinhaIndisponivelProps {
  funcionario: FuncionarioComTurnos;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
}

const LARGURA_COLUNAS_FIXAS = COLUNAS_FIXAS.reduce((sum, col) => sum + col.width, 0);

export function LinhaIndisponivel({
  funcionario,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
}: LinhaIndisponivelProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-sky-50/30' : 'bg-sky-50/50';

  return (
    <tr className={cn('group transition-colors', rowBg)}>
      <td
        colSpan={COLUNAS_FIXAS.length}
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
      {dias.map((dia, idx) => {
        const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
        const isHoje = dia === hoje;
        const feriadoNome = feriadosPorDia[dia] ?? null;
        const status = funcionario.statusPorDia?.[dia];
        const turno = funcionario.turnos[dia] ?? funcionario.turnosProjetados?.[dia] ?? null;

        return (
          <td
            key={dia}
            title={status ? `Status especial: ${status}` : feriadoNome ?? undefined}
            className={cn(
              'border-b px-0 py-0 text-center text-xs min-w-[40px] h-9',
              rowBg,
              status ? statusEspecialCellClass(status) : 'text-muted-foreground/30',
              colunaCalendarioClass({ isWeekend, feriadoNome, isHoje })
            )}
          >
            {status ? (turno ?? '·') : '·'}
          </td>
        );
      })}
    </tr>
  );
}
