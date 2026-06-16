import { memo } from 'react';
import type { GrupoEscala, TipoEscala, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import type { GradeEscalaRow } from '@/lib/gradeEscalaRows';
import { trocaOrigemEqual } from '@/lib/gradeEscalaMemo';
import { LinhaTurno } from './LinhaTurno';
import { LinhaGrupoEscala } from './LinhaGrupoEscala';
import { LinhaSemGrupo } from './LinhaSemGrupo';
import { LinhaIndisponivel } from './LinhaIndisponivel';
import { LinhaSecaoEscala } from './LinhaSecaoEscala';
import { LinhaGrade } from './GradeEscalaLayout';
import type { CelulaTroca } from './ConfirmarTrocaDialog';

export interface GradeEscalaVirtualRowProps {
  row: GradeEscalaRow;
  rowIndex: number;
  virtualTop: number;
  virtualHeight: number;
  competenciaId: number;
  tipoEscala: TipoEscala;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
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
  isScrolling: boolean;
}

function GradeEscalaVirtualRowComponent({
  row,
  rowIndex,
  virtualTop,
  virtualHeight,
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
}: GradeEscalaVirtualRowProps) {
  const layout = { virtualTop, virtualHeight };
  const sharedVirtual = {
    visibleDiaIndices,
    diasPadStart,
    diasPadEnd,
    ...layout,
  };

  switch (row.kind) {
    case 'spacer':
      return (
        <LinhaGrade
          virtualTop={virtualTop}
          virtualHeight={virtualHeight}
          className="bg-slate-200/60 border-y"
          aria-hidden
        />
      );
    case 'group':
      return (
        <LinhaGrupoEscala
          grupo={row.grupo}
          indicePadrao={row.grupo.indicePadrao}
          dias={dias}
          diasSemana={diasSemana}
          hoje={hoje}
          feriadosPorDia={feriadosPorDia}
          isDragOver={dragOverGrupo === row.grupo.indicePadrao}
          onDragOverGrupo={onDragOverGrupo}
          onDragLeaveGrupo={onDragLeaveGrupo}
          onDropGrupo={onDropGrupo}
          {...sharedVirtual}
        />
      );
    case 'turno':
      return (
        <LinhaTurno
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
          isScrolling={isScrolling}
          {...sharedVirtual}
        />
      );
    case 'section':
      return (
        <LinhaSecaoEscala
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
}

function virtualRowPropsEqual(
  prev: GradeEscalaVirtualRowProps,
  next: GradeEscalaVirtualRowProps
): boolean {
  if (prev.row !== next.row) return false;
  if (prev.rowIndex !== next.rowIndex) return false;
  if (prev.virtualTop !== next.virtualTop) return false;
  if (prev.virtualHeight !== next.virtualHeight) return false;
  if (prev.visibleDiaIndices !== next.visibleDiaIndices) return false;
  if (prev.diasPadStart !== next.diasPadStart) return false;
  if (prev.diasPadEnd !== next.diasPadEnd) return false;
  if (prev.competenciaId !== next.competenciaId) return false;
  if (prev.tipoEscala !== next.tipoEscala) return false;
  if (prev.hoje !== next.hoje) return false;
  if (prev.dias !== next.dias) return false;
  if (prev.diasSemana !== next.diasSemana) return false;
  if (prev.feriadosPorDia !== next.feriadosPorDia) return false;

  if (prev.row.kind === 'group' && prev.dragOverGrupo !== next.dragOverGrupo) return false;

  if (prev.row.kind === 'turno') {
    if (prev.isScrolling !== next.isScrolling) return false;
    if (prev.row.comGrupo) {
      if (prev.modoSelecaoTroca !== next.modoSelecaoTroca) return false;
      if (!trocaOrigemEqual(prev.trocaOrigem, next.trocaOrigem)) return false;
      if (
        prev.onIniciarTroca !== next.onIniciarTroca ||
        prev.onSelecionarDestinoTroca !== next.onSelecionarDestinoTroca ||
        prev.onSolicitarOcorrencia !== next.onSolicitarOcorrencia
      ) {
        return false;
      }
    }
  }

  if (prev.row.kind === 'semGrupo' && prev.onAtribuirGrupo !== next.onAtribuirGrupo) return false;
  if (prev.row.kind === 'group') {
    if (
      prev.onDragOverGrupo !== next.onDragOverGrupo ||
      prev.onDragLeaveGrupo !== next.onDragLeaveGrupo ||
      prev.onDropGrupo !== next.onDropGrupo
    ) {
      return false;
    }
  }

  if (prev.row.kind === 'semGrupo' && prev.gruposEscala !== next.gruposEscala) return false;

  return true;
}

export const GradeEscalaVirtualRow = memo(GradeEscalaVirtualRowComponent, virtualRowPropsEqual);
