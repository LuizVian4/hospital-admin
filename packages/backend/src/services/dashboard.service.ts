import { and, eq, inArray } from 'drizzle-orm';
import { getPadraoEscala } from '@escala/shared';
import { db } from '../db';
import { setores, funcionarios, competencias, escalaDias } from '../db/schema';
import { mapFuncionario, getDiasNoMes } from '../utils/helpers';
import { listStatusPorSetorNoMes, montarStatusPorDia } from './statusEspecial.service';

export async function getDashboardData(mes?: number, ano?: number) {
  const now = new Date();
  const mesAtual = mes ?? now.getMonth() + 1;
  const anoAtual = ano ?? now.getFullYear();
  const dias = Array.from(
    { length: Math.min(30, getDiasNoMes(mesAtual, anoAtual)) },
    (_, i) => i + 1
  );

  const allSetores = await db.select().from(setores).orderBy(setores.nome);
  const allFuncs = await db.select().from(funcionarios).where(eq(funcionarios.ativo, true));

  const comps = await db
    .select()
    .from(competencias)
    .where(and(eq(competencias.mes, mesAtual), eq(competencias.ano, anoAtual)));

  const compIds = comps.map((c) => c.id);
  const compBySetor = new Map(comps.map((c) => [c.setorId, c.id]));

  const statusPorSetor = new Map<number, Awaited<ReturnType<typeof listStatusPorSetorNoMes>>>();
  for (const setor of allSetores) {
    statusPorSetor.set(setor.id, await listStatusPorSetorNoMes(setor.id, mesAtual, anoAtual));
  }

  const inicios =
    compIds.length > 0
      ? await db
          .select()
          .from(escalaDias)
          .where(
            and(
              inArray(escalaDias.competenciaId, compIds),
              eq(escalaDias.tipoRegistro, 'inicio'),
              eq(escalaDias.ativo, true)
            )
          )
      : [];

  const funcComInicio = new Set(inicios.map((i) => i.funcionarioId));

  const semEscalaDefinida = allFuncs
    .filter((f) => {
      if (!getPadraoEscala(f.categoria ?? '')) return false;
      if (f.setorId == null) return true;

      const statuses = statusPorSetor.get(f.setorId) ?? [];
      const statusPorDia = montarStatusPorDia(statuses, f.id, mesAtual, anoAtual, dias);
      const diasComStatus = Object.keys(statusPorDia).length;
      if (diasComStatus >= dias.length) return false;

      const compId = compBySetor.get(f.setorId);
      if (!compId) return true;
      return !funcComInicio.has(f.id);
    })
    .map(mapFuncionario);

  return {
    setores: allSetores,
    totalFuncionarios: allFuncs.length,
    funcionariosPorSetor: allSetores.map((s) => ({
      setorId: s.id,
      setor: s.nome,
      total: allFuncs.filter((f) => f.setorId === s.id).length,
    })),
    semEscalaDefinida,
    mes: mesAtual,
    ano: anoAtual,
  };
}
