import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { FERIADO_TIPO_LABEL, getFeriadosNoMes } from '@escala/shared';
import { cn } from '@/lib/utils';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface LegendaFeriadosProps {
  mes: number;
  ano: number;
}

export function LegendaFeriados({ mes, ano }: LegendaFeriadosProps) {
  const [open, setOpen] = useState(true);

  const feriados = useMemo(() => getFeriadosNoMes(mes, ano), [mes, ano]);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Calendário — Salvador/BA
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 border border-slate-300" />
              Fim de semana
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-800">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-100 border border-rose-200" />
              Feriado
            </span>
          </div>

          {feriados.length > 0 ? (
            <div className="rounded-md border divide-y">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30">
                Feriados em {MESES[mes - 1]} / {ano}
              </div>
              <ul className="divide-y">
                {feriados.map((f) => (
                  <li
                    key={`${f.dia}-${f.nome}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="font-medium tabular-nums text-rose-900">
                      {String(f.dia).padStart(2, '0')}/{String(f.mes).padStart(2, '0')}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{f.nome}</span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {FERIADO_TIPO_LABEL[f.tipo]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum feriado em {MESES[mes - 1]} / {ano}.
            </p>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Feriados nacionais, estaduais da Bahia e municipais de Salvador são calculados
            automaticamente, incluindo datas móveis (Carnaval, Sexta-feira Santa e Corpus Christi).
          </p>
        </div>
      )}
    </div>
  );
}
