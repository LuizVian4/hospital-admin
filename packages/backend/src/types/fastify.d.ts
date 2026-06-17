import type { JwtPayload } from '../plugins/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
    empresaId?: string;
  }
}
