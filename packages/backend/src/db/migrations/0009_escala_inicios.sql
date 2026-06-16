CREATE TABLE IF NOT EXISTS "escala_inicios" (
	"id" serial PRIMARY KEY NOT NULL,
	"competencia_id" integer NOT NULL,
	"funcionario_id" integer NOT NULL,
	"mes_inicio" integer NOT NULL,
	"ano_inicio" integer NOT NULL,
	"turno_inicio" text NOT NULL,
	"indice_padrao" integer,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "escala_inicios" ADD CONSTRAINT "escala_inicios_competencia_id_competencias_id_fk" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "escala_inicios" ADD CONSTRAINT "escala_inicios_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "escala_inicios" ("competencia_id", "funcionario_id", "mes_inicio", "ano_inicio", "turno_inicio", "indice_padrao", "ativo")
SELECT "competencia_id", "funcionario_id", "mes_inicio", "ano_inicio", "turno_inicio", "indice_padrao", "ativo"
FROM "escala_dias"
WHERE "tipo_registro" = 'inicio'
	AND "mes_inicio" IS NOT NULL
	AND "ano_inicio" IS NOT NULL
	AND "turno_inicio" IS NOT NULL;
--> statement-breakpoint
DELETE FROM "escala_dias" WHERE "tipo_registro" = 'inicio';
--> statement-breakpoint
DELETE FROM "escala_dias" WHERE "dia" IS NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "escala_dias_turno_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "escala_dias_inicio_ativo_unique";
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP COLUMN IF EXISTS "tipo_registro";
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP COLUMN IF EXISTS "mes_inicio";
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP COLUMN IF EXISTS "ano_inicio";
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP COLUMN IF EXISTS "turno_inicio";
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP COLUMN IF EXISTS "indice_padrao";
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP COLUMN IF EXISTS "ativo";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "escala_inicios_ativo_unique"
	ON "escala_inicios" ("competencia_id", "funcionario_id")
	WHERE "ativo" = true;
--> statement-breakpoint
ALTER TABLE "escala_dias" ALTER COLUMN "dia" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "escala_dias_unique"
	ON "escala_dias" ("competencia_id", "funcionario_id", "dia");
