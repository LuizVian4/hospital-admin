import { memo, useCallback, useMemo } from 'react';
import type { FuncionarioComTurnos, GrupoEscala } from '@escala/shared';
import { COLUNAS_FIXAS } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import { FuncionarioInfoPopover } from './FuncionarioInfoPopover';
import {
  DiasLeituraVirtualizados,
  buildDadosLeituraPorDia,
} from './DiasLeituraVirtualizados';
import { CelulaFixa, ColunasFixas, LinhaGrade, ViewportDias } from './GradeEscalaLayout';
import { GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface LinhaSemGrupoProps {
  funcionario: FuncionarioComTurnos;
  virtualTop: number;
  virtualHeight: number;
  dias: number[];
  diasSemana: string[];
  hoje: number | null;
  feriadosPorDia: Record<number, string>;
  rowIndex: number;
  gruposEscala: GrupoEscala[];
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
  onAtribuirGrupo: (funcionarioId: number, indicePadrao: number) => void;
}

function LinhaSemGrupoComponent({
  funcionario,
  virtualTop,
  virtualHeight,
  dias,
  diasSemana,
  hoje,
  feriadosPorDia,
  rowIndex,
  gruposEscala,
  visibleDiaIndices,
  diasPadStart,
  diasPadEnd,
  onAtribuirGrupo,
}: LinhaSemGrupoProps) {
  const isEven = rowIndex % 2 === 0;
  const rowBg = isEven ? 'bg-amber-50/30' : 'bg-amber-50/50';
  const dadosPorDia = useMemo(
    () => buildDadosLeituraPorDia(funcionario, visibleDiaIndices, dias),
    [funcionario, visibleDiaIndices, dias]
  );

  const handleGrupoChange = useCallback(
    (value: string) => {
      const grupoId = Number(value);
      const grupo = gruposEscala.find((g) => g.id === grupoId);
      if (!grupo) return;
      onAtribuirGrupo(funcionario.id, grupo.indicePadrao);
    },
    [gruposEscala, onAtribuirGrupo, funcionario.id]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('funcionarioId', String(funcionario.id));
      e.dataTransfer.effectAllowed = 'move';
    },
    [funcionario.id]
  );

  return (
    <LinhaGrade
      virtualTop={virtualTop}
      virtualHeight={virtualHeight}
      className={rowBg}
      draggable
      onDragStart={handleDragStart}
    >
      <ColunasFixas className={rowBg}>
        <CelulaFixa
          width={COLUNAS_FIXAS[0].width}
          className={cn('font-medium text-foreground', rowBg)}
        >
          <span className="flex items-center gap-1 min-w-0">
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
            <span className="truncate min-w-0">
              <FuncionarioInfoPopover funcionario={funcionario} />
            </span>
          </span>
        </CelulaFixa>
        <CelulaFixa width={COLUNAS_FIXAS[1].width} className={rowBg}>
          <Select onValueChange={handleGrupoChange}>
            <SelectTrigger className="h-7 w-full text-xs border-dashed border-amber-300/80 bg-white/80">
              <SelectValue placeholder="Selecionar grupo..." />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[280px]">
              {gruposEscala.map((grupo) => (
                <SelectItem key={grupo.id} value={String(grupo.id)} className="py-2">
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold">{grupo.label}</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {grupo.descricao}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

function linhaSemGrupoPropsEqual(prev: LinhaSemGrupoProps, next: LinhaSemGrupoProps): boolean {
  return (
    prev.funcionario === next.funcionario &&
    prev.virtualTop === next.virtualTop &&
    prev.virtualHeight === next.virtualHeight &&
    prev.rowIndex === next.rowIndex &&
    prev.gruposEscala === next.gruposEscala &&
    prev.dias === next.dias &&
    prev.diasSemana === next.diasSemana &&
    prev.hoje === next.hoje &&
    prev.feriadosPorDia === next.feriadosPorDia &&
    prev.visibleDiaIndices === next.visibleDiaIndices &&
    prev.diasPadStart === next.diasPadStart &&
    prev.diasPadEnd === next.diasPadEnd &&
    prev.onAtribuirGrupo === next.onAtribuirGrupo
  );
}

export const LinhaSemGrupo = memo(LinhaSemGrupoComponent, linhaSemGrupoPropsEqual);
