import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Funcionario } from '@escala/shared';

export function useFuncionarios(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['funcionarios', filters],
    queryFn: () => api.getFuncionarios(filters),
  });
}

export function useSetores() {
  return useQuery({
    queryKey: ['setores'],
    queryFn: api.getSetores,
  });
}

export function useCreateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Funcionario>) => api.createFuncionario(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  });
}

export function useUpdateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Funcionario> }) =>
      api.updateFuncionario(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  });
}
