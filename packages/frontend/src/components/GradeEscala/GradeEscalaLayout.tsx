import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useGradeEscalaScroll } from './GradeEscalaScrollContext';

export interface LinhaGradeProps extends HTMLAttributes<HTMLDivElement> {
  virtualTop: number;
  virtualHeight: number;
}

export function LinhaGrade({
  virtualTop,
  virtualHeight,
  className,
  style,
  children,
  ...props
}: LinhaGradeProps) {
  return (
    <div
      className={cn('absolute left-0 flex w-full', className)}
      style={{
        top: virtualTop,
        height: virtualHeight,
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${virtualHeight}px`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function ColunasFixas({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { larguraColunasFixas } = useGradeEscalaScroll();
  if (larguraColunasFixas === 0) return null;

  return (
    <div
      className={cn('flex shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] z-10', className)}
      style={{ width: larguraColunasFixas }}
    >
      {children}
    </div>
  );
}

export function CelulaFixa({
  width,
  className,
  title,
  children,
}: {
  width: number;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      title={title}
      className={cn('border-b border-r px-2 py-1.5 text-xs shrink-0', className)}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      {children}
    </div>
  );
}

export function CelulaNomeScroll({
  className,
  title,
  children,
}: {
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const { isMobile, larguraLeading } = useGradeEscalaScroll();
  if (!isMobile) return null;

  return (
    <CelulaFixa width={larguraLeading} className={className} title={title}>
      {children}
    </CelulaFixa>
  );
}

export function ViewportDias({ children }: { children: ReactNode }) {
  const { horizontalScrollRef, totalStripWidth } = useGradeEscalaScroll();
  const stripRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollEl = horizontalScrollRef.current;
    const stripEl = stripRef.current;
    if (!scrollEl || !stripEl) return;

    const update = () => {
      stripEl.style.transform = `translate3d(-${scrollEl.scrollLeft}px,0,0)`;
    };

    scrollEl.addEventListener('scroll', update, { passive: true });
    update();

    return () => scrollEl.removeEventListener('scroll', update);
  }, [horizontalScrollRef]);

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <div
        ref={stripRef}
        className="flex will-change-transform"
        style={{ width: totalStripWidth }}
      >
        {children}
      </div>
    </div>
  );
}

export function CabecalhoViewportDias({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { totalDiasWidth } = useGradeEscalaScroll();

  return (
    <div className={cn('flex shrink-0', className)} style={{ width: totalDiasWidth, ...style }}>
      {children}
    </div>
  );
}

export function ScrollHorizontalDias({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { horizontalScrollRef } = useGradeEscalaScroll();

  return (
    <div
      ref={horizontalScrollRef}
      className={cn('overflow-x-auto overflow-y-hidden flex-1 min-w-0', className)}
    >
      {children}
    </div>
  );
}

export function RodapeScrollHorizontal() {
  const { footerScrollRef, totalStripWidth, larguraColunasFixas } = useGradeEscalaScroll();

  return (
    <div className="flex shrink-0 border-t bg-slate-50/80">
      {larguraColunasFixas > 0 && (
        <div className="shrink-0" style={{ width: larguraColunasFixas }} />
      )}
      <div ref={footerScrollRef} className="overflow-x-auto flex-1 min-w-0 h-3">
        <div style={{ width: totalStripWidth, height: 1 }} aria-hidden />
      </div>
    </div>
  );
}

export function CabecalhoLeadingColunas() {
  const { isMobile, larguraLeading } = useGradeEscalaScroll();
  if (!isMobile) return null;

  return (
    <div className="flex shrink-0 flex-col border-r border-slate-200" style={{ width: larguraLeading }}>
      <div className="flex bg-slate-100">
        <CelulaFixa
          width={larguraLeading}
          className="py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 text-left"
        >
          NOME
        </CelulaFixa>
      </div>
      <div className="flex bg-slate-50 border-t border-slate-200">
        <CelulaFixa
          width={larguraLeading}
          className="py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-50 text-left"
        >
          Escala
        </CelulaFixa>
      </div>
    </div>
  );
}
