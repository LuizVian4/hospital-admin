import { FastifyPluginAsync } from 'fastify';
import {
  buildPreview,
  confirmImport,
  getLastPreview,
  parseOdsBuffer,
  persistImport,
  setLastPreview,
} from '../services/importacao.service';

export const importacaoRoutes: FastifyPluginAsync = async (app) => {
  app.post<{
    Querystring: { confirmar?: string; mes?: string; ano?: string };
  }>('/api/importacao/ods', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Arquivo não enviado' });
    }

    const buffer = await data.toBuffer();
    const confirmar = request.query.confirmar === 'true';
    const mes = request.query.mes ? parseInt(request.query.mes, 10) : undefined;
    const ano = request.query.ano ? parseInt(request.query.ano, 10) : undefined;

    if (confirmar) {
      const preview = getLastPreview();
      if (!preview) {
        const parsed = parseOdsBuffer(buffer);
        setLastPreview(parsed);
        const result = await persistImport(parsed, mes, ano);
        return reply.status(201).send({ ...result, persisted: true });
      }
      const result = await confirmImport(mes, ano);
      return reply.status(201).send({ ...result, persisted: true });
    }

    const preview = await buildPreview(buffer);
    return preview;
  });

  app.get('/api/importacao/preview', async (_request, reply) => {
    const preview = getLastPreview();
    if (!preview) {
      return reply.status(404).send({ error: 'Nenhuma importação em preview' });
    }

    return {
      setores: preview.map((s) => ({
        nome: s.nome,
        funcionarios: s.funcionarios.length,
        statusEspeciais: s.statusEspeciais.length,
        erros: s.erros,
      })),
    };
  });
};
