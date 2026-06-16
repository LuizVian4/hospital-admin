import { eq, and, or } from 'drizzle-orm';
import { db } from '../db';
import {
  competencias,
  escalaInicios,
  escalaTrocas,
  funcionarios,
  setores,
} from '../db/schema';
import type {
  EscalaInicio,
  EscalaTroca,
  FuncionarioComTurnos,
  GradeEscalaResponse,
  StatusEspecial,
  TipoEscala,
  Turno,
} from '@escala/shared';
import {
  appendObservacaoLista,
  getPadraoEscala,
  pertenceTipoEscala,
  projetarTurnosVazios,
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
  mesInicio: number | null;
  anoInicio: number | null;
  turnoInicio: string | null;
  indicePadrao: number | null;
}): EscalaInicio | null {
  const turno = normalizeTurno(row.turnoInicio);
  if (!row.mesInicio || !row.anoInicio || !turno) return null;
  return {
    id: row.id,
    mesInicio: row.mesInicio,
    anoInicio: row.anoInicio,
    turnoInicio: turno,
    ...(row.indicePadrao != null ? { indicePadrao: row.indicePadrao } : {}),
  };
}

async function getIniciosPorCompetencia(
  competenciaId: number
): Promise<Map<number, EscalaInicio>> {
  const rows = await db
    .select()
    .from(escalaInicios)
    .where(eq(escalaInicios.competenciaId, competenciaId));

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
  ano: number,
  tipo: TipoEscala
): Promise<Map<number, EscalaInicio>> {
  const { mes: mesAnt, ano: anoAnt } = mesAnterior(mes, ano);
  const compAnt = await db.query.competencias.findFirst({
    where: and(
      eq(competencias.mes, mesAnt),
      eq(competencias.ano, anoAnt),
      eq(competencias.setorId, setorId),
      eq(competencias.tipo, tipo)
    ),
  });
  if (!compAnt) return new Map();
  return getIniciosPorCompetencia(compAnt.id);
}

async function getTurnosMesAnterior(
  setorId: number,
  mes: number,
  ano: number,
  tipo: TipoEscala,
  funcs: Array<{ id: number; categoria: string | null }>
): Promise<Map<number, Record<number, Turno | null>>> {
  const { mes: mesAnt, ano: anoAnt } = mesAnterior(mes, ano);
  const compAnt = await db.query.competencias.findFirst({
    where: and(
      eq(competencias.mes, mesAnt),
      eq(competencias.ano, anoAnt),
      eq(competencias.setorId, setorId),
      eq(competencias.tipo, tipo)
    ),
  });

  const result = new Map<number, Record<number, Turno | null>>();
  if (!compAnt) return result;

  const totalDias = getDiasNoMes(mesAnt, anoAnt);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);
  const inicios = await getIniciosPorCompetencia(compAnt.id);
  const iniciosMesAnterior = await getIniciosMesAnterior(setorId, mesAnt, anoAnt, tipo);
  const trocas = await db.query.escalaTrocas.findMany({
    where: eq(escalaTrocas.competenciaId, compAnt.id),
  });

  for (const f of funcs) {
    const padrao = getPadraoEscala(f.categoria ?? '');
    if (!padrao) continue;

    const overrides = montarOverridesPorTrocas(f.id, trocas);
    const { turnos, turnosProjetados } = montarTurnosFuncionario(
      padrao,
      dias,
      mesAnt,
      anoAnt,
      inicios.get(f.id),
      iniciosMesAnterior.get(f.id),
      undefined,
      undefined,
      overrides,
      {}
    );

    const efetivos: Record<number, Turno | null> = {};
    for (const dia of dias) {
      efetivos[dia] = turnos[dia] ?? turnosProjetados?.[dia] ?? null;
    }
    result.set(f.id, efetivos);
  }

  return result;
}

async function removerInicio(competenciaId: number, funcionarioId: number) {
  await db
    .delete(escalaInicios)
    .where(
      and(
        eq(escalaInicios.competenciaId, competenciaId),
        eq(escalaInicios.funcionarioId, funcionarioId)
      )
    );
}

async function criarInicioAtivo(
  competenciaId: number,
  funcionarioId: number,
  mesInicio: number,
  anoInicio: number,
  turnoInicio: Turno,
  indicePadrao?: number
) {
  await removerInicio(competenciaId, funcionarioId);
  await db.insert(escalaInicios).values({
    competenciaId,
    funcionarioId,
    mesInicio,
    anoInicio,
    turnoInicio,
    indicePadrao: indicePadrao ?? null,
  });
}

