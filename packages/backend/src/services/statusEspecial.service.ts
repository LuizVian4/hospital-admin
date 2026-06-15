import { and, eq, inArray, desc } from 'drizzle-orm';
import type { StatusEspecial, StatusEspecialItem } from '@escala/shared';
import {
  diasAfetadosNoMes,
  intervaloSobrepoeMes,
  limitesMes,
  normalizarStatusEspecial,
  statusParaTurno,
} from '@escala/shared';
import { db } from '../db';
import { funcionarios, statusEspeciais } from '../db/schema';
import { mapFuncionario } from '../utils/helpers';

type StatusRow = typeof statusEspeciais.$inferSelect;

function resolveDatas(
  row: StatusRow,
  comp?: { mes: number; ano: number } | null
): { dataInicio: string; dataFim: string } | null {
  if (row.dataInicio && row.dataFim) {
    return { dataInicio: row.dataInicio, dataFim: row.dataFim };
  }
  if (comp) {
    const limites = limitesMes(comp.mes, comp.ano);
    return { dataInicio: limites.inicio, dataFim: limites.fim };
  }
  return null;
}

export function mapStatusEspecialItem(
  row: StatusRow,
  funcionario: Parameters<typeof mapFuncionario>[0],
  comp?: { mes: number; ano: number } | null
): StatusEspecialItem | null {
  const datas = resolveDatas(row, comp);
  if (!datas) return null;

  return {
    id: row.id,
    funcionario: mapFuncionario(funcionario),
    status: normalizarStatusEspecial(row.status),
    dataInicio: datas.dataInicio,
    dataFim: datas.dataFim,
    ...(row.competenciaId != null ? { competenciaId: row.competenciaId } : {}),
  };
}

export async function listStatusPorFuncionario(funcionarioId: number) {
  const rows = await db.query.statusEspeciais.findMany({
    where: eq(statusEspeciais.funcionarioId, funcionarioId),
    with: { funcionario: true, competencia: true },
    orderBy: [desc(statusEspeciais.dataInicio)],
  });

  return rows
    .map((row) => mapStatusEspecialItem(row, row.funcionario, row.competencia))
    .filter((item): item is StatusEspecialItem => item != null);
}

export async function listStatusPorSetorNoMes(setorId: number, mes: number, ano: number) {
  const funcs = await db
    .select({ id: funcionarios.id })
    .from(funcionarios)
    .where(and(eq(funcionarios.setorId, setorId), eq(funcionarios.ativo, true)));

  const funcIds = funcs.map((f) => f.id);
  if (funcIds.length === 0) return [];

  const rows = await db.query.statusEspeciais.findMany({
    where: inArray(statusEspeciais.funcionarioId, funcIds),
    with: { funcionario: true, competencia: true },
  });

  return rows
    .map((row) => mapStatusEspecialItem(row, row.funcionario, row.competencia))
    .filter((item): item is StatusEspecialItem => {
      if (!item) return false;
      return intervaloSobrepoeMes(item.dataInicio, item.dataFim, mes, ano);
    });
}

export function montarStatusPorDia(
  statuses: StatusEspecialItem[],
  funcionarioId: number,
  mes: number,
  ano: number,
  dias: number[]
): Record<number, StatusEspecial> {
  const porDia: Record<number, StatusEspecial> = {};
  const doFunc = statuses.filter((s) => s.funcionario.id === funcionarioId);

  for (const status of doFunc) {
    for (const dia of diasAfetadosNoMes(status.dataInicio, status.dataFim, mes, ano, dias.length)) {
      if (!dias.includes(dia)) continue;
      porDia[dia] = status.status;
    }
  }

  return porDia;
}

export function aplicarStatusNosTurnos<T extends Record<number, string | null>>(
  turnos: T,
  statusPorDia: Record<number, StatusEspecial>
): T {
  const result = { ...turnos };
  for (const [diaStr, status] of Object.entries(statusPorDia)) {
    result[Number(diaStr) as keyof T] = statusParaTurno(status) as T[keyof T];
  }
  return result;
}

export async function criarStatusEspecial(input: {
  funcionarioId: number;
  status: StatusEspecial;
  dataInicio: string;
  dataFim: string;
  competenciaId?: number;
}) {
  if (input.dataFim < input.dataInicio) {
    throw new Error('A data de fim deve ser igual ou posterior à data de início');
  }

  const func = await db.query.funcionarios.findFirst({
    where: eq(funcionarios.id, input.funcionarioId),
  });
  if (!func) throw new Error('Funcionário não encontrado');

  const [created] = await db
    .insert(statusEspeciais)
    .values({
      funcionarioId: input.funcionarioId,
      status: input.status,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      competenciaId: input.competenciaId ?? null,
    })
    .returning();

  return mapStatusEspecialItem(created, func, null)!;
}

export async function removerStatusEspecial(id: number) {
  const [deleted] = await db
    .delete(statusEspeciais)
    .where(eq(statusEspeciais.id, id))
    .returning();
  return deleted != null;
}
