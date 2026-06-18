import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { setores, competencias } from '../db/schema';
import {
  findOrCreateCompetencia,
  listSetoresComEnfermeiros,
  listSetoresComTecnicosEnfermagem,
} from '../services/escala.service';
import { getDashboardData } from '../services/dashboard.service';
import { assertSetorEmpresa, assertSetorNomeDisponivel } from '../services/empresa.service';
import { requireEmpresaId } from '../plugins/empresa';
import type { TipoEscala } from '@escala/shared';

const setorSchema = z.object({
  nome: z.string().trim().min(1),
  empresa: z.string().optional(),
  gerente: z.string().optional(),
});

const competenciaSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000),
  tipo: z.enum(['tecnico', 'enfermeiro']).optional(),
});

function parseTipoEscala(value?: string): TipoEscala {
  return value === 'enfermeiro' ? 'enfermeiro' : 'tecnico';
}

export const setoresRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { comTecnicos?: string; comEnfermeiros?: string } }>('/api/setores', async (request) => {
    const empresaId = requireEmpresaId(request);

    if (request.query.comTecnicos === 'true') {
      return listSetoresComTecnicosEnfermagem(empresaId);
    }
    if (request.query.comEnfermeiros === 'true') {
      return listSetoresComEnfermeiros(empresaId);
    }
    return db
      .select()
      .from(setores)
      .where(eq(setores.empresaId, empresaId))
      .orderBy(setores.id);
  });

  app.post('/api/setores', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const body = setorSchema.parse(request.body);

    try {
      await assertSetorNomeDisponivel(empresaId, body.nome);
    } catch (error) {
      if (error instanceof Error && error.message === 'SETOR_NOME_DUPLICADO') {
        return reply.status(409).send({ error: 'Já existe um setor com este nome nesta empresa' });
      }
      throw error;
    }

    try {
      const [created] = await db.insert(setores).values({ ...body, empresaId }).returning();
      return reply.status(201).send(created);
    } catch {
      return reply.status(409).send({ error: 'Já existe um setor com este nome nesta empresa' });
    }
  });

  app.put<{ Params: { id: string } }>('/api/setores/:id', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const id = parseInt(request.params.id, 10);
    const body = setorSchema.parse(request.body);

    try {
      await assertSetorEmpresa(id, empresaId);
    } catch {
      return reply.status(404).send({ error: 'Setor não encontrado' });
    }

    try {
      await assertSetorNomeDisponivel(empresaId, body.nome, id);
    } catch (error) {
      if (error instanceof Error && error.message === 'SETOR_NOME_DUPLICADO') {
        return reply.status(409).send({ error: 'Já existe um setor com este nome nesta empresa' });
      }
      throw error;
    }

    try {
      const [updated] = await db
        .update(setores)
        .set(body)
        .where(and(eq(setores.id, id), eq(setores.empresaId, empresaId)))
        .returning();

      if (!updated) return reply.status(404).send({ error: 'Setor não encontrado' });
      return updated;
    } catch {
      return reply.status(409).send({ error: 'Já existe um setor com este nome nesta empresa' });
    }
  });

  app.get('/api/dashboard', async (request) => {
    const empresaId = requireEmpresaId(request);
    return getDashboardData(empresaId);
  });

  app.get<{ Params: { id: string } }>('/api/setores/:id/funcionarios', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const id = parseInt(request.params.id, 10);

    try {
      await assertSetorEmpresa(id, empresaId);
    } catch {
      return reply.status(404).send({ error: 'Setor não encontrado' });
    }

    return db.query.funcionarios.findMany({
      where: (f, { and, eq }) => and(eq(f.setorId, id), eq(f.empresaId, empresaId)),
      orderBy: (f, { asc }) => [asc(f.ordemEscala), asc(f.nome)],
    });
  });

  app.post<{ Params: { id: string } }>('/api/setores/:id/competencias', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const setorId = parseInt(request.params.id, 10);
    const body = competenciaSchema.parse(request.body);
    const tipo = body.tipo ?? 'tecnico';

    try {
      await assertSetorEmpresa(setorId, empresaId);
    } catch {
      return reply.status(404).send({ error: 'Setor não encontrado' });
    }

    const existing = await db.query.competencias.findFirst({
      where: (c, { and, eq }) =>
        and(
          eq(c.mes, body.mes),
          eq(c.ano, body.ano),
          eq(c.setorId, setorId),
          eq(c.tipo, tipo),
          eq(c.empresaId, empresaId)
        ),
    });

    if (existing) {
      return reply.status(409).send({
        error: `Competência ${body.mes}/${body.ano} já existe para este setor (${tipo})`,
        competenciaId: existing.id,
      });
    }

    const comp = await findOrCreateCompetencia(body.mes, body.ano, setorId, tipo, empresaId);
    return reply.status(201).send(comp);
  });

  app.get<{
    Params: { id: string };
    Querystring: { mes?: string; ano?: string; tipo?: string };
  }>('/api/setores/:id/competencias', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const setorId = parseInt(request.params.id, 10);
    const mes = request.query.mes ? parseInt(request.query.mes, 10) : undefined;
    const ano = request.query.ano ? parseInt(request.query.ano, 10) : undefined;
    const tipo = parseTipoEscala(request.query.tipo);

    try {
      await assertSetorEmpresa(setorId, empresaId);
    } catch {
      return reply.status(404).send({ error: 'Setor não encontrado' });
    }

    if (mes !== undefined && ano !== undefined) {
      const comp = await db.query.competencias.findFirst({
        where: (c, { and, eq }) =>
          and(
            eq(c.mes, mes),
            eq(c.ano, ano),
            eq(c.setorId, setorId),
            eq(c.tipo, tipo),
            eq(c.empresaId, empresaId)
          ),
      });

      if (!comp) return reply.status(404).send({ error: 'Competência não encontrada' });
      return comp;
    }

    const tipoFiltro = request.query.tipo ? tipo : undefined;

    return db
      .select({
        id: competencias.id,
        mes: competencias.mes,
        ano: competencias.ano,
        setorId: competencias.setorId,
        tipo: competencias.tipo,
        observacoes: competencias.observacoes,
      })
      .from(competencias)
      .where(
        tipoFiltro
          ? and(
              eq(competencias.setorId, setorId),
              eq(competencias.tipo, tipoFiltro),
              eq(competencias.empresaId, empresaId)
            )
          : and(eq(competencias.setorId, setorId), eq(competencias.empresaId, empresaId))
      )
      .orderBy(desc(competencias.ano), desc(competencias.mes));
  });
};
