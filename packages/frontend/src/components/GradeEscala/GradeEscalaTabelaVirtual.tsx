import { LARGURA_COLUNA_DIA } from '@/constants/turnos';
import type { GrupoEscala, TipoEscala, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import type { GradeEscalaRow } from '@/lib/gradeEscalaRows';
import { GradeEscalaScrollProvider, useGradeEscalaScroll } from './GradeEscalaScrollContext';
import { useGradeEscalaColumnWindow } from './useGradeEscalaColumnWindow';
import { CabecalhoDiasGradeEscala, CabecalhoFixoGradeEscala } from './CabecalhoGradeEscala';
import { GradeEscalaCorpoVirtual } from './GradeEscalaCorpoVirtual';
import { RodapeScrollHorizontal, ScrollHorizontalDias } from './GradeEscalaLayout';
import type { CelulaTroca } from './ConfirmarTrocaDialog';

interface GradeEscalaTabelaVirtualProps {
  dias: number[];
  flatRows: GradeEscalaRow[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  diasComProblemaCobertura: Set<number>;
  competenciaId: number;
  tipoEscala: TipoEscala;
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

export function GradeEscalaTabelaVirtual(props: GradeEscalaTabelaVirtualProps) {
  const totalDiasWidth = props.dias.length * LARGURA_COLUNA_DIA;

  return (
    <GradeEscalaScrollProvider totalDiasWidth={totalDiasWidth}>
      <GradeEscalaTabelaInner {...props} />
    </GradeEscalaScrollProvider>
  );
}

function GradeEscalaTabelaInner({
  dias,
  flatRows,
  diasSemana,
  hoje,
  feriadosPorDia,
  diasComProblemaCobertura,
  competenciaId,
  tipoEscala,
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
}: GradeEscalaTabelaVirtualProps) {
  const { horizontalScrollRef } = useGradeEscalaScroll();
  const { visibleDiaIndices, diasPadStart, diasPadEnd } = useGradeEscalaColumnWindow(
    horizontalScrollRef,
    dias.length
  );

  return (
    <div
      className="flex flex-col max-h-[calc(100vh-320px)] text-sm border border-slate-200 rounded-sm overflow-hidden"
      role="grid"
      aria-label="Grade de escala"
    >
      <div className="flex shrink-0 z-20 border-b border-slate-200">
        <CabecalhoFixoGradeEscala />
        <ScrollHorizontalDias>
          <CabecalhoDiasGradeEscala
            dias={dias}
            diasSemana={diasSemana}
            hoje={hoje}
            feriadosPorDia={feriadosPorDia}
            diasComProblemaCobertura={diasComProblemaCobertura}
            visibleDiaIndices={visibleDiaIndices}
            diasPadStart={diasPadStart}
            diasPadEnd={diasPadEnd}
          />
        </ScrollHorizontalDias>
      </div>
      <GradeEscalaCorpoVirtual
        flatRows={flatRows}
        visibleDiaIndices={visibleDiaIndices}
        diasPadStart={diasPadStart}
        diasPadEnd={diasPadEnd}
        competenciaId={competenciaId}
        tipoEscala={tipoEscala}
        dias={dias}
        diasSemana={diasSemana}
        hoje={hoje}
        feriadosPorDia={feriadosPorDia}
        gruposEscala={gruposEscala}
        dragOverGrupo={dragOverGrupo}
        trocaOrigem={trocaOrigem}
        modoSelecaoTroca={modoSelecaoTroca}
        onDragOverGrupo={onDragOverGrupo}
        onDragLeaveGrupo={onDragLeaveGrupo}
        onDropGrupo={onDropGrupo}
        onAtribuirGrupo={onAtribuirGrupo}
        onIniciarTroca={onIniciarTroca}
        onSelecionarDestinoTroca={onSelecionarDestinoTroca}
        onSolicitarOcorrencia={onSolicitarOcorrencia}
      />
      <RodapeScrollHorizontal />
    </div>
  );
}
