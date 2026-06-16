import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import {
  intervaloSobrepoeMes,
  montarResumoCargaHoraria,
  type BancoHorasAgregado,
  type BancoHorasComDetalhes,
  type CargaHoraria,
  type StatusBancoHoras,
  type TipoEscala,
} from '@escala/shared';
import { db } from '../db';
import { bancoHoras, competencias, funcionarios, setores } from '../db/schema';

function mapBancoHorasRow(
  row: typeof bancoHoras.$inferSelect,
  detalhes: {
    funcionarioNome: string;
    funcionarioMatricula: string;
    funcionarioCategoria: string;
    setorId: number | null;
    setorNome: string | null;
    competenciaMes: number;
    competenciaAno: number;
    competenciaTipo: TipoEscala;
  }
): BancoHorasComDetalhes {
  return {
    id: row.id,
    competenciaId: row.competenciaId,
    funcionarioId: row.funcionarioId,
    cargaContratada: row.cargaContratada as CargaHoraria,
    horasContratadas: row.horasContratadas,
    horasTrabalhadas: row.horasTrabalhadas,
    turnosTrabalhados: row.turnosTrabalhados,
    saldoHoras: row.saldoHoras,
    status: row.status as StatusBancoHoras,
    updatedAt: row.updatedAt.toISOString(),
    ...detalhes,
  };
}

