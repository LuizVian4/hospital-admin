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

export const escalaDias = pgTable('escala_dias', {
  id: serial('id').primaryKey(),
  competenciaId: integer('competencia_id')
    .notNull()
    .references(() => competencias.id, { onDelete: 'cascade' }),
  funcionarioId: integer('funcionario_id')
    .notNull()
    .references(() => funcionarios.id),
  /** 'turno' = célula diária; 'inicio' = configuração de início da escala no mês */
  tipoRegistro: text('tipo_registro').notNull().default('turno'),
  /** Dia do mês (1–31) — apenas para tipo_registro = 'turno' */
  dia: integer('dia'),
  turno: text('turno'),
  observacao: text('observacao'),
  /** Início da escala — preenchido quando tipo_registro = 'inicio' */
  diaInicio: integer('dia_inicio'),
  mesInicio: integer('mes_inicio'),
  anoInicio: integer('ano_inicio'),
  turnoInicio: text('turno_inicio'),
  /** Posição no ciclo (0–4) — apenas para tipo_registro = 'inicio' */
  indicePadrao: integer('indice_padrao'),
  /** Apenas para tipo_registro = 'inicio': config ativa do mês */
  ativo: boolean('ativo').default(true).notNull(),
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
  escalaDias: many(escalaDias),
  statusEspeciais: many(statusEspeciais),
}));

export const competenciasRelations = relations(competencias, ({ one, many }) => ({
  setor: one(setores, { fields: [competencias.setorId], references: [setores.id] }),
  escalaDias: many(escalaDias),
  statusEspeciais: many(statusEspeciais),
}));

export const escalaDiasRelations = relations(escalaDias, ({ one }) => ({
  competencia: one(competencias, {
    fields: [escalaDias.competenciaId],
    references: [competencias.id],
  }),
  funcionario: one(funcionarios, {
    fields: [escalaDias.funcionarioId],
    references: [funcionarios.id],
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
