import type { VirtualItem } from '@tanstack/react-virtual';
import type { FuncionarioComTurnos, GrupoEscala } from '@escala/shared';
import { COLUNAS_FIXAS, stickyLeft, statusEspecialCellClass, colunaCalendarioClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';
import { DiasVirtualizados, DiaVazio } from './DiasVirtualizados';
import { GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LinhaSemGrupoProps {
  funcionario: FuncionarioComTurnos;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
  gruposEscala: GrupoEscala[];
  virtualColumns: VirtualItem[];
  diasPadStart: number;
  diasPadEnd: number;
  onAtribuirGrupo: (funcionarioId: number, indicePadrao: number) => void;
}

export function LinhaSemGrupo({
  funcionario,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
  gruposEscala,
  virtualColumns,
  diasPadStart,
  diasPadEnd,
  onAtribuirGrupo,
}: LinhaSemGrupoProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-amber-50/30' : 'bg-amber-50/50';

  const stickyCell = (index: number, className?: string) =>
    cn(
      'border-b border-r px-2 py-1.5 text-xs sticky z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]',
      rowBg,
      className
    );

  const handleGrupoChange = (value: string) => {
    const grupoId = Number(value);
    const grupo = gruposEscala.find((g) => g.id === grupoId);
    if (!grupo) return;
    onAtribuirGrupo(funcionario.id, grupo.indicePadrao);
  };

  return (
    <tr
      className={cn('group transition-colors', rowBg)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('funcionarioId', String(funcionario.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <td
        className={stickyCell(0, 'font-medium text-foreground')}
        style={{
          left: stickyLeft(0),
          minWidth: COLUNAS_FIXAS[0].width,
          width: COLUNAS_FIXAS[0].width,
          maxWidth: COLUNAS_FIXAS[0].width,
        }}
      >
        <span className="flex items-center gap-1 min-w-0">
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
          <span className="truncate min-w-0">
            <FuncionarioInfoPopover funcionario={funcionario} />
          </span>
        </span>
      </td>
      <td
        className={stickyCell(1)}
        style={{
          left: stickyLeft(1),
          minWidth: COLUNAS_FIXAS[1].width,
          width: COLUNAS_FIXAS[1].width,
          maxWidth: COLUNAS_FIXAS[1].width,
        }}
      >
        <Select onValueChange={handleGrupoChange}>
          <SelectTrigger className="h-7 w-full text-xs border-dashed border-amber-300/80 bg-white/80">
            <SelectValue placeholder="Selecionar grupo..." />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[280px]">
            {gruposEscala.map((grupo) => (
              <SelectItem key={grupo.id} value={String(grupo.id)} className="py-2">
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold">{grupo.label}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {grupo.descricao}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                'text-center text-xs h-9',
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
