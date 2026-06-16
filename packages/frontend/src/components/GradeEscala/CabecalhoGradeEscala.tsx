import { memo } from 'react';
import {
  COLUNAS_FIXAS,
  LARGURA_COLUNA_DIA,
  LARGURA_COLUNAS_FIXAS,
  colunaCalendarioClass,
} from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { CelulaEspacadorDias } from './DiasVirtualizados';
import { CabecalhoViewportDias, CelulaFixa, ColunasFixas } from './GradeEscalaLayout';

export const CabecalhoFixoGradeEscala = memo(function CabecalhoFixoGradeEscala() {
  return (
    <ColunasFixas className="flex-col border-r border-slate-200">
      <div className="flex bg-slate-100">
        {COLUNAS_FIXAS.map((coluna) => (
          <CelulaFixa
            key={coluna.key}
            width={coluna.width}
            className={cn(
              'py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-100',
              coluna.key === 'nome' && 'text-left'
            )}
          >
            {coluna.label}
          </CelulaFixa>
        ))}
      </div>
      <div className="flex bg-slate-50 border-t border-slate-200">
        <CelulaFixa
          width={LARGURA_COLUNAS_FIXAS}
          className="py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-50 text-left"
        >
          Escala
        </CelulaFixa>
      </div>
    </ColunasFixas>
  );
});

interface CabecalhoDiasGradeEscalaProps {
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  diasComProblemaCobertura: Set<number>;
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
}

function CabecalhoDiasGradeEscalaComponent({
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  diasComProblemaCobertura,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
}: CabecalhoDiasGradeEscalaProps) {
  return (
    <CabecalhoViewportDias className="flex-col">
      <div className="flex bg-slate-100">
        <CelulaEspacadorDias width={diasPadStart} />
        {visibleDiaIndices.map((idx) => {
          const dia = dias[idx];
          const isHoje = dia === hoje;
          const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
          const feriadoNome = feriadosPorDia[dia] ?? null;
          const semCobertura = diasComProblemaCobertura.has(dia);
          return (
            <div
              key={dia}
              className={cn(
                'border-b px-1 py-2 text-xs text-center font-semibold shrink-0',
                semCobertura
                  ? 'dia-sem-cobertura-header'
                  : cn(
                      'bg-slate-100 text-slate-700',
                      colunaCalendarioClass({ isWeekend, feriadoNome, isHoje, parte: 'header' })
                    )
              )}
              style={{
                width: LARGURA_COLUNA_DIA,
                minWidth: LARGURA_COLUNA_DIA,
                maxWidth: LARGURA_COLUNA_DIA,
              }}
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
            </div>
          );
        })}
        <CelulaEspacadorDias width={diasPadEnd} />
      </div>
      <div className="flex bg-slate-50">
        <CelulaEspacadorDias width={diasPadStart} />
        {visibleDiaIndices.map((idx) => {
          const dia = dias[idx];
          const isHoje = dia === hoje;
          const ds = diasSemana[idx];
          const isWeekend = ds === 'SAB' || ds === 'DOM';
          const feriadoNome = feriadosPorDia[dia] ?? null;
          const semCobertura = diasComProblemaCobertura.has(dia);
          return (
            <div
              key={`dow-${dia}`}
              className={cn(
                'border-b px-1 py-1 text-[10px] font-medium text-center shrink-0',
                semCobertura
                  ? 'dia-sem-cobertura-header'
                  : cn(
                      'bg-slate-50 text-slate-400',
                      colunaCalendarioClass({ isWeekend, feriadoNome, isHoje, parte: 'dow' })
                    )
              )}
              style={{
                width: LARGURA_COLUNA_DIA,
                minWidth: LARGURA_COLUNA_DIA,
                maxWidth: LARGURA_COLUNA_DIA,
              }}
              title={
                semCobertura ? 'Cobertura insuficiente neste dia' : feriadoNome ?? undefined
              }
            >
              {ds}
            </div>
          );
        })}
        <CelulaEspacadorDias width={diasPadEnd} />
      </div>
    </CabecalhoViewportDias>
  );
}

function cabecalhoDiasPropsEqual(
  prev: CabecalhoDiasGradeEscalaProps,
  next: CabecalhoDiasGradeEscalaProps
): boolean {
  return (
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.diasComProblemaCobertura === next.diasComProblemaCobertura &&
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.diasPadStart === next.diasPadStart &&
    prev.diasPadEnd === next.diasPadEnd
  );
}

export const CabecalhoDiasGradeEscala = memo(
  CabecalhoDiasGradeEscalaComponent,
  cabecalhoDiasPropsEqual
);

// Compat: reexport combinado para testes ou uso legado
export const CabecalhoGradeEscala = CabecalhoDiasGradeEscala;
