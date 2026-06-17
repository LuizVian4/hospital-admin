import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { isPublicApiPath, type JwtPayload } from './auth';
import { listEmpresasDoUsuario, usuarioTemAcessoEmpresa } from '../services/empresa.service';

export const EMPRESA_HEADER = 'x-empresa-id';

const EMPRESA_OPTIONAL_PATHS = new Set(['/api/empresas']);

function getEmpresaIdFromRequest(request: FastifyRequest): string | undefined {
  const header = request.headers[EMPRESA_HEADER];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }

  const cookie = request.cookies?.empresa_id;
  if (typeof cookie === 'string' && cookie.trim()) {
    return cookie.trim();
  }

  return undefined;
}

function isEmpresaOptionalPath(url: string): boolean {
  const path = url.split('?')[0];
  if (EMPRESA_OPTIONAL_PATHS.has(path)) return true;
  return /^\/api\/empresas\/[0-9a-f-]{36}/i.test(path);
}

export async function registerEmpresaContext(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url.split('?')[0];

    if (
      path === '/health' ||
      path.startsWith('/docs') ||
      !path.startsWith('/api/') ||
      isPublicApiPath(path) ||
      isEmpresaOptionalPath(path)
    ) {
      return;
    }

    const payload = request.user as JwtPayload | undefined;
    if (!payload) {
      return reply.code(401).send({ error: 'Não autorizado' });
    }

    let resolvedEmpresaId: string;
    const empresaId = getEmpresaIdFromRequest(request);

    if (!empresaId) {
      const empresas = await listEmpresasDoUsuario(payload.sub);
      if (empresas.length === 1) {
        resolvedEmpresaId = empresas[0].id;
      } else if (empresas.length === 0) {
        return reply.code(403).send({ error: 'Usuário sem empresa vinculada' });
      } else {
        return reply.code(400).send({
          error: 'Selecione uma empresa para continuar',
          code: 'EMPRESA_REQUIRED',
          empresas,
        });
      }
    } else {
      resolvedEmpresaId = empresaId;
    }

    const hasAccess = await usuarioTemAcessoEmpresa(payload.sub, resolvedEmpresaId);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Sem acesso a esta empresa' });
    }

    request.empresaId = resolvedEmpresaId;
  });
}

export function requireEmpresaId(request: FastifyRequest): string {
  if (!request.empresaId) {
    throw new Error('Contexto de empresa não definido');
  }
  return request.empresaId;
}
