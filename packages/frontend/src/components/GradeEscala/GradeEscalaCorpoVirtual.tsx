import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import type {
  GrupoEscala,
  TipoEscala,
  TipoOcorrenciaEscala,
  Turno,
} from '@escala/shared';
import { getGradeEscalaRowKey, type GradeEscalaRow } from '@/lib/gradeEscalaRows';
import { GradeEscalaVirtualRow } from './GradeEscalaVirtualRow';
import type { CelulaTroca } from './ConfirmarTrocaDialog';

const ROW_HEIGHTS = {
  spacer: 4,
  group: 40,
  section: 32,
  data: 36,
} as const;

function estimateRowHeight(row: GradeEscalaRow | undefined): number {
  if (!row) return ROW_HEIGHTS.data;
  if (row.kind === 'spacer') return ROW_HEIGHTS.spacer;
  if (row.kind === 'group') return ROW_HEIGHTS.group;
  if (row.kind === 'section') return ROW_HEIGHTS.section;
  return ROW_HEIGHTS.data;
}

interface GradeEscalaCorpoVirtualProps {
  flatRows: GradeEscalaRow[];
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
  competenciaId: number;
  tipoEscala: TipoEscala;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  gruposEscala: GrupoEscala[];
  dragOverGrupo: number | null;
  trocaOrigem: CelulaTroca | null;
  modoSelecaoTroca: boolean;
  onDragOverGrupo: (indicePadrao: number, e: React.DragEvent) => void;
  onDragLeaveGrupo: () => void;
  onDropGrupo: (indicePadrao: number, e: React.DragEvent) => void;
  onAtribuirGrupo: (funcionarioId: number, indicePadrao: number) => void;
  onIniciarTroca: (funcionarioId: number, dia: number) => void;
  onSelecionarDestinoTroca: (funcionarioId: number, dia: number) => void;
  onSolicitarOcorrencia: (
    funcionarioId: number,
    funcionarioNome: string,
    dia: number,
    turno: Turno | null,
    tipo: TipoOcorrenciaEscala
  ) => void;
}

export function GradeEscalaCorpoVirtual({
  flatRows,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
  competenciaId,
  tipoEscala,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  gruposEscala,
  dragOverGrupo,
  trocaOrigem,
  modoSelecaoTroca,
  onDragOverGrupo,
  onDragLeaveGrupo,
  onDropGrupo,
  onAtribuirGrupo,
  onIniciarTroca,
  onSelecionarDestinoTroca,
  onSolicitarOcorrencia,
}: GradeEscalaCorpoVirtualProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => estimateRowHeight(flatRows[index]),
    overscan: 2,
    isScrollingResetDelay: 120,
  });

  const virtualRows: VirtualItem[] = rowVirtualizer.getVirtualItems();
  const totalRowsHeight = rowVirtualizer.getTotalSize();
  const isScrolling = rowVirtualizer.isScrolling;

  const sharedRowProps = {
    competenciaId,
    tipoEscala,
    dias,
    diasSemana,
    hoje,
    feriadosPorDia,
    visibleDiaIndices,
    diasPadStart,
    diasPadEnd,
    gruposEscala,
    dragOverGrupo,
    trocaOrigem,
    modoSelecaoTroca,
    onDragOverGrupo,
    onDragLeaveGrupo,
    onDropGrupo,
    onAtribuirGrupo,
    onIniciarTroca,
    onSelecionarDestinoTroca,
    onSolicitarOcorrencia,
    isScrolling,
  };

  return (
    <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
      <div className="relative w-full" style={{ height: totalRowsHeight }}>
        {virtualRows.map((virtualRow) => {
          const row = flatRows[virtualRow.index];
          return (
            <GradeEscalaVirtualRow
              key={getGradeEscalaRowKey(row, virtualRow.index)}
              row={row}
              rowIndex={virtualRow.index}
              virtualTop={virtualRow.start}
              virtualHeight={virtualRow.size}
              {...sharedRowProps}
            />
          );
        })}
      </div>
    </div>
  );
}
