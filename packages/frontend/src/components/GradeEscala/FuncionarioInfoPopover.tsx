import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FuncionarioComTurnos } from '@escala/shared';
import { cn } from '@/lib/utils';

interface FuncionarioInfoPopoverProps {
  funcionario: FuncionarioComTurnos;
  className?: string;
}

function formatDate(d?: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function FuncionarioInfoPopover({ funcionario, className }: FuncionarioInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const cancelHide = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const fields = [
    { label: 'Matrícula', value: funcionario.matricula },
    { label: 'COREN', value: funcionario.coren || '—' },
    { label: 'Contrato', value: funcionario.tipoContrato },
    { label: 'Admissão', value: formatDate(funcionario.dataAdmissao) },
    { label: 'Carga horária', value: funcionario.cargaHoraria },
  ];

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        className={cn(
          'cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2',
          className
        )}
      >
        {funcionario.nome}
      </span>
      {open &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            onMouseEnter={cancelHide}
            onMouseLeave={hide}
            className="w-56 rounded-lg border bg-white text-foreground shadow-lg"
          >
            <div className="px-3 py-2 border-b bg-muted/40">
              <p className="text-xs font-semibold truncate">{funcionario.nome}</p>
            </div>
            <dl className="px-3 py-2 space-y-1.5">
              {fields.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 text-xs">
                  <dt className="text-muted-foreground shrink-0">{label}</dt>
                  <dd className="font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>,
          document.body
        )}
    </>
  );
}
