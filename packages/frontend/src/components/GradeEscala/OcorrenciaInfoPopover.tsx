import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EscalaOcorrencia, TipoEscala } from '@escala/shared';
import { useRemoverOcorrenciaEscala } from '@/hooks/useEscala';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OcorrenciaInfoPopoverProps {
  ocorrencia: EscalaOcorrencia;
  competenciaId: number;
  tipoEscala: TipoEscala;
  dia: number;
  turno?: string | null;
  children: React.ReactNode;
}

function labelTipo(tipo: EscalaOcorrencia['tipo']) {
  return tipo === 'FALTA' ? 'Falta' : 'Plantão extra';
}

export function OcorrenciaInfoPopover({
  ocorrencia,
  competenciaId,
  tipoEscala,
  dia,
  turno,
  children,
}: OcorrenciaInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const remover = useRemoverOcorrenciaEscala(competenciaId, tipoEscala);

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left });
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const cancelHide = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleRemover = () => {
    if (!ocorrencia.id) return;
    remover.mutate(ocorrencia.id, {
      onSuccess: () => {
        toast.success(
          ocorrencia.tipo === 'FALTA' ? 'Falta removida' : 'Plantão extra removido'
        );
        setOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const labelRemover =
    ocorrencia.tipo === 'FALTA' ? 'Remover falta' : 'Remover extra';

  return (
    <>
      <div ref={triggerRef} onMouseEnter={show} onMouseLeave={hide} className="h-full w-full">
        {children}
      </div>
      {open &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            onMouseEnter={cancelHide}
            onMouseLeave={hide}
            className="w-60 rounded-lg border bg-white text-foreground shadow-lg"
          >
            <div
              className={`px-3 py-2 border-b text-xs font-semibold ${
                ocorrencia.tipo === 'FALTA'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {labelTipo(ocorrencia.tipo)} · Dia {dia}
            </div>
            <dl className="px-3 py-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Turno Extra</dt>
                <dd className="font-medium">
                  {ocorrencia.tipo === 'PLANTAO_EXTRA'
                    ? (ocorrencia.turno ?? '—')
                    : (ocorrencia.turno ?? turno ?? '—')}
                </dd>
              </div>
              {ocorrencia.funcionarioVinculo && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Vínculo</dt>
                  <dd className="font-medium text-right">{ocorrencia.funcionarioVinculo.nome}</dd>
                </div>
              )}
              {ocorrencia.observacao && (
                <div>
                  <dt className="text-muted-foreground mb-0.5">Observação</dt>
                  <dd>{ocorrencia.observacao}</dd>
                </div>
              )}
            </dl>
            {ocorrencia.id != null && (
              <div className="border-t px-3 py-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full h-8 text-xs"
                  disabled={remover.isPending}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleRemover}
                >
                  {remover.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    labelRemover
                  )}
                </Button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
