import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { competencias, escalaDias } from '../db/schema';
import {
  getGradeEscala,
  batchUpdateEscalaDias,
  trocarEscalaDia,
  zerarEscalaFuncionario,
  getRelatorioFolgas,
  getRelatorioCargaHoraria,
} from '../services/escala.service';
import { exportEscalaExcel } from '../services/exportacao.service';
import {
  criarStatusEspecial,
  listStatusPorFuncionario,
  listStatusPorSetorNoMes,
  removerStatusEspecial,
} from '../services/statusEspecial.service';
import { STATUS_ESPECIAIS_OPCOES, type StatusEspecial } from '@escala/shared';

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

const escalaDiaSchema = z.object({
  turno: z.string().nullable(),
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

export const escalasRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { id: string } }>('/api/competencias/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const grade = await getGradeEscala(id);
    if (!grade) return reply.status(404).send({ error: 'Competência não encontrada' });
    return grade;
  });

  app.get<{ Params: { id: string } }>('/api/competencias/:id/escala', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const grade = await getGradeEscala(id);
    if (!grade) return reply.status(404).send({ error: 'Competência não encontrada' });
    return grade;
  });

  app.get<{ Params: { id: string } }>(
    '/api/competencias/:id/escala/export',
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const result = await exportEscalaExcel(id);
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

  app.put('/api/escala-dias', async (request) => {
    const body = escalaDiaBatchSchema.parse(request.body);
    await batchUpdateEscalaDias(body.competenciaId, body.items);
    return { success: true, updated: body.items.length };
  });

  app.delete<{ Params: { id: string; funcionarioId: string } }>(
    '/api/competencias/:id/escala/:funcionarioId',
    async (request, reply) => {
      const competenciaId = parseInt(request.params.id, 10);
      const funcionarioId = parseInt(request.params.funcionarioId, 10);

      const ok = await zerarEscalaFuncionario(competenciaId, funcionarioId);
      if (!ok) return reply.status(404).send({ error: 'Competência não encontrada' });
      return { success: true };
    }
  );

  app.post<{ Params: { id: string } }>(
    '/api/competencias/:id/troca',
    async (request, reply) => {
      const competenciaId = parseInt(request.params.id, 10);
      const body = trocaEscalaSchema.parse(request.body);

      try {
        const result = await trocarEscalaDia(
          competenciaId,
          body.funcionarioIdOrigem,
          body.diaOrigem,
          body.funcionarioIdDestino,
          body.diaDestino
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao realizar troca';
        return reply.status(400).send({ error: message });
      }
    }
  );

  app.put<{ Params: { id: string } }>('/api/escala-dias/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const body = escalaDiaSchema.parse(request.body);

    const [updated] = await db
      .update(escalaDias)
      .set({ turno: body.turno })
      .where(eq(escalaDias.id, id))
      .returning();

    if (!updated) return reply.status(404).send({ error: 'Registro não encontrado' });
    return updated;
  });

  app.get<{ Params: { competencia_id: string } }>(
    '/api/status-especiais/:competencia_id',
    async (request) => {
      const competenciaId = parseInt(request.params.competencia_id, 10);
      const comp = await db.query.competencias.findFirst({
        where: eq(competencias.id, competenciaId),
      });
      if (!comp?.setorId) return [];

      return listStatusPorSetorNoMes(comp.setorId, comp.mes, comp.ano);
    }
  );

  app.post('/api/status-especiais', async (request, reply) => {
    const body = statusEspecialSchema.parse(request.body);
    try {
      const created = await criarStatusEspecial({
        ...body,
        status: body.status as StatusEspecial,
      });
      return reply.status(201).send(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar status especial';
      return reply.status(400).send({ error: message });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/status-especiais/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const ok = await removerStatusEspecial(id);
    if (!ok) return reply.status(404).send({ error: 'Status especial não encontrado' });
    return { success: true };
  });

  app.get<{
    Querystring: { mes: string; ano: string; setorId?: string };
  }>('/api/relatorios/folgas-mes', async (request) => {
    const mes = parseInt(request.query.mes, 10);
    const ano = parseInt(request.query.ano, 10);
    const setorId = request.query.setorId ? parseInt(request.query.setorId, 10) : undefined;
    return getRelatorioFolgas(mes, ano, setorId);
  });

  app.get<{
    Querystring: { mes: string; ano: string };
  }>('/api/relatorios/carga-horaria', async (request) => {
    const mes = parseInt(request.query.mes, 10);
    const ano = parseInt(request.query.ano, 10);
    return getRelatorioCargaHoraria(mes, ano);
  });
};
