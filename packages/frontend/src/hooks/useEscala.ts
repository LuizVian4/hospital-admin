import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { EscalaDiaUpdate, TrocaEscalaRequest } from '@escala/shared';

export function useEscala(competenciaId: number | undefined) {
  return useQuery({
    queryKey: ['escala', competenciaId],
    queryFn: () => api.getEscala(competenciaId!),
    enabled: !!competenciaId,
  });
}

export function useUpdateEscalaDia(competenciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: EscalaDiaUpdate[]) => api.updateEscalaDias(competenciaId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escala', competenciaId] });
    },
  });
}

export function useZerarEscalaFuncionario(competenciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (funcionarioId: number) => api.zerarEscalaFuncionario(competenciaId, funcionarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escala', competenciaId] });
    },
  });
}

export function useAtribuirGrupoEscala(competenciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      funcionarioId,
      indicePadrao,
      turnoInicio,
    }: {
      funcionarioId: number;
      indicePadrao: number;
      turnoInicio: string;
    }) =>
      api.updateEscalaDias(competenciaId, [
        {
          funcionarioId,
          dia: 1,
          turno: turnoInicio,
          definirInicio: true,
          indicePadrao,
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escala', competenciaId] });
    },
  });
}

export function useTrocarEscalaDia(competenciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TrocaEscalaRequest) => api.trocarEscalaDia(competenciaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escala', competenciaId] });
    },
  });
}

export function useUpdateObservacoes(competenciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (observacoes: string) => api.updateObservacoes(competenciaId, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escala', competenciaId] });
    },
  });
}
