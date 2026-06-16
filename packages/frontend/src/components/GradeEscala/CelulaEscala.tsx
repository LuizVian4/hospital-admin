import { useCallback, useRef, useState } from 'react';
import {
  TURNOS_DISPONIVEIS,
  formatarExibicaoComPlantaoExtra,
  type EscalaOcorrencia,
  type StatusEspecial,
  type TipoOcorrenciaEscala,
  type TipoEscala,
  type Turno,
} from '@escala/shared';
import { turnoCellClass, statusEspecialCellClass, colunaCalendarioClass } from '@/constants/turnos';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ObservacaoTrocaPopover } from './ObservacaoTrocaPopover';
import { OcorrenciaInfoPopover } from './OcorrenciaInfoPopover';

export interface EscalaCellChangeOptions {
  indicePadrao?: number;
}

interface CelulaEscalaProps {
  competenciaId: number;
  tipoEscala: TipoEscala;
  funcionarioId: number;
  dia: number;
  turno: Turno | null;
  turnoProjetado?: Turno | null;
  observacao?: string | null;
  ocorrencia?: EscalaOcorrencia | null;
  statusEspecial?: StatusEspecial | null;
  feriadoNome?: string | null;
  modoSomenteTroca?: boolean;
  modoSelecaoTroca?: boolean;
  somenteLeitura?: boolean;
  isTrocaOrigem?: boolean;
  elegivelDestinoTroca?: boolean;
  isWeekend: boolean;
  isHoje: boolean;
  rowBg: string;
  onChange: (
    funcionarioId: number,
    dia: number,
    turno: Turno | null,
    options?: EscalaCellChangeOptions
  ) => void;
  onIniciarTroca?: (funcionarioId: number, dia: number) => void;
  onSelecionarDestinoTroca?: (funcionarioId: number, dia: number) => void;
  onSolicitarOcorrencia?: (tipo: TipoOcorrenciaEscala) => void;
}

