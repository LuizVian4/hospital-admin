import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  PapelEmpresa,
  UpdateEmpresaRequest,
  VincularUsuarioEmpresaRequest,
} from '@escala/shared';
import { api } from '@/api/client';

const empresaAdminKeys = {
  all: ['empresa-admin'] as const,
  detalhes: () => [...empresaAdminKeys.all, 'detalhes'] as const,
  usuarios: () => [...empresaAdminKeys.all, 'usuarios'] as const,
  candidatos: () => [...empresaAdminKeys.all, 'candidatos'] as const,
};

export function useEmpresaAtual() {
  return useQuery({
    queryKey: empresaAdminKeys.detalhes(),
    queryFn: () => api.getEmpresaAtual(),
  });
}

export function useUsuariosEmpresa(enabled = true) {
  return useQuery({
    queryKey: empresaAdminKeys.usuarios(),
    queryFn: () => api.listUsuariosEmpresa(),
    enabled,
  });
}

export function useUsuariosCandidatosEmpresa(enabled = false) {
  return useQuery({
    queryKey: empresaAdminKeys.candidatos(),
    queryFn: () => api.listUsuariosCandidatosEmpresa(),
    enabled,
  });
}

export function useUpdateEmpresaAtual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEmpresaRequest) => api.updateEmpresaAtual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.detalhes() });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useVincularUsuarioEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VincularUsuarioEmpresaRequest) => api.vincularUsuarioEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.usuarios() });
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.candidatos() });
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.detalhes() });
    },
  });
}

export function useUpdateVinculoUsuarioEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, papel }: { userId: number; papel: PapelEmpresa }) =>
      api.updateVinculoUsuarioEmpresa(userId, { papel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.usuarios() });
    },
  });
}

export function useRemoverVinculoUsuarioEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.removerVinculoUsuarioEmpresa(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.usuarios() });
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.candidatos() });
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.detalhes() });
    },
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nome: string; slug: string }) => api.createEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}
