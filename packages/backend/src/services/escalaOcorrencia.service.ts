import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { competencias, escalaOcorrencias } from '../db/schema';
import type {
  EscalaOcorrencia,
  EscalaOcorrenciaRequest,
  TipoEscala,
  TipoOcorrenciaEscala,
  Turno,
} from '@escala/shared';
import { TIPOS_OCORRENCIA_ESCALA, isTurnoMtOuSn, validarTurnoPlantaoExtra } from '@escala/shared';
import { normalizeTurno } from '../utils/helpers';

function mapOcorrenciaRow(row: {
  id: number;
  competenciaId: number;
  funcionarioId: number;
  dia: number;
  tipo: string;
  turno: string | null;
  funcionarioVinculoId: number | null;
  observacao: string | null;
  createdAt: Date | null;
  funcionarioVinculo?: { id: number; nome: string; matricula: string } | null;
}): EscalaOcorrencia {
  return {
    id: row.id,
    competenciaId: row.competenciaId,
    funcionarioId: row.funcionarioId,
    dia: row.dia,
    tipo: row.tipo as TipoOcorrenciaEscala,
    turno: normalizeTurno(row.turno) ?? null,
    funcionarioVinculoId: row.funcionarioVinculoId,
    ...(row.funcionarioVinculo
      ? {
          funcionarioVinculo: {
            id: row.funcionarioVinculo.id,
            nome: row.funcionarioVinculo.nome,
            matricula: row.funcionarioVinculo.matricula,
          },
        }
      : {}),
    observacao: row.observacao,
    ...(row.createdAt ? { createdAt: row.createdAt.toISOString() } : {}),
  };
}

async function removerFaltaVinculadaCobertura(
  competenciaId: number,
  funcionarioFaltaId: number,
  dia: number,
  cobridorId: number
) {
  await db
    .delete(escalaOcorrencias)
    .where(
      and(
        eq(escalaOcorrencias.competenciaId, competenciaId),
        eq(escalaOcorrencias.funcionarioId, funcionarioFaltaId),
        eq(escalaOcorrencias.dia, dia),
        eq(escalaOcorrencias.tipo, 'FALTA'),
        eq(escalaOcorrencias.funcionarioVinculoId, cobridorId)
      )
    );
}

async function removerPlantaoExtraVinculadoFalta(
  competenciaId: number,
  cobridorId: number,
  dia: number,
  funcionarioFaltaId: number
) {
  await db
    .delete(escalaOcorrencias)
    .where(
      and(
        eq(escalaOcorrencias.competenciaId, competenciaId),
        eq(escalaOcorrencias.funcionarioId, cobridorId),
        eq(escalaOcorrencias.dia, dia),
        eq(escalaOcorrencias.tipo, 'PLANTAO_EXTRA'),
        eq(escalaOcorrencias.funcionarioVinculoId, funcionarioFaltaId)
      )
    );
}

async function removerOcorrenciaVinculada(existing: {
  competenciaId: number;
  funcionarioId: number;
  dia: number;
  tipo: string;
  funcionarioVinculoId: number | null;
}) {
  if (existing.funcionarioVinculoId == null) return;

  if (existing.tipo === 'PLANTAO_EXTRA') {
    await removerFaltaVinculadaCobertura(
      existing.competenciaId,
      existing.funcionarioVinculoId,
      existing.dia,
      existing.funcionarioId
    );
    return;
  }

  if (existing.tipo === 'FALTA') {
    await removerPlantaoExtraVinculadoFalta(
      existing.competenciaId,
      existing.funcionarioVinculoId,
      existing.dia,
      existing.funcionarioId
    );
  }
}

async function getEmpresaIdFromCompetencia(competenciaId: number): Promise<string> {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
    columns: { empresaId: true },
  });
  if (!comp) throw new Error('Competência não encontrada');
  return comp.empresaId;
}

async function getTipoEscalaCompetencia(competenciaId: number): Promise<TipoEscala> {
  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
  });
  return comp?.tipo === 'enfermeiro' ? 'enfermeiro' : 'tecnico';
}

