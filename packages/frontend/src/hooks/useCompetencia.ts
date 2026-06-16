import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { api, type Competencia } from '@/api/client';
import type { TipoEscala } from '@escala/shared';

export function competenciaQueryKey(
  setorId: number,
  mes: number,
  ano: number,
  tipo: TipoEscala
) {
  return ['competencia', setorId, mes, ano, tipo] as const;
}

export function useCompetencia(
  setorId: number | undefined,
  mes: number,
  ano: number,
  tipo: TipoEscala = 'tecnico'
) {
  return useQuery({
    queryKey: competenciaQueryKey(setorId!, mes, ano, tipo),
    queryFn: () => api.getCompetencia(setorId!, mes, ano, tipo),
    enabled: setorId != null && !Number.isNaN(setorId),
    staleTime: 60_000,
  });
}

function shiftMesAno(mes: number, ano: number, delta: number) {
  let newMes = mes + delta;
  let newAno = ano;
  if (newMes < 1) {
    newMes = 12;
    newAno -= 1;
  } else if (newMes > 12) {
    newMes = 1;
    newAno += 1;
  }
  return { mes: newMes, ano: newAno };
}

export function useCompetenciasNavegacao(
  setorId: number | undefined,
  mes: number,
  ano: number,
  tipo: TipoEscala = 'tecnico'
) {
  const anterior = useMemo(() => shiftMesAno(mes, ano, -1), [mes, ano]);
  const proxima = useMemo(() => shiftMesAno(mes, ano, 1), [mes, ano]);

  const enabled = setorId != null && !Number.isNaN(setorId);

  const results = useQueries({
    queries: [
      {
        queryKey: competenciaQueryKey(setorId!, mes, ano, tipo),
        queryFn: () => api.getCompetencia(setorId!, mes, ano, tipo),
        enabled,
        staleTime: 60_000,
      },
      {
        queryKey: competenciaQueryKey(setorId!, anterior.mes, anterior.ano, tipo),
        queryFn: () => api.getCompetencia(setorId!, anterior.mes, anterior.ano, tipo),
        enabled,
        staleTime: 60_000,
      },
      {
        queryKey: competenciaQueryKey(setorId!, proxima.mes, proxima.ano, tipo),
        queryFn: () => api.getCompetencia(setorId!, proxima.mes, proxima.ano, tipo),
        enabled,
        staleTime: 60_000,
      },
    ],
  });

  const [atual, prev, next] = results;

  return {
    competencia: atual.data as Competencia | null | undefined,
    competenciaId: atual.data?.id,
    temCompetenciaAnterior: !!prev.data,
    temCompetenciaProxima: !!next.data,
    isLoading: results.some((r) => r.isLoading),
    isError: atual.isError,
  };
}
