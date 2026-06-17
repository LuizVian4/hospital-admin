import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import {
  applyEscalaGradeFromResponse,
  beginEscalaOptimisticUpdate,
  escalaQueryKey,
  patchObservacoesGrade,
  patchOcorrenciaOptimistic,
  patchTrocaOptimistic,
  removeOcorrenciaOptimistic,
  rollbackEscalaCache,
  type EscalaMutationContext,
} from '@/lib/escalaCache';
import {
  DIA_INICIO_ESCALA,
  type EscalaDiaUpdate,
  type EscalaOcorrenciaRequest,
  type TipoEscala,
  type TrocaEscalaRequest,
} from '@escala/shared';

export { escalaQueryKey };

export function useEscala(competenciaId: number | undefined, tipo: TipoEscala = 'tecnico') {
  return useQuery({
    queryKey: escalaQueryKey(competenciaId!, tipo),
    queryFn: () => api.getEscala(competenciaId!, tipo),
    enabled: !!competenciaId,
  });
}

export function useUpdateEscalaDia(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: EscalaDiaUpdate[]) => api.updateEscalaDias(competenciaId, items),
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
    },
  });
}

export function useZerarEscalaFuncionario(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (funcionarioId: number) => api.zerarEscalaFuncionario(competenciaId, funcionarioId),
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAtribuirGrupoEscala(competenciaId: number, tipo: TipoEscala = 'tecnico') {
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
          dia: DIA_INICIO_ESCALA,
          turno: turnoInicio,
          definirInicio: true,
          indicePadrao,
        },
      ]),
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useTrocarEscalaDia(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TrocaEscalaRequest) => api.trocarEscalaDia(competenciaId, data, tipo),
    onMutate: async (data) =>
      beginEscalaOptimisticUpdate(queryClient, competenciaId, tipo, (grade) =>
        patchTrocaOptimistic(grade, data)
      ),
    onError: (_err, _vars, context) => {
      rollbackEscalaCache(queryClient, competenciaId, tipo, context as EscalaMutationContext);
    },
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateGruposOpcionais(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gruposOpcionaisAtivos: ('mt-f' | 'f-mt')[]) =>
      api.updateGruposOpcionais(competenciaId, gruposOpcionaisAtivos),
    onMutate: async (gruposOpcionaisAtivos) =>
      beginEscalaOptimisticUpdate(queryClient, competenciaId, tipo, (grade) => ({
        ...grade,
        competencia: { ...grade.competencia, gruposOpcionaisAtivos },
      })),
    onError: (_err, _vars, context) => {
      rollbackEscalaCache(queryClient, competenciaId, tipo, context as EscalaMutationContext);
    },
  });
}

export function useUpdateObservacoes(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (observacoes: string) => api.updateObservacoes(competenciaId, observacoes),
    onMutate: async (observacoes) =>
      beginEscalaOptimisticUpdate(queryClient, competenciaId, tipo, (grade) =>
        patchObservacoesGrade(grade, observacoes)
      ),
    onError: (_err, _vars, context) => {
      rollbackEscalaCache(queryClient, competenciaId, tipo, context as EscalaMutationContext);
    },
  });
}

export function useSimularProximoMes(competenciaId: number | undefined, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.simularProximoMes(competenciaId!, tipo),
    onSuccess: (result) => {
      if (result.grade) {
        applyEscalaGradeFromResponse(queryClient, result.competenciaId, tipo, result.grade);
      }
      queryClient.invalidateQueries({ queryKey: ['competencia'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSalvarOcorrenciaEscala(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EscalaOcorrenciaRequest) => api.salvarOcorrenciaEscala(data),
    onMutate: async (data) =>
      beginEscalaOptimisticUpdate(queryClient, competenciaId, tipo, (grade) =>
        patchOcorrenciaOptimistic(grade, data.funcionarioId, data.dia, {
          id: -1,
          competenciaId: data.competenciaId,
          funcionarioId: data.funcionarioId,
          dia: data.dia,
          tipo: data.tipo,
          turno: data.turno,
          funcionarioVinculoId: data.funcionarioVinculoId ?? null,
          observacao: data.observacao ?? null,
        })
      ),
    onError: (_err, _vars, context) => {
      rollbackEscalaCache(queryClient, competenciaId, tipo, context as EscalaMutationContext);
    },
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRemoverOcorrenciaEscala(
  competenciaId: number,
  tipo: TipoEscala = 'tecnico',
  meta?: { funcionarioId: number; dia: number }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.removerOcorrenciaEscala(id),
    onMutate: async () => {
      if (!meta) return beginEscalaOptimisticUpdate(queryClient, competenciaId, tipo);
      return beginEscalaOptimisticUpdate(queryClient, competenciaId, tipo, (grade) =>
        removeOcorrenciaOptimistic(grade, meta.funcionarioId, meta.dia)
      );
    },
    onError: (_err, _vars, context) => {
      rollbackEscalaCache(queryClient, competenciaId, tipo, context as EscalaMutationContext);
    },
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRemoverTrocaCelula(
  competenciaId: number,
  tipo: TipoEscala = 'tecnico'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ funcionarioId, dia }: { funcionarioId: number; dia: number }) =>
      api.removerTrocaCelula(competenciaId, funcionarioId, dia),
    onSuccess: (data) => {
      applyEscalaGradeFromResponse(queryClient, competenciaId, tipo, data.grade);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
