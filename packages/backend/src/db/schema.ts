import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  unique,
  real,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const empresas = pgTable('empresas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  ativo: boolean('ativo').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nome: text('nome').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const usuarioEmpresas = pgTable(
  'usuario_empresas',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id, { onDelete: 'cascade' }),
    papel: text('papel').notNull().default('membro'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueUsuarioEmpresa: unique().on(t.userId, t.empresaId),
  })
);

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const setores = pgTable(
  'setores',
  {
    id: serial('id').primaryKey(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id),
    nome: text('nome').notNull(),
    empresa: text('empresa'),
    gerente: text('gerente'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueSetorEmpresa: unique().on(t.empresaId, t.nome),
  })
);

export const funcionarios = pgTable(
  'funcionarios',
  {
    id: serial('id').primaryKey(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id),
    matricula: text('matricula').notNull(),
    nome: text('nome').notNull(),
  coren: text('coren'),
  categoria: text('categoria'),
  tipoContrato: text('tipo_contrato'),
  dataAdmissao: date('data_admissao'),
  cargaHoraria: text('carga_horaria').default('180H'),
  setorId: integer('setor_id').references(() => setores.id),
  ordemEscala: integer('ordem_escala').default(0),
    ativo: boolean('ativo').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueMatriculaEmpresa: unique().on(t.empresaId, t.matricula),
  })
);

export const competencias = pgTable(
  'competencias',
  {
    id: serial('id').primaryKey(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id),
    mes: integer('mes').notNull(),
    ano: integer('ano').notNull(),
    setorId: integer('setor_id').references(() => setores.id),
    tipo: text('tipo').notNull().default('tecnico'),
    observacoes: text('observacoes'),
    bancoHorasDirty: boolean('banco_horas_dirty').notNull().default(true),
    bancoHorasSyncedAt: timestamp('banco_horas_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueCompetencia: unique().on(t.mes, t.ano, t.setorId, t.tipo),
  })
);

export const escalaInicios = pgTable(
  'escala_inicios',
  {
    id: serial('id').primaryKey(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id),
    competenciaId: integer('competencia_id')
      .notNull()
      .references(() => competencias.id, { onDelete: 'cascade' }),
    funcionarioId: integer('funcionario_id')
      .notNull()
      .references(() => funcionarios.id),
    mesInicio: integer('mes_inicio').notNull(),
    anoInicio: integer('ano_inicio').notNull(),
    turnoInicio: text('turno_inicio').notNull(),
    indicePadrao: integer('indice_padrao'),
  },
  (t) => ({
    uniqueInicio: unique().on(t.competenciaId, t.funcionarioId),
  })
);

export const escalaTrocas = pgTable('escala_trocas', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id')
    .notNull()
    .references(() => empresas.id),
  competenciaId: integer('competencia_id')
    .notNull()
    .references(() => competencias.id, { onDelete: 'cascade' }),
  funcionarioId: integer('funcionario_id')
    .notNull()
    .references(() => funcionarios.id),
  dia: integer('dia').notNull(),
  turnoAnterior: text('turno_anterior').notNull(),
  turnoNovo: text('turno_novo').notNull(),
  funcionarioTrocaId: integer('funcionario_troca_id')
    .notNull()
    .references(() => funcionarios.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const escalaOcorrencias = pgTable(
  'escala_ocorrencias',
  {
    id: serial('id').primaryKey(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id),
    competenciaId: integer('competencia_id')
      .notNull()
      .references(() => competencias.id, { onDelete: 'cascade' }),
    funcionarioId: integer('funcionario_id')
      .notNull()
      .references(() => funcionarios.id),
    dia: integer('dia').notNull(),
    tipo: text('tipo').notNull(),
    turno: text('turno'),
    funcionarioVinculoId: integer('funcionario_vinculo_id').references(() => funcionarios.id),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueOcorrencia: unique().on(t.competenciaId, t.funcionarioId, t.dia),
  })
);

export const statusEspeciais = pgTable('status_especiais', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id')
    .notNull()
    .references(() => empresas.id),
  competenciaId: integer('competencia_id').references(() => competencias.id, {
    onDelete: 'cascade',
  }),
  funcionarioId: integer('funcionario_id')
    .notNull()
    .references(() => funcionarios.id),
  status: text('status').notNull(),
  dataInicio: date('data_inicio'),
  dataFim: date('data_fim'),
});

