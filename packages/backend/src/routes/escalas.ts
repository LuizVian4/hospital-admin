import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { competencias, escalaOcorrencias, statusEspeciais } from '../db/schema';
import {
  getGradeEscala,
  batchUpdateEscalaDias,
  trocarEscalaDia,
  zerarEscalaFuncionario,
  getRelatorioFolgas,
  getRelatorioCargaHoraria,
  simularProximoMes,
  removerTrocaCelula,
} from '../services/escala.service';
import { exportEscalaExcel, exportEscalaMesCompletoExcel } from '../services/exportacao.service';
import {
  criarStatusEspecial,
  listStatusPorFuncionario,
  listStatusPorSetorNoMes,
  removerStatusEspecial,
} from '../services/statusEspecial.service';
import {
  removerOcorrenciaEscala,
  salvarOcorrenciaEscala,
} from '../services/escalaOcorrencia.service';
import {
  syncBancoHorasAfetadosPorStatus,
  invalidateAndSyncBancoHorasCompetencia,
} from '../services/bancoHoras.service';
import { STATUS_ESPECIAIS_OPCOES, TIPOS_OCORRENCIA_ESCALA, type StatusEspecial, type TipoEscala } from '@escala/shared';
import { requireEmpresaId } from '../plugins/empresa';
import type { FastifyRequest } from 'fastify';
import { assertCompetenciaEmpresa } from '../services/empresa.service';

async function ensureCompetenciaAccess(request: FastifyRequest, competenciaId: number) {
  await assertCompetenciaEmpresa(competenciaId, requireEmpresaId(request));
}

const escalaDiaBatchSchema = z.object({
  competenciaId: z.number().int(),
  items: z.array(
    z.object({
      funcionarioId: z.number().int(),
      dia: z.number().int().min(1).max(31),
      turno: z.string().nullable(),
      definirInicio: z.boolean().optional(),
      indicePadrao: z.number().int().min(0).max(4).optional(),
    })
  ),
});

const observacoesSchema = z.object({
  observacoes: z.string(),
});

const trocaEscalaSchema = z.object({
  funcionarioIdOrigem: z.number().int(),
  diaOrigem: z.number().int().min(1).max(31),
  funcionarioIdDestino: z.number().int(),
  diaDestino: z.number().int().min(1).max(31),
});

const statusEspecialSchema = z
  .object({
    funcionarioId: z.number().int(),
    status: z.enum(STATUS_ESPECIAIS_OPCOES as [string, ...string[]]),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    competenciaId: z.number().int().optional(),
  })
  .refine((data) => data.dataFim >= data.dataInicio, {
    message: 'A data de fim deve ser igual ou posterior à data de início',
    path: ['dataFim'],
  });

const escalaOcorrenciaSchema = z.object({
  competenciaId: z.number().int(),
  funcionarioId: z.number().int(),
  dia: z.number().int().min(1).max(31),
  tipo: z.enum(TIPOS_OCORRENCIA_ESCALA as [string, ...string[]]),
  turno: z.enum(['MT', 'SN']),
  funcionarioVinculoId: z.number().int().nullable().optional(),
  observacao: z.string().nullable().optional(),
  turnoBase: z.string().nullable().optional(),
});

function parseTipoEscala(value?: string): TipoEscala {
  return value === 'enfermeiro' ? 'enfermeiro' : 'tecnico';
}

