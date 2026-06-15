import { useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ObservacaoTrocaPopoverProps {
  observacao: string;
  dia: number;
  turno?: string | null;
  children: ReactNode;
  className?: string;
}

export function ObservacaoTrocaPopover({
  observacao,
  dia,
  turno,
  children,
  className,
}: ObservacaoTrocaPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
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

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={cn('h-full w-full cursor-help', className)}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            onMouseEnter={cancelHide}
            onMouseLeave={hide}
            className="w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border bg-white text-foreground shadow-lg"
          >
            <div className="flex items-center gap-2 border-b bg-violet-50/80 px-3 py-2">
              <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-violet-600" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-violet-900">Troca de escala</p>
                <p className="text-[10px] text-muted-foreground">
                  Dia {dia}
                  {turno ? (
                    <>
                      {' '}
                      · Turno <span className="font-semibold text-foreground">{turno}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <p className="px-3 py-2.5 text-xs leading-relaxed text-foreground">{observacao}</p>
          </div>,
          document.body
        )}
    </>
  );
}
