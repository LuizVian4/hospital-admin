import { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import type { JwtPayload } from '../plugins/auth';
import { toPublicUser } from '../services/auth.service';

const createUserSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(1),
  password: z.string().min(8),
});

const updateUserSchema = z.object({
  nome: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/users', async () => {
    const rows = await db.select().from(users).orderBy(users.nome);
    return rows.map(toPublicUser);
  });

  app.post('/api/users', async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const email = body.email.toLowerCase();

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return reply.code(409).send({ error: 'E-mail já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [created] = await db
      .insert(users)
      .values({
        email,
        nome: body.nome,
        passwordHash,
        ativo: true,
      })
      .returning();

    return toPublicUser(created);
  });

  app.put<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
    const id = Number.parseInt(request.params.id, 10);
    const body = updateUserSchema.parse(request.body);
    const payload = request.user as JwtPayload;

    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: 'ID inválido' });
    }

    if (body.ativo === false && id === payload.sub) {
      return reply.code(400).send({ error: 'Não é possível desativar o próprio usuário' });
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(body.nome !== undefined ? { nome: body.nome } : {}),
        ...(body.ativo !== undefined ? { ativo: body.ativo } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return reply.code(404).send({ error: 'Usuário não encontrado' });
    }

    return toPublicUser(updated);
  });

  app.put<{ Params: { id: string } }>('/api/users/:id/senha', async (request, reply) => {
    const id = Number.parseInt(request.params.id, 10);
    const body = resetPasswordSchema.parse(request.body);

    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: 'ID inválido' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [updated] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return reply.code(404).send({ error: 'Usuário não encontrado' });
    }

    return { success: true };
  });
};
