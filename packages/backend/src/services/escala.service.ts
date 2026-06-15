import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  competencias,
  escalaDias,
  funcionarios,
  setores,
} from '../db/schema';
import type { EscalaInicio, FuncionarioComTurnos, GradeEscalaResponse, Turno } from '@escala/shared';
import {
  appendObservacaoLista,
  formatObservacaoTrocaCompetencia,
  getPadraoEscala,
  projetarTurnosVazios,
  simularMesAPartirDeAncora,
  ancoraFromEscalaInicio,
  calcularTurnoProjetado,
  calcularIndiceNoDia,
} from '@escala/shared';
import {
  agruparPorEscalaIgual,
  getDiasNoMes,
  getDiasSemana,
  mapFuncionario,
  normalizeTurno,
} from '../utils/helpers';
import {
  aplicarStatusNosTurnos,
  listStatusPorSetorNoMes,
  montarStatusPorDia,
} from './statusEspecial.service';

function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) return { mes: 12, ano: ano - 1 };
  return { mes: mes - 1, ano };
}

function mesSeguinte(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 12) return { mes: 1, ano: ano + 1 };
  return { mes: mes + 1, ano };
}

function mapEscalaInicioRow(row: {
  id: number;
  diaInicio: number | null;
  mesInicio: number | null;
  anoInicio: number | null;
  turnoInicio: string | null;
  indicePadrao: number | null;
  ativo: boolean;
}): EscalaInicio | null {
  const turno = normalizeTurno(row.turnoInicio);
  if (!row.diaInicio || !row.mesInicio || !row.anoInicio || !turno) return null;
  return {
    id: row.id,
    diaInicio: row.diaInicio,
    mesInicio: row.mesInicio,
    anoInicio: row.anoInicio,
    turnoInicio: turno,
    ...(row.indicePadrao != null ? { indicePadrao: row.indicePadrao } : {}),
    ativo: row.ativo,
  };
}

async function getIniciosAtivos(
  competenciaId: number
): Promise<Map<number, EscalaInicio>> {
  const rows = await db
    .select()
    .from(escalaDias)
    .where(
      and(
        eq(escalaDias.competenciaId, competenciaId),
        eq(escalaDias.tipoRegistro, 'inicio'),
        eq(escalaDias.ativo, true)
      )
    );

  const map = new Map<number, EscalaInicio>();
  for (const row of rows) {
    const config = mapEscalaInicioRow(row);
    if (config) map.set(row.funcionarioId, config);
  }
  return map;
}

async function getIniciosMesAnterior(
  setorId: number,
  mes: number,
  ano: number
): Promise<Map<number, EscalaInicio>> {
  const { mes: mesAnt, ano: anoAnt } = mesAnterior(mes, ano);
  const compAnt = await db.query.competencias.findFirst({
    where: and(
      eq(competencias.mes, mesAnt),
      eq(competencias.ano, anoAnt),
      eq(competencias.setorId, setorId)
    ),
  });
  if (!compAnt) return new Map();
  return getIniciosAtivos(compAnt.id);
}

async function getTurnosMesAnterior(
  setorId: number,
  mes: number,
  ano: number
): Promise<Map<number, Record<number, Turno | null>>> {
  const { mes: mesAnt, ano: anoAnt } = mesAnterior(mes, ano);
  const compAnt = await db.query.competencias.findFirst({
    where: and(
      eq(competencias.mes, mesAnt),
      eq(competencias.ano, anoAnt),
      eq(competencias.setorId, setorId)
    ),
  });

  const result = new Map<number, Record<number, Turno | null>>();
  if (!compAnt) return result;

  const diasAnt = await db
    .select()
    .from(escalaDias)
    .where(
      and(eq(escalaDias.competenciaId, compAnt.id), eq(escalaDias.tipoRegistro, 'turno'))
    );

  for (const d of diasAnt) {
    if (!d.dia) continue;
    const turno = normalizeTurno(d.turno);
    if (!turno) continue;
    if (!result.has(d.funcionarioId)) {
      result.set(d.funcionarioId, {});
    }
    result.get(d.funcionarioId)![d.dia] = turno;
  }

  return result;
}

async function desativarInicioAtivo(competenciaId: number, funcionarioId: number) {
  await db
    .update(escalaDias)
    .set({ ativo: false })
    .where(
      and(
        eq(escalaDias.competenciaId, competenciaId),
        eq(escalaDias.funcionarioId, funcionarioId),
        eq(escalaDias.tipoRegistro, 'inicio'),
        eq(escalaDias.ativo, true)
      )
    );
}

