import { Fragment } from 'react';
import type { VirtualItem } from '@tanstack/react-virtual';
import { LARGURA_COLUNA_DIA } from '@/constants/turnos';
import { cn } from '@/lib/utils';

export function CelulaEspacadorDias({
  width,
  as = 'td',
}: {
  width: number;
  as?: 'td' | 'th';
}) {
  if (width <= 0) return null;
  const Tag = as;
  return (
    <Tag
      aria-hidden
      className="border-b p-0"
      style={{ width, minWidth: width, maxWidth: width }}
    />
  );
}

interface DiasVirtualizadosProps {
  virtualColumns: VirtualItem[];
  padStart: number;
  padEnd: number;
  dias: number[];
  renderDia: (dia: number, idx: number, width: number) => React.ReactNode;
}

export function DiasVirtualizados({
  virtualColumns,
  padStart,
  padEnd,
  dias,
  renderDia,
}: DiasVirtualizadosProps) {
  return (
    <>
      <CelulaEspacadorDias width={padStart} />
      {virtualColumns.map((vc) => {
        const dia = dias[vc.index];
        const width = vc.size || LARGURA_COLUNA_DIA;
        return <Fragment key={dia}>{renderDia(dia, vc.index, width)}</Fragment>;
      })}
      <CelulaEspacadorDias width={padEnd} />
    </>
  );
}

interface DiaVazioProps {
  width: number;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

export function DiaVazio({ width, className, title, children }: DiaVazioProps) {
  return (
    <td
      title={title}
      className={cn('border-b px-0 py-0 text-center text-xs min-w-[40px] h-9', className)}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      {children}
    </td>
  );
}
