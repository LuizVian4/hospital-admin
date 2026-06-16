import type { VirtualItem } from '@tanstack/react-virtual';
import type { Table } from '@tanstack/react-table';
import { COLUNAS_FIXAS, LARGURA_COLUNAS_FIXAS, colunaCalendarioClass, stickyLeft } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { CelulaEspacadorDias } from './DiasVirtualizados';

interface CabecalhoGradeEscalaProps {
  table: Table<{ id: string }>;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  diasComProblemaCobertura: Set<number>;
  virtualColumns: VirtualItem[];
  diasPadStart: number;
  diasPadEnd: number;
}

export function CabecalhoGradeEscala({
  table,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  diasComProblemaCobertura,
  virtualColumns,
  diasPadStart,
  diasPadEnd,
}: CabecalhoGradeEscalaProps) {
  const fixedHeaders = table.getHeaderGroups()[0]?.headers.slice(0, COLUNAS_FIXAS.length) ?? [];

  return (
    <thead className="sticky top-0 z-20">
      <tr className="bg-slate-100">
        {fixedHeaders.map((header, i) => (
          <th
            key={header.id}
            className={cn(
              'border-b border-r px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sticky z-30 bg-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]',
              header.id === 'nome' && 'text-left'
            )}
            style={{
              left: stickyLeft(i),
              minWidth: header.getSize(),
              width: header.getSize(),
            }}
          >
            {header.column.columnDef.header as string}
          </th>
        ))}
        <CelulaEspacadorDias as="th" width={diasPadStart} />
        {virtualColumns.map((vc) => {
          const dia = dias[vc.index];
          const isHoje = dia === hoje;
          const isWeekend = diasSemana[vc.index] === 'SAB' || diasSemana[vc.index] === 'DOM';
          const feriadoNome = feriadosPorDia[dia] ?? null;
          const semCobertura = diasComProblemaCobertura.has(dia);
          return (
            <th
              key={dia}
              className={cn(
                'border-b px-1 py-2 text-xs text-center font-semibold',
                semCobertura
                  ? 'dia-sem-cobertura-header'
                  : cn(
                      'bg-slate-100 text-slate-700',
                      colunaCalendarioClass({ isWeekend, feriadoNome, isHoje, parte: 'header' })
                    )
              )}
              style={{ width: vc.size, minWidth: vc.size, maxWidth: vc.size }}
              title={
                semCobertura
                  ? 'Cobertura insuficiente neste dia'
                  : feriadoNome ?? (isHoje ? 'Dia atual' : undefined)
              }
            >
              {isHoje && !semCobertura ? (
                <span className="flex flex-col items-center gap-0.5 leading-none">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">
                    Hoje
                  </span>
                  <span className="text-sm tabular-nums">{dia}</span>
                </span>
              ) : (
                dia
              )}
            </th>
          );
        })}
        <CelulaEspacadorDias as="th" width={diasPadEnd} />
      </tr>
      <tr className="bg-slate-50">
        <th
          colSpan={COLUNAS_FIXAS.length}
          className="border-b border-r px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 sticky left-0 z-30 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] text-left"
          style={{ minWidth: LARGURA_COLUNAS_FIXAS }}
        >
          Escala
        </th>
        <CelulaEspacadorDias as="th" width={diasPadStart} />
        {virtualColumns.map((vc) => {
          const dia = dias[vc.index];
          const isHoje = dia === hoje;
          const ds = diasSemana[vc.index];
          const isWeekend = ds === 'SAB' || ds === 'DOM';
          const feriadoNome = feriadosPorDia[dia] ?? null;
          const semCobertura = diasComProblemaCobertura.has(dia);
          return (
            <th
              key={`dow-${dia}`}
              className={cn(
                'border-b px-1 py-1 text-[10px] font-medium text-center',
                semCobertura
                  ? 'dia-sem-cobertura-header'
                  : cn(
                      'bg-slate-50 text-slate-400',
                      colunaCalendarioClass({ isWeekend, feriadoNome, isHoje, parte: 'dow' })
                    )
              )}
              style={{ width: vc.size, minWidth: vc.size, maxWidth: vc.size }}
              title={
                semCobertura ? 'Cobertura insuficiente neste dia' : feriadoNome ?? undefined
              }
            >
              {ds}
            </th>
          );
        })}
        <CelulaEspacadorDias as="th" width={diasPadEnd} />
      </tr>
    </thead>
  );
}