async function criarInicioAtivo(
  competenciaId: number,
  funcionarioId: number,
  diaInicio: number,
  mesInicio: number,
  anoInicio: number,
  turnoInicio: Turno,
  indicePadrao?: number
) {
  await desativarInicioAtivo(competenciaId, funcionarioId);
  await db.insert(escalaDias).values({
    competenciaId,
    funcionarioId,
    tipoRegistro: 'inicio',
    dia: null,
    turno: null,
    diaInicio,
    mesInicio,
    anoInicio,
    turnoInicio,
    indicePadrao: indicePadrao ?? null,
    ativo: true,
  });
}

async function upsertTurnoDia(
  competenciaId: number,
  funcionarioId: number,
  dia: number,
  turno: Turno | null,
  observacao?: string | null
) {
  const existing = await db.query.escalaDias.findFirst({
    where: and(
      eq(escalaDias.competenciaId, competenciaId),
      eq(escalaDias.funcionarioId, funcionarioId),
      eq(escalaDias.dia, dia),
      eq(escalaDias.tipoRegistro, 'turno')
    ),
  });

  if (existing) {
    await db
      .update(escalaDias)
      .set({
        turno,
        ...(observacao !== undefined ? { observacao } : {}),
      })
      .where(eq(escalaDias.id, existing.id));
    return;
  }

  if (turno) {
    await db.insert(escalaDias).values({
      competenciaId,
      funcionarioId,
      tipoRegistro: 'turno',
      dia,
      turno,
      observacao: observacao ?? null,
      ativo: true,
    });
  }
}

export function formatObservacaoTroca(
  nomeOutro: string,
  diaOutro: number,
  turnoAnterior: Turno,
  turnoNovo: Turno
): string {
  return `Troca com ${nomeOutro} (dia ${diaOutro}): cedeu o turno ${turnoAnterior} e assumiu ${turnoNovo}.`;
}

function findFuncionarioNaGrade(
  grade: GradeEscalaResponse,
  funcionarioId: number
): FuncionarioComTurnos | null {
  for (const grupo of grade.grupos) {
    const func = grupo.funcionarios.find((f) => f.id === funcionarioId);
    if (func) return func;
  }
  return null;
}

function getTurnoEfetivo(func: FuncionarioComTurnos, dia: number): Turno | null {
  return func.turnos[dia] ?? func.turnosProjetados?.[dia] ?? null;
}

