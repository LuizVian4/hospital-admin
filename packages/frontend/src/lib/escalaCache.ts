import type { QueryClient } from '@tanstack/react-query';
import type {
  EscalaOcorrencia,
  FuncionarioComTurnos,
  GradeEscalaResponse,
  TipoEscala,
  TrocaEscalaRequest,
  Turno,
} from '@escala/shared';

export function escalaQueryKey(competenciaId: number, tipo: TipoEscala = 'tecnico') {
  return ['escala', competenciaId, tipo] as const;
}

export function getEscalaCache(
  queryClient: QueryClient,
  competenciaId: number,
  tipo: TipoEscala
): GradeEscalaResponse | undefined {
  return queryClient.getQueryData(escalaQueryKey(competenciaId, tipo));
}

export function setEscalaCache(
  queryClient: QueryClient,
  competenciaId: number,
  tipo: TipoEscala,
  grade: GradeEscalaResponse
) {
  queryClient.setQueryData(escalaQueryKey(competenciaId, tipo), grade);
}

function cloneGrade(grade: GradeEscalaResponse): GradeEscalaResponse {
  return structuredClone(grade);
}

function updateFuncionarioInGrade(
  grade: GradeEscalaResponse,
  funcionarioId: number,
  updater: (func: FuncionarioComTurnos) => void
): GradeEscalaResponse {
  const next = cloneGrade(grade);
  for (const grupo of next.grupos) {
    const func = grupo.funcionarios.find((f) => f.id === funcionarioId);
    if (func) {
      updater(func);
      return next;
    }
  }
  return next;
}

function getTurnoEfetivo(func: FuncionarioComTurnos, dia: number): Turno | null {
  return func.turnos[dia] ?? func.turnosProjetados?.[dia] ?? null;
}

export function patchTrocaOptimistic(
  grade: GradeEscalaResponse,
  data: TrocaEscalaRequest
): GradeEscalaResponse | null {
  let origemTurno: Turno | null = null;
  let destinoTurno: Turno | null = null;

  for (const grupo of grade.grupos) {
    for (const func of grupo.funcionarios) {
      if (func.id === data.funcionarioIdOrigem) {
        origemTurno = getTurnoEfetivo(func, data.diaOrigem);
      }
      if (func.id === data.funcionarioIdDestino) {
        destinoTurno = getTurnoEfetivo(func, data.diaDestino);
      }
    }
  }

  if (!origemTurno || !destinoTurno) return null;

  let next = updateFuncionarioInGrade(grade, data.funcionarioIdOrigem, (func) => {
    func.turnos = { ...func.turnos, [data.diaOrigem]: destinoTurno };
  });
  next = updateFuncionarioInGrade(next, data.funcionarioIdDestino, (func) => {
    func.turnos = { ...func.turnos, [data.diaDestino]: origemTurno };
  });
  return next;
}

export function patchOcorrenciaOptimistic(
  grade: GradeEscalaResponse,
  funcionarioId: number,
  dia: number,
  ocorrencia: EscalaOcorrencia
): GradeEscalaResponse {
  return updateFuncionarioInGrade(grade, funcionarioId, (func) => {
    func.ocorrenciasPorDia = { ...func.ocorrenciasPorDia, [dia]: ocorrencia };
  });
}

export function removeOcorrenciaOptimistic(
  grade: GradeEscalaResponse,
  funcionarioId: number,
  dia: number
): GradeEscalaResponse {
  return updateFuncionarioInGrade(grade, funcionarioId, (func) => {
    if (!func.ocorrenciasPorDia) return;
    const next = { ...func.ocorrenciasPorDia };
    delete next[dia];
    func.ocorrenciasPorDia = Object.keys(next).length > 0 ? next : undefined;
  });
}

export function patchObservacoesGrade(
  grade: GradeEscalaResponse,
  observacoes: string
): GradeEscalaResponse {
  return { ...cloneGrade(grade), observacoes };
}

export interface EscalaMutationContext {
  previous?: GradeEscalaResponse;
}

export async function beginEscalaOptimisticUpdate(
  queryClient: QueryClient,
  competenciaId: number,
  tipo: TipoEscala,
  patch?: (grade: GradeEscalaResponse) => GradeEscalaResponse | null
): Promise<EscalaMutationContext> {
  const key = escalaQueryKey(competenciaId, tipo);
  await queryClient.cancelQueries({ queryKey: key });
  const previous = getEscalaCache(queryClient, competenciaId, tipo);
  if (previous && patch) {
    const patched = patch(previous);
    if (patched) {
      setEscalaCache(queryClient, competenciaId, tipo, patched);
    }
  }
  return { previous };
}

export function rollbackEscalaCache(
  queryClient: QueryClient,
  competenciaId: number,
  tipo: TipoEscala,
  context?: EscalaMutationContext
) {
  if (context?.previous) {
    setEscalaCache(queryClient, competenciaId, tipo, context.previous);
  }
}

export function applyEscalaGradeFromResponse(
  queryClient: QueryClient,
  competenciaId: number,
  tipo: TipoEscala,
  grade?: GradeEscalaResponse | null
) {
  if (grade) {
    setEscalaCache(queryClient, competenciaId, tipo, grade);
  }
}
