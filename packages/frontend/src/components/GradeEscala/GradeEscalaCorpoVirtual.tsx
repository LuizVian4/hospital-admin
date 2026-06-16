import type { VirtualItem } from '@tanstack/react-virtual';
import type {
  GrupoEscala,
  TipoEscala,
  TipoOcorrenciaEscala,
  Turno,
} from '@escala/shared';
import { COLUNAS_FIXAS, LARGURA_COLUNAS_FIXAS, colunaCalendarioClass } from '@/constants/turnos';
import type { GradeEscalaRow } from '@/lib/gradeEscalaRows';
import { cn } from '@/lib/utils';
import { LinhaTurno } from './LinhaTurno';
import { LinhaGrupoEscala } from './LinhaGrupoEscala';
import { LinhaSemGrupo } from './LinhaSemGrupo';
import { LinhaIndisponivel } from './LinhaIndisponivel';
import { DiaVazio, DiasVirtualizados } from './DiasVirtualizados';
import type { CelulaTroca } from './ConfirmarTrocaDialog';

interface GradeEscalaCorpoVirtualProps {
  flatRows: GradeEscalaRow[];
  virtualRows: VirtualItem[];
  paddingTop: number;
  paddingBottom: number;
  virtualColumns: VirtualItem[];
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

function colSpanTotal(virtualColumns: VirtualItem[], diasPadStart: number, diasPadEnd: number) {
  return (
    COLUNAS_FIXAS.length +
    (diasPadStart > 0 ? 1 : 0) +
    virtualColumns.length +
    (diasPadEnd > 0 ? 1 : 0)
  );
}

function LinhaSecao({
  section,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  virtualColumns,
  diasPadStart,
  diasPadEnd,
}: {
  section: 'indisponivel' | 'semAtribuicao' | 'semPadrao';
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  virtualColumns: VirtualItem[];
  diasPadStart: number;
  diasPadEnd: number;
}) {
  const config = {
    indisponivel: {
      label: 'Indisponível para assumir turno',
      rowClass: 'bg-sky-50/60',
      cellClass: 'bg-sky-50/60',
      diaClass: 'bg-sky-50/40',
    },
    semAtribuicao: {
      label: 'Sem atribuição — selecione um grupo ou arraste para cima',
      rowClass: 'bg-amber-50/60',
      cellClass: 'bg-amber-50/60',
      diaClass: 'bg-amber-50/40',
    },
    semPadrao: {
      label: 'Outras categorias',
      rowClass: 'bg-slate-100/70',
      cellClass: 'bg-slate-100/70',
      diaClass: 'bg-slate-100/50',
    },
  }[section];

  return (
    <tr className={config.rowClass}>
      <td
        colSpan={COLUNAS_FIXAS.length}
        className={cn(
          'border-b border-r px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide sticky left-0 z-10',
          config.cellClass,
          section === 'indisponivel' && 'text-sky-900',
          section === 'semAtribuicao' && 'text-amber-800',
          section === 'semPadrao' && 'text-slate-600'
        )}
        style={{ minWidth: LARGURA_COLUNAS_FIXAS }}
      >
        {config.label}
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
                config.diaClass,
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

export function GradeEscalaCorpoVirtual({
  flatRows,
  virtualRows,
  paddingTop,
  paddingBottom,
  virtualColumns,
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
  const totalColSpan = colSpanTotal(virtualColumns, diasPadStart, diasPadEnd);

  const renderRow = (row: GradeEscalaRow, rowIndex: number) => {
    const sharedVirtual = {
      virtualColumns,
      diasPadStart,
      diasPadEnd,
    };

    switch (row.kind) {
      case 'spacer':
        return (
          <tr key={`spacer-${rowIndex}`}>
            <td colSpan={totalColSpan} className="h-1 bg-slate-200/60 border-y p-0" />
          </tr>
        );
      case 'group':
        return (
          <LinhaGrupoEscala
            key={`group-${row.grupo.id}`}
            grupo={row.grupo}
            dias={dias}
            diasSemana={diasSemana}
            hoje={hoje}
            feriadosPorDia={feriadosPorDia}
            isDragOver={dragOverGrupo === row.grupo.indicePadrao}
            onDragOver={(e) => onDragOverGrupo(row.grupo.indicePadrao, e)}
            onDragLeave={onDragLeaveGrupo}
            onDrop={(e) => onDropGrupo(row.grupo.indicePadrao, e)}
            {...sharedVirtual}
          />
        );
      case 'turno':
        return (
          <LinhaTurno
            key={`turno-${row.funcionario.id}`}
            competenciaId={competenciaId}
            tipoEscala={tipoEscala}
            funcionario={row.funcionario}
            dias={dias}
            diasSemana={diasSemana}
            hoje={hoje}
            feriadosPorDia={feriadosPorDia}
            rowIndex={rowIndex}
            arrastavel={row.arrastavel}
            comGrupo={row.comGrupo}
            somenteLeitura={row.somenteLeitura}
            trocaOrigem={trocaOrigem}
            modoSelecaoTroca={modoSelecaoTroca}
            onIniciarTroca={row.comGrupo ? onIniciarTroca : undefined}
            onSelecionarDestinoTroca={row.comGrupo ? onSelecionarDestinoTroca : undefined}
            onSolicitarOcorrencia={row.comGrupo ? onSolicitarOcorrencia : undefined}
            {...sharedVirtual}
          />
        );
      case 'section':
        return (
          <LinhaSecao
            key={`section-${row.section}`}
            section={row.section}
            dias={dias}
            diasSemana={diasSemana}
            hoje={hoje}
            feriadosPorDia={feriadosPorDia}
            {...sharedVirtual}
          />
        );
      case 'indisponivel':
        return (
          <LinhaIndisponivel
            key={`indisponivel-${row.funcionario.id}`}
            funcionario={row.funcionario}
            dias={dias}
            diasSemana={diasSemana}
            hoje={hoje}
            feriadosPorDia={feriadosPorDia}
            rowIndex={rowIndex}
            {...sharedVirtual}
          />
        );
      case 'semGrupo':
        return (
          <LinhaSemGrupo
            key={`sem-grupo-${row.funcionario.id}`}
            funcionario={row.funcionario}
            dias={dias}
            diasSemana={diasSemana}
            hoje={hoje}
            feriadosPorDia={feriadosPorDia}
            rowIndex={rowIndex}
            gruposEscala={gruposEscala}
            onAtribuirGrupo={onAtribuirGrupo}
            {...sharedVirtual}
          />
        );
      default:
        return null;
    }
  };

  return (
    <tbody>
      {paddingTop > 0 && (
        <tr aria-hidden style={{ height: paddingTop }}>
          <td colSpan={totalColSpan} className="p-0 border-none" />
        </tr>
      )}
      {virtualRows.map((virtualRow) => {
        const row = flatRows[virtualRow.index];
        return renderRow(row, virtualRow.index);
      })}
      {paddingBottom > 0 && (
        <tr aria-hidden style={{ height: paddingBottom }}>
          <td colSpan={totalColSpan} className="p-0 border-none" />
        </tr>
      )}
    </tbody>
  );
}