export async function getGradeEscala(competenciaId: number): Promise<GradeEscalaResponse | null> {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
    with: { setor: true },
  });

  if (!comp || !comp.setor) return null;

  const totalDias = getDiasNoMes(comp.mes, comp.ano);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);

  const statusList = await listStatusPorSetorNoMes(comp.setorId!, comp.mes, comp.ano);

  const allFuncs = await db
    .select()
    .from(funcionarios)
    .where(and(eq(funcionarios.setorId, comp.setorId!), eq(funcionarios.ativo, true)))
    .orderBy(funcionarios.ordemEscala, funcionarios.nome);

  const funcs = allFuncs;

  const registrosEscala = await db
    .select()
    .from(escalaDias)
    .where(eq(escalaDias.competenciaId, competenciaId));

  const diasPorFunc = new Map<number, Record<number, Turno | null>>();
  const observacoesPorFunc = new Map<number, Record<number, string>>();
  const iniciosPorFunc = new Map<number, EscalaInicio>();

  for (const d of registrosEscala) {
    if (d.tipoRegistro === 'inicio' && d.ativo) {
      const config = mapEscalaInicioRow(d);
      if (config) iniciosPorFunc.set(d.funcionarioId, config);
      continue;
    }
    if (d.tipoRegistro !== 'turno' || !d.dia) continue;
    if (!diasPorFunc.has(d.funcionarioId)) {
      diasPorFunc.set(d.funcionarioId, {});
    }
    diasPorFunc.get(d.funcionarioId)![d.dia] = normalizeTurno(d.turno) ?? null;
    if (d.observacao) {
      if (!observacoesPorFunc.has(d.funcionarioId)) {
        observacoesPorFunc.set(d.funcionarioId, {});
      }
      observacoesPorFunc.get(d.funcionarioId)![d.dia] = d.observacao;
    }
  }

  const turnosMesAnterior = await getTurnosMesAnterior(comp.setorId!, comp.mes, comp.ano);
  const iniciosMesAnterior = await getIniciosMesAnterior(comp.setorId!, comp.mes, comp.ano);
  const { mes: mesAnt, ano: anoAnt } = mesAnterior(comp.mes, comp.ano);
  const diasNoMesAnterior = getDiasNoMes(mesAnt, anoAnt);

  const funcionariosComTurnos = funcs.map((f) => {
    let turnos = diasPorFunc.get(f.id) ?? {};
    const observacoesDia = observacoesPorFunc.get(f.id);
    const escalaInicio = iniciosPorFunc.get(f.id);
    const statusPorDia = montarStatusPorDia(statusList, f.id, comp.mes, comp.ano, dias);
    const padrao = getPadraoEscala(f.categoria ?? 'TÉC. DE ENFERMAGEM');
    let turnosProjetados = padrao
      ? projetarTurnosVazios(
          padrao,
          turnos,
          dias,
          comp.mes,
          comp.ano,
          escalaInicio,
          turnosMesAnterior.get(f.id),
          diasNoMesAnterior,
          iniciosMesAnterior.get(f.id)
        )
      : undefined;

    if (Object.keys(statusPorDia).length > 0) {
      turnos = aplicarStatusNosTurnos(turnos, statusPorDia);
      if (turnosProjetados) {
        turnosProjetados = { ...turnosProjetados };
        for (const dia of Object.keys(statusPorDia).map(Number)) {
          delete turnosProjetados[dia];
        }
      }
    }

    return {
      ...mapFuncionario(f),
      turnos,
      ...(escalaInicio ? { escalaInicio } : {}),
      ...(turnosProjetados && Object.keys(turnosProjetados).length > 0
        ? { turnosProjetados }
        : {}),
      ...(observacoesDia && Object.keys(observacoesDia).length > 0 ? { observacoesDia } : {}),
      ...(Object.keys(statusPorDia).length > 0 ? { statusPorDia } : {}),
    };
  });

  const grupos = agruparPorEscalaIgual(funcionariosComTurnos, dias);

  return {
    competencia: {
      id: comp.id,
      mes: comp.mes,
      ano: comp.ano,
      setor: comp.setor.nome,
    },
    dias,
    diasSemana: getDiasSemana(comp.mes, comp.ano, dias.length),
    grupos,
    statusEspeciais: statusList,
    observacoes: comp.observacoes ?? undefined,
  };
}

export async function batchUpdateEscalaDias(
  competenciaId: number,
  items: {
    funcionarioId: number;
    dia: number;
    turno: Turno | null;
    definirInicio?: boolean;
    indicePadrao?: number;
  }[]
) {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (!comp) return;

  const totalDias = getDiasNoMes(comp.mes, comp.ano);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);

  const iniciosAtivos = await getIniciosAtivos(competenciaId);
  const expandedItems = [...items];

  for (const item of items) {
    if (!item.turno) continue;

    const func = await db.query.funcionarios.findFirst({
      where: eq(funcionarios.id, item.funcionarioId),
    });
    if (!func) continue;

    const inicioAtual = iniciosAtivos.get(item.funcionarioId);
    const diaInicioPadrao = inicioAtual?.diaInicio ?? 1;
    const ehInicio =
      item.definirInicio === true ||
      (item.definirInicio !== false && item.dia === diaInicioPadrao);

    if (!ehInicio) continue;

    const padrao = getPadraoEscala(func.categoria ?? 'TÉC. DE ENFERMAGEM');
    if (!padrao) continue;

    const turno = normalizeTurno(item.turno);
    if (!turno) continue;

    await criarInicioAtivo(
      competenciaId,
      item.funcionarioId,
      item.dia,
      comp.mes,
      comp.ano,
      turno,
      item.indicePadrao
    );

    const simulados = simularMesAPartirDeAncora(
      padrao,
      item.dia,
      turno,
      dias,
      item.indicePadrao,
      item.definirInicio === true
    );
    for (const [diaStr, turnoSimulado] of Object.entries(simulados)) {
      expandedItems.push({
        funcionarioId: item.funcionarioId,
        dia: Number(diaStr),
        turno: turnoSimulado,
      });
    }
  }

  const deduped = new Map<string, { funcionarioId: number; dia: number; turno: Turno | null }>();
  for (const item of expandedItems) {
    deduped.set(`${item.funcionarioId}:${item.dia}`, item);
  }

  for (const item of deduped.values()) {
    const turno = item.turno ? normalizeTurno(item.turno) : null;
    await upsertTurnoDia(competenciaId, item.funcionarioId, item.dia, turno);
  }
}

