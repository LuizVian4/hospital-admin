import { useMemo, useRef } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { COLUNAS_FIXAS, LARGURA_COLUNA_DIA } from '@/constants/turnos';
import type { GradeEscalaRow } from '@/lib/gradeEscalaRows';

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

export function useGradeEscalaVirtual(dias: number[], flatRows: GradeEscalaRow[]) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    const helper = createColumnHelper<{ id: string }>();
    return [
      helper.display({ id: 'nome', header: COLUNAS_FIXAS[0].label, size: COLUNAS_FIXAS[0].width }),
      helper.display({
        id: 'categoria',
        header: COLUNAS_FIXAS[1].label,
        size: COLUNAS_FIXAS[1].width,
      }),
      ...dias.map((dia) =>
        helper.display({
          id: `dia-${dia}`,
          header: String(dia),
          size: LARGURA_COLUNA_DIA,
          meta: { dia },
        })
      ),
    ];
  }, [dias]);

  const table = useReactTable({
    data: [{ id: 'layout' }],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => estimateRowHeight(flatRows[index]),
    overscan: 6,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: dias.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => LARGURA_COLUNA_DIA,
    overscan: 4,
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalDiasWidth = columnVirtualizer.getTotalSize();
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalRowsHeight = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalRowsHeight -
        (virtualRows[virtualRows.length - 1].start + virtualRows[virtualRows.length - 1].size)
      : 0;

  const firstVirtualColumn = virtualColumns[0];
  const lastVirtualColumn = virtualColumns[virtualColumns.length - 1];
  const diasPadStart = firstVirtualColumn?.start ?? 0;
  const diasPadEnd = lastVirtualColumn
    ? totalDiasWidth - (lastVirtualColumn.start + lastVirtualColumn.size)
    : totalDiasWidth;

  return {
    scrollRef,
    table,
    virtualColumns,
    virtualRows,
    totalDiasWidth,
    paddingTop,
    paddingBottom,
    diasPadStart,
    diasPadEnd,
  };
}