export async function syncBancoHorasCompetencia(competenciaId: number): Promise<void> {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (!comp) return;

  const { getGradeEscala } = await import('./escala.service');
  const grade = await getGradeEscala(competenciaId, comp.tipo as TipoEscala);
  if (!grade) return;

  const resumos = montarResumoCargaHoraria(grade);
  const funcionarioIds = resumos.map((r) => r.funcionarioId);
  const now = new Date();

  if (resumos.length > 0) {
    await db
      .insert(bancoHoras)
      .values(
        resumos.map((r) => ({
          competenciaId,
          funcionarioId: r.funcionarioId,
          cargaContratada: r.cargaContratada,
          horasContratadas: r.horasContratadas,
          horasTrabalhadas: r.horasTrabalhadas,
          turnosTrabalhados: r.turnosTrabalhados,
          saldoHoras: r.saldoHoras,
          status: r.status,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: [bancoHoras.competenciaId, bancoHoras.funcionarioId],
        set: {
          cargaContratada: sql`excluded.carga_contratada`,
          horasContratadas: sql`excluded.horas_contratadas`,
          horasTrabalhadas: sql`excluded.horas_trabalhadas`,
          turnosTrabalhados: sql`excluded.turnos_trabalhados`,
          saldoHoras: sql`excluded.saldo_horas`,
          status: sql`excluded.status`,
          updatedAt: now,
        },
      });
  }

  if (funcionarioIds.length === 0) {
    await db.delete(bancoHoras).where(eq(bancoHoras.competenciaId, competenciaId));
  } else {
    await db
      .delete(bancoHoras)
      .where(
        and(
          eq(bancoHoras.competenciaId, competenciaId),
          notInArray(bancoHoras.funcionarioId, funcionarioIds)
        )
      );
  }
}

export async function syncBancoHorasMes(mes: number, ano: number): Promise<void> {
  const comps = await db
    .select()
    .from(competencias)
    .where(and(eq(competencias.mes, mes), eq(competencias.ano, ano)));

  for (const comp of comps) {
    await syncBancoHorasCompetencia(comp.id);
  }
}

export async function syncBancoHorasAfetadosPorStatus(
  funcionarioId: number,
  dataInicio: string,
  dataFim: string,
  competenciaId?: number | null
): Promise<void> {
  if (competenciaId != null) {
    await syncBancoHorasCompetencia(competenciaId);
    return;
  }

  const func = await db.query.funcionarios.findFirst({
    where: eq(funcionarios.id, funcionarioId),
  });
  if (!func?.setorId) return;

  const comps = await db
    .select()
    .from(competencias)
    .where(eq(competencias.setorId, func.setorId));

  for (const comp of comps) {
    if (intervaloSobrepoeMes(dataInicio, dataFim, comp.mes, comp.ano)) {
      await syncBancoHorasCompetencia(comp.id);
    }
  }
}

function resolverStatusSaldo(saldoHoras: number): StatusBancoHoras {
  if (saldoHoras < 0) return 'devendo';
  if (saldoHoras > 0) return 'excedeu';
  return 'atingiu';
}

async function ensureBancoHorasGeral(): Promise<void> {
  const comps = await db.select({ id: competencias.id }).from(competencias);
  if (comps.length === 0) return;

  const compIds = comps.map((c) => c.id);
  const existentes = await db
    .select({ competenciaId: bancoHoras.competenciaId })
    .from(bancoHoras)
    .where(inArray(bancoHoras.competenciaId, compIds))
    .groupBy(bancoHoras.competenciaId);

  const comDados = new Set(existentes.map((e) => e.competenciaId));
  for (const comp of comps) {
    if (!comDados.has(comp.id)) {
      await syncBancoHorasCompetencia(comp.id);
    }
  }
}

async function ensureBancoHorasMes(mes: number, ano: number): Promise<void> {
  const comps = await db
    .select({ id: competencias.id })
    .from(competencias)
    .where(and(eq(competencias.mes, mes), eq(competencias.ano, ano)));

  if (comps.length === 0) return;

  const compIds = comps.map((c) => c.id);
  const existentes = await db
    .select({ competenciaId: bancoHoras.competenciaId })
    .from(bancoHoras)
    .where(inArray(bancoHoras.competenciaId, compIds))
    .groupBy(bancoHoras.competenciaId);

  const comDados = new Set(existentes.map((e) => e.competenciaId));
  for (const comp of comps) {
    if (!comDados.has(comp.id)) {
      await syncBancoHorasCompetencia(comp.id);
    }
  }
}

export async function listBancoHorasCompetencia(competenciaId: number): Promise<BancoHorasComDetalhes[]> {
  await syncBancoHorasCompetencia(competenciaId);
  return queryBancoHoras({ competenciaId });
}

export async function listBancoHorasMes(
  mes: number,
  ano: number,
  options?: { apenasPendentes?: boolean }
): Promise<BancoHorasComDetalhes[]> {
  await ensureBancoHorasMes(mes, ano);
  return queryBancoHoras({ mes, ano, apenasPendentes: options?.apenasPendentes });
}

async function queryBancoHoras(filters: {
  competenciaId?: number;
  mes?: number;
  ano?: number;
  apenasPendentes?: boolean;
}): Promise<BancoHorasComDetalhes[]> {
  const rows = await db
    .select({
      banco: bancoHoras,
      funcionarioNome: funcionarios.nome,
      funcionarioMatricula: funcionarios.matricula,
      funcionarioCategoria: funcionarios.categoria,
      setorId: funcionarios.setorId,
      setorNome: setores.nome,
      competenciaMes: competencias.mes,
      competenciaAno: competencias.ano,
      competenciaTipo: competencias.tipo,
    })
    .from(bancoHoras)
    .innerJoin(competencias, eq(bancoHoras.competenciaId, competencias.id))
    .innerJoin(funcionarios, eq(bancoHoras.funcionarioId, funcionarios.id))
    .leftJoin(setores, eq(funcionarios.setorId, setores.id))
    .where(
      and(
        filters.competenciaId != null
          ? eq(bancoHoras.competenciaId, filters.competenciaId)
          : undefined,
        filters.mes != null ? eq(competencias.mes, filters.mes) : undefined,
        filters.ano != null ? eq(competencias.ano, filters.ano) : undefined,
        filters.apenasPendentes
          ? inArray(bancoHoras.status, ['devendo', 'excedeu'])
          : undefined
      )
    );

  return rows
    .map((row) =>
      mapBancoHorasRow(row.banco, {
        funcionarioNome: row.funcionarioNome,
        funcionarioMatricula: row.funcionarioMatricula,
        funcionarioCategoria: row.funcionarioCategoria ?? '',
        setorId: row.setorId,
        setorNome: row.setorNome,
        competenciaMes: row.competenciaMes,
        competenciaAno: row.competenciaAno,
        competenciaTipo: row.competenciaTipo as TipoEscala,
      })
    )
    .sort((a, b) => {
      const absDiff = Math.abs(b.saldoHoras) - Math.abs(a.saldoHoras);
      if (absDiff !== 0) return absDiff;
      return a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR', { sensitivity: 'base' });
    });
}

export async function listBancoHorasPendentes(mes: number, ano: number): Promise<BancoHorasComDetalhes[]> {
  return listBancoHorasMes(mes, ano, { apenasPendentes: true });
}

export async function listBancoHorasGeral(options?: {
  apenasPendentes?: boolean;
}): Promise<BancoHorasAgregado[]> {
  await ensureBancoHorasGeral();

  const rows = await db
    .select({
      funcionarioId: funcionarios.id,
      funcionarioNome: funcionarios.nome,
      funcionarioMatricula: funcionarios.matricula,
      funcionarioCategoria: funcionarios.categoria,
      setorId: funcionarios.setorId,
      setorNome: setores.nome,
      horasContratadas: sql<number>`sum(${bancoHoras.horasContratadas})`.mapWith(Number),
      horasTrabalhadas: sql<number>`sum(${bancoHoras.horasTrabalhadas})`.mapWith(Number),
      saldoHoras: sql<number>`sum(${bancoHoras.saldoHoras})`.mapWith(Number),
      competenciasContabilizadas: sql<number>`count(distinct ${bancoHoras.competenciaId})`.mapWith(
        Number
      ),
    })
    .from(bancoHoras)
    .innerJoin(funcionarios, eq(bancoHoras.funcionarioId, funcionarios.id))
    .leftJoin(setores, eq(funcionarios.setorId, setores.id))
    .groupBy(
      funcionarios.id,
      funcionarios.nome,
      funcionarios.matricula,
      funcionarios.categoria,
      funcionarios.setorId,
      setores.nome
    );

  return rows
    .map((row) => {
      const saldoHoras = row.saldoHoras;
      return {
        funcionarioId: row.funcionarioId,
        funcionarioNome: row.funcionarioNome,
        funcionarioMatricula: row.funcionarioMatricula,
        funcionarioCategoria: row.funcionarioCategoria ?? '',
        setorId: row.setorId,
        setorNome: row.setorNome,
        horasContratadas: row.horasContratadas,
        horasTrabalhadas: row.horasTrabalhadas,
        saldoHoras,
        status: resolverStatusSaldo(saldoHoras),
        competenciasContabilizadas: row.competenciasContabilizadas,
      };
    })
    .filter((row) =>
      options?.apenasPendentes ? row.status === 'devendo' || row.status === 'excedeu' : true
    )
    .sort((a, b) => {
      const absDiff = Math.abs(b.saldoHoras) - Math.abs(a.saldoHoras);
      if (absDiff !== 0) return absDiff;
      return a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR', { sensitivity: 'base' });
    });
}
