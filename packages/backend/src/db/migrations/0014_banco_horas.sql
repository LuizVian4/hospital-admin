CREATE TABLE IF NOT EXISTS "banco_horas" (
	"id" serial PRIMARY KEY NOT NULL,
	"competencia_id" integer NOT NULL,
	"funcionario_id" integer NOT NULL,
	"carga_contratada" text NOT NULL,
	"horas_contratadas" integer NOT NULL,
	"horas_trabalhadas" integer NOT NULL,
	"turnos_trabalhados" real NOT NULL,
	"saldo_horas" integer NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banco_horas" ADD CONSTRAINT "banco_horas_competencia_id_competencias_id_fk" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "banco_horas" ADD CONSTRAINT "banco_horas_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "banco_horas_competencia_funcionario_unique" ON "banco_horas" ("competencia_id","funcionario_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banco_horas_competencia_id_idx" ON "banco_horas" ("competencia_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banco_horas_status_idx" ON "banco_horas" ("status");
