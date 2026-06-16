import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Funcionario, TipoEscala } from '@escala/shared';

export function useFuncionarios(
  filters?: Record<string, string>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['funcionarios', filters],
    queryFn: () => api.getFuncionarios(filters),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}

export function useFuncionariosAgrupamentos(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['funcionarios', 'agrupamentos', filters],
    queryFn: () => api.getFuncionariosAgrupamentos(filters),
    placeholderData: (previous) => previous,
  });
}

export function useFuncionario(id: number | undefined) {
  return useQuery({
    queryKey: ['funcionario', id],
    queryFn: () => api.getFuncionario(id!),
    enabled: id != null && !Number.isNaN(id),
  });
}

export function useSetores() {
  return useQuery({
    queryKey: ['setores'],
    queryFn: api.getSetores,
  });
}

export function useSetoresPorEscala(tipo: TipoEscala) {
  return useQuery({
    queryKey: ['setores', 'escala', tipo],
    queryFn: () => api.getSetoresPorEscala(tipo),
  });
}

export function useSetoresEscala() {
  return useSetoresPorEscala('tecnico');
}

export function useCreateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Funcionario>) => api.createFuncionario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
    },
  });
}

export function useUpdateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Funcionario> }) =>
      api.updateFuncionario(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario', variables.id] });
    },
  });
}
