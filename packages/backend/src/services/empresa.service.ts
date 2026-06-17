import { and, eq, notInArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { competencias, empresas, funcionarios, setores, users, usuarioEmpresas } from '../db/schema';
import type {
  Empresa,
  EmpresaComPapel,
  EmpresaDetalhes,
  PapelEmpresa,
  UsuarioEmpresa,
  UsuarioEmpresaCandidato,
} from '@escala/shared';

export function toPublicEmpresa(empresa: typeof empresas.$inferSelect): Empresa {
  return {
    id: empresa.id,
    nome: empresa.nome,
    slug: empresa.slug,
    ativo: empresa.ativo,
  };
}

export async function listEmpresasDoUsuario(
  userId: number,
  options?: { incluirInativas?: boolean }
): Promise<EmpresaComPapel[]> {
  const conditions = [eq(usuarioEmpresas.userId, userId)];
  if (!options?.incluirInativas) {
    conditions.push(eq(empresas.ativo, true));
  }

  const rows = await db
    .select({
      id: empresas.id,
      nome: empresas.nome,
      slug: empresas.slug,
      ativo: empresas.ativo,
      papel: usuarioEmpresas.papel,
    })
    .from(usuarioEmpresas)
    .innerJoin(empresas, eq(usuarioEmpresas.empresaId, empresas.id))
    .where(and(...conditions));

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    ativo: row.ativo,
    papel: row.papel as EmpresaComPapel['papel'],
  }));
}

export async function usuarioTemVinculoEmpresa(userId: number, empresaId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: usuarioEmpresas.id })
    .from(usuarioEmpresas)
    .where(and(eq(usuarioEmpresas.userId, userId), eq(usuarioEmpresas.empresaId, empresaId)))
    .limit(1);

  return Boolean(row);
}

export async function usuarioTemAcessoEmpresa(userId: number, empresaId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: usuarioEmpresas.id })
    .from(usuarioEmpresas)
    .innerJoin(empresas, eq(usuarioEmpresas.empresaId, empresas.id))
    .where(
      and(
        eq(usuarioEmpresas.userId, userId),
        eq(usuarioEmpresas.empresaId, empresaId),
        eq(empresas.ativo, true)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function vincularUsuarioEmpresa(
  userId: number,
  empresaId: string,
  papel: EmpresaComPapel['papel'] = 'membro'
) {
  await db
    .insert(usuarioEmpresas)
    .values({ userId, empresaId, papel })
    .onConflictDoNothing();
}

export async function criarEmpresa(input: {
  nome: string;
  slug: string;
  userId: number;
  papel?: EmpresaComPapel['papel'];
}): Promise<Empresa> {
  const [empresa] = await db
    .insert(empresas)
    .values({
      nome: input.nome,
      slug: input.slug,
      ativo: true,
    })
    .returning();

  await vincularUsuarioEmpresa(input.userId, empresa.id, input.papel ?? 'admin');

  return toPublicEmpresa(empresa);
}

export async function getPapelUsuarioVinculo(
  userId: number,
  empresaId: string
): Promise<PapelEmpresa | null> {
  const [row] = await db
    .select({ papel: usuarioEmpresas.papel })
    .from(usuarioEmpresas)
    .where(and(eq(usuarioEmpresas.userId, userId), eq(usuarioEmpresas.empresaId, empresaId)))
    .limit(1);

  return row ? (row.papel as PapelEmpresa) : null;
}

export async function getPapelUsuarioEmpresa(
  userId: number,
  empresaId: string
): Promise<PapelEmpresa | null> {
  const [row] = await db
    .select({ papel: usuarioEmpresas.papel })
    .from(usuarioEmpresas)
    .innerJoin(empresas, eq(usuarioEmpresas.empresaId, empresas.id))
    .where(
      and(
        eq(usuarioEmpresas.userId, userId),
        eq(usuarioEmpresas.empresaId, empresaId),
        eq(empresas.ativo, true)
      )
    )
    .limit(1);

  return row ? (row.papel as PapelEmpresa) : null;
}

export async function assertAdminEmpresa(userId: number, empresaId: string) {
  const papel = await getPapelUsuarioVinculo(userId, empresaId);
  if (papel !== 'admin') {
    throw new Error('Acesso restrito a administradores da empresa');
  }
}

export async function getEmpresaDetalhes(
  empresaId: string,
  userId: number
): Promise<EmpresaDetalhes | null> {
  const empresa = await db.query.empresas.findFirst({
    where: eq(empresas.id, empresaId),
  });
  if (!empresa) return null;

  const papelAtual = await getPapelUsuarioVinculo(userId, empresaId);
  if (!papelAtual) return null;

  const [agg] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(usuarioEmpresas)
    .where(eq(usuarioEmpresas.empresaId, empresaId));

  return {
    ...toPublicEmpresa(empresa),
    totalUsuarios: agg?.total ?? 0,
    papelAtual,
  };
}

export async function atualizarEmpresa(
  empresaId: string,
  data: { nome?: string; ativo?: boolean }
): Promise<Empresa | null> {
  const [updated] = await db
    .update(empresas)
    .set({
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      updatedAt: new Date(),
    })
    .where(eq(empresas.id, empresaId))
    .returning();

  return updated ? toPublicEmpresa(updated) : null;
}

export async function listUsuariosEmpresa(empresaId: string): Promise<UsuarioEmpresa[]> {
  const rows = await db
    .select({
      vinculoId: usuarioEmpresas.id,
      userId: users.id,
      email: users.email,
      nome: users.nome,
      ativo: users.ativo,
      papel: usuarioEmpresas.papel,
      createdAt: usuarioEmpresas.createdAt,
    })
    .from(usuarioEmpresas)
    .innerJoin(users, eq(usuarioEmpresas.userId, users.id))
    .where(eq(usuarioEmpresas.empresaId, empresaId))
    .orderBy(users.nome);

  return rows.map((row) => ({
    vinculoId: row.vinculoId,
    userId: row.userId,
    email: row.email,
    nome: row.nome,
    ativo: row.ativo,
    papel: row.papel as PapelEmpresa,
    createdAt: row.createdAt?.toISOString(),
  }));
}

export async function listUsuariosCandidatosEmpresa(
  empresaId: string
): Promise<UsuarioEmpresaCandidato[]> {
  const vinculados = await db
    .select({ userId: usuarioEmpresas.userId })
    .from(usuarioEmpresas)
    .where(eq(usuarioEmpresas.empresaId, empresaId));

  const vinculadosIds = vinculados.map((row) => row.userId);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      nome: users.nome,
      ativo: users.ativo,
    })
    .from(users)
    .where(
      vinculadosIds.length > 0
        ? and(eq(users.ativo, true), notInArray(users.id, vinculadosIds))
        : eq(users.ativo, true)
    )
    .orderBy(users.nome);

  return rows;
}

