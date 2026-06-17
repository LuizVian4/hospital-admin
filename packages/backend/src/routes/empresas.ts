import { FastifyPluginAsync } from 'fastify';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { JwtPayload } from '../plugins/auth';
import { requireEmpresaId } from '../plugins/empresa';
import {
  adicionarUsuarioEmpresa,
  assertAdminEmpresa,
  atualizarEmpresa,
  atualizarPapelUsuarioEmpresa,
  criarEmpresa,
  getEmpresaDetalhes,
  listEmpresasDoUsuario,
  listUsuariosCandidatosEmpresa,
  listUsuariosEmpresa,
  removerUsuarioEmpresa,
} from '../services/empresa.service';

const createEmpresaSchema = z.object({
  nome: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
});

const updateEmpresaSchema = z.object({
  nome: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
});

const vincularUsuarioSchema = z.object({
  userId: z.number().int().positive(),
  papel: z.enum(['admin', 'membro']).optional(),
});

const updateVinculoSchema = z.object({
  papel: z.enum(['admin', 'membro']),
});

async function requireAdmin(request: FastifyRequest) {
  const payload = request.user as JwtPayload;
  const empresaId = requireEmpresaId(request);
  await assertAdminEmpresa(payload.sub, empresaId);
  return { payload, empresaId };
}

export const empresasRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/empresas', async (request) => {
    const payload = request.user as JwtPayload;
    return listEmpresasDoUsuario(payload.sub);
  });

  app.post('/api/empresas', async (request, reply) => {
    const payload = request.user as JwtPayload;
    const body = createEmpresaSchema.parse(request.body);

    try {
      const empresa = await criarEmpresa({
        nome: body.nome,
        slug: body.slug,
        userId: payload.sub,
        papel: 'admin',
      });
      return reply.status(201).send(empresa);
    } catch {
      return reply.status(409).send({ error: 'Já existe uma empresa com este slug' });
    }
  });

  app.get('/api/empresas/atual', async (request, reply) => {
    const payload = request.user as JwtPayload;
    const empresaId = requireEmpresaId(request);

    const detalhes = await getEmpresaDetalhes(empresaId, payload.sub);
    if (!detalhes) {
      return reply.status(404).send({ error: 'Empresa não encontrada' });
    }
    return detalhes;
  });

  app.put('/api/empresas/atual', async (request, reply) => {
    try {
      const { empresaId } = await requireAdmin(request);
      const body = updateEmpresaSchema.parse(request.body);

      const updated = await atualizarEmpresa(empresaId, body);
      if (!updated) {
        return reply.status(404).send({ error: 'Empresa não encontrada' });
      }
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar empresa';
      const status = message.includes('administradores') ? 403 : 400;
      return reply.status(status).send({ error: message });
    }
  });

  app.get('/api/empresas/atual/usuarios', async (request, reply) => {
    try {
      const { empresaId } = await requireAdmin(request);
      return listUsuariosEmpresa(empresaId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Acesso negado';
      return reply.status(403).send({ error: message });
    }
  });

  app.get('/api/empresas/atual/usuarios/candidatos', async (request, reply) => {
    try {
      const { empresaId } = await requireAdmin(request);
      return listUsuariosCandidatosEmpresa(empresaId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Acesso negado';
      return reply.status(403).send({ error: message });
    }
  });

  app.post('/api/empresas/atual/usuarios', async (request, reply) => {
    try {
      const { empresaId } = await requireAdmin(request);
      const body = vincularUsuarioSchema.parse(request.body);
      await adicionarUsuarioEmpresa(empresaId, body.userId, body.papel ?? 'membro');
      return reply.status(201).send({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao vincular usuário';
      return reply.status(400).send({ error: message });
    }
  });

  app.put<{ Params: { userId: string } }>(
    '/api/empresas/atual/usuarios/:userId',
    async (request, reply) => {
      try {
        const { payload, empresaId } = await requireAdmin(request);
        const userId = Number.parseInt(request.params.userId, 10);
        const body = updateVinculoSchema.parse(request.body);

        if (!Number.isFinite(userId)) {
          return reply.status(400).send({ error: 'ID de usuário inválido' });
        }

        await atualizarPapelUsuarioEmpresa(empresaId, userId, body.papel, payload.sub);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar vínculo';
        return reply.status(400).send({ error: message });
      }
    }
  );

  app.delete<{ Params: { userId: string } }>(
    '/api/empresas/atual/usuarios/:userId',
    async (request, reply) => {
      try {
        const { payload, empresaId } = await requireAdmin(request);
        const userId = Number.parseInt(request.params.userId, 10);

        if (!Number.isFinite(userId)) {
          return reply.status(400).send({ error: 'ID de usuário inválido' });
        }

        await removerUsuarioEmpresa(empresaId, userId, payload.sub);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover vínculo';
        return reply.status(400).send({ error: message });
      }
    }
  );
};
