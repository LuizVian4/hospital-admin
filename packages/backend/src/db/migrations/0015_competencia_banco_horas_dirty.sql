ALTER TABLE "competencias" ADD COLUMN IF NOT EXISTS "banco_horas_dirty" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE "competencias" ADD COLUMN IF NOT EXISTS "banco_horas_synced_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "competencias" c
SET
  "banco_horas_dirty" = false,
  "banco_horas_synced_at" = NOW()
WHERE EXISTS (
  SELECT 1 FROM "banco_horas" bh WHERE bh."competencia_id" = c."id"
);
