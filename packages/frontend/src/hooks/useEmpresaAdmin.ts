import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  PapelEmpresa,
  UpdateEmpresaRequest,
  VincularUsuarioEmpresaRequest,
} from '@escala/shared';
import { api } from '@/api/client';

const empresaAdminKeys = {
  all: ['empresa-admin'] as const,
  vinculadas: () => [...empresaAdminKeys.all, 'vinculadas'] as const,
  detalhes: (empresaId: string | null) => [...empresaAdminKeys.all, 'detalhes', empresaId] as const,
  usuarios: (empresaId: string | null) => [...empresaAdminKeys.all, 'usuarios', empresaId] as const,
  candidatos: (empresaId: string | null) => [...empresaAdminKeys.all, 'candidatos', empresaId] as const,
};

export function useEmpresasVinculadas() {
  return useQuery({
    queryKey: empresaAdminKeys.vinculadas(),
    queryFn: () => api.listEmpresas(true),
  });
}

export function useEmpresaDetalhes(empresaId: string | null) {
  return useQuery({
    queryKey: empresaAdminKeys.detalhes(empresaId),
    queryFn: () => api.getEmpresa(empresaId!),
    enabled: !!empresaId,
  });
}

export function useUsuariosEmpresa(empresaId: string | null, enabled = true) {
  return useQuery({
    queryKey: empresaAdminKeys.usuarios(empresaId),
    queryFn: () => api.listUsuariosEmpresa(empresaId!),
    enabled: enabled && !!empresaId,
  });
}

export function useUsuariosCandidatosEmpresa(empresaId: string | null, enabled = false) {
  return useQuery({
    queryKey: empresaAdminKeys.candidatos(empresaId),
    queryFn: () => api.listUsuariosCandidatosEmpresa(empresaId!),
    enabled: enabled && !!empresaId,
  });
}

export function useUpdateEmpresa(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEmpresaRequest) => api.updateEmpresa(empresaId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.all });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useVincularUsuarioEmpresa(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VincularUsuarioEmpresaRequest) =>
      api.vincularUsuarioEmpresa(empresaId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.all });
    },
  });
}

export function useUpdateVinculoUsuarioEmpresa(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, papel }: { userId: number; papel: PapelEmpresa }) =>
      api.updateVinculoUsuarioEmpresa(empresaId!, userId, { papel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.all });
    },
  });
}

export function useRemoverVinculoUsuarioEmpresa(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.removerVinculoUsuarioEmpresa(empresaId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.all });
    },
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nome: string; slug: string }) => api.createEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: empresaAdminKeys.all });
    },
  });
}

/** @deprecated use useEmpresaDetalhes */
export function useEmpresaAtual(empresaId: string | null) {
  return useEmpresaDetalhes(empresaId);
}

/** @deprecated use useUpdateEmpresa */
export function useUpdateEmpresaAtual(empresaId: string | null) {
  return useUpdateEmpresa(empresaId);
}
