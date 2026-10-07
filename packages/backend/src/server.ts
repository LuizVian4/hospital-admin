import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { registerPlugins } from './plugins';
import { setoresRoutes } from './routes/setores';
import { funcionariosRoutes } from './routes/funcionarios';
import { escalasRoutes } from './routes/escalas';
import { importacaoRoutes } from './routes/importacao';
import { bancoHorasRoutes } from './routes/bancoHoras';
import { authRoutes } from './routes/auth';
import { empresasRoutes } from './routes/empresas';

const app = Fastify({
  logger: true,
  trustProxy: true,
});

function frontendDistPath(): string {
  if (process.env.FRONTEND_DIST) {
    return path.resolve(process.env.FRONTEND_DIST);
  }
  return path.resolve(__dirname, '../../frontend/dist');
}

async function registerFrontend() {
  const dist = frontendDistPath();
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    app.log.info('Frontend dist ausente; servindo apenas a API');
    return;
  }

  await app.register(fastifyStatic, {
    root: dist,
    wildcard: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(`${path.sep}index.html`)) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  });

  app.setNotFoundHandler((request, reply) => {
    const urlPath = request.url.split('?')[0];
    const isSpaRoute =
      (request.method === 'GET' || request.method === 'HEAD') &&
      !urlPath.startsWith('/api') &&
      !urlPath.startsWith('/docs') &&
      urlPath !== '/health';

    if (isSpaRoute) {
      return reply.sendFile('index.html');
    }

    return reply.code(404).send({ error: 'Não encontrado' });
  });
}

async function start() {
  await registerPlugins(app);

  await app.register(authRoutes);
  await app.register(empresasRoutes);
  await app.register(setoresRoutes);
  await app.register(funcionariosRoutes);
  await app.register(escalasRoutes);
  await app.register(importacaoRoutes);
  await app.register(bancoHorasRoutes);

  app.get('/health', async () => ({ status: 'ok' }));

  await registerFrontend();

  const port = parseInt(process.env.PORT || '3001', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
    console.log(`Swagger docs at http://${host}:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
