import { Fragment } from 'react';
import { LARGURA_COLUNA_DIA } from '@/constants/turnos';
import { cn } from '@/lib/utils';

export function CelulaEspacadorDias({ width }: { width: number }) {
  if (width <= 0) return null;
  return (
    <div
      aria-hidden
      className="border-b shrink-0"
      style={{ width, minWidth: width, maxWidth: width }}
    />
  );
}

interface DiasVirtualizadosProps {
  visibleDiaIndices: number[];
  padStart: number;
  padEnd: number;
  dias: number[];
  renderDia: (dia: number, idx: number, width: number) => React.ReactNode;
}

export function DiasVirtualizados({
  visibleDiaIndices,
  padStart,
  padEnd,
  dias,
  renderDia,
}: DiasVirtualizadosProps) {
  return (
    <>
      <CelulaEspacadorDias width={padStart} />
      {visibleDiaIndices.map((idx) => {
        const dia = dias[idx];
        return <Fragment key={dia}>{renderDia(dia, idx, LARGURA_COLUNA_DIA)}</Fragment>;
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
    <div
      title={title}
      className={cn(
        'border-b border-r px-0 py-0 text-center text-xs min-w-[40px] h-9 shrink-0 flex items-center justify-center',
        className
      )}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      {children}
    </div>
  );
}

interface CelulaDiaProps {
  width: number;
  className?: string;
  title?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function CelulaDia({ width, className, title, children, onClick, style }: CelulaDiaProps) {
  return (
    <div
      title={title}
      onClick={onClick}
      className={cn(
        'border-b border-r px-0 py-0 text-center text-xs min-w-[40px] h-9 shrink-0 relative',
        className
      )}
      style={{ width, minWidth: width, maxWidth: width, ...style }}
    >
      {children}
    </div>
  );
}
