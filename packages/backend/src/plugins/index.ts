import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(cors, { origin: true });

  await app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Escala Hospital API',
        description: 'API para gestão de escala de técnicos de enfermagem',
        version: '1.0.0',
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });
}