async function sincronizarPlantaoExtraParaFalta(
  data: EscalaOcorrenciaRequest,
  turno: Turno,
  cobridorAnterior: number | null
) {
  const funcionarioFaltaId = data.funcionarioId;
  const novoCobridor = data.funcionarioVinculoId ?? null;

  if (cobridorAnterior && cobridorAnterior !== novoCobridor) {
    await removerPlantaoExtraVinculadoFalta(
      data.competenciaId,
      cobridorAnterior,
      data.dia,
      funcionarioFaltaId
    );
  }

  if (!novoCobridor) return;

  const tipoEscala = await getTipoEscalaCompetencia(data.competenciaId);
  const { resolverTurnoFuncionarioDia } = await import('./escala.service');
  const turnoCobridor = await resolverTurnoFuncionarioDia(
    data.competenciaId,
    novoCobridor,
    data.dia,
    tipoEscala
  );

  if (turnoCobridor === turno) {
    throw new Error('Quem cobre não pode possuir este turno na escala do dia');
  }

  const erroExtra = validarTurnoPlantaoExtra(turnoCobridor, turno);
  if (erroExtra) throw new Error(erroExtra);

  const ocorrenciaCobridor = await db.query.escalaOcorrencias.findFirst({
    where: and(
      eq(escalaOcorrencias.competenciaId, data.competenciaId),
      eq(escalaOcorrencias.funcionarioId, novoCobridor),
      eq(escalaOcorrencias.dia, data.dia)
    ),
  });

  if (ocorrenciaCobridor?.tipo === 'FALTA') {
    throw new Error('O funcionário selecionado já possui falta registrada neste dia');
  }

  await db
    .delete(escalaOcorrencias)
    .where(
      and(
        eq(escalaOcorrencias.competenciaId, data.competenciaId),
        eq(escalaOcorrencias.funcionarioId, novoCobridor),
        eq(escalaOcorrencias.dia, data.dia)
      )
    );

  await db.insert(escalaOcorrencias).values({
    empresaId: await getEmpresaIdFromCompetencia(data.competenciaId),
    competenciaId: data.competenciaId,
    funcionarioId: novoCobridor,
    dia: data.dia,
    tipo: 'PLANTAO_EXTRA',
    turno,
    funcionarioVinculoId: funcionarioFaltaId,
    observacao: data.observacao?.trim() || null,
  });
}

async function sincronizarFaltaPlantaoExtra(
  data: EscalaOcorrenciaRequest,
  turno: Turno,
  vinculoAnterior: number | null
) {
  const cobridorId = data.funcionarioId;
  const novoVinculo = data.funcionarioVinculoId ?? null;

  if (vinculoAnterior && vinculoAnterior !== novoVinculo) {
    await removerFaltaVinculadaCobertura(
      data.competenciaId,
      vinculoAnterior,
      data.dia,
      cobridorId
    );
  }

  if (!novoVinculo) return;

  const tipoEscala = await getTipoEscalaCompetencia(data.competenciaId);
  const { resolverTurnoFuncionarioDia } = await import('./escala.service');
  const turnoVinculo = await resolverTurnoFuncionarioDia(
    data.competenciaId,
    novoVinculo,
    data.dia,
    tipoEscala
  );

  if (turnoVinculo !== turno) {
    throw new Error('O funcionário selecionado não possui este turno na escala do dia');
  }

  const ocorrenciaVinculo = await db.query.escalaOcorrencias.findFirst({
    where: and(
      eq(escalaOcorrencias.competenciaId, data.competenciaId),
      eq(escalaOcorrencias.funcionarioId, novoVinculo),
      eq(escalaOcorrencias.dia, data.dia)
    ),
  });

  if (ocorrenciaVinculo?.tipo === 'PLANTAO_EXTRA') {
    throw new Error('O funcionário selecionado já possui plantão extra neste dia');
  }

  await db
    .delete(escalaOcorrencias)
    .where(
      and(
        eq(escalaOcorrencias.competenciaId, data.competenciaId),
        eq(escalaOcorrencias.funcionarioId, novoVinculo),
        eq(escalaOcorrencias.dia, data.dia)
      )
    );

  await db.insert(escalaOcorrencias).values({
    empresaId: await getEmpresaIdFromCompetencia(data.competenciaId),
    competenciaId: data.competenciaId,
    funcionarioId: novoVinculo,
    dia: data.dia,
    tipo: 'FALTA',
    turno,
    funcionarioVinculoId: cobridorId,
    observacao: data.observacao?.trim() || null,
  });
}

export async function listOcorrenciasPorCompetencia(
  competenciaId: number
): Promise<EscalaOcorrencia[]> {
  const rows = await db.query.escalaOcorrencias.findMany({
    where: eq(escalaOcorrencias.competenciaId, competenciaId),
    with: { funcionarioVinculo: true },
  });
  return rows.map(mapOcorrenciaRow);
}

function montarOcorrenciasPorFuncionario(
  ocorrencias: EscalaOcorrencia[]
): Map<number, Record<number, EscalaOcorrencia>> {
  const map = new Map<number, Record<number, EscalaOcorrencia>>();
  for (const o of ocorrencias) {
    if (!map.has(o.funcionarioId)) map.set(o.funcionarioId, {});
    map.get(o.funcionarioId)![o.dia] = o;
  }
  return map;
}

