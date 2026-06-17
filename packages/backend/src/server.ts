import Fastify from 'fastify';
import { registerPlugins } from './plugins';
import { setoresRoutes } from './routes/setores';
import { funcionariosRoutes } from './routes/funcionarios';
import { escalasRoutes } from './routes/escalas';
import { importacaoRoutes } from './routes/importacao';
import { bancoHorasRoutes } from './routes/bancoHoras';
import { authRoutes } from './routes/auth';
import { empresasRoutes } from './routes/empresas';

const app = Fastify({ logger: true });

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
