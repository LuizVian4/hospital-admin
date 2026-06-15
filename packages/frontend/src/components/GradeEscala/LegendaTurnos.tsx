import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { TURNOS_LEGEND } from '@/constants/turnos';
import { cn } from '@/lib/utils';

export function LegendaTurnos() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          Legenda de turnos
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {TURNOS_LEGEND.map(({ sigla, desc, bg, text }) => (
              <span
                key={sigla}
                className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs', bg, text)}
              >
                <span className="font-semibold tabular-nums">{sigla}</span>
                <span className="text-[11px] opacity-80">{desc}</span>
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Arraste o nome do enfermeiro para um dos{' '}
            <span className="font-medium text-foreground">grupos de escala</span> na planilha, ou selecione
            o grupo na seção &quot;Sem atribuição&quot;. Funcionários com grupo podem usar{' '}
            <span className="font-medium text-foreground">Troca</span> em qualquer dia para permutar o turno
            com outro enfermeiro (pode ser em dias diferentes). Após selecionar as duas células,
            confirme a troca no pop-up. Turnos com troca realizada aparecem com destaque{' '}
            <span className="inline-block w-3 h-3 align-middle rounded-sm ring-2 ring-inset ring-violet-500/80 bg-violet-100" />
            {' '}— passe o mouse para ver o pop-up com a observação.
          </p>
        </div>
      )}
    </div>
  );
}