export async function trocarEscalaDia(
  competenciaId: number,
  funcionarioIdOrigem: number,
  diaOrigem: number,
  funcionarioIdDestino: number,
  diaDestino: number
) {
  if (funcionarioIdOrigem === funcionarioIdDestino && diaOrigem === diaDestino) {
    throw new Error('Selecione uma célula diferente para a troca');
  }

  const grade = await getGradeEscala(competenciaId);
  if (!grade) throw new Error('Competência não encontrada');

  const origem = findFuncionarioNaGrade(grade, funcionarioIdOrigem);
  const destino = findFuncionarioNaGrade(grade, funcionarioIdDestino);

  if (!origem || !destino) {
    throw new Error('Funcionário não encontrado na escala');
  }

  const turnoOrigem = getTurnoEfetivo(origem, diaOrigem);
  const turnoDestino = getTurnoEfetivo(destino, diaDestino);

  if (!turnoOrigem || !turnoDestino) {
    throw new Error('Ambas as células precisam ter turno para realizar a troca');
  }

  await upsertTurnoDia(
    competenciaId,
    funcionarioIdOrigem,
    diaOrigem,
    turnoDestino,
    formatObservacaoTroca(destino.nome, diaDestino, turnoOrigem, turnoDestino)
  );

  await upsertTurnoDia(
    competenciaId,
    funcionarioIdDestino,
    diaDestino,
    turnoOrigem,
    formatObservacaoTroca(origem.nome, diaOrigem, turnoDestino, turnoOrigem)
  );

  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (comp) {
    const linhaTroca = formatObservacaoTrocaCompetencia(
      origem.nome,
      diaOrigem,
      turnoOrigem,
      destino.nome,
      diaDestino,
      turnoDestino
    );
    await db
      .update(competencias)
      .set({ observacoes: appendObservacaoLista(comp.observacoes, linhaTroca) })
      .where(eq(competencias.id, competenciaId));
  }

  return { success: true };
}

export async function zerarEscalaFuncionario(competenciaId: number, funcionarioId: number) {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (!comp) return false;

  await db
    .delete(escalaDias)
    .where(
      and(
        eq(escalaDias.competenciaId, competenciaId),
        eq(escalaDias.funcionarioId, funcionarioId),
        eq(escalaDias.tipoRegistro, 'turno')
      )
    );

  await desativarInicioAtivo(competenciaId, funcionarioId);

  const totalDias = getDiasNoMes(comp.mes, comp.ano);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);

  if (dias.length > 0) {
    await db.insert(escalaDias).values(
      dias.map((dia) => ({
        competenciaId,
        funcionarioId,
        tipoRegistro: 'turno' as const,
        dia,
        turno: null,
        ativo: true,
      }))
    );
  }

  return true;
}

export async function getRelatorioFolgas(mes: number, ano: number, setorId?: number) {
  const comps = await db
    .select()
    .from(competencias)
    .where(
      and(
        eq(competencias.mes, mes),
        eq(competencias.ano, ano),
        setorId ? eq(competencias.setorId, setorId) : undefined
      )
    );

  const results = [];
  for (const comp of comps) {
    const folgas = await db
      .select({
        funcionarioId: escalaDias.funcionarioId,
        nome: funcionarios.nome,
        matricula: funcionarios.matricula,
        total: sql<number>`count(*)::int`,
      })
      .from(escalaDias)
      .innerJoin(funcionarios, eq(escalaDias.funcionarioId, funcionarios.id))
      .where(
        and(
          eq(escalaDias.competenciaId, comp.id),
          eq(escalaDias.tipoRegistro, 'turno'),
          eq(escalaDias.turno, 'F')
        )
      )
      .groupBy(escalaDias.funcionarioId, funcionarios.nome, funcionarios.matricula);

    const setor = await db.query.setores.findFirst({ where: eq(setores.id, comp.setorId!) });
    results.push({ setor: setor?.nome, competenciaId: comp.id, folgas });
  }
  return results;
}

