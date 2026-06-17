import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, ilike, sql, asc, desc, or, isNull } from 'drizzle-orm';
import { db } from '../db';
import { funcionarios, setores } from '../db/schema';
import { mapFuncionario } from '../utils/helpers';
import {
  contarTecnicosEnfermeiros,
  isAgrupamentoEspecial,
} from '../utils/funcionarioAgrupamento';
import { listStatusPorFuncionario } from '../services/statusEspecial.service';
import { requireEmpresaId } from '../plugins/empresa';
import { assertFuncionarioEmpresa } from '../services/empresa.service';
import type { FuncionarioAgrupamentoResumo, FuncionariosResumo } from '@escala/shared';

const funcionarioSchema = z.object({
  matricula: z.string().min(1),
  nome: z.string().min(1),
  coren: z.string().optional(),
  categoria: z.string().default('TÉC. DE ENFERMAGEM'),
  tipoContrato: z.string().default('EFETIVO'),
  dataAdmissao: z.string().optional(),
  cargaHoraria: z.enum(['180H', '144H']).default('180H'),
  setorId: z.number().int().nullable().optional(),
  ativo: z.boolean().optional(),
});

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type FuncionarioFilterQuery = {
  setor?: string;
  agrupamento?: string;
  nome?: string;
  contrato?: string;
  ativo?: string;
};

function buildFuncionarioConditions(query: FuncionarioFilterQuery, empresaId: string) {
  const { setor, agrupamento, nome, contrato, ativo } = query;
  const conditions = [eq(funcionarios.empresaId, empresaId)];

  if (agrupamento === 'especial') {
    const especialFilter = or(eq(funcionarios.ativo, false), isNull(funcionarios.setorId));
    if (especialFilter) conditions.push(especialFilter);
  } else if (setor) {
    conditions.push(eq(funcionarios.setorId, parseInt(setor, 10)));
    conditions.push(eq(funcionarios.ativo, true));
  }

  if (nome) conditions.push(ilike(funcionarios.nome, `%${nome}%`));
  if (contrato) conditions.push(eq(funcionarios.tipoContrato, contrato));
  if (ativo !== undefined) conditions.push(eq(funcionarios.ativo, ativo === 'true'));

  return and(...conditions);
}

async function buildFuncionariosResumo(
  whereClause: ReturnType<typeof buildFuncionarioConditions>
): Promise<FuncionariosResumo> {
  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ativos: sql<number>`count(*) filter (where ${funcionarios.ativo})::int`,
      inativos: sql<number>`count(*) filter (where not ${funcionarios.ativo})::int`,
      semSetor: sql<number>`count(*) filter (where ${funcionarios.setorId} is null)::int`,
      semCoren: sql<number>`count(*) filter (where ${funcionarios.coren} is null or trim(${funcionarios.coren}) = '')::int`,
      provisorios: sql<number>`count(*) filter (where upper(${funcionarios.tipoContrato}) like '%PROVIS%')::int`,
      carga180: sql<number>`count(*) filter (where ${funcionarios.cargaHoraria} = '180H')::int`,
      carga144: sql<number>`count(*) filter (where ${funcionarios.cargaHoraria} = '144H')::int`,
      setoresAtivos: sql<number>`count(distinct ${funcionarios.setorId}) filter (where ${funcionarios.ativo} and ${funcionarios.setorId} is not null)::int`,
    })
    .from(funcionarios)
    .where(whereClause);

  const categoriaRows = await db
    .select({
      categoria: sql<string>`coalesce(nullif(trim(${funcionarios.categoria}), ''), 'Sem categoria')`,
      total: sql<number>`count(*)::int`,
    })
    .from(funcionarios)
    .where(whereClause)
    .groupBy(sql`coalesce(nullif(trim(${funcionarios.categoria}), ''), 'Sem categoria')`)
    .orderBy(desc(sql`count(*)`));

  const total = agg?.total ?? 0;
  const semCoren = agg?.semCoren ?? 0;

  return {
    total,
    ativos: agg?.ativos ?? 0,
    inativos: agg?.inativos ?? 0,
    semSetor: agg?.semSetor ?? 0,
    semCoren,
    provisorios: agg?.provisorios ?? 0,
    carga180: agg?.carga180 ?? 0,
    carga144: agg?.carga144 ?? 0,
    setoresAtivos: agg?.setoresAtivos ?? 0,
    porCategoria: categoriaRows.map((row) => ({
      categoria: row.categoria,
      total: row.total,
    })),
    corenPercent: total > 0 ? Math.round(((total - semCoren) / total) * 100) : 100,
  };
}

