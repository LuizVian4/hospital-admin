import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import {
  LARGURA_COLUNA_NOME_MOBILE,
  LARGURA_COLUNAS_FIXAS_DESKTOP,
} from '@/constants/turnos';

interface GradeEscalaScrollContextValue {
  horizontalScrollRef: RefObject<HTMLDivElement>;
  footerScrollRef: RefObject<HTMLDivElement>;
  /** Largura total só dos dias (sem coluna de nome). */
  totalDiasWidth: number;
  /** Largura da faixa horizontal (nome mobile + dias). */
  totalStripWidth: number;
  /** Coluna de nome dentro da faixa rolável (mobile). */
  larguraLeading: number;
  /** Largura das colunas fixas à esquerda (desktop). */
  larguraColunasFixas: number;
  isMobile: boolean;
  showCategoria: boolean;
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const larguraLeading = isMobile ? LARGURA_COLUNA_NOME_MOBILE : 0;
  const larguraColunasFixas = isMobile ? 0 : LARGURA_COLUNAS_FIXAS_DESKTOP;
  const totalStripWidth = larguraLeading + totalDiasWidth;

  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const footerScrollRef = useRef<HTMLDivElement>(null);

  useSyncedHorizontalScroll(horizontalScrollRef, footerScrollRef);

  return (
    <GradeEscalaScrollContext.Provider
      value={{
        horizontalScrollRef,
        footerScrollRef,
        totalDiasWidth,
        totalStripWidth,
        larguraLeading,
        larguraColunasFixas,
        isMobile,
        showCategoria: !isMobile,
      }}
    >
      {children}
    </GradeEscalaScrollContext.Provider>
  );
}
