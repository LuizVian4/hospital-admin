import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { EmpresaComPapel } from '@escala/shared';
import { api, setEmpresaIdProvider } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'escala_empresa_id';

interface EmpresaContextValue {
  empresas: EmpresaComPapel[];
  empresa: EmpresaComPapel | null;
  empresaId: string | null;
  isLoading: boolean;
  selectEmpresa: (empresaId: string) => void;
  refreshEmpresas: () => Promise<EmpresaComPapel[]>;
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<EmpresaComPapel[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const empresaIdRef = useRef(empresaId);
  empresaIdRef.current = empresaId;

  const refreshEmpresas = useCallback(async () => {
    const list = await api.listEmpresas();
    setEmpresas(list);
    return list;
  }, []);

  useEffect(() => {
    setEmpresaIdProvider(() => empresaIdRef.current);
  }, []);

  useEffect(() => {
    if (!user) {
      setEmpresas([]);
      setEmpresaId(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    setIsLoading(true);
    refreshEmpresas()
      .then((list) => {
        if (list.length === 0) {
          setEmpresaId(null);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        const validStored = stored && list.some((item) => item.id === stored);
        if (validStored) {
          setEmpresaId(stored);
          return;
        }

        if (list.length === 1) {
          setEmpresaId(list[0].id);
          localStorage.setItem(STORAGE_KEY, list[0].id);
          return;
        }

        setEmpresaId(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .catch(() => {
        setEmpresas([]);
        setEmpresaId(null);
      })
      .finally(() => setIsLoading(false));
  }, [user, refreshEmpresas]);

  const selectEmpresa = useCallback((nextEmpresaId: string) => {
    setEmpresaId(nextEmpresaId);
    localStorage.setItem(STORAGE_KEY, nextEmpresaId);
  }, []);

  const empresa = useMemo(
    () => empresas.find((item) => item.id === empresaId) ?? null,
    [empresas, empresaId]
  );

  const value = useMemo(
    () => ({
      empresas,
      empresa,
      empresaId,
      isLoading,
      selectEmpresa,
      refreshEmpresas,
    }),
    [empresas, empresa, empresaId, isLoading, selectEmpresa, refreshEmpresas]
  );

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider');
  }
  return context;
}
