DELETE FROM "escala_inicios" WHERE "ativo" = false;
--> statement-breakpoint
DROP INDEX IF EXISTS "escala_inicios_ativo_unique";
--> statement-breakpoint
ALTER TABLE "escala_inicios" DROP COLUMN IF EXISTS "ativo";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "escala_inicios_unique"
	ON "escala_inicios" ("competencia_id", "funcionario_id");