export const escalasRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { id: string }; Querystring: { tipo?: string } }>(
    '/api/competencias/:id',
    async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const tipo = parseTipoEscala(request.query.tipo);
    try {
      await ensureCompetenciaAccess(request, id);
    } catch {
      return reply.status(404).send({ error: 'Competência não encontrada' });
    }
    const grade = await getGradeEscala(id, tipo);
    if (!grade) return reply.status(404).send({ error: 'Competência não encontrada' });
    return grade;
  });

  app.get<{ Params: { id: string }; Querystring: { tipo?: string } }>(
    '/api/competencias/:id/escala',
    async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const tipo = parseTipoEscala(request.query.tipo);
    try {
      await ensureCompetenciaAccess(request, id);
    } catch {
      return reply.status(404).send({ error: 'Competência não encontrada' });
    }
    const grade = await getGradeEscala(id, tipo);
    if (!grade) return reply.status(404).send({ error: 'Competência não encontrada' });
    return grade;
  });

  app.get<{ Params: { id: string }; Querystring: { tipo?: string } }>(
    '/api/competencias/:id/escala/export',
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const tipo = parseTipoEscala(request.query.tipo);
      const result = await exportEscalaExcel(id, tipo);
      if (!result) return reply.status(404).send({ error: 'Competência não encontrada' });

      return reply
        .header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .header('Content-Disposition', `attachment; filename="${result.filename}"`)
        .send(result.buffer);
    }
  );

  app.get<{ Params: { mes: string; ano: string }; Querystring: { tipo?: string } }>(
    '/api/escala/export/:mes/:ano',
    async (request, reply) => {
      const empresaId = requireEmpresaId(request);
      const mes = parseInt(request.params.mes, 10);
      const ano = parseInt(request.params.ano, 10);
      const tipo = parseTipoEscala(request.query.tipo);
      const result = await exportEscalaMesCompletoExcel(empresaId, mes, ano, tipo);
      if (!result) {
        return reply.status(404).send({ error: 'Nenhuma competência encontrada para o período' });
      }

      return reply
        .header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .header('Content-Disposition', `attachment; filename="${result.filename}"`)
        .send(result.buffer);
    }
  );

  app.put<{ Params: { id: string } }>(
    '/api/competencias/:id/observacoes',
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const body = observacoesSchema.parse(request.body);

      const [updated] = await db
        .update(competencias)
        .set({ observacoes: body.observacoes })
        .where(eq(competencias.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: 'Competência não encontrada' });
      return updated;
    }
  );

  app.post<{ Params: { id: string }; Querystring: { tipo?: string } }>(
    '/api/competencias/:id/simular-proximo-mes',
    async (request, reply) => {
      const competenciaId = parseInt(request.params.id, 10);
      const tipo = parseTipoEscala(request.query.tipo);

      try {
        const result = await simularProximoMes(competenciaId, tipo);
        await invalidateAndSyncBancoHorasCompetencia(result.competenciaId, {
          grade: result.grade,
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao simular próximo mês';
        return reply.status(400).send({ error: message });
      }
    }
  );

  app.put('/api/escala-dias', async (request) => {
    const body = escalaDiaBatchSchema.parse(request.body);
    const grade = await batchUpdateEscalaDias(body.competenciaId, body.items);
    await invalidateAndSyncBancoHorasCompetencia(body.competenciaId, { grade: grade ?? undefined });
    return { success: true, updated: body.items.length, grade };
  });

  app.post('/api/escala-ocorrencias', async (request, reply) => {
    const body = escalaOcorrenciaSchema.parse(request.body);
    try {
      const created = await salvarOcorrenciaEscala({
        ...body,
        tipo: body.tipo as 'PLANTAO_EXTRA' | 'FALTA',
      });
      const grade = await getGradeEscala(body.competenciaId);
      await invalidateAndSyncBancoHorasCompetencia(body.competenciaId, { grade: grade ?? undefined });
      return reply.status(201).send({ ocorrencia: created, grade });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar ocorrência';
      return reply.status(400).send({ error: message });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/escala-ocorrencias/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const existing = await db.query.escalaOcorrencias.findFirst({
      where: eq(escalaOcorrencias.id, id),
    });
    const ok = await removerOcorrenciaEscala(id);
    if (!ok) return reply.status(404).send({ error: 'Ocorrência não encontrada' });
    if (existing) {
      const grade = await getGradeEscala(existing.competenciaId);
      await invalidateAndSyncBancoHorasCompetencia(existing.competenciaId, {
        grade: grade ?? undefined,
      });
      return { success: true, grade };
    }
    return { success: true };
  });

  app.delete<{ Params: { id: string; funcionarioId: string } }>(
    '/api/competencias/:id/escala/:funcionarioId',
    async (request, reply) => {
      const competenciaId = parseInt(request.params.id, 10);
      const funcionarioId = parseInt(request.params.funcionarioId, 10);

      const grade = await zerarEscalaFuncionario(competenciaId, funcionarioId);
      if (!grade) return reply.status(404).send({ error: 'Competência não encontrada' });
      await invalidateAndSyncBancoHorasCompetencia(competenciaId, { grade });
      return { success: true, grade };
    }
  );

  app.post<{ Params: { id: string }; Querystring: { tipo?: string } }>(
    '/api/competencias/:id/troca',
    async (request, reply) => {
      const competenciaId = parseInt(request.params.id, 10);
      const tipo = parseTipoEscala(request.query.tipo);
      const body = trocaEscalaSchema.parse(request.body);

      try {
        const result = await trocarEscalaDia(
          competenciaId,
          body.funcionarioIdOrigem,
          body.diaOrigem,
          body.funcionarioIdDestino,
          body.diaDestino,
          tipo
        );
        await invalidateAndSyncBancoHorasCompetencia(competenciaId, { grade: result.grade });
        return { success: result.success, grade: result.grade };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao realizar troca';
        return reply.status(400).send({ error: message });
      }
    }
  );

  app.delete<{ Params: { id: string; funcionarioId: string; dia: string } }>(
    '/api/competencias/:id/troca/:funcionarioId/:dia',
    async (request, reply) => {
      const competenciaId = parseInt(request.params.id, 10);
      const funcionarioId = parseInt(request.params.funcionarioId, 10);
      const dia = parseInt(request.params.dia, 10);

      const comp = await db.query.competencias.findFirst({
        where: eq(competencias.id, competenciaId),
      });
      if (!comp) return reply.status(404).send({ error: 'Competência não encontrada' });

      const grade = await removerTrocaCelula(
        competenciaId,
        funcionarioId,
        dia,
        comp.tipo as TipoEscala
      );
      await invalidateAndSyncBancoHorasCompetencia(competenciaId, { grade: grade ?? undefined });
      return { success: true, grade };
    }
  );

  app.get<{ Params: { competencia_id: string } }>(
    '/api/status-especiais/:competencia_id',
    async (request) => {
      const competenciaId = parseInt(request.params.competencia_id, 10);
      const comp = await db.query.competencias.findFirst({
        where: eq(competencias.id, competenciaId),
      });
      if (!comp?.setorId) return [];

      return listStatusPorSetorNoMes(comp.setorId, comp.mes, comp.ano, comp.empresaId);
    }
  );

  app.post('/api/status-especiais', async (request, reply) => {
    const body = statusEspecialSchema.parse(request.body);
    try {
      const created = await criarStatusEspecial({
        ...body,
        status: body.status as StatusEspecial,
      });
      await syncBancoHorasAfetadosPorStatus(
        body.funcionarioId,
        body.dataInicio,
        body.dataFim,
        body.competenciaId
      );
      return reply.status(201).send(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar status especial';
      return reply.status(400).send({ error: message });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/status-especiais/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const existing = await db.query.statusEspeciais.findFirst({
      where: eq(statusEspeciais.id, id),
    });
    const ok = await removerStatusEspecial(id);
    if (!ok) return reply.status(404).send({ error: 'Status especial não encontrado' });
    if (existing?.dataInicio && existing.dataFim) {
      await syncBancoHorasAfetadosPorStatus(
        existing.funcionarioId,
        existing.dataInicio,
        existing.dataFim,
        existing.competenciaId
      );
    }
    return { success: true };
  });

  app.get<{
    Querystring: { mes: string; ano: string; setorId?: string };
  }>('/api/relatorios/folgas-mes', async (request) => {
    const empresaId = requireEmpresaId(request);
    const mes = parseInt(request.query.mes, 10);
    const ano = parseInt(request.query.ano, 10);
    const setorId = request.query.setorId ? parseInt(request.query.setorId, 10) : undefined;
    return getRelatorioFolgas(empresaId, mes, ano, setorId);
  });

  app.get<{
    Querystring: { mes: string; ano: string };
  }>('/api/relatorios/carga-horaria', async (request) => {
    const empresaId = requireEmpresaId(request);
    const mes = parseInt(request.query.mes, 10);
    const ano = parseInt(request.query.ano, 10);
    return getRelatorioCargaHoraria(empresaId, mes, ano);
  });
};