export async function getRelatorioCargaHoraria(mes: number, ano: number) {
  const { HORAS_POR_TURNO } = await import('@escala/shared');
  const comps = await db
    .select()
    .from(competencias)
    .where(and(eq(competencias.mes, mes), eq(competencias.ano, ano)));

  const results = [];
  for (const comp of comps) {
    const dias = await db
      .select({
        turno: escalaDias.turno,
        funcionarioId: escalaDias.funcionarioId,
        cargaHoraria: funcionarios.cargaHoraria,
        nome: funcionarios.nome,
      })
      .from(escalaDias)
      .innerJoin(funcionarios, eq(escalaDias.funcionarioId, funcionarios.id))
      .where(and(eq(escalaDias.competenciaId, comp.id), eq(escalaDias.tipoRegistro, 'turno')));

    const porFunc = new Map<number, { nome: string; horas: number; contratado: string }>();
    for (const d of dias) {
      if (!porFunc.has(d.funcionarioId)) {
        porFunc.set(d.funcionarioId, {
          nome: d.nome,
          horas: 0,
          contratado: d.cargaHoraria ?? '180H',
        });
      }
      const entry = porFunc.get(d.funcionarioId)!;
      entry.horas += HORAS_POR_TURNO[d.turno ?? ''] ?? 0;
    }

    const setor = await db.query.setores.findFirst({ where: eq(setores.id, comp.setorId!) });
    results.push({
      setor: setor?.nome,
      competenciaId: comp.id,
      funcionarios: [...porFunc.values()],
    });
  }
  return results;
}

export async function findOrCreateCompetencia(mes: number, ano: number, setorId: number) {
  const existing = await db.query.competencias.findFirst({
    where: and(
      eq(competencias.mes, mes),
      eq(competencias.ano, ano),
      eq(competencias.setorId, setorId)
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(competencias)
    .values({ mes, ano, setorId })
    .returning();
  return created;
}

export interface SimularProximoMesResult {
  competenciaId: number;
  mes: number;
  ano: number;
  processados: number;
  ignorados: number;
}

export async function simularProximoMes(
  competenciaId: number
): Promise<SimularProximoMesResult> {
  const grade = await getGradeEscala(competenciaId);
  if (!grade) throw new Error('Competência não encontrada');

  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (!comp?.setorId) throw new Error('Setor não encontrado');

  const { mes: proxMes, ano: proxAno } = mesSeguinte(comp.mes, comp.ano);
  const proxComp = await findOrCreateCompetencia(proxMes, proxAno, comp.setorId);

  const totalDiasProx = getDiasNoMes(proxMes, proxAno);
  const diasProx = Array.from({ length: totalDiasProx }, (_, i) => i + 1);

  let processados = 0;
  let ignorados = 0;
  const funcionariosVistos = new Set<number>();

  for (const grupo of grade.grupos) {
    for (const func of grupo.funcionarios) {
      if (funcionariosVistos.has(func.id)) continue;
      funcionariosVistos.add(func.id);

      const padrao = getPadraoEscala(func.categoria ?? '');
      if (!padrao) {
        ignorados++;
        continue;
      }

      const escalaInicio = func.escalaInicio;
      if (!escalaInicio?.ativo) {
        ignorados++;
        continue;
      }

      const ancoraProx = ancoraFromEscalaInicio(padrao, escalaInicio, proxMes, proxAno);
      const turnoDia1 = calcularTurnoProjetado(padrao, ancoraProx, 1);
      if (!turnoDia1) {
        ignorados++;
        continue;
      }

      const indiceDia1 = calcularIndiceNoDia(padrao, ancoraProx, 1);

      await zerarEscalaFuncionario(proxComp.id, func.id);

      await criarInicioAtivo(
        proxComp.id,
        func.id,
        1,
        proxMes,
        proxAno,
        turnoDia1,
        indiceDia1
      );

      const simulados = simularMesAPartirDeAncora(
        padrao,
        1,
        turnoDia1,
        diasProx,
        indiceDia1,
        true
      );

      for (const [diaStr, turnoSimulado] of Object.entries(simulados)) {
        await upsertTurnoDia(proxComp.id, func.id, Number(diaStr), turnoSimulado);
      }

      processados++;
    }
  }

  if (processados > 0) {
    const MESES = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const nota = `Simulação gerada a partir de ${MESES[comp.mes - 1]}/${comp.ano}: ${processados} técnico(s) com escala e grupo atualizados para ${MESES[proxMes - 1]}/${proxAno}.`;
    await db
      .update(competencias)
      .set({ observacoes: appendObservacaoLista(proxComp.observacoes, nota) })
      .where(eq(competencias.id, proxComp.id));
  }

  return {
    competenciaId: proxComp.id,
    mes: proxMes,
    ano: proxAno,
    processados,
    ignorados,
  };
}