export function getOcorrenciasPorFuncionarioMap(
  ocorrencias: EscalaOcorrencia[]
): Map<number, Record<number, EscalaOcorrencia>> {
  return montarOcorrenciasPorFuncionario(ocorrencias);
}

export async function salvarOcorrenciaEscala(
  data: EscalaOcorrenciaRequest
): Promise<EscalaOcorrencia> {
  if (!TIPOS_OCORRENCIA_ESCALA.includes(data.tipo)) {
    throw new Error('Tipo de ocorrência inválido');
  }

  const turno = data.turno ? normalizeTurno(data.turno) : null;
  if (!turno || (turno !== 'MT' && turno !== 'SN')) {
    throw new Error('Turno deve ser MT ou SN');
  }

  const turnoBase = data.turnoBase ? normalizeTurno(data.turnoBase) : null;

  if (data.tipo === 'FALTA') {
    if (!isTurnoMtOuSn(turnoBase)) {
      throw new Error('Falta só pode ser registrada em dias com turno MT ou SN na escala');
    }
  }

  if (data.tipo === 'PLANTAO_EXTRA') {
    const erro = validarTurnoPlantaoExtra(turnoBase, turno);
    if (erro) throw new Error(erro);
  }

  const existente = await db.query.escalaOcorrencias.findFirst({
    where: and(
      eq(escalaOcorrencias.competenciaId, data.competenciaId),
      eq(escalaOcorrencias.funcionarioId, data.funcionarioId),
      eq(escalaOcorrencias.dia, data.dia)
    ),
  });

  const vinculoAnterior = existente?.funcionarioVinculoId ?? null;
  const eraPlantaoExtra = existente?.tipo === 'PLANTAO_EXTRA';
  const eraFalta = existente?.tipo === 'FALTA';

  await db
    .delete(escalaOcorrencias)
    .where(
      and(
        eq(escalaOcorrencias.competenciaId, data.competenciaId),
        eq(escalaOcorrencias.funcionarioId, data.funcionarioId),
        eq(escalaOcorrencias.dia, data.dia)
      )
    );

  if (data.tipo === 'PLANTAO_EXTRA' && !data.funcionarioVinculoId && eraPlantaoExtra && vinculoAnterior) {
    await removerFaltaVinculadaCobertura(
      data.competenciaId,
      vinculoAnterior,
      data.dia,
      data.funcionarioId
    );
  }

  if (data.tipo === 'FALTA' && !data.funcionarioVinculoId && eraFalta && vinculoAnterior) {
    await removerPlantaoExtraVinculadoFalta(
      data.competenciaId,
      vinculoAnterior,
      data.dia,
      data.funcionarioId
    );
  }

  const empresaId = await getEmpresaIdFromCompetencia(data.competenciaId);

  const [created] = await db
    .insert(escalaOcorrencias)
    .values({
      empresaId,
      competenciaId: data.competenciaId,
      funcionarioId: data.funcionarioId,
      dia: data.dia,
      tipo: data.tipo,
      turno: turno ?? null,
      funcionarioVinculoId: data.funcionarioVinculoId ?? null,
      observacao: data.observacao?.trim() || null,
    })
    .returning();

  if (data.tipo === 'PLANTAO_EXTRA') {
    await sincronizarFaltaPlantaoExtra(
      data,
      turno,
      eraPlantaoExtra ? vinculoAnterior : null
    );
  }

  if (data.tipo === 'FALTA') {
    await sincronizarPlantaoExtraParaFalta(data, turno, eraFalta ? vinculoAnterior : null);
  }

  const row = await db.query.escalaOcorrencias.findFirst({
    where: eq(escalaOcorrencias.id, created.id),
    with: { funcionarioVinculo: true },
  });

  if (!row) throw new Error('Erro ao salvar ocorrência');
  return mapOcorrenciaRow(row);
}

export async function removerOcorrenciaEscala(id: number): Promise<boolean> {
  const existing = await db.query.escalaOcorrencias.findFirst({
    where: eq(escalaOcorrencias.id, id),
  });
  if (!existing) return false;

  const [deleted] = await db
    .delete(escalaOcorrencias)
    .where(eq(escalaOcorrencias.id, id))
    .returning();

  await removerOcorrenciaVinculada(deleted);

  return true;
}

export function formatObservacaoOcorrencia(
  tipo: TipoOcorrenciaEscala,
  turno: Turno | null | undefined,
  nomeVinculo?: string
): string {
  if (tipo === 'FALTA') {
    const base = turno ? `Falta no turno ${turno}` : 'Falta registrada';
    return nomeVinculo ? `${base} — coberto por ${nomeVinculo}` : base;
  }
  const base = turno ? `Plantão extra (${turno})` : 'Plantão extra';
  return nomeVinculo ? `${base} — vinculado a ${nomeVinculo}` : base;
}
