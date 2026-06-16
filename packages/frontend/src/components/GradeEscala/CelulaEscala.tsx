import { useCallback, useRef, useState } from 'react';
import { TURNOS_DISPONIVEIS, type StatusEspecial, type Turno } from '@escala/shared';
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

export interface EscalaCellChangeOptions {
  indicePadrao?: number;
}

interface CelulaEscalaProps {
  funcionarioId: number;
  dia: number;
  turno: Turno | null;
  turnoProjetado?: Turno | null;
  observacao?: string | null;
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
}

export function CelulaEscala({
  funcionarioId,
  dia,
  turno,
  turnoProjetado = null,
  observacao = null,
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
}: CelulaEscalaProps) {
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const exibicao = turno ?? turnoProjetado;
  const isProjetado = turno == null && turnoProjetado != null;
  const hasTurno = exibicao != null && exibicao !== '';
  const temStatusEspecial = Boolean(statusEspecial);
  const temTroca = Boolean(observacao);
  const selectValue = turno ?? (isProjetado ? turnoProjetado! : '__empty__');
  const valorExibicaoTroca = hasTurno ? String(exibicao) : '__vazio__';

  const handleChange = useCallback(
    (value: string) => {
      if (value === '__troca__') {
        onIniciarTroca?.(funcionarioId, dia);
        return;
      }

      const newTurno = value === '__empty__' ? null : (value as Turno);
      onChange(funcionarioId, dia, newTurno);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaving(true);
      debounceRef.current = setTimeout(() => setSaving(false), 500);
    },
    [funcionarioId, dia, onChange, onIniciarTroca]
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
            ? 'Abra o menu e selecione Troca'
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

  const conteudoCelula = temStatusEspecial ? (
    conteudoStatus
  ) : somenteLeitura || modoSelecaoTroca ? (
    <span
      className={cn(
        'flex h-9 w-full items-center justify-center text-xs px-1',
        hasTurno ? 'font-semibold' : 'text-muted-foreground/40',
        isProjetado && 'italic opacity-80'
      )}
    >
      {exibicao ?? '·'}
    </span>
  ) : modoSomenteTroca ? (
    <Select
      value={valorExibicaoTroca}
      onValueChange={(value) => {
        if (value === '__troca__') handleChange('__troca__');
      }}
    >
      <SelectTrigger
        className={cn(
          'h-9 w-full border-0 bg-transparent shadow-none text-xs px-1 focus:ring-2 focus:ring-primary/30 rounded-none',
          hasTurno ? 'font-semibold' : 'text-muted-foreground/40',
          isProjetado && 'italic opacity-80'
        )}
      >
        <span className="flex-1 text-center">{exibicao ?? '·'}</span>
      </SelectTrigger>
      <SelectContent align="center" className="min-w-[100px]">
        <SelectItem value={valorExibicaoTroca} className="hidden" disabled>
          {exibicao ?? '·'}
        </SelectItem>
        <SelectItem value="__troca__" className="font-medium">
          Troca
        </SelectItem>
      </SelectContent>
    </Select>
  ) : (
    <Select value={selectValue} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'h-9 w-full border-0 bg-transparent shadow-none text-xs px-1 focus:ring-2 focus:ring-primary/30 rounded-none',
          hasTurno ? 'font-semibold' : 'text-muted-foreground/40',
          isProjetado && 'italic opacity-80'
        )}
      >
        <SelectValue placeholder="·">{exibicao ?? '·'}</SelectValue>
      </SelectTrigger>
      <SelectContent align="center" className="min-w-[80px]">
        <SelectItem value="__empty__" className="text-muted-foreground">
          —
        </SelectItem>
        {TURNOS_DISPONIVEIS.map((t) => (
          <SelectItem key={t} value={t} className="font-medium">
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <td
      onClick={modoSelecaoTroca && elegivelDestinoTroca ? handleCelulaClick : undefined}
      className={cn(
        'border-b px-0 py-0 text-center text-xs min-w-[40px] h-9 relative transition-colors',
        temTroca && !isTrocaOrigem && 'celula-com-troca',
        temStatusEspecial && statusEspecialCellClass(statusEspecial),
        isTrocaOrigem && 'ring-2 ring-inset ring-primary bg-primary/10',
        elegivelDestinoTroca && 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-primary/50',
        !hasTurno && rowBg,
        !isTrocaOrigem && !temStatusEspecial && turnoCellClass(exibicao),
        isProjetado && 'turno-projetado',
        colunaCalendarioClass({ isWeekend, feriadoNome, isHoje }),
        !modoSelecaoTroca && 'group-hover:bg-blue-50/50',
        saving && 'opacity-70'
      )}
      title={temTroca || temStatusEspecial ? undefined : title}
    >
      {temTroca ? (
        <ObservacaoTrocaPopover observacao={observacao!} dia={dia} turno={exibicao}>
          {conteudoCelula}
        </ObservacaoTrocaPopover>
      ) : (
        conteudoCelula
      )}
    </td>
  );
}
