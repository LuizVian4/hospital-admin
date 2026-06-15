ALTER TABLE "funcionarios" DROP COLUMN IF EXISTS "dia_inicio_escala";
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD COLUMN IF NOT EXISTS "tipo_registro" text DEFAULT 'turno' NOT NULL;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD COLUMN IF NOT EXISTS "dia_inicio" integer;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD COLUMN IF NOT EXISTS "mes_inicio" integer;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD COLUMN IF NOT EXISTS "ano_inicio" integer;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD COLUMN IF NOT EXISTS "turno_inicio" text;
--> statement-breakpoint
ALTER TABLE "escala_dias" ADD COLUMN IF NOT EXISTS "ativo" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "escala_dias" ALTER COLUMN "dia" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "escala_dias" DROP CONSTRAINT IF EXISTS "escala_dias_competencia_id_funcionario_id_dia_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "escala_dias_turno_unique"
  ON "escala_dias" ("competencia_id", "funcionario_id", "dia")
  WHERE "tipo_registro" = 'turno' AND "dia" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "escala_dias_inicio_ativo_unique"
  ON "escala_dias" ("competencia_id", "funcionario_id")
  WHERE "tipo_registro" = 'inicio' AND "ativo" = true;
