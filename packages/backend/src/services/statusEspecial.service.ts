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

export async function listStatusPorSetoresNoMes(
  setorIds: number[],
  mes: number,
  ano: number,
  empresaId: string
): Promise<Map<number, StatusEspecialItem[]>> {
  const result = new Map<number, StatusEspecialItem[]>();
  for (const setorId of setorIds) {
    result.set(setorId, []);
  }
  if (setorIds.length === 0) return result;

  const funcs = await db
    .select({ id: funcionarios.id, setorId: funcionarios.setorId })
    .from(funcionarios)
    .where(
      and(
        inArray(funcionarios.setorId, setorIds),
        eq(funcionarios.ativo, true),
        eq(funcionarios.empresaId, empresaId)
      )
    );

  const funcIds = funcs.map((f) => f.id);
  if (funcIds.length === 0) return result;

  const setorPorFuncionario = new Map(funcs.map((f) => [f.id, f.setorId!]));

  const rows = await db.query.statusEspeciais.findMany({
    where: and(inArray(statusEspeciais.funcionarioId, funcIds), eq(statusEspeciais.empresaId, empresaId)),
    with: { funcionario: true, competencia: true },
  });

  for (const row of rows) {
    const item = mapStatusEspecialItem(row, row.funcionario, row.competencia);
    if (!item) continue;
    if (!intervaloSobrepoeMes(item.dataInicio, item.dataFim, mes, ano)) continue;

    const setorId = setorPorFuncionario.get(row.funcionarioId);
    if (setorId == null) continue;
    result.get(setorId)!.push(item);
  }

  return result;
}

export async function listStatusPorSetorNoMes(
  setorId: number,
  mes: number,
  ano: number,
  empresaId: string
) {
  const porSetor = await listStatusPorSetoresNoMes([setorId], mes, ano, empresaId);
  return porSetor.get(setorId) ?? [];
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
      empresaId: func.empresaId,
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
