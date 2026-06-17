import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ACCESS_COOKIE } from '../services/auth.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

export function isPublicApiPath(url: string): boolean {
  const path = url.split('?')[0];
  return PUBLIC_API_PATHS.has(path);
}

function getAccessToken(request: FastifyRequest): string | undefined {
  const cookieToken = request.cookies[ACCESS_COOKIE];
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return undefined;
}

export async function registerAuth(app: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET é obrigatório');
  }

  await app.register(jwt, { secret });

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0];

    if (
      path === '/health' ||
      path.startsWith('/docs') ||
      !path.startsWith('/api/') ||
      isPublicApiPath(path)
    ) {
      return;
    }

    const token = getAccessToken(request);
    if (!token) {
      return reply.code(401).send({ error: 'Não autorizado' });
    }

    try {
      const decoded = await request.server.jwt.verify<JwtPayload>(token);
      request.user = decoded;
    } catch {
      return reply.code(401).send({ error: 'Não autorizado' });
    }
  });
}
