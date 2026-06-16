import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { StatusEspecialRequest } from '@escala/shared';

export function useStatusEspeciaisFuncionario(funcionarioId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['status-especiais', funcionarioId],
    queryFn: () => api.getStatusEspeciaisFuncionario(funcionarioId!),
    enabled: enabled && funcionarioId != null,
  });
}

export function useCreateStatusEspecial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StatusEspecialRequest) => api.createStatusEspecial(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-especiais', variables.funcionarioId] });
      if (variables.competenciaId) {
        queryClient.invalidateQueries({
          queryKey: ['escala', variables.competenciaId],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['escala'] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteStatusEspecial(funcionarioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteStatusEspecial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-especiais', funcionarioId] });
      queryClient.invalidateQueries({ queryKey: ['escala'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