export async function adicionarUsuarioEmpresa(
  empresaId: string,
  userId: number,
  papel: PapelEmpresa = 'membro'
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.ativo) {
    throw new Error('Usuário não encontrado ou inativo');
  }

  await db
    .insert(usuarioEmpresas)
    .values({ userId, empresaId, papel })
    .onConflictDoUpdate({
      target: [usuarioEmpresas.userId, usuarioEmpresas.empresaId],
      set: { papel },
    });
}

export async function atualizarPapelUsuarioEmpresa(
  empresaId: string,
  userId: number,
  papel: PapelEmpresa,
  actorUserId: number
) {
  if (userId === actorUserId && papel !== 'admin') {
    const admins = await db
      .select({ id: usuarioEmpresas.id })
      .from(usuarioEmpresas)
      .where(and(eq(usuarioEmpresas.empresaId, empresaId), eq(usuarioEmpresas.papel, 'admin')));

    if (admins.length <= 1) {
      throw new Error('A empresa precisa ter pelo menos um administrador');
    }
  }

  const [updated] = await db
    .update(usuarioEmpresas)
    .set({ papel })
    .where(and(eq(usuarioEmpresas.empresaId, empresaId), eq(usuarioEmpresas.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error('Vínculo não encontrado');
  }
}

export async function removerUsuarioEmpresa(
  empresaId: string,
  userId: number,
  actorUserId: number
) {
  const [vinculo] = await db
    .select()
    .from(usuarioEmpresas)
    .where(and(eq(usuarioEmpresas.empresaId, empresaId), eq(usuarioEmpresas.userId, userId)))
    .limit(1);

  if (!vinculo) {
    throw new Error('Vínculo não encontrado');
  }

  if (vinculo.papel === 'admin') {
    const admins = await db
      .select({ id: usuarioEmpresas.id })
      .from(usuarioEmpresas)
      .where(and(eq(usuarioEmpresas.empresaId, empresaId), eq(usuarioEmpresas.papel, 'admin')));

    if (admins.length <= 1) {
      throw new Error('Não é possível remover o único administrador da empresa');
    }
  }

  if (userId === actorUserId) {
    throw new Error('Remova seu acesso pela seleção de outra empresa ou peça a outro administrador');
  }

  await db
    .delete(usuarioEmpresas)
    .where(and(eq(usuarioEmpresas.empresaId, empresaId), eq(usuarioEmpresas.userId, userId)));
}

export async function assertSetorEmpresa(setorId: number, empresaId: string) {
  const setor = await db.query.setores.findFirst({
    where: and(eq(setores.id, setorId), eq(setores.empresaId, empresaId)),
  });
  if (!setor) {
    throw new Error('Setor não encontrado');
  }
  return setor;
}

export async function assertCompetenciaEmpresa(competenciaId: number, empresaId: string) {
  const competencia = await db.query.competencias.findFirst({
    where: and(eq(competencias.id, competenciaId), eq(competencias.empresaId, empresaId)),
  });
  if (!competencia) {
    throw new Error('Competência não encontrada');
  }
  return competencia;
}

export async function assertFuncionarioEmpresa(funcionarioId: number, empresaId: string) {
  const funcionario = await db.query.funcionarios.findFirst({
    where: and(eq(funcionarios.id, funcionarioId), eq(funcionarios.empresaId, empresaId)),
  });
  if (!funcionario) {
    throw new Error('Funcionário não encontrado');
  }
  return funcionario;
}