function montarOverridesPorTrocas(
  funcionarioId: number,
  trocas: Array<{ funcionarioId: number; dia: number; turnoNovo: string }>
): Record<number, Turno | null> {
  const overrides: Record<number, Turno | null> = {};
  for (const troca of trocas) {
    if (troca.funcionarioId !== funcionarioId) continue;
    overrides[troca.dia] = normalizeTurno(troca.turnoNovo) ?? null;
  }
  return overrides;
}

function montarTurnosFuncionario(
  padrao: Turno[],
  dias: number[],
  mes: number,
  ano: number,
  escalaInicio: EscalaInicio | undefined,
  inicioMesAnterior: EscalaInicio | undefined,
  turnosMesAnterior: Record<number, Turno | null> | undefined,
  diasNoMesAnterior: number | undefined,
  overrides: Record<number, Turno | null>,
  statusPorDia: Record<number, StatusEspecial>
): {
  turnos: Record<number, Turno | null>;
  turnosProjetados?: Record<number, Turno>;
} {
  let turnos = { ...overrides };
  let turnosProjetados = projetarTurnosVazios(
    padrao,
    turnos,
    dias,
    mes,
    ano,
    escalaInicio,
    turnosMesAnterior,
    diasNoMesAnterior,
    inicioMesAnterior
  );

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
    turnos,
    ...(turnosProjetados && Object.keys(turnosProjetados).length > 0
      ? { turnosProjetados }
      : {}),
  };
}

function mapEscalaTrocaRow(row: {
  id: number;
  competenciaId: number;
  funcionarioId: number;
  dia: number;
  turnoAnterior: string;
  turnoNovo: string;
  funcionarioTrocaId: number;
  createdAt: Date | null;
}): EscalaTroca {
  return {
    id: row.id,
    competenciaId: row.competenciaId,
    funcionarioId: row.funcionarioId,
    dia: row.dia,
    turnoAnterior: row.turnoAnterior,
    turnoNovo: row.turnoNovo,
    funcionarioTrocaId: row.funcionarioTrocaId,
    ...(row.createdAt ? { createdAt: row.createdAt.toISOString() } : {}),
  };
}

async function removerTrocasCelula(
  competenciaId: number,
  funcionarioId: number,
  dia: number
) {
  const rows = await db.query.escalaTrocas.findMany({
    where: and(
      eq(escalaTrocas.competenciaId, competenciaId),
      eq(escalaTrocas.funcionarioId, funcionarioId),
      eq(escalaTrocas.dia, dia)
    ),
  });

  for (const row of rows) {
    await db
      .delete(escalaTrocas)
      .where(
        or(
          eq(escalaTrocas.id, row.id),
          and(
            eq(escalaTrocas.competenciaId, competenciaId),
            eq(escalaTrocas.funcionarioId, row.funcionarioTrocaId),
            eq(escalaTrocas.funcionarioTrocaId, funcionarioId)
          )
        )
      );
  }
}

async function registrarTrocaEscala(
  competenciaId: number,
  funcionarioId: number,
  dia: number,
  turnoAnterior: Turno,
  turnoNovo: Turno,
  funcionarioTrocaId: number
) {
  const [created] = await db
    .insert(escalaTrocas)
    .values({
      competenciaId,
      funcionarioId,
      dia,
      turnoAnterior,
      turnoNovo,
      funcionarioTrocaId,
    })
    .returning();

  return mapEscalaTrocaRow(created);
}

