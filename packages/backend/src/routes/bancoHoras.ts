import { FastifyPluginAsync } from 'fastify';
import { listBancoHorasCompetencia, listBancoHorasGeral, listBancoHorasMes } from '../services/bancoHoras.service';

export const bancoHorasRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: { mes?: string; ano?: string; pendentes?: string; geral?: string };
  }>('/api/banco-horas', async (request) => {
    const apenasPendentes = request.query.pendentes === 'true';
    const geral = request.query.geral === 'true';

    if (geral) {
      return listBancoHorasGeral({ apenasPendentes });
    }

    const now = new Date();
    const mes = request.query.mes ? parseInt(request.query.mes, 10) : now.getMonth() + 1;
    const ano = request.query.ano ? parseInt(request.query.ano, 10) : now.getFullYear();

    return listBancoHorasMes(mes, ano, { apenasPendentes });
  });

  app.get<{ Params: { id: string } }>('/api/competencias/:id/banco-horas', async (request, reply) => {
    const competenciaId = parseInt(request.params.id, 10);
    const items = await listBancoHorasCompetencia(competenciaId);
    if (items.length === 0) {
      const { db } = await import('../db');
      const { competencias } = await import('../db/schema');
      const { eq } = await import('drizzle-orm');
      const comp = await db.query.competencias.findFirst({
        where: eq(competencias.id, competenciaId),
      });
      if (!comp) return reply.status(404).send({ error: 'Competência não encontrada' });
    }
    return items;
  });
};
