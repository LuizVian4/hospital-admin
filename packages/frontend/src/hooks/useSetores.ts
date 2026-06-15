import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Setor } from '@escala/shared';

export function useUpdateSetor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Setor> }) => api.updateSetor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateSetor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Setor>) => api.createSetor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
