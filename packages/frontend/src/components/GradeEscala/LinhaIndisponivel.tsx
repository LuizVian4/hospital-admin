import { memo, useMemo } from 'react';
import type { FuncionarioComTurnos } from '@escala/shared';
import { LARGURA_COLUNAS_FIXAS } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';
import {
  DiasLeituraVirtualizados,
  buildDadosLeituraPorDia,
} from './DiasLeituraVirtualizados';
import { CelulaFixa, ColunasFixas, LinhaGrade, ViewportDias } from './GradeEscalaLayout';

export interface LinhaIndisponivelProps {
  funcionario: FuncionarioComTurnos;
  virtualTop: number;
  virtualHeight: number;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
}

function LinhaIndisponivelComponent({
  funcionario,
  virtualTop,
  virtualHeight,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
}: LinhaIndisponivelProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-sky-50/30' : 'bg-sky-50/50';
  const dadosPorDia = useMemo(
    () => buildDadosLeituraPorDia(funcionario, visibleDiaIndices, dias),
    [funcionario, visibleDiaIndices, dias]
  );

  return (
    <LinhaGrade virtualTop={virtualTop} virtualHeight={virtualHeight} className={rowBg}>
      <ColunasFixas className={rowBg}>
        <CelulaFixa
          width={LARGURA_COLUNAS_FIXAS}
          className={cn('font-medium text-foreground', rowBg)}
        >
          <span className="truncate min-w-0">
            <FuncionarioInfoPopover funcionario={funcionario} />
          </span>
        </CelulaFixa>
      </ColunasFixas>
      <ViewportDias>
        <DiasLeituraVirtualizados
          visibleDiaIndices={visibleDiaIndices}
          padStart={diasPadStart}
          padEnd={diasPadEnd}
          dias={dias}
          diasSemana={diasSemana}
          hoje={hoje}
          feriadosPorDia={feriadosPorDia}
          rowBg={rowBg}
          dadosPorDia={dadosPorDia}
        />
      </ViewportDias>
    </LinhaGrade>
  );
}

function linhaIndisponivelPropsEqual(
  prev: LinhaIndisponivelProps,
  next: LinhaIndisponivelProps
): boolean {
  return (
    prev.funcionario === next.funcionario &&
    prev.virtualTop === next.virtualTop &&
    prev.virtualHeight === next.virtualHeight &&
    prev.rowIndex === next.rowIndex &&
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.diasPadStart === next.diasPadStart &&
    prev.diasPadEnd === next.diasPadEnd
  );
}

export const LinhaIndisponivel = memo(LinhaIndisponivelComponent, linhaIndisponivelPropsEqual);
