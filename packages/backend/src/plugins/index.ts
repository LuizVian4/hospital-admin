import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';
import { registerAuth } from './auth';
import { registerEmpresaContext } from './empresa';

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    return ['http://localhost:5173'];
  }
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function isAllowedCorsOrigin(origin: string): boolean {
  if (parseCorsOrigins().includes(origin)) {
    return true;
  }

  // Staging no Railway: front e API em subdomínios distintos de up.railway.app
  if (/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i.test(origin)) {
    return true;
  }

  // Domínios customizados Escala360 (app, api, www)
  if (/^https:\/\/([a-z0-9-]+\.)?escala360\.(app|com\.br)$/i.test(origin)) {
    return true;
  }

  return false;
}

export async function registerPlugins(app: FastifyInstance) {
  await app.register(cookie);

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (isAllowedCorsOrigin(origin)) {
        cb(null, origin);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Empresa-Id'],
  });

  await registerAuth(app);
  await registerEmpresaContext(app);

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
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token',
          },
        },
      },
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });
}
