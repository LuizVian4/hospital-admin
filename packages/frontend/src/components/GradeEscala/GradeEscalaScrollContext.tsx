import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';

interface GradeEscalaScrollContextValue {
  horizontalScrollRef: RefObject<HTMLDivElement>;
  footerScrollRef: RefObject<HTMLDivElement>;
  totalDiasWidth: number;
}

const GradeEscalaScrollContext = createContext<GradeEscalaScrollContextValue | null>(null);

export function useGradeEscalaScroll() {
  const ctx = useContext(GradeEscalaScrollContext);
  if (!ctx) {
    throw new Error('useGradeEscalaScroll must be used within GradeEscalaScrollProvider');
  }
  return ctx;
}

function useSyncedHorizontalScroll(
  primaryRef: RefObject<HTMLDivElement>,
  mirrorRef: RefObject<HTMLDivElement>
) {
  useLayoutEffect(() => {
    const primary = primaryRef.current;
    const mirror = mirrorRef.current;
    if (!primary) return;

    let syncing = false;

    const sync = (source: HTMLDivElement, target: HTMLDivElement | null) => {
      if (!target || syncing) return;
      if (target.scrollLeft === source.scrollLeft) return;
      syncing = true;
      target.scrollLeft = source.scrollLeft;
      syncing = false;
    };

    const onPrimaryScroll = () => sync(primary, mirror);
    const onMirrorScroll = () => {
      if (mirror) sync(mirror, primary);
    };

    primary.addEventListener('scroll', onPrimaryScroll, { passive: true });
    mirror?.addEventListener('scroll', onMirrorScroll, { passive: true });

    return () => {
      primary.removeEventListener('scroll', onPrimaryScroll);
      mirror?.removeEventListener('scroll', onMirrorScroll);
    };
  }, [primaryRef, mirrorRef]);
}

export function GradeEscalaScrollProvider({
  totalDiasWidth,
  children,
}: {
  totalDiasWidth: number;
  children: ReactNode;
}) {
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const footerScrollRef = useRef<HTMLDivElement>(null);

  useSyncedHorizontalScroll(horizontalScrollRef, footerScrollRef);

  return (
    <GradeEscalaScrollContext.Provider
      value={{ horizontalScrollRef, footerScrollRef, totalDiasWidth }}
    >
      {children}
    </GradeEscalaScrollContext.Provider>
  );
}
