import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import type { AuthResponse } from '@escala/shared';
import type { JwtPayload } from '../plugins/auth';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  issueSession,
  revokeRefreshToken,
  rotateRefreshSession,
  toPublicUser,
} from '../services/auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(1),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1),
  senhaNova: z.string().min(8),
});

const updateProfileSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const deleteAccountSchema = z.object({
  senha: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

function resolveRefreshToken(
  cookieToken: string | undefined,
  bodyToken: string | undefined
): string | undefined {
  return cookieToken ?? bodyToken;
}

const AUTH_RATE_LIMIT_MESSAGE = 'Muitas tentativas. Tente novamente em 15 minutos.';

const authRateLimit =
  process.env.NODE_ENV === 'production'
    ? { max: 10, timeWindow: '15 minutes' as const }
    : undefined;

export const authRoutes: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: AUTH_RATE_LIMIT_MESSAGE,
    }),
  });

  app.post<{ Body: z.infer<typeof loginSchema> }>(
    '/api/auth/login',
    authRateLimit ? { config: { rateLimit: authRateLimit } } : {},
    async (request, reply) => {
      const body = loginSchema.parse(request.body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email.toLowerCase()))
        .limit(1);

      if (!user || !user.ativo) {
        return reply.code(401).send({ error: 'E-mail ou senha inválidos' });
      }

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({ error: 'E-mail ou senha inválidos' });
      }

      const tokens = await issueSession(app, reply, user);

      const response: AuthResponse = {
        user: toPublicUser(user),
        ...tokens,
      };

      return response;
    }
  );

  app.post<{ Body: z.infer<typeof registerSchema> }>(
    '/api/auth/register',
    authRateLimit ? { config: { rateLimit: authRateLimit } } : {},
    async (request, reply) => {
      const body = registerSchema.parse(request.body);
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

      const tokens = await issueSession(app, reply, created);

      const response: AuthResponse = {
        user: toPublicUser(created),
        ...tokens,
      };

      return response;
    }
  );

  app.post<{ Body: z.infer<typeof refreshSchema> }>('/api/auth/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const refreshToken = resolveRefreshToken(request.cookies[REFRESH_COOKIE], body.refreshToken);
    if (!refreshToken) {
      clearAuthCookies(reply);
      return reply.code(401).send({ error: 'Sessão expirada' });
    }

    const session = await rotateRefreshSession(app, reply, refreshToken);
    if (!session) {
      clearAuthCookies(reply);
      return reply.code(401).send({ error: 'Sessão expirada' });
    }

    const response: AuthResponse = {
      user: toPublicUser(session.user),
      ...session.tokens,
    };

    return response;
  });

  app.post<{ Body: z.infer<typeof logoutSchema> }>('/api/auth/logout', async (request, reply) => {
    const body = logoutSchema.parse(request.body ?? {});
    await revokeRefreshToken(resolveRefreshToken(request.cookies[REFRESH_COOKIE], body.refreshToken));
    clearAuthCookies(reply);
    return { success: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    const payload = request.user as JwtPayload;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.ativo) {
      return reply.code(401).send({ error: 'Usuário inválido ou inativo' });
    }

    return toPublicUser(user);
  });

  app.put('/api/auth/senha', async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    const payload = request.user as JwtPayload;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.ativo) {
      return reply.code(401).send({ error: 'Usuário inválido ou inativo' });
    }

    const valid = await bcrypt.compare(body.senhaAtual, user.passwordHash);
    if (!valid) {
      return reply.code(400).send({ error: 'Senha atual incorreta' });
    }

    const passwordHash = await bcrypt.hash(body.senhaNova, 12);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await revokeRefreshToken(request.cookies[REFRESH_COOKIE]);
    await issueSession(app, reply, user);

    return { success: true };
  });

  app.put('/api/auth/me', async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);
    const payload = request.user as JwtPayload;

    if (body.nome === undefined && body.email === undefined) {
      return reply.code(400).send({ error: 'Informe nome ou e-mail para atualizar' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.ativo) {
      return reply.code(401).send({ error: 'Usuário inválido ou inativo' });
    }

    if (body.email !== undefined) {
      const email = body.email.toLowerCase();
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing && existing.id !== user.id) {
        return reply.code(409).send({ error: 'E-mail já cadastrado' });
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(body.nome !== undefined ? { nome: body.nome.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email.toLowerCase() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return toPublicUser(updated);
  });

  app.delete('/api/auth/me', async (request, reply) => {
    const body = deleteAccountSchema.parse(request.body);
    const payload = request.user as JwtPayload;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'Usuário não encontrado' });
    }

    const valid = await bcrypt.compare(body.senha, user.passwordHash);
    if (!valid) {
      return reply.code(400).send({ error: 'Senha incorreta' });
    }

    await revokeRefreshToken(request.cookies[REFRESH_COOKIE]);
    await db.delete(users).where(eq(users.id, user.id));
    clearAuthCookies(reply);

    return { success: true };
  });
};
