import type { FuncionarioComTurnos, Turno } from '@escala/shared';
import { COLUNAS_FIXAS, stickyLeft } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { CelulaEscala, type EscalaCellChangeOptions } from './CelulaEscala';
import type { CelulaTroca } from './ConfirmarTrocaDialog';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';
import { ZerarEscalaButton } from './ZerarEscalaButton';
import { GripVertical } from 'lucide-react';

interface LinhaTurnoProps {
  competenciaId: number;
  funcionario: FuncionarioComTurnos;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
  arrastavel?: boolean;
  comGrupo?: boolean;
  somenteLeitura?: boolean;
  trocaOrigem?: CelulaTroca | null;
  modoSelecaoTroca?: boolean;
  onIniciarTroca?: (funcionarioId: number, dia: number) => void;
  onSelecionarDestinoTroca?: (funcionarioId: number, dia: number) => void;
  onCellChange?: (
    funcionarioId: number,
    dia: number,
    turno: Turno | null,
    options?: EscalaCellChangeOptions
  ) => void;
}

export function LinhaTurno({
  competenciaId,
  funcionario,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
  arrastavel = false,
  comGrupo = false,
  somenteLeitura = false,
  trocaOrigem = null,
  modoSelecaoTroca = false,
  onIniciarTroca,
  onSelecionarDestinoTroca,
  onCellChange,
}: LinhaTurnoProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70';

  const stickyCell = (index: number, className?: string) =>
    cn(
      'border-b border-r px-2 py-1.5 text-xs sticky z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]',
      rowBg,
      'group-hover:bg-blue-50/60',
      className
    );

  return (
    <tr
      className={cn('group transition-colors hover:bg-blue-50/40', rowBg)}
      draggable={arrastavel && !modoSelecaoTroca}
      onDragStart={(e) => {
        if (!arrastavel || modoSelecaoTroca) return;
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
          {arrastavel && (
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
          )}
          <span className="truncate min-w-0">
            <FuncionarioInfoPopover funcionario={funcionario} />
          </span>
          <ZerarEscalaButton
            competenciaId={competenciaId}
            funcionarioId={funcionario.id}
            funcionarioNome={funcionario.nome}
          />
        </span>
      </td>
      <td
        className={stickyCell(1, 'text-muted-foreground truncate')}
        style={{
          left: stickyLeft(1),
          minWidth: COLUNAS_FIXAS[1].width,
          width: COLUNAS_FIXAS[1].width,
          maxWidth: COLUNAS_FIXAS[1].width,
        }}
        title={funcionario.categoria}
      >
        {funcionario.categoria || '—'}
      </td>
      {dias.map((dia, idx) => {
        const turno = funcionario.turnos[dia] ?? null;
        const turnoProjetado = funcionario.turnosProjetados?.[dia] ?? null;
        const exibicao = turno ?? turnoProjetado;
        const isTrocaOrigem =
          trocaOrigem?.funcionarioId === funcionario.id && trocaOrigem.dia === dia;
        const elegivelDestinoTroca =
          modoSelecaoTroca &&
          comGrupo &&
          exibicao != null &&
          !funcionario.statusPorDia?.[dia] &&
          funcionario.id !== trocaOrigem?.funcionarioId &&
          !isTrocaOrigem;

        const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
        const feriadoNome = feriadosPorDia[dia] ?? null;

        return (
          <CelulaEscala
            key={dia}
            funcionarioId={funcionario.id}
            dia={dia}
            turno={turno}
            turnoProjetado={turnoProjetado}
            observacao={funcionario.observacoesDia?.[dia] ?? null}
            statusEspecial={funcionario.statusPorDia?.[dia] ?? null}
            feriadoNome={feriadoNome}
            modoSomenteTroca={comGrupo && !somenteLeitura}
            modoSelecaoTroca={modoSelecaoTroca}
            somenteLeitura={somenteLeitura}
            isTrocaOrigem={isTrocaOrigem}
            elegivelDestinoTroca={elegivelDestinoTroca}
            isWeekend={diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM'}
            isHoje={dia === hoje}
            rowBg={rowBg}
            onChange={onCellChange ?? (() => {})}
            onIniciarTroca={onIniciarTroca}
            onSelecionarDestinoTroca={onSelecionarDestinoTroca}
          />
        );
      })}
    </tr>
  );
}
