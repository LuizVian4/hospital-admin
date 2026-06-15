import { createPortal } from 'react-dom';
import type { Turno } from '@escala/shared';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, X } from 'lucide-react';

export interface CelulaTroca {
  funcionarioId: number;
  funcionarioNome: string;
  dia: number;
  turno: Turno;
}

interface ConfirmarTrocaDialogProps {
  open: boolean;
  origem: CelulaTroca;
  destino: CelulaTroca;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function CartaoFuncionario({
  titulo,
  nome,
  dia,
  turno,
}: {
  titulo: string;
  nome: string;
  dia: number;
  turno: Turno;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {titulo}
      </p>
      <p className="text-sm font-semibold text-foreground leading-snug break-words">{nome}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          Dia <span className="font-semibold text-foreground">{dia}</span>
        </span>
        <span className="text-border">|</span>
        <span>
          Turno{' '}
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded bg-background border px-1.5 py-0.5 font-bold text-foreground">
            {turno}
          </span>
        </span>
      </div>
    </div>
  );
}

export function ConfirmarTrocaDialog({
  open,
  origem,
  destino,
  isPending,
  onClose,
  onConfirm,
}: ConfirmarTrocaDialogProps) {
  if (!open) return null;

  const mesmoDia = origem.dia === destino.dia;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">Confirmar troca de escala</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revise os dados antes de confirmar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <CartaoFuncionario
            titulo="Origem"
            nome={origem.funcionarioNome}
            dia={origem.dia}
            turno={origem.turno}
          />

          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <CartaoFuncionario
            titulo="Destino"
            nome={destino.funcionarioNome}
            dia={destino.dia}
            turno={destino.turno}
          />

          <div className="rounded-lg border border-dashed bg-muted/10 px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Após confirmar
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2 leading-snug">
                <span className="text-primary shrink-0">→</span>
                <span>
                  <strong className="font-medium text-foreground">{origem.funcionarioNome}</strong>
                  {' '}passará a ter turno{' '}
                  <strong className="font-semibold text-foreground">{destino.turno}</strong>
                  {' '}no dia <strong className="text-foreground">{origem.dia}</strong>
                </span>
              </li>
              <li className="flex gap-2 leading-snug">
                <span className="text-primary shrink-0">→</span>
                <span>
                  <strong className="font-medium text-foreground">{destino.funcionarioNome}</strong>
                  {' '}passará a ter turno{' '}
                  <strong className="font-semibold text-foreground">{origem.turno}</strong>
                  {' '}no dia <strong className="text-foreground">{destino.dia}</strong>
                </span>
              </li>
            </ul>
            {!mesmoDia && (
              <p className="text-[11px] text-muted-foreground/80 pt-1 border-t border-dashed">
                A troca envolve dias diferentes ({origem.dia} e {destino.dia}).
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Trocando...' : 'Confirmar troca'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
