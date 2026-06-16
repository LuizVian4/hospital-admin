import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { escalaOcorrencias } from '../db/schema';
import type { EscalaOcorrencia, EscalaOcorrenciaRequest, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import { TIPOS_OCORRENCIA_ESCALA, validarTurnoPlantaoExtra } from '@escala/shared';
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

  if (data.tipo === 'PLANTAO_EXTRA') {
    const turnoBase = data.turnoBase ? normalizeTurno(data.turnoBase) : null;
    const erro = validarTurnoPlantaoExtra(turnoBase, turno);
    if (erro) throw new Error(erro);
  }

  await db
    .delete(escalaOcorrencias)
    .where(
      and(
        eq(escalaOcorrencias.competenciaId, data.competenciaId),
        eq(escalaOcorrencias.funcionarioId, data.funcionarioId),
        eq(escalaOcorrencias.dia, data.dia)
      )
    );

  const [created] = await db
    .insert(escalaOcorrencias)
    .values({
      competenciaId: data.competenciaId,
      funcionarioId: data.funcionarioId,
      dia: data.dia,
      tipo: data.tipo,
      turno: turno ?? null,
      funcionarioVinculoId: data.funcionarioVinculoId ?? null,
      observacao: data.observacao?.trim() || null,
    })
    .returning();

  const row = await db.query.escalaOcorrencias.findFirst({
    where: eq(escalaOcorrencias.id, created.id),
    with: { funcionarioVinculo: true },
  });

  if (!row) throw new Error('Erro ao salvar ocorrência');
  return mapOcorrenciaRow(row);
}

export async function removerOcorrenciaEscala(id: number): Promise<boolean> {
  const [deleted] = await db
    .delete(escalaOcorrencias)
    .where(eq(escalaOcorrencias.id, id))
    .returning();
  return !!deleted;
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
