import { and, eq, inArray } from 'drizzle-orm';
import { getPadraoEscala, isEnfermeiro, isTecnicoEnfermagem } from '@escala/shared';
import { db } from '../db';
import { setores, funcionarios, competencias, escalaDias, statusEspeciais } from '../db/schema';
import { mapFuncionario, getDiasNoMes } from '../utils/helpers';
import { listStatusPorSetorNoMes, montarStatusPorDia } from './statusEspecial.service';

type FuncionarioRow = typeof funcionarios.$inferSelect;

function isSemEscalaDefinida(
  f: FuncionarioRow,
  funcComInicio: Set<number>,
  compBySetor: Map<number, number>,
  statusPorSetor: Map<number, Awaited<ReturnType<typeof listStatusPorSetorNoMes>>>,
  dias: number[],
  mesAtual: number,
  anoAtual: number
): boolean {
  if (!getPadraoEscala(f.categoria ?? '')) return false;
  if (f.setorId == null) return true;

  const statuses = statusPorSetor.get(f.setorId) ?? [];
  const statusPorDia = montarStatusPorDia(statuses, f.id, mesAtual, anoAtual, dias);
  const diasComStatus = Object.keys(statusPorDia).length;
  if (diasComStatus >= dias.length) return false;

  const compId = compBySetor.get(f.setorId);
  if (!compId) return true;
  return !funcComInicio.has(f.id);
}

function calcularCobertura(
  allFuncs: FuncionarioRow[],
  filtroCategoria: (categoria: string) => boolean,
  funcComInicio: Set<number>,
  compBySetor: Map<number, number>,
  statusPorSetor: Map<number, Awaited<ReturnType<typeof listStatusPorSetorNoMes>>>,
  dias: number[],
  mesAtual: number,
  anoAtual: number
) {
  const comPadrao = allFuncs.filter((f) => filtroCategoria(f.categoria ?? ''));
  const semEscala = comPadrao
    .filter((f) =>
      isSemEscalaDefinida(f, funcComInicio, compBySetor, statusPorSetor, dias, mesAtual, anoAtual)
    )
    .map(mapFuncionario);
  const total = comPadrao.length;
  const comEscalaDefinida = total - semEscala.length;
  const percent = total > 0 ? Math.round((comEscalaDefinida / total) * 100) : 100;

  return { total, comEscalaDefinida, percent, semEscala };
}

export async function getDashboardData(mes?: number, ano?: number) {
  const now = new Date();
  const mesAtual = mes ?? now.getMonth() + 1;
  const anoAtual = ano ?? now.getFullYear();
  const dias = Array.from(
    { length: getDiasNoMes(mesAtual, anoAtual) },
    (_, i) => i + 1
  );

  const allSetores = await db.select().from(setores).orderBy(setores.id);
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

  const coberturaTecnicos = calcularCobertura(
    allFuncs,
    isTecnicoEnfermagem,
    funcComInicio,
    compBySetor,
    statusPorSetor,
    dias,
    mesAtual,
    anoAtual
  );
  const coberturaEnfermeiros = calcularCobertura(
    allFuncs,
    isEnfermeiro,
    funcComInicio,
    compBySetor,
    statusPorSetor,
    dias,
    mesAtual,
    anoAtual
  );

  const semEscalaDefinida = [...coberturaTecnicos.semEscala, ...coberturaEnfermeiros.semEscala].sort(
    (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );
  const semEscalaIds = new Set(coberturaTecnicos.semEscala.map((f) => f.id));
  const setoresComCompetencia = new Set(comps.map((c) => c.setorId));

  const totalTecnicos = coberturaTecnicos.total;
  const comEscalaDefinida = coberturaTecnicos.comEscalaDefinida;
  const coberturaEscalaPercent = coberturaTecnicos.percent;
  const totalEnfermeiros = coberturaEnfermeiros.total;
  const comEscalaDefinidaEnfermeiros = coberturaEnfermeiros.comEscalaDefinida;
  const coberturaEscalaEnfermeirosPercent = coberturaEnfermeiros.percent;

  const funcionariosSemSetor = allFuncs.filter((f) => f.setorId == null).length;

  const categoriaMap = new Map<string, number>();
  const contratoMap = new Map<string, number>();
  for (const f of allFuncs) {
    const cat = f.categoria?.trim() || 'Sem categoria';
    categoriaMap.set(cat, (categoriaMap.get(cat) ?? 0) + 1);
    const contrato = f.tipoContrato?.trim() || 'Não informado';
    contratoMap.set(contrato, (contratoMap.get(contrato) ?? 0) + 1);
  }

  const funcionariosPorCategoria = [...categoriaMap.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);

  const funcionariosPorContrato = [...contratoMap.entries()]
    .map(([tipo, total]) => ({ tipo, total }))
    .sort((a, b) => b.total - a.total);

  const setoresSemCompetencia = allSetores
    .filter((s) => !setoresComCompetencia.has(s.id))
    .map((s) => ({ setorId: s.id, setor: s.nome }));

  const resumoEscalaSetores = allSetores.map((s) => {
    const funcsNoSetor = allFuncs.filter((f) => f.setorId === s.id);
    const tecnicosNoSetor = funcsNoSetor.filter((f) => isTecnicoEnfermagem(f.categoria ?? ''));
    const tecnicosSemEscala = tecnicosNoSetor.filter((f) => semEscalaIds.has(f.id)).length;
    return {
      setorId: s.id,
      setor: s.nome,
      totalFuncionarios: funcsNoSetor.length,
      totalTecnicos: tecnicosNoSetor.length,
      tecnicosSemEscala,
      temCompetencia: setoresComCompetencia.has(s.id),
    };
  });

  const inicioMes = new Date(anoAtual, mesAtual - 1, 1);
  const fimMes = new Date(anoAtual, mesAtual, 0);
  const allStatus = await db.select().from(statusEspeciais);
  const statusAtivosNoMes = allStatus.filter((s) => {
    if (!s.dataInicio || !s.dataFim) return false;
    const ini = new Date(s.dataInicio);
    const fim = new Date(s.dataFim);
    return ini <= fimMes && fim >= inicioMes;
  });

  const statusPorTipo = new Map<string, number>();
  for (const s of statusAtivosNoMes) {
    statusPorTipo.set(s.status, (statusPorTipo.get(s.status) ?? 0) + 1);
  }

  const statusEspeciaisNoMes = [...statusPorTipo.entries()]
    .map(([status, total]) => ({ status, total }))
    .sort((a, b) => b.total - a.total);

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
    totalTecnicos,
    comEscalaDefinida,
    coberturaEscalaPercent,
    totalEnfermeiros,
    comEscalaDefinidaEnfermeiros,
    coberturaEscalaEnfermeirosPercent,
    funcionariosSemSetor,
    setoresComCompetencia: setoresComCompetencia.size,
    setoresSemCompetencia,
    funcionariosPorCategoria,
    funcionariosPorContrato,
    resumoEscalaSetores,
    statusEspeciaisNoMes,
    totalStatusEspeciaisNoMes: statusAtivosNoMes.length,
  };
}
