import { and, eq, inArray } from 'drizzle-orm';
import {
  getPadraoEscala,
  isEnfermeiro,
  isTecnicoEnfermagem,
  type StatusEspecialItem,
  type TipoEscala,
} from '@escala/shared';
import { db } from '../db';
import { setores, funcionarios, competencias, escalaInicios, statusEspeciais } from '../db/schema';
import { mapFuncionario, getDiasNoMes } from '../utils/helpers';
import { listBancoHorasPendentes } from './bancoHoras.service';
import { listStatusPorSetoresNoMes, montarStatusPorDia } from './statusEspecial.service';

type FuncionarioRow = typeof funcionarios.$inferSelect;

function isSemEscalaDefinida(
  f: FuncionarioRow,
  funcComInicio: Set<number>,
  compBySetor: Map<number, number>,
  statusPorSetor: Map<number, StatusEspecialItem[]>,
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
  statusPorSetor: Map<number, StatusEspecialItem[]>,
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

  const compBySetorTecnico = new Map<number, number>();
  const compBySetorEnfermeiro = new Map<number, number>();
  for (const c of comps) {
    if (c.setorId == null) continue;
    if (c.tipo === 'enfermeiro') {
      compBySetorEnfermeiro.set(c.setorId, c.id);
    } else {
      compBySetorTecnico.set(c.setorId, c.id);
    }
  }

  const compIds = comps.map((c) => c.id);

  const statusPorSetor = await listStatusPorSetoresNoMes(
    allSetores.map((s) => s.id),
    mesAtual,
    anoAtual
  );

  const inicios =
    compIds.length > 0
      ? await db
          .select()
          .from(escalaInicios)
          .where(inArray(escalaInicios.competenciaId, compIds))
      : [];

  const funcComInicioTecnico = new Set<number>();
  const funcComInicioEnfermeiro = new Set<number>();
  for (const inicio of inicios) {
    const comp = comps.find((c) => c.id === inicio.competenciaId);
    if (!comp) continue;
    if (comp.tipo === 'enfermeiro') {
      funcComInicioEnfermeiro.add(inicio.funcionarioId);
    } else {
      funcComInicioTecnico.add(inicio.funcionarioId);
    }
  }

  const coberturaTecnicos = calcularCobertura(
    allFuncs,
    isTecnicoEnfermagem,
    funcComInicioTecnico,
    compBySetorTecnico,
    statusPorSetor,
    dias,
    mesAtual,
    anoAtual
  );
  const coberturaEnfermeiros = calcularCobertura(
    allFuncs,
    isEnfermeiro,
    funcComInicioEnfermeiro,
    compBySetorEnfermeiro,
    statusPorSetor,
    dias,
    mesAtual,
    anoAtual
  );

  const semEscalaDefinida = [...coberturaTecnicos.semEscala, ...coberturaEnfermeiros.semEscala].sort(
    (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );
  const semEscalaTecnicosIds = new Set(coberturaTecnicos.semEscala.map((f) => f.id));
  const semEscalaEnfermeirosIds = new Set(coberturaEnfermeiros.semEscala.map((f) => f.id));
  const setoresComCompetenciaTecnico = new Set(compBySetorTecnico.keys());
  const setoresComCompetenciaEnfermeiro = new Set(compBySetorEnfermeiro.keys());

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
    .flatMap((s) => {
      const funcsNoSetor = allFuncs.filter((f) => f.setorId === s.id);
      const temTecnicos = funcsNoSetor.some((f) => isTecnicoEnfermagem(f.categoria ?? ''));
      const temEnfermeiros = funcsNoSetor.some((f) => isEnfermeiro(f.categoria ?? ''));
      const faltando: { setorId: number; setor: string; tipo: TipoEscala }[] = [];
      if (temTecnicos && !setoresComCompetenciaTecnico.has(s.id)) {
        faltando.push({ setorId: s.id, setor: s.nome, tipo: 'tecnico' });
      }
      if (temEnfermeiros && !setoresComCompetenciaEnfermeiro.has(s.id)) {
        faltando.push({ setorId: s.id, setor: s.nome, tipo: 'enfermeiro' });
      }
      return faltando;
    });

  const resumoEscalaSetores = allSetores
    .map((s) => {
      const funcsNoSetor = allFuncs.filter((f) => f.setorId === s.id);
      const tecnicosNoSetor = funcsNoSetor.filter((f) => isTecnicoEnfermagem(f.categoria ?? ''));
      const enfermeirosNoSetor = funcsNoSetor.filter((f) => isEnfermeiro(f.categoria ?? ''));
      const tecnicosSemEscala = tecnicosNoSetor.filter((f) =>
        semEscalaTecnicosIds.has(f.id)
      ).length;
      const enfermeirosSemEscala = enfermeirosNoSetor.filter((f) =>
        semEscalaEnfermeirosIds.has(f.id)
      ).length;
      const tecnicosComEscala = tecnicosNoSetor.length - tecnicosSemEscala;
      const enfermeirosComEscala = enfermeirosNoSetor.length - enfermeirosSemEscala;
      const totalOutros =
        funcsNoSetor.length - tecnicosNoSetor.length - enfermeirosNoSetor.length;

      const coberturaTecnicosPercent =
        tecnicosNoSetor.length > 0
          ? Math.round((tecnicosComEscala / tecnicosNoSetor.length) * 100)
          : 100;
      const coberturaEnfermeirosPercent =
        enfermeirosNoSetor.length > 0
          ? Math.round((enfermeirosComEscala / enfermeirosNoSetor.length) * 100)
          : 100;

      const semCompetenciaTecnico =
        tecnicosNoSetor.length > 0 && !setoresComCompetenciaTecnico.has(s.id);
      const semCompetenciaEnfermeiro =
        enfermeirosNoSetor.length > 0 && !setoresComCompetenciaEnfermeiro.has(s.id);

      const pendencias =
        tecnicosSemEscala +
        enfermeirosSemEscala +
        (semCompetenciaTecnico ? 1 : 0) +
        (semCompetenciaEnfermeiro ? 1 : 0);

      return {
        setorId: s.id,
        setor: s.nome,
        totalFuncionarios: funcsNoSetor.length,
        totalTecnicos: tecnicosNoSetor.length,
        totalEnfermeiros: enfermeirosNoSetor.length,
        totalOutros,
        tecnicosComEscala,
        enfermeirosComEscala,
        tecnicosSemEscala,
        enfermeirosSemEscala,
        coberturaTecnicosPercent,
        coberturaEnfermeirosPercent,
        temCompetenciaTecnico: !semCompetenciaTecnico,
        temCompetenciaEnfermeiro: !semCompetenciaEnfermeiro,
        pendencias,
      };
    })
    .sort((a, b) => a.setorId - b.setorId);

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

  const bancoHorasPendentes = await listBancoHorasPendentes(mesAtual, anoAtual);

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
    setoresComCompetencia: setoresComCompetenciaTecnico.size + setoresComCompetenciaEnfermeiro.size,
    setoresSemCompetencia,
    funcionariosPorCategoria,
    funcionariosPorContrato,
    resumoEscalaSetores,
    statusEspeciaisNoMes,
    totalStatusEspeciaisNoMes: statusAtivosNoMes.length,
    bancoHorasPendentes,
  };
}