function ConteudoTurno({
  exibicao,
  hasTurno,
  isProjetado,
  ocorrencia,
}: {
  exibicao: Turno | null | undefined;
  hasTurno: boolean;
  isProjetado: boolean;
  ocorrencia?: EscalaOcorrencia | null;
}) {
  const textoPlantaoExtra =
    ocorrencia?.tipo === 'PLANTAO_EXTRA'
      ? formatarExibicaoComPlantaoExtra(exibicao, ocorrencia.turno)
      : null;

  if (ocorrencia?.tipo === 'PLANTAO_EXTRA' && textoPlantaoExtra) {
    return (
      <span className="flex flex-col items-center justify-center leading-none gap-0 px-0.5">
        <span className="font-semibold text-[10px] sm:text-xs whitespace-nowrap text-emerald-800">
          {textoPlantaoExtra}
        </span>
        <span
          className="text-[9px] leading-none text-emerald-600 mt-0.5"
          title="Plantão extra"
          aria-hidden
        >
          ★
        </span>
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center justify-center leading-tight gap-0">
      <span
        className={cn(
          hasTurno ? 'font-semibold' : 'text-muted-foreground/40',
          isProjetado && 'italic opacity-80',
          ocorrencia?.tipo === 'FALTA' && 'line-through opacity-60'
        )}
      >
        {exibicao ?? '·'}
      </span>
      {ocorrencia?.tipo === 'FALTA' && (
        <span className="text-[9px] font-bold text-red-700 leading-none">FALTA</span>
      )}
    </span>
  );
}

function MenuOcorrencias({ comTroca = false }: { comTroca?: boolean }) {
  return (
    <>
      {comTroca && (
        <SelectItem value="__troca__" className="font-medium">
          Troca
        </SelectItem>
      )}
      <SelectItem value="__falta__" className="font-medium text-red-700">
        Falta
      </SelectItem>
      <SelectItem value="__plantao_extra__" className="font-medium text-emerald-700">
        Plantão extra
      </SelectItem>
    </>
  );
}

export function CelulaEscala({
  competenciaId,
  tipoEscala,
  funcionarioId,
  dia,
  turno,
  turnoProjetado = null,
  observacao = null,
  ocorrencia = null,
  statusEspecial = null,
  feriadoNome = null,
  modoSomenteTroca = false,
  modoSelecaoTroca = false,
  somenteLeitura = false,
  isTrocaOrigem = false,
  elegivelDestinoTroca = false,
  isWeekend,
  isHoje,
  rowBg,
  onChange,
  onIniciarTroca,
  onSelecionarDestinoTroca,
  onSolicitarOcorrencia,
}: CelulaEscalaProps) {
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const exibicao = turno ?? turnoProjetado;
  const isProjetado = turno == null && turnoProjetado != null;
  const hasTurno = exibicao != null && exibicao !== '';
  const temStatusEspecial = Boolean(statusEspecial);
  const temTroca = Boolean(observacao);
  const temOcorrencia = Boolean(ocorrencia);
  const selectValue = turno ?? (isProjetado ? turnoProjetado! : '__empty__');
  const valorExibicaoTroca = hasTurno ? String(exibicao) : '__vazio__';

  const handleAcaoEspecial = useCallback(
    (value: string) => {
      if (value === '__troca__') {
        onIniciarTroca?.(funcionarioId, dia);
        return;
      }
      if (value === '__falta__') {
        onSolicitarOcorrencia?.('FALTA');
        return;
      }
      if (value === '__plantao_extra__') {
        onSolicitarOcorrencia?.('PLANTAO_EXTRA');
      }
    },
    [funcionarioId, dia, onIniciarTroca, onSolicitarOcorrencia]
  );

  const handleChange = useCallback(
    (value: string) => {
      if (value.startsWith('__')) {
        handleAcaoEspecial(value);
        return;
      }

      const newTurno = value === '__empty__' ? null : (value as Turno);
      onChange(funcionarioId, dia, newTurno);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaving(true);
      debounceRef.current = setTimeout(() => setSaving(false), 500);
    },
    [funcionarioId, dia, onChange, handleAcaoEspecial]
  );

  const handleCelulaClick = useCallback(() => {
    if (modoSelecaoTroca && elegivelDestinoTroca) {
      onSelecionarDestinoTroca?.(funcionarioId, dia);
    }
  }, [modoSelecaoTroca, elegivelDestinoTroca, funcionarioId, dia, onSelecionarDestinoTroca]);

  const title = temStatusEspecial
    ? `Status especial: ${statusEspecial}`
    : feriadoNome
      ? `Feriado: ${feriadoNome}`
      : isTrocaOrigem
        ? 'Célula de origem — selecione outra célula na planilha'
        : elegivelDestinoTroca
          ? 'Clique para selecionar como destino da troca'
          : isProjetado
            ? 'Projeção automática pelo padrão do grupo'
            : modoSomenteTroca
              ? 'Abra o menu para troca, falta ou plantão extra'
              : undefined;

  const conteudoStatus = (
    <span
      title={title}
      className={cn(
        'flex h-9 w-full items-center justify-center text-xs px-1 font-semibold cursor-default',
        hasTurno ? '' : 'text-muted-foreground/40'
      )}
    >
      {exibicao ?? '·'}
    </span>
  );

  const triggerClass = cn(
    'h-9 w-full border-0 bg-transparent shadow-none text-xs px-1 focus:ring-2 focus:ring-primary/30 rounded-none',
    hasTurno ? '' : 'text-muted-foreground/40',
    isProjetado && !temOcorrencia && 'italic opacity-80'
  );

  const conteudoCelula = temStatusEspecial ? (
    conteudoStatus
  ) : somenteLeitura || modoSelecaoTroca ? (
    <span className="flex h-9 w-full items-center justify-center text-xs px-1">
      <ConteudoTurno
        exibicao={exibicao}
        hasTurno={hasTurno}
        isProjetado={isProjetado}
        ocorrencia={ocorrencia}
      />
    </span>
  ) : modoSomenteTroca ? (
    <Select
      value={valorExibicaoTroca}
      onValueChange={handleChange}
    >
      <SelectTrigger className={triggerClass}>
        <ConteudoTurno
          exibicao={exibicao}
          hasTurno={hasTurno}
          isProjetado={isProjetado}
          ocorrencia={ocorrencia}
        />
      </SelectTrigger>
      <SelectContent align="center" className="min-w-[140px]">
        <SelectItem value={valorExibicaoTroca} className="hidden" disabled>
          {exibicao ?? '·'}
        </SelectItem>
        <MenuOcorrencias comTroca />
      </SelectContent>
    </Select>
  ) : (
    <Select value={selectValue} onValueChange={handleChange}>
      <SelectTrigger className={triggerClass}>
        <SelectValue placeholder="·">
          <ConteudoTurno
            exibicao={exibicao}
            hasTurno={hasTurno}
            isProjetado={isProjetado}
            ocorrencia={ocorrencia}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" className="min-w-[140px]">
        <SelectItem value="__empty__" className="text-muted-foreground">
          —
        </SelectItem>
        {TURNOS_DISPONIVEIS.map((t) => (
          <SelectItem key={t} value={t} className="font-medium">
            {t}
          </SelectItem>
        ))}
        <MenuOcorrencias />
      </SelectContent>
    </Select>
  );

  const celulaInner =
    temTroca ? (
      <ObservacaoTrocaPopover
        observacao={observacao!}
        competenciaId={competenciaId}
        funcionarioId={funcionarioId}
        tipoEscala={tipoEscala}
        dia={dia}
        turno={exibicao}
      >
        {conteudoCelula}
      </ObservacaoTrocaPopover>
    ) : temOcorrencia && ocorrencia ? (
      <OcorrenciaInfoPopover
        ocorrencia={ocorrencia}
        competenciaId={competenciaId}
        tipoEscala={tipoEscala}
        dia={dia}
        turno={exibicao}
      >
        {conteudoCelula}
      </OcorrenciaInfoPopover>
    ) : (
      conteudoCelula
    );

  return (
    <td
      onClick={modoSelecaoTroca && elegivelDestinoTroca ? handleCelulaClick : undefined}
      className={cn(
        'border-b px-0 py-0 text-center text-xs min-w-[40px] h-9 relative transition-colors',
        temTroca && !isTrocaOrigem && 'celula-com-troca',
        temOcorrencia && ocorrencia?.tipo === 'FALTA' && 'celula-falta',
        temOcorrencia && ocorrencia?.tipo === 'PLANTAO_EXTRA' && 'celula-plantao-extra',
        temStatusEspecial && statusEspecialCellClass(statusEspecial),
        isTrocaOrigem && 'ring-2 ring-inset ring-primary bg-primary/10',
        elegivelDestinoTroca && 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-primary/50',
        !hasTurno && rowBg,
        !isTrocaOrigem && !temStatusEspecial && !temOcorrencia && turnoCellClass(exibicao),
        isProjetado && !temOcorrencia && 'turno-projetado',
        colunaCalendarioClass({ isWeekend, feriadoNome, isHoje }),
        !modoSelecaoTroca && 'group-hover:bg-blue-50/50',
        saving && 'opacity-70'
      )}
      title={temTroca || temStatusEspecial || temOcorrencia ? undefined : title}
    >
      {celulaInner}
    </td>
  );
}