function montarObservacoesPorTrocas(
  trocas: Array<{
    funcionarioId: number;
    dia: number;
    turnoAnterior: string;
    turnoNovo: string;
    funcionarioTrocaId: number;
    funcionarioTroca: { nome: string };
  }>
): Map<number, Record<number, string>> {
  const result = new Map<number, Record<number, string>>();

  for (const troca of trocas) {
    const diaParceiro =
      trocas.find(
        (p) =>
          p.funcionarioId === troca.funcionarioTrocaId &&
          p.funcionarioTrocaId === troca.funcionarioId
      )?.dia ?? troca.dia;

    const observacao = formatObservacaoTroca(
      troca.funcionarioTroca.nome,
      diaParceiro,
      troca.turnoAnterior,
      troca.turnoNovo
    );

    if (!result.has(troca.funcionarioId)) {
      result.set(troca.funcionarioId, {});
    }
    result.get(troca.funcionarioId)![troca.dia] = observacao;
  }

  return result;
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

export async function getGradeEscala(
  competenciaId: number,
  tipoEscalaParam?: TipoEscala
): Promise<GradeEscalaResponse | null> {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
    with: { setor: true },
  });

  if (!comp || !comp.setor) return null;

  const tipoEscala = tipoEscalaParam ?? (comp.tipo as TipoEscala) ?? 'tecnico';

  const totalDias = getDiasNoMes(comp.mes, comp.ano);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);

  const statusList = await listStatusPorSetorNoMes(comp.setorId!, comp.mes, comp.ano);

  const allFuncs = await db
    .select()
    .from(funcionarios)
    .where(and(eq(funcionarios.setorId, comp.setorId!), eq(funcionarios.ativo, true)))
    .orderBy(funcionarios.ordemEscala, funcionarios.nome);

  const funcs = allFuncs.filter((f) => pertenceTipoEscala(f.categoria ?? '', tipoEscala));
  const funcIds = new Set(funcs.map((f) => f.id));

  const registrosEscala = await db
    .select()
    .from(escalaInicios)
    .where(eq(escalaInicios.competenciaId, competenciaId));

  const trocasRegistradas = (
    await db.query.escalaTrocas.findMany({
      where: eq(escalaTrocas.competenciaId, competenciaId),
      with: { funcionarioTroca: true },
    })
  ).filter((t) => funcIds.has(t.funcionarioId));

  const iniciosPorFunc = new Map<number, EscalaInicio>();

  for (const row of registrosEscala) {
    const config = mapEscalaInicioRow(row);
    if (config) iniciosPorFunc.set(row.funcionarioId, config);
  }

  const turnosMesAnterior = await getTurnosMesAnterior(comp.setorId!, comp.mes, comp.ano, tipoEscala, funcs);
  const iniciosMesAnterior = await getIniciosMesAnterior(comp.setorId!, comp.mes, comp.ano, tipoEscala);
  const { mes: mesAnt, ano: anoAnt } = mesAnterior(comp.mes, comp.ano);
  const diasNoMesAnterior = getDiasNoMes(mesAnt, anoAnt);

  const observacoesPorFunc = montarObservacoesPorTrocas(trocasRegistradas);

  const funcionariosComTurnos = funcs.map((f) => {
    const observacoesDia = observacoesPorFunc.get(f.id);
    const escalaInicio = iniciosPorFunc.get(f.id);
    const statusPorDia = montarStatusPorDia(statusList, f.id, comp.mes, comp.ano, dias);
    const padrao = getPadraoEscala(f.categoria ?? 'TÉC. DE ENFERMAGEM');
    const overrides = montarOverridesPorTrocas(f.id, trocasRegistradas);
    let turnos = overrides;
    let turnosProjetados: Record<number, Turno> | undefined;
    if (padrao) {
      const result = montarTurnosFuncionario(
        padrao,
        dias,
        comp.mes,
        comp.ano,
        escalaInicio,
        iniciosMesAnterior.get(f.id),
        turnosMesAnterior.get(f.id),
        diasNoMesAnterior,
        overrides,
        statusPorDia
      );
      turnos = result.turnos;
      turnosProjetados = result.turnosProjetados;
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
    statusEspeciais: statusList.filter((se) =>
      pertenceTipoEscala(se.funcionario.categoria ?? '', tipoEscala)
    ),
    trocas: trocasRegistradas.map(mapEscalaTrocaRow),
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

  for (const item of items) {
    if (!item.definirInicio || !item.turno) continue;

    const func = await db.query.funcionarios.findFirst({
      where: eq(funcionarios.id, item.funcionarioId),
    });
    if (!func) continue;

    const padrao = getPadraoEscala(func.categoria ?? 'TÉC. DE ENFERMAGEM');
    if (!padrao) continue;

    const turno = normalizeTurno(item.turno);
    if (!turno) continue;

    await criarInicioAtivo(
      competenciaId,
      item.funcionarioId,
      comp.mes,
      comp.ano,
      turno,
      item.indicePadrao
    );
  }
}

export async function trocarEscalaDia(
  competenciaId: number,
  funcionarioIdOrigem: number,
  diaOrigem: number,
  funcionarioIdDestino: number,
  diaDestino: number,
  tipoEscala: TipoEscala = 'tecnico'
) {
  if (funcionarioIdOrigem === funcionarioIdDestino && diaOrigem === diaDestino) {
    throw new Error('Selecione uma célula diferente para a troca');
  }

  const grade = await getGradeEscala(competenciaId, tipoEscala);
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

  await removerTrocasCelula(competenciaId, funcionarioIdOrigem, diaOrigem);
  await removerTrocasCelula(competenciaId, funcionarioIdDestino, diaDestino);

  await registrarTrocaEscala(
    competenciaId,
    funcionarioIdOrigem,
    diaOrigem,
    turnoOrigem,
    turnoDestino,
    funcionarioIdDestino
  );

  await registrarTrocaEscala(
    competenciaId,
    funcionarioIdDestino,
    diaDestino,
    turnoDestino,
    turnoOrigem,
    funcionarioIdOrigem
  );

  return { success: true };
}

export async function zerarEscalaFuncionario(competenciaId: number, funcionarioId: number) {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (!comp) return false;

  await db
    .delete(escalaTrocas)
    .where(
      and(
        eq(escalaTrocas.competenciaId, competenciaId),
        or(
          eq(escalaTrocas.funcionarioId, funcionarioId),
          eq(escalaTrocas.funcionarioTrocaId, funcionarioId)
        )
      )
    );

  await removerInicio(competenciaId, funcionarioId);

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
    const tipo = (comp.tipo as TipoEscala) ?? 'tecnico';
    const grade = await getGradeEscala(comp.id, tipo);
    if (!grade) continue;

    const folgas: Array<{
      funcionarioId: number;
      nome: string;
      matricula: string;
      total: number;
    }> = [];

    for (const grupo of grade.grupos) {
      for (const func of grupo.funcionarios) {
        let total = 0;
        for (const dia of grade.dias) {
          if (getTurnoEfetivo(func, dia) === 'F') total++;
        }
        if (total > 0) {
          folgas.push({
            funcionarioId: func.id,
            nome: func.nome,
            matricula: func.matricula,
            total,
          });
        }
      }
    }

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
    const tipo = (comp.tipo as TipoEscala) ?? 'tecnico';
    const grade = await getGradeEscala(comp.id, tipo);
    if (!grade) continue;

    const porFunc = new Map<number, { nome: string; horas: number; contratado: string }>();
    for (const grupo of grade.grupos) {
      for (const func of grupo.funcionarios) {
        let horas = 0;
        for (const dia of grade.dias) {
          const turno = getTurnoEfetivo(func, dia);
          horas += HORAS_POR_TURNO[turno ?? ''] ?? 0;
        }
        porFunc.set(func.id, {
          nome: func.nome,
          horas,
          contratado: func.cargaHoraria ?? '180H',
        });
      }
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

export async function listSetoresPorTipoEscala(tipo: TipoEscala) {
  const allSetores = await db.select().from(setores).orderBy(setores.id);
  const allFuncs = await db
    .select({ setorId: funcionarios.setorId, categoria: funcionarios.categoria })
    .from(funcionarios)
    .where(eq(funcionarios.ativo, true));

  const setoresCom = new Set<number>();
  for (const f of allFuncs) {
    if (f.setorId != null && pertenceTipoEscala(f.categoria ?? '', tipo)) {
      setoresCom.add(f.setorId);
    }
  }

  return allSetores.filter((s) => setoresCom.has(s.id));
}

export async function listSetoresComTecnicosEnfermagem() {
  return listSetoresPorTipoEscala('tecnico');
}

export async function listSetoresComEnfermeiros() {
  return listSetoresPorTipoEscala('enfermeiro');
}

export async function findOrCreateCompetencia(
  mes: number,
  ano: number,
  setorId: number,
  tipo: TipoEscala = 'tecnico'
) {
  const existing = await db.query.competencias.findFirst({
    where: and(
      eq(competencias.mes, mes),
      eq(competencias.ano, ano),
      eq(competencias.setorId, setorId),
      eq(competencias.tipo, tipo)
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(competencias)
    .values({ mes, ano, setorId, tipo })
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
  competenciaId: number,
  tipoEscalaParam: TipoEscala = 'tecnico'
): Promise<SimularProximoMesResult> {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  if (!comp?.setorId) throw new Error('Competência não encontrada');

  const tipoEscala = (comp.tipo as TipoEscala) ?? tipoEscalaParam;
  const grade = await getGradeEscala(competenciaId, tipoEscala);
  if (!grade) throw new Error('Competência não encontrada');

  const { mes: proxMes, ano: proxAno } = mesSeguinte(comp.mes, comp.ano);
  const proxComp = await findOrCreateCompetencia(proxMes, proxAno, comp.setorId, tipoEscala);

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
      if (!escalaInicio) {
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
        proxMes,
        proxAno,
        turnoDia1,
        indiceDia1
      );

      processados++;
    }
  }

  if (processados > 0) {
    const MESES = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const label = tipoEscala === 'enfermeiro' ? 'enfermeiro(s)' : 'técnico(s)';
    const nota = `Simulação gerada a partir de ${MESES[comp.mes - 1]}/${comp.ano}: ${processados} ${label} com escala e grupo atualizados para ${MESES[proxMes - 1]}/${proxAno}.`;
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
