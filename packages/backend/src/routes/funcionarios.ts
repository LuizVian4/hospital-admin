import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { db } from '../db';
import { funcionarios } from '../db/schema';
import { mapFuncionario } from '../utils/helpers';
import { listStatusPorFuncionario } from '../services/statusEspecial.service';

const funcionarioSchema = z.object({
  matricula: z.string().min(1),
  nome: z.string().min(1),
  coren: z.string().optional(),
  categoria: z.string().default('TÉC. DE ENFERMAGEM'),
  tipoContrato: z.string().default('EFETIVO'),
  dataAdmissao: z.string().optional(),
  cargaHoraria: z.enum(['180H', '144H']).default('180H'),
  setorId: z.number().int().nullable().optional(),
  ativo: z.boolean().optional(),
});

export const funcionariosRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: { setor?: string; nome?: string; contrato?: string; ativo?: string };
  }>('/api/funcionarios', async (request) => {
    const { setor, nome, contrato, ativo } = request.query;
    const conditions = [];

    if (setor) conditions.push(eq(funcionarios.setorId, parseInt(setor, 10)));
    if (nome) conditions.push(ilike(funcionarios.nome, `%${nome}%`));
    if (contrato) conditions.push(eq(funcionarios.tipoContrato, contrato));
    if (ativo !== undefined) conditions.push(eq(funcionarios.ativo, ativo === 'true'));

    const rows = await db
      .select()
      .from(funcionarios)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(funcionarios.nome);

    return rows.map(mapFuncionario);
  });

  app.post('/api/funcionarios', async (request, reply) => {
    const body = funcionarioSchema.parse(request.body);
    try {
      const [created] = await db
        .insert(funcionarios)
        .values({
          matricula: body.matricula,
          nome: body.nome,
          coren: body.coren,
          categoria: body.categoria,
          tipoContrato: body.tipoContrato,
          dataAdmissao: body.dataAdmissao,
          cargaHoraria: body.cargaHoraria,
          setorId: body.setorId ?? null,
          ativo: body.ativo ?? true,
        })
        .returning();
      return reply.status(201).send(mapFuncionario(created));
    } catch {
      return reply.status(409).send({ error: 'Matrícula já cadastrada' });
    }
  });

  app.put<{ Params: { id: string } }>('/api/funcionarios/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const body = funcionarioSchema.partial().parse(request.body);

    const [updated] = await db
      .update(funcionarios)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(funcionarios.id, id))
      .returning();

    if (!updated) return reply.status(404).send({ error: 'Funcionário não encontrado' });
    return mapFuncionario(updated);
  });

  app.delete<{ Params: { id: string } }>('/api/funcionarios/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const [updated] = await db
      .update(funcionarios)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(funcionarios.id, id))
      .returning();

    if (!updated) return reply.status(404).send({ error: 'Funcionário não encontrado' });
    return { success: true };
  });

  app.get<{ Params: { id: string } }>(
    '/api/funcionarios/:id/status-especiais',
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const func = await db.query.funcionarios.findFirst({ where: eq(funcionarios.id, id) });
      if (!func) return reply.status(404).send({ error: 'Funcionário não encontrado' });
      return listStatusPorFuncionario(id);
    }
  );
};
