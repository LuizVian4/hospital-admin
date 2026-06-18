import { FastifyPluginAsync } from 'fastify';
import {
  buildPreview,
  getLastPreview,
  parseOdsBuffer,
  persistImport,
  setLastPreview,
  buildEquipeTemplateBuffer,
  buildEscalaTemplateBuffer,
} from '../services/importacao.service';
import { requireEmpresaId } from '../plugins/empresa';

type ImportTipo = 'equipe' | 'escala';

function parseImportTipo(value?: string): ImportTipo | undefined {
  if (value === 'equipe' || value === 'escala') return value;
  return undefined;
}

export const importacaoRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { tipo: string } }>('/api/importacao/template/:tipo', async (request, reply) => {
    const tipo = parseImportTipo(request.params.tipo);
    if (!tipo) {
      return reply.status(400).send({ error: 'Tipo inválido. Use equipe ou escala.' });
    }

    const buffer =
      tipo === 'equipe' ? await buildEquipeTemplateBuffer() : await buildEscalaTemplateBuffer();
    const filename = tipo === 'equipe' ? 'template_equipe.xlsx' : 'template_escala.xlsx';

    return reply
      .header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(buffer);
  });

  app.post<{
    Querystring: { confirmar?: string; mes?: string; ano?: string; tipo?: string };
  }>('/api/importacao/ods', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Arquivo não enviado' });
    }

    const buffer = await data.toBuffer();
    const confirmar = request.query.confirmar === 'true';
    const mes = request.query.mes ? parseInt(request.query.mes, 10) : undefined;
    const ano = request.query.ano ? parseInt(request.query.ano, 10) : undefined;
    const tipo = parseImportTipo(request.query.tipo);

    if (confirmar) {
      try {
        const parsed = parseOdsBuffer(buffer);
        if (tipo) {
          const format = parsed[0]?.format ?? 'escala';
          if (format !== tipo) {
            return reply.status(400).send({
              error:
                tipo === 'equipe'
                  ? 'Este arquivo parece ser uma escala mensal. Use o card de importação de escala.'
                  : 'Este arquivo parece ser uma planilha de equipe. Use o card de importação de equipe.',
            });
          }
        }
        const result = await persistImport(parsed, empresaId, mes, ano);
        setLastPreview(parsed, tipo);
        return reply.status(201).send({ ...result, persisted: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao confirmar importação';
        return reply.status(400).send({ error: message });
      }
    }

    try {
      const preview = await buildPreview(buffer, empresaId, tipo);
      return preview;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      return reply.status(400).send({ error: message });
    }
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
