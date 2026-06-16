import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const setores = pgTable('setores', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  empresa: text('empresa'),
  gerente: text('gerente'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const funcionarios = pgTable('funcionarios', {
  id: serial('id').primaryKey(),
  matricula: text('matricula').notNull().unique(),
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
});

export const competencias = pgTable(
  'competencias',
  {
    id: serial('id').primaryKey(),
    mes: integer('mes').notNull(),
    ano: integer('ano').notNull(),
    setorId: integer('setor_id').references(() => setores.id),
    observacoes: text('observacoes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueCompetencia: unique().on(t.mes, t.ano, t.setorId),
  })
);

export const escalaInicios = pgTable(
  'escala_inicios',
  {
    id: serial('id').primaryKey(),
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

export const statusEspeciais = pgTable('status_especiais', {
  id: serial('id').primaryKey(),
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

export const setoresRelations = relations(setores, ({ many }) => ({
  funcionarios: many(funcionarios),
  competencias: many(competencias),
}));

export const funcionariosRelations = relations(funcionarios, ({ one, many }) => ({
  setor: one(setores, { fields: [funcionarios.setorId], references: [setores.id] }),
  escalaInicios: many(escalaInicios),
  escalaTrocas: many(escalaTrocas),
  escalaTrocasComoParceiro: many(escalaTrocas, { relationName: 'trocaParceiro' }),
  statusEspeciais: many(statusEspeciais),
}));

export const competenciasRelations = relations(competencias, ({ one, many }) => ({
  setor: one(setores, { fields: [competencias.setorId], references: [setores.id] }),
  escalaInicios: many(escalaInicios),
  escalaTrocas: many(escalaTrocas),
  statusEspeciais: many(statusEspeciais),
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
