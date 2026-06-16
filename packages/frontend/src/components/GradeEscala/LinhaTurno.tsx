import { memo } from 'react';
import type { FuncionarioComTurnos, TipoEscala, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import { COLUNAS_FIXAS, LARGURA_COLUNA_DIA } from '@/constants/turnos';
import { ESCALA_CELL_NOOP, trocaOrigemEqual } from '@/lib/gradeEscalaMemo';
import { cn } from '@/lib/utils';
import type { CelulaTroca } from './ConfirmarTrocaDialog';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';
import { ZerarEscalaButton } from './ZerarEscalaButton';
import { CelulaEspacadorDias } from './DiasVirtualizados';
import { LinhaTurnoCelula, type LinhaTurnoCelulaProps } from './LinhaTurnoCelula';
import type { EscalaCellChangeOptions } from './CelulaEscala';
import { CelulaFixa, ColunasFixas, LinhaGrade, ViewportDias } from './GradeEscalaLayout';
import { GripVertical } from 'lucide-react';

export interface LinhaTurnoProps {
  competenciaId: number;
  tipoEscala: TipoEscala;
  funcionario: FuncionarioComTurnos;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
  virtualTop: number;
  virtualHeight: number;
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
  arrastavel?: boolean;
  comGrupo?: boolean;
  somenteLeitura?: boolean;
  trocaOrigem?: CelulaTroca | null;
  modoSelecaoTroca?: boolean;
  onIniciarTroca?: (funcionarioId: number, dia: number) => void;
  onSelecionarDestinoTroca?: (funcionarioId: number, dia: number) => void;
  onSolicitarOcorrencia?: (
    funcionarioId: number,
    funcionarioNome: string,
    dia: number,
    turno: Turno | null,
    tipo: TipoOcorrenciaEscala
  ) => void;
  onCellChange?: (
    funcionarioId: number,
    dia: number,
    turno: Turno | null,
    options?: EscalaCellChangeOptions
  ) => void;
  isScrolling?: boolean;
}

function LinhaTurnoComponent({
  competenciaId,
  tipoEscala,
  funcionario,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
  virtualTop,
  virtualHeight,
  arrastavel = false,
  comGrupo = false,
  somenteLeitura = false,
  trocaOrigem = null,
  modoSelecaoTroca = false,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
  onIniciarTroca,
  onSelecionarDestinoTroca,
  onSolicitarOcorrencia,
  onCellChange,
  isScrolling = false,
}: LinhaTurnoProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70';
  const trocaOrigemFuncionarioId = trocaOrigem?.funcionarioId ?? null;
  const trocaOrigemDia = trocaOrigem?.dia ?? null;
  const modoSomenteTroca = comGrupo && !somenteLeitura;
  const onChange = onCellChange ?? ESCALA_CELL_NOOP;

  return (
    <LinhaGrade
      virtualTop={virtualTop}
      virtualHeight={virtualHeight}
      className={cn('group hover:bg-blue-50/40', rowBg)}
      draggable={arrastavel && !modoSelecaoTroca}
      onDragStart={(e) => {
        if (!arrastavel || modoSelecaoTroca) return;
        e.dataTransfer.setData('funcionarioId', String(funcionario.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <ColunasFixas className={rowBg}>
        <CelulaFixa
          width={COLUNAS_FIXAS[0].width}
          className={cn('font-medium text-foreground group-hover:bg-blue-50/60', rowBg)}
        >
          <span className="flex items-center gap-1 min-w-0">
            {arrastavel && (
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
            )}
            <span className="truncate min-w-0">
              <FuncionarioInfoPopover funcionario={funcionario} />
            </span>
            <ZerarEscalaButton
              competenciaId={competenciaId}
              tipoEscala={tipoEscala}
              funcionarioId={funcionario.id}
              funcionarioNome={funcionario.nome}
            />
          </span>
        </CelulaFixa>
        <CelulaFixa
          width={COLUNAS_FIXAS[1].width}
          className={cn('text-muted-foreground truncate group-hover:bg-blue-50/60', rowBg)}
          title={funcionario.categoria}
        >
          {funcionario.categoria || '—'}
        </CelulaFixa>
      </ColunasFixas>
      <ViewportDias>
        <CelulaEspacadorDias width={diasPadStart} />
        {visibleDiaIndices.map((idx) => {
          const dia = dias[idx];
          const turno = funcionario.turnos[dia] ?? null;
          const turnoProjetado = funcionario.turnosProjetados?.[dia] ?? null;
          const exibicao = turno ?? turnoProjetado;
          const isTrocaOrigem =
            trocaOrigemFuncionarioId === funcionario.id && trocaOrigemDia === dia;
          const elegivelDestinoTroca =
            modoSelecaoTroca &&
            comGrupo &&
            exibicao != null &&
            !funcionario.statusPorDia?.[dia] &&
            funcionario.id !== trocaOrigemFuncionarioId &&
            !isTrocaOrigem;

          const celulaProps: LinhaTurnoCelulaProps = {
            competenciaId,
            tipoEscala,
            funcionarioId: funcionario.id,
            funcionarioNome: funcionario.nome,
            dia,
            cellWidth: LARGURA_COLUNA_DIA,
            turno,
            turnoProjetado,
            observacao: funcionario.observacoesDia?.[dia] ?? null,
            ocorrencia: funcionario.ocorrenciasPorDia?.[dia] ?? null,
            statusEspecial: funcionario.statusPorDia?.[dia] ?? null,
            feriadoNome: feriadosPorDia[dia] ?? null,
            isWeekend: diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM',
            isHoje: dia === hoje,
            rowBg,
            modoSomenteTroca,
            modoSelecaoTroca,
            somenteLeitura,
            isTrocaOrigem,
            elegivelDestinoTroca,
            exibicaoSomente: isScrolling,
            onChange,
            onIniciarTroca,
            onSelecionarDestinoTroca,
            onSolicitarOcorrencia,
          };

          return <LinhaTurnoCelula key={dia} {...celulaProps} />;
        })}
        <CelulaEspacadorDias width={diasPadEnd} />
      </ViewportDias>
    </LinhaGrade>
  );
}

function linhaTurnoPropsEqual(prev: LinhaTurnoProps, next: LinhaTurnoProps): boolean {
  if (prev.funcionario !== next.funcionario) return false;
  if (prev.visibleDiaIndices !== next.visibleDiaIndices) return false;
  if (prev.virtualTop !== next.virtualTop) return false;
  if (prev.virtualHeight !== next.virtualHeight) return false;
  if (prev.competenciaId !== next.competenciaId) return false;
  if (prev.tipoEscala !== next.tipoEscala) return false;
  if (prev.rowIndex !== next.rowIndex) return false;
  if (prev.arrastavel !== next.arrastavel) return false;
  if (prev.comGrupo !== next.comGrupo) return false;
  if (prev.somenteLeitura !== next.somenteLeitura) return false;
  if (prev.hoje !== next.hoje) return false;
  if (prev.diasPadStart !== next.diasPadStart) return false;
  if (prev.diasPadEnd !== next.diasPadEnd) return false;
  if (prev.onCellChange !== next.onCellChange) return false;
  if (prev.onIniciarTroca !== next.onIniciarTroca) return false;
  if (prev.onSelecionarDestinoTroca !== next.onSelecionarDestinoTroca) return false;
  if (prev.onSolicitarOcorrencia !== next.onSolicitarOcorrencia) return false;

  if (prev.modoSelecaoTroca !== next.modoSelecaoTroca) {
    if (prev.comGrupo || next.comGrupo) return false;
  }

  if (!trocaOrigemEqual(prev.trocaOrigem, next.trocaOrigem)) {
    if (prev.comGrupo || next.comGrupo) return false;
  }

  if (prev.isScrolling !== next.isScrolling) return false;

  return true;
}

export const LinhaTurno = memo(LinhaTurnoComponent, linhaTurnoPropsEqual);
