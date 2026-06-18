import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { LARGURA_COLUNA_DIA } from '@/constants/turnos';

const COLUMN_OVERSCAN = 3;

export interface GradeEscalaColumnWindow {
  visibleDiaIndices: number[];
  diasPadStart: number;
  diasPadEnd: number;
  totalDiasWidth: number;
}

function measureColumnWindow(
  scrollLeft: number,
  clientWidth: number,
  diasCount: number,
  leadingWidth: number
): GradeEscalaColumnWindow {
  const totalDiasWidth = diasCount * LARGURA_COLUNA_DIA;
  const dayScrollLeft = Math.max(0, scrollLeft - leadingWidth);
  const dayViewport = Math.max(LARGURA_COLUNA_DIA, clientWidth - Math.max(0, leadingWidth - scrollLeft));

  const firstIndex = Math.max(0, Math.floor(dayScrollLeft / LARGURA_COLUNA_DIA) - COLUMN_OVERSCAN);
  const lastIndex = Math.min(
    diasCount - 1,
    Math.ceil((dayScrollLeft + dayViewport) / LARGURA_COLUNA_DIA) - 1 + COLUMN_OVERSCAN
  );

  const visibleDiaIndices: number[] = [];
  for (let i = firstIndex; i <= lastIndex; i++) {
    visibleDiaIndices.push(i);
  }

  const diasPadStart = firstIndex * LARGURA_COLUNA_DIA;
  const renderedWidth = visibleDiaIndices.length * LARGURA_COLUNA_DIA;
  const diasPadEnd = Math.max(0, totalDiasWidth - diasPadStart - renderedWidth);

  return { visibleDiaIndices, diasPadStart, diasPadEnd, totalDiasWidth };
}

function columnWindowKey(window: GradeEscalaColumnWindow): string {
  return `${window.diasPadStart}|${window.diasPadEnd}|${window.visibleDiaIndices.join(',')}`;
}

export function useGradeEscalaColumnWindow(
  horizontalScrollRef: RefObject<HTMLDivElement>,
  diasCount: number,
  leadingWidth = 0
): GradeEscalaColumnWindow {
  const [window, setWindow] = useState<GradeEscalaColumnWindow>(() =>
    measureColumnWindow(0, 800, diasCount, leadingWidth)
  );
  const windowKeyRef = useRef(columnWindowKey(window));

  useLayoutEffect(() => {
    const el = horizontalScrollRef.current;
    if (!el) return;

    let raf = 0;
    let lastLeft = -1;
    let lastWidth = -1;

    const applyMeasure = () => {
      const scrollLeft = el.scrollLeft;
      const clientWidth = el.clientWidth;
      if (scrollLeft === lastLeft && clientWidth === lastWidth) return;

      lastLeft = scrollLeft;
      lastWidth = clientWidth;

      const next = measureColumnWindow(scrollLeft, clientWidth, diasCount, leadingWidth);
      const nextKey = columnWindowKey(next);
      if (nextKey === windowKeyRef.current) return;

      windowKeyRef.current = nextKey;
      setWindow(next);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(applyMeasure);
    };

    const resizeObserver = new ResizeObserver(onScroll);
    resizeObserver.observe(el);
    el.addEventListener('scroll', onScroll, { passive: true });
    applyMeasure();

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
    };
  }, [horizontalScrollRef, diasCount, leadingWidth]);

  return window;
}
