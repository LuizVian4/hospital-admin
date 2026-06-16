import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { LARGURA_COLUNAS_FIXAS } from '@/constants/turnos';
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
  return (
    <div
      className={cn('flex shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] z-10', className)}
      style={{ width: LARGURA_COLUNAS_FIXAS }}
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

export function ViewportDias({ children }: { children: ReactNode }) {
  const { horizontalScrollRef, totalDiasWidth } = useGradeEscalaScroll();
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
        style={{ width: totalDiasWidth }}
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
  const { footerScrollRef, totalDiasWidth } = useGradeEscalaScroll();

  return (
    <div className="flex shrink-0 border-t bg-slate-50/80">
      <div className="shrink-0" style={{ width: LARGURA_COLUNAS_FIXAS }} />
      <div ref={footerScrollRef} className="overflow-x-auto flex-1 min-w-0 h-3">
        <div style={{ width: totalDiasWidth, height: 1 }} aria-hidden />
      </div>
    </div>
  );
}
