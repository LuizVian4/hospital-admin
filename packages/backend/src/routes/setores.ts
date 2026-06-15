import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { setores, competencias } from '../db/schema';
import { findOrCreateCompetencia } from '../services/escala.service';
import { getDashboardData } from '../services/dashboard.service';

const setorSchema = z.object({
  nome: z.string().min(1),
  empresa: z.string().optional(),
  gerente: z.string().optional(),
});

const competenciaSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000),
});

export const setoresRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/setores', async () => {
    return db.select().from(setores).orderBy(setores.nome);
  });

  app.post('/api/setores', async (request, reply) => {
    const body = setorSchema.parse(request.body);
    try {
      const [created] = await db.insert(setores).values(body).returning();
      return reply.status(201).send(created);
    } catch {
      return reply.status(409).send({ error: 'Setor já existe' });
    }
  });

  app.put<{ Params: { id: string } }>('/api/setores/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const body = setorSchema.parse(request.body);

    try {
      const [updated] = await db
        .update(setores)
        .set(body)
        .where(eq(setores.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: 'Setor não encontrado' });
      return updated;
    } catch {
      return reply.status(409).send({ error: 'Já existe um setor com este nome' });
    }
  });

  app.get('/api/dashboard', async () => getDashboardData());

  app.get<{ Params: { id: string } }>('/api/setores/:id/funcionarios', async (request) => {
    const id = parseInt(request.params.id, 10);
    return db.query.funcionarios.findMany({
      where: (f, { eq }) => eq(f.setorId, id),
      orderBy: (f, { asc }) => [asc(f.ordemEscala), asc(f.nome)],
    });
  });

  app.post<{ Params: { id: string } }>('/api/setores/:id/competencias', async (request, reply) => {
    const setorId = parseInt(request.params.id, 10);
    const body = competenciaSchema.parse(request.body);

    const existing = await db.query.competencias.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.mes, body.mes), eq(c.ano, body.ano), eq(c.setorId, setorId)),
    });

    if (existing) {
      return reply.status(409).send({
        error: `Competência ${body.mes}/${body.ano} já existe para este setor`,
        competenciaId: existing.id,
      });
    }

    const comp = await findOrCreateCompetencia(body.mes, body.ano, setorId);
    return reply.status(201).send(comp);
  });

  app.get<{
    Params: { id: string };
    Querystring: { mes?: string; ano?: string };
  }>('/api/setores/:id/competencias', async (request, reply) => {
    const setorId = parseInt(request.params.id, 10);
    const mes = request.query.mes ? parseInt(request.query.mes, 10) : undefined;
    const ano = request.query.ano ? parseInt(request.query.ano, 10) : undefined;

    if (mes !== undefined && ano !== undefined) {
      const comp = await db.query.competencias.findFirst({
        where: (c, { and, eq }) =>
          and(eq(c.mes, mes), eq(c.ano, ano), eq(c.setorId, setorId)),
      });

      if (!comp) return reply.status(404).send({ error: 'Competência não encontrada' });
      return comp;
    }

    return db
      .select({
        id: competencias.id,
        mes: competencias.mes,
        ano: competencias.ano,
        setorId: competencias.setorId,
        observacoes: competencias.observacoes,
      })
      .from(competencias)
      .where(eq(competencias.setorId, setorId))
      .orderBy(desc(competencias.ano), desc(competencias.mes));
  });
};
