CREATE TABLE IF NOT EXISTS "escala_ocorrencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"competencia_id" integer NOT NULL,
	"funcionario_id" integer NOT NULL,
	"dia" integer NOT NULL,
	"tipo" text NOT NULL,
	"turno" text,
	"funcionario_vinculo_id" integer,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "escala_ocorrencias_competencia_id_competencias_id_fk" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "escala_ocorrencias_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "escala_ocorrencias_funcionario_vinculo_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_vinculo_id") REFERENCES "public"."funcionarios"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "escala_ocorrencias_tipo_check" CHECK ("tipo" IN ('PLANTAO_EXTRA', 'FALTA'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "escala_ocorrencias_unique"
	ON "escala_ocorrencias" ("competencia_id", "funcionario_id", "dia");
