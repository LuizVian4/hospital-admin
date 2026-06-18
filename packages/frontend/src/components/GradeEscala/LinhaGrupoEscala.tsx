import { memo, useCallback } from 'react';
import type { GrupoEscala } from '@escala/shared';
import { LARGURA_COLUNAS_FIXAS_DESKTOP } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { DiasVaziosVirtualizados } from './DiasVaziosVirtualizados';
import { CelulaFixa, CelulaNomeScroll, ColunasFixas, LinhaGrade, ViewportDias } from './GradeEscalaLayout';
import { GripVertical } from 'lucide-react';

export interface LinhaGrupoEscalaProps {
  grupo: GrupoEscala;
  indicePadrao: number;
  virtualTop: number;
  virtualHeight: number;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  isDragOver: boolean;
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
  onDragOverGrupo: (indicePadrao: number, e: React.DragEvent) => void;
  onDragLeaveGrupo: () => void;
  onDropGrupo: (indicePadrao: number, e: React.DragEvent) => void;
}

function LinhaGrupoEscalaComponent({
  grupo,
  indicePadrao,
  virtualTop,
  virtualHeight,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  isDragOver,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
  onDragOverGrupo,
  onDragLeaveGrupo,
  onDropGrupo,
}: LinhaGrupoEscalaProps) {
  const handleDragOver = useCallback(
    (e: React.DragEvent) => onDragOverGrupo(indicePadrao, e),
    [onDragOverGrupo, indicePadrao]
  );
  const handleDrop = useCallback(
    (e: React.DragEvent) => onDropGrupo(indicePadrao, e),
    [onDropGrupo, indicePadrao]
  );

  return (
    <LinhaGrade
      virtualTop={virtualTop}
      virtualHeight={virtualHeight}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeaveGrupo}
      onDrop={handleDrop}
      className={cn(
        isDragOver ? 'bg-primary/10 ring-2 ring-inset ring-primary/40' : 'bg-slate-100/90'
      )}
    >
      <ColunasFixas className={isDragOver ? 'bg-primary/10' : 'bg-slate-100/90'}>
        <CelulaFixa width={LARGURA_COLUNAS_FIXAS_DESKTOP} className="py-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-foreground">{grupo.label}</span>
              <span className="mx-2 text-muted-foreground/40">·</span>
              <span className="text-[11px] text-muted-foreground">{grupo.descricao}</span>
            </div>
          </div>
        </CelulaFixa>
      </ColunasFixas>
      <ViewportDias>
        <CelulaNomeScroll className="py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate">{grupo.label}</span>
              <span className="text-[10px] text-muted-foreground block truncate">{grupo.descricao}</span>
            </div>
          </div>
        </CelulaNomeScroll>
        <DiasVaziosVirtualizados
          visibleDiaIndices={visibleDiaIndices}
          padStart={diasPadStart}
          padEnd={diasPadEnd}
          dias={dias}
          diasSemana={diasSemana}
          hoje={hoje}
          feriadosPorDia={feriadosPorDia}
          diaClassName="bg-slate-100/60"
          dragHighlight={isDragOver}
        />
      </ViewportDias>
    </LinhaGrade>
  );
}

function linhaGrupoPropsEqual(prev: LinhaGrupoEscalaProps, next: LinhaGrupoEscalaProps): boolean {
  return (
    prev.grupo === next.grupo &&
    prev.indicePadrao === next.indicePadrao &&
    prev.virtualTop === next.virtualTop &&
    prev.virtualHeight === next.virtualHeight &&
    prev.isDragOver === next.isDragOver &&
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.diasPadStart === next.diasPadStart &&
    prev.diasPadEnd === next.diasPadEnd &&
    prev.onDragOverGrupo === next.onDragOverGrupo &&
    prev.onDragLeaveGrupo === next.onDragLeaveGrupo &&
    prev.onDropGrupo === next.onDropGrupo
  );
}

export const LinhaGrupoEscala = memo(LinhaGrupoEscalaComponent, linhaGrupoPropsEqual);
