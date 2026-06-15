CREATE TABLE IF NOT EXISTS "setores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"empresa" text,
	"gerente" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "setores_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "funcionarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"matricula" text NOT NULL,
	"nome" text NOT NULL,
	"coren" text,
	"categoria" text,
	"tipo_contrato" text,
	"data_admissao" date,
	"carga_horaria" text DEFAULT '180H',
	"setor_id" integer,
	"ordem_escala" integer DEFAULT 0,
	"ativo" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "funcionarios_matricula_unique" UNIQUE("matricula")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"setor_id" integer,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "competencias_mes_ano_setor_id_unique" UNIQUE("mes","ano","setor_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escala_dias" (
	"id" serial PRIMARY KEY NOT NULL,
	"competencia_id" integer NOT NULL,
	"funcionario_id" integer NOT NULL,
	"dia" integer NOT NULL,
	"turno" text,
	CONSTRAINT "escala_dias_competencia_id_funcionario_id_dia_unique" UNIQUE("competencia_id","funcionario_id","dia")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "status_especiais" (
	"id" serial PRIMARY KEY NOT NULL,
	"competencia_id" integer NOT NULL,
	"funcionario_id" integer NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "status_especiais_competencia_id_funcionario_id_unique" UNIQUE("competencia_id","funcionario_id")
);
--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_setor_id_setores_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "competencias" ADD CONSTRAINT "competencias_setor_id_setores_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD CONSTRAINT "escala_dias_competencia_id_competencias_id_fk" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD CONSTRAINT "escala_dias_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "status_especiais" ADD CONSTRAINT "status_especiais_competencia_id_competencias_id_fk" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "status_especiais" ADD CONSTRAINT "status_especiais_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE no action ON UPDATE no action;