async function listFuncionariosAgrupamentos(
  empresaId: string,
  filterQuery: Omit<FuncionarioFilterQuery, 'setor' | 'agrupamento'>
): Promise<FuncionarioAgrupamentoResumo[]> {
  const whereClause = buildFuncionarioConditions(filterQuery, empresaId);

  const rows = await db
    .select({
      setorId: funcionarios.setorId,
      setorNome: setores.nome,
      ativo: funcionarios.ativo,
      categoria: funcionarios.categoria,
    })
    .from(funcionarios)
    .leftJoin(setores, eq(funcionarios.setorId, setores.id))
    .where(whereClause);

  const porSetor = new Map<number, { nome: string; categorias: string[] }>();
  const especialCategorias: string[] = [];

  for (const row of rows) {
    if (isAgrupamentoEspecial(row.ativo ?? false, row.setorId)) {
      especialCategorias.push(row.categoria ?? '');
      continue;
    }

    if (row.setorId == null) continue;

    const grupo = porSetor.get(row.setorId) ?? {
      nome: row.setorNome ?? `Setor #${row.setorId}`,
      categorias: [],
    };
    grupo.categorias.push(row.categoria ?? '');
    porSetor.set(row.setorId, grupo);
  }

  const agrupamentos: FuncionarioAgrupamentoResumo[] = [...porSetor.entries()]
    .map(([id, grupo]) => {
      const { totalTecnicos, totalEnfermeiros } = contarTecnicosEnfermeiros(grupo.categorias);
      return {
        id,
        nome: grupo.nome,
        especial: false,
        total: grupo.categorias.length,
        totalTecnicos,
        totalEnfermeiros,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

  if (especialCategorias.length > 0) {
    const { totalTecnicos, totalEnfermeiros } = contarTecnicosEnfermeiros(especialCategorias);
    agrupamentos.push({
      id: null,
      nome: 'Inativados / Sem setor',
      especial: true,
      total: especialCategorias.length,
      totalTecnicos,
      totalEnfermeiros,
    });
  }

  return agrupamentos;
}

export const funcionariosRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: {
      nome?: string;
      contrato?: string;
      ativo?: string;
      setor?: string;
    };
  }>('/api/funcionarios/agrupamentos', async (request) => {
    const empresaId = requireEmpresaId(request);
    const { setor, ...filterQuery } = request.query;
    const agrupamentos = await listFuncionariosAgrupamentos(empresaId, filterQuery);
    const whereClause = buildFuncionarioConditions(
      setor ? { ...filterQuery, setor } : filterQuery,
      empresaId
    );
    const resumo = await buildFuncionariosResumo(whereClause);

    const filtrados = setor
      ? agrupamentos.filter((g) => !g.especial && String(g.id) === setor)
      : agrupamentos;

    return { agrupamentos: filtrados, resumo };
  });

  app.get<{
    Querystring: {
      setor?: string;
      agrupamento?: string;
      nome?: string;
      contrato?: string;
      ativo?: string;
      page?: string;
      pageSize?: string;
    };
  }>('/api/funcionarios', async (request) => {
    const empresaId = requireEmpresaId(request);
    const { page: pageRaw, pageSize: pageSizeRaw, ...filterQuery } = request.query;
    const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(pageSizeRaw ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * pageSize;
    const whereClause = buildFuncionarioConditions(filterQuery, empresaId);
    const scopedToGrupo = Boolean(filterQuery.setor || filterQuery.agrupamento === 'especial');

    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(funcionarios)
      .where(whereClause);

    const rows = await db
      .select({ funcionario: funcionarios })
      .from(funcionarios)
      .leftJoin(setores, eq(funcionarios.setorId, setores.id))
      .where(whereClause)
      .orderBy(
        ...(scopedToGrupo
          ? [asc(funcionarios.nome)]
          : [
              sql`case when ${funcionarios.ativo} and ${funcionarios.setorId} is not null then 0 else 1 end`,
              asc(setores.nome),
              asc(funcionarios.nome),
            ])
      )
      .limit(pageSize)
      .offset(offset);

    const resumo = await buildFuncionariosResumo(whereClause);

    return {
      items: rows.map((row) => mapFuncionario(row.funcionario)),
      total: countRow?.total ?? 0,
      page,
      pageSize,
      resumo,
    };
  });

  app.get<{ Params: { id: string } }>('/api/funcionarios/:id', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const id = parseInt(request.params.id, 10);
    try {
      const func = await assertFuncionarioEmpresa(id, empresaId);
      return mapFuncionario(func);
    } catch {
      return reply.status(404).send({ error: 'Funcionário não encontrado' });
    }
  });

  app.post('/api/funcionarios', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const body = funcionarioSchema.parse(request.body);
    try {
      const [created] = await db
        .insert(funcionarios)
        .values({
          empresaId,
          matricula: body.matricula,
          nome: body.nome,
          coren: body.coren,
          categoria: body.categoria,
          tipoContrato: body.tipoContrato,
          dataAdmissao: body.dataAdmissao,
          cargaHoraria: body.cargaHoraria,
          setorId: body.setorId ?? null,
          ativo: body.ativo ?? true,
        })
        .returning();
      return reply.status(201).send(mapFuncionario(created));
    } catch {
      return reply.status(409).send({ error: 'Matrícula já cadastrada' });
    }
  });

  app.put<{ Params: { id: string } }>('/api/funcionarios/:id', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const id = parseInt(request.params.id, 10);
    const body = funcionarioSchema.partial().parse(request.body);

    const [updated] = await db
      .update(funcionarios)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(funcionarios.id, id), eq(funcionarios.empresaId, empresaId)))
      .returning();

    if (!updated) return reply.status(404).send({ error: 'Funcionário não encontrado' });
    return mapFuncionario(updated);
  });

  app.delete<{ Params: { id: string } }>('/api/funcionarios/:id', async (request, reply) => {
    const empresaId = requireEmpresaId(request);
    const id = parseInt(request.params.id, 10);
    const [updated] = await db
      .update(funcionarios)
      .set({ ativo: false, updatedAt: new Date() })
      .where(and(eq(funcionarios.id, id), eq(funcionarios.empresaId, empresaId)))
      .returning();

    if (!updated) return reply.status(404).send({ error: 'Funcionário não encontrado' });
    return { success: true };
  });

  app.get<{ Params: { id: string } }>(
    '/api/funcionarios/:id/status-especiais',
    async (request, reply) => {
      const empresaId = requireEmpresaId(request);
      const id = parseInt(request.params.id, 10);
      try {
        await assertFuncionarioEmpresa(id, empresaId);
      } catch {
        return reply.status(404).send({ error: 'Funcionário não encontrado' });
      }
      return listStatusPorFuncionario(id);
    }
  );
};
