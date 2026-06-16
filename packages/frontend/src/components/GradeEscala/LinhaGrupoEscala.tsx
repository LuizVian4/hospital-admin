import type { VirtualItem } from '@tanstack/react-virtual';
import type { GrupoEscala } from '@escala/shared';
import { COLUNAS_FIXAS, colunaCalendarioClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { DiasVirtualizados, DiaVazio } from './DiasVirtualizados';
import { GripVertical } from 'lucide-react';

interface LinhaGrupoEscalaProps {
  grupo: GrupoEscala;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  isDragOver: boolean;
  virtualColumns: VirtualItem[];
  diasPadStart: number;
  diasPadEnd: number;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function LinhaGrupoEscala({
  grupo,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  isDragOver,
  virtualColumns,
  diasPadStart,
  diasPadEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: LinhaGrupoEscalaProps) {
  return (
    <tr
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'transition-colors',
        isDragOver ? 'bg-primary/10 ring-2 ring-inset ring-primary/40' : 'bg-slate-100/90'
      )}
    >
      <td
        colSpan={COLUNAS_FIXAS.length}
        className={cn(
          'border-b border-r px-3 py-2 sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]',
          isDragOver ? 'bg-primary/10' : 'bg-slate-100/90'
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-foreground">{grupo.label}</span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="text-[11px] text-muted-foreground">{grupo.descricao}</span>
          </div>
        </div>
      </td>
      <DiasVirtualizados
        virtualColumns={virtualColumns}
        padStart={diasPadStart}
        padEnd={diasPadEnd}
        dias={dias}
        renderDia={(dia, idx, width) => {
          const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
          return (
            <DiaVazio
              width={width}
              className={cn(
                isDragOver ? 'bg-primary/5' : 'bg-slate-100/60',
                colunaCalendarioClass({
                  isWeekend,
                  feriadoNome: feriadosPorDia[dia],
                  isHoje: dia === hoje,
                })
              )}
            />
          );
        }}
      />
    </tr>
  );
}
