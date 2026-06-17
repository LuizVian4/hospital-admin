import { FastifyPluginAsync } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { listBancoHorasCompetencia, listBancoHorasGeral, listBancoHorasMes } from '../services/bancoHoras.service';
import { assertCompetenciaEmpresa } from '../services/empresa.service';
import { requireEmpresaId } from '../plugins/empresa';

export const bancoHorasRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: { mes?: string; ano?: string; pendentes?: string; geral?: string };
  }>('/api/banco-horas', async (request) => {
    const empresaId = requireEmpresaId(request);
    const apenasPendentes = request.query.pendentes === 'true';
    const geral = request.query.geral === 'true';

    if (geral) {
      return listBancoHorasGeral(empresaId, { apenasPendentes });
    }

    const now = new Date();
    const mes = request.query.mes ? parseInt(request.query.mes, 10) : now.getMonth() + 1;
    const ano = request.query.ano ? parseInt(request.query.ano, 10) : now.getFullYear();

    return listBancoHorasMes(empresaId, mes, ano, { apenasPendentes });
  });

  app.get<{ Params: { id: string } }>('/api/competencias/:id/banco-horas', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const competenciaId = parseInt(request.params.id, 10);

    try {
      await assertCompetenciaEmpresa(competenciaId, empresaId);
    } catch {
      return reply.status(404).send({ error: 'Competência não encontrada' });
    }

    return listBancoHorasCompetencia(empresaId, competenciaId);
  });
};
