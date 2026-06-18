import { memo } from 'react';
import { LARGURA_COLUNAS_FIXAS_DESKTOP } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { DiasVaziosVirtualizados } from './DiasVaziosVirtualizados';
import { CelulaFixa, CelulaNomeScroll, ColunasFixas, LinhaGrade, ViewportDias } from './GradeEscalaLayout';

export interface LinhaSecaoEscalaProps {
  section: 'indisponivel' | 'semAtribuicao' | 'semPadrao';
  virtualTop: number;
  virtualHeight: number;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
}

const SECTION_CONFIG = {
  indisponivel: {
    label: 'Indisponível para assumir turno',
    rowClass: 'bg-sky-50/60',
    cellClass: 'bg-sky-50/60',
    diaClass: 'bg-sky-50/40',
    textClass: 'text-sky-900',
  },
  semAtribuicao: {
    label: 'Sem atribuição — selecione um grupo ou arraste para cima',
    rowClass: 'bg-amber-50/60',
    cellClass: 'bg-amber-50/60',
    diaClass: 'bg-amber-50/40',
    textClass: 'text-amber-800',
  },
  semPadrao: {
    label: 'Outras categorias',
    rowClass: 'bg-slate-100/70',
    cellClass: 'bg-slate-100/70',
    diaClass: 'bg-slate-100/50',
    textClass: 'text-slate-600',
  },
} as const;

function LinhaSecaoEscalaComponent({
  section,
  virtualTop,
  virtualHeight,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
}: LinhaSecaoEscalaProps) {
  const config = SECTION_CONFIG[section];

  return (
    <LinhaGrade virtualTop={virtualTop} virtualHeight={virtualHeight} className={config.rowClass}>
      <ColunasFixas className={config.cellClass}>
        <CelulaFixa
          width={LARGURA_COLUNAS_FIXAS_DESKTOP}
          className={cn(
            'py-1.5 text-[11px] font-semibold uppercase tracking-wide',
            config.cellClass,
            config.textClass
          )}
        >
          {config.label}
        </CelulaFixa>
      </ColunasFixas>
      <ViewportDias>
        <CelulaNomeScroll
          className={cn(
            'py-1.5 text-[10px] font-semibold uppercase tracking-wide',
            config.cellClass,
            config.textClass
          )}
        >
          <span className="line-clamp-2">{config.label}</span>
        </CelulaNomeScroll>
        <DiasVaziosVirtualizados
          visibleDiaIndices={visibleDiaIndices}
          padStart={diasPadStart}
          padEnd={diasPadEnd}
          dias={dias}
          diasSemana={diasSemana}
          hoje={hoje}
          feriadosPorDia={feriadosPorDia}
          diaClassName={config.diaClass}
        />
      </ViewportDias>
    </LinhaGrade>
  );
}

function linhaSecaoPropsEqual(
  prev: LinhaSecaoEscalaProps,
  next: LinhaSecaoEscalaProps
): boolean {
  return (
    prev.section === next.section &&
    prev.virtualTop === next.virtualTop &&
    prev.virtualHeight === next.virtualHeight &&
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.diasPadStart === next.diasPadStart &&
    prev.diasPadEnd === next.diasPadEnd
  );
}

export const LinhaSecaoEscala = memo(LinhaSecaoEscalaComponent, linhaSecaoPropsEqual);