export const bancoHoras = pgTable(
  'banco_horas',
  {
    id: serial('id').primaryKey(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id),
    competenciaId: integer('competencia_id')
      .notNull()
      .references(() => competencias.id, { onDelete: 'cascade' }),
    funcionarioId: integer('funcionario_id')
      .notNull()
      .references(() => funcionarios.id, { onDelete: 'cascade' }),
    cargaContratada: text('carga_contratada').notNull(),
    horasContratadas: integer('horas_contratadas').notNull(),
    horasTrabalhadas: integer('horas_trabalhadas').notNull(),
    turnosTrabalhados: real('turnos_trabalhados').notNull(),
    saldoHoras: integer('saldo_horas').notNull(),
    status: text('status').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueBancoHoras: unique().on(t.competenciaId, t.funcionarioId),
  })
);

export const empresasRelations = relations(empresas, ({ many }) => ({
  usuarioEmpresas: many(usuarioEmpresas),
  setores: many(setores),
  funcionarios: many(funcionarios),
  competencias: many(competencias),
}));

export const usuarioEmpresasRelations = relations(usuarioEmpresas, ({ one }) => ({
  user: one(users, { fields: [usuarioEmpresas.userId], references: [users.id] }),
  empresa: one(empresas, { fields: [usuarioEmpresas.empresaId], references: [empresas.id] }),
}));

export const setoresRelations = relations(setores, ({ one, many }) => ({
  empresa: one(empresas, { fields: [setores.empresaId], references: [empresas.id] }),
  funcionarios: many(funcionarios),
  competencias: many(competencias),
}));

export const funcionariosRelations = relations(funcionarios, ({ one, many }) => ({
  empresa: one(empresas, { fields: [funcionarios.empresaId], references: [empresas.id] }),
  setor: one(setores, { fields: [funcionarios.setorId], references: [setores.id] }),
  escalaInicios: many(escalaInicios),
  escalaTrocas: many(escalaTrocas),
  escalaTrocasComoParceiro: many(escalaTrocas, { relationName: 'trocaParceiro' }),
  escalaOcorrencias: many(escalaOcorrencias),
  escalaOcorrenciasVinculo: many(escalaOcorrencias, { relationName: 'ocorrenciaVinculo' }),
  statusEspeciais: many(statusEspeciais),
  bancoHoras: many(bancoHoras),
}));

export const competenciasRelations = relations(competencias, ({ one, many }) => ({
  empresa: one(empresas, { fields: [competencias.empresaId], references: [empresas.id] }),
  setor: one(setores, { fields: [competencias.setorId], references: [setores.id] }),
  escalaInicios: many(escalaInicios),
  escalaTrocas: many(escalaTrocas),
  escalaOcorrencias: many(escalaOcorrencias),
  statusEspeciais: many(statusEspeciais),
  bancoHoras: many(bancoHoras),
}));

export const escalaIniciosRelations = relations(escalaInicios, ({ one }) => ({
  competencia: one(competencias, {
    fields: [escalaInicios.competenciaId],
    references: [competencias.id],
  }),
  funcionario: one(funcionarios, {
    fields: [escalaInicios.funcionarioId],
    references: [funcionarios.id],
  }),
}));

export const escalaTrocasRelations = relations(escalaTrocas, ({ one }) => ({
  competencia: one(competencias, {
    fields: [escalaTrocas.competenciaId],
    references: [competencias.id],
  }),
  funcionario: one(funcionarios, {
    fields: [escalaTrocas.funcionarioId],
    references: [funcionarios.id],
  }),
  funcionarioTroca: one(funcionarios, {
    fields: [escalaTrocas.funcionarioTrocaId],
    references: [funcionarios.id],
    relationName: 'trocaParceiro',
  }),
}));

export const escalaOcorrenciasRelations = relations(escalaOcorrencias, ({ one }) => ({
  competencia: one(competencias, {
    fields: [escalaOcorrencias.competenciaId],
    references: [competencias.id],
  }),
  funcionario: one(funcionarios, {
    fields: [escalaOcorrencias.funcionarioId],
    references: [funcionarios.id],
  }),
  funcionarioVinculo: one(funcionarios, {
    fields: [escalaOcorrencias.funcionarioVinculoId],
    references: [funcionarios.id],
    relationName: 'ocorrenciaVinculo',
  }),
}));

export const statusEspeciaisRelations = relations(statusEspeciais, ({ one }) => ({
  competencia: one(competencias, {
    fields: [statusEspeciais.competenciaId],
    references: [competencias.id],
  }),
  funcionario: one(funcionarios, {
    fields: [statusEspeciais.funcionarioId],
    references: [funcionarios.id],
  }),
}));

export const bancoHorasRelations = relations(bancoHoras, ({ one }) => ({
  competencia: one(competencias, {
    fields: [bancoHoras.competenciaId],
    references: [competencias.id],
  }),
  funcionario: one(funcionarios, {
    fields: [bancoHoras.funcionarioId],
    references: [funcionarios.id],
  }),
}));
