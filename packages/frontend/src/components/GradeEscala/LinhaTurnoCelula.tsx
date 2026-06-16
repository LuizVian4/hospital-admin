import { memo, useCallback } from 'react';
import type {
  EscalaOcorrencia,
  StatusEspecial,
  TipoOcorrenciaEscala,
  TipoEscala,
  Turno,
} from '@escala/shared';
import { ocorrenciaCelulaEqual, ESCALA_CELL_NOOP } from '@/lib/gradeEscalaMemo';
import { CelulaEscala, type EscalaCellChangeOptions } from './CelulaEscala';

export interface LinhaTurnoCelulaProps {
  competenciaId: number;
  tipoEscala: TipoEscala;
  funcionarioId: number;
  funcionarioNome: string;
  dia: number;
  cellWidth: number;
  turno: Turno | null;
  turnoProjetado: Turno | null;
  observacao: string | null;
  ocorrencia: EscalaOcorrencia | null;
  statusEspecial: StatusEspecial | null;
  feriadoNome: string | null;
  isWeekend: boolean;
  isHoje: boolean;
  rowBg: string;
  modoSomenteTroca: boolean;
  modoSelecaoTroca: boolean;
  somenteLeitura: boolean;
  isTrocaOrigem: boolean;
  elegivelDestinoTroca: boolean;
  exibicaoSomente?: boolean;
  onChange?: (
    funcionarioId: number,
    dia: number,
    turno: Turno | null,
    options?: EscalaCellChangeOptions
  ) => void;
  onIniciarTroca?: (funcionarioId: number, dia: number) => void;
  onSelecionarDestinoTroca?: (funcionarioId: number, dia: number) => void;
  onSolicitarOcorrencia?: (
    funcionarioId: number,
    funcionarioNome: string,
    dia: number,
    turno: Turno | null,
    tipo: TipoOcorrenciaEscala
  ) => void;
}

function LinhaTurnoCelulaComponent({
  competenciaId,
  tipoEscala,
  funcionarioId,
  funcionarioNome,
  dia,
  cellWidth,
  turno,
  turnoProjetado,
  observacao,
  ocorrencia,
  statusEspecial,
  feriadoNome,
  isWeekend,
  isHoje,
  rowBg,
  modoSomenteTroca,
  modoSelecaoTroca,
  somenteLeitura,
  isTrocaOrigem,
  elegivelDestinoTroca,
  exibicaoSomente = false,
  onChange,
  onIniciarTroca,
  onSelecionarDestinoTroca,
  onSolicitarOcorrencia,
}: LinhaTurnoCelulaProps) {
  const exibicao = turno ?? turnoProjetado;

  const handleSolicitarOcorrencia = useCallback(
    (tipo: TipoOcorrenciaEscala) => {
      onSolicitarOcorrencia?.(funcionarioId, funcionarioNome, dia, exibicao, tipo);
    },
    [onSolicitarOcorrencia, funcionarioId, funcionarioNome, dia, exibicao]
  );

  return (
    <CelulaEscala
      cellWidth={cellWidth}
      competenciaId={competenciaId}
      tipoEscala={tipoEscala}
      funcionarioId={funcionarioId}
      dia={dia}
      turno={turno}
      turnoProjetado={turnoProjetado}
      observacao={observacao}
      ocorrencia={ocorrencia}
      statusEspecial={statusEspecial}
      feriadoNome={feriadoNome}
      modoSomenteTroca={modoSomenteTroca}
      modoSelecaoTroca={modoSelecaoTroca}
      somenteLeitura={somenteLeitura}
      isTrocaOrigem={isTrocaOrigem}
      elegivelDestinoTroca={elegivelDestinoTroca}
      isWeekend={isWeekend}
      isHoje={isHoje}
      rowBg={rowBg}
      exibicaoSomente={exibicaoSomente}
      onChange={onChange ?? ESCALA_CELL_NOOP}
      onIniciarTroca={onIniciarTroca}
      onSelecionarDestinoTroca={onSelecionarDestinoTroca}
      onSolicitarOcorrencia={handleSolicitarOcorrencia}
    />
  );
}

function linhaTurnoCelulaPropsEqual(
  prev: LinhaTurnoCelulaProps,
  next: LinhaTurnoCelulaProps
): boolean {
  return (
    prev.competenciaId === next.competenciaId &&
    prev.tipoEscala === next.tipoEscala &&
    prev.funcionarioId === next.funcionarioId &&
    prev.dia === next.dia &&
    prev.cellWidth === next.cellWidth &&
    prev.turno === next.turno &&
    prev.turnoProjetado === next.turnoProjetado &&
    prev.observacao === next.observacao &&
    ocorrenciaCelulaEqual(prev.ocorrencia, next.ocorrencia) &&
    prev.statusEspecial === next.statusEspecial &&
    prev.feriadoNome === next.feriadoNome &&
    prev.isWeekend === next.isWeekend &&
    prev.isHoje === next.isHoje &&
    prev.rowBg === next.rowBg &&
    prev.modoSomenteTroca === next.modoSomenteTroca &&
    prev.modoSelecaoTroca === next.modoSelecaoTroca &&
    prev.somenteLeitura === next.somenteLeitura &&
    prev.isTrocaOrigem === next.isTrocaOrigem &&
    prev.elegivelDestinoTroca === next.elegivelDestinoTroca &&
    prev.exibicaoSomente === next.exibicaoSomente &&
    prev.onChange === next.onChange &&
    prev.onIniciarTroca === next.onIniciarTroca &&
    prev.onSelecionarDestinoTroca === next.onSelecionarDestinoTroca &&
    prev.onSolicitarOcorrencia === next.onSolicitarOcorrencia
  );
}

export const LinhaTurnoCelula = memo(LinhaTurnoCelulaComponent, linhaTurnoCelulaPropsEqual);
