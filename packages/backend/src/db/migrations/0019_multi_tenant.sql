CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "empresas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "ativo" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "usuario_empresas" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "empresa_id" uuid NOT NULL REFERENCES "empresas"("id") ON DELETE CASCADE,
  "papel" text NOT NULL DEFAULT 'membro',
  "created_at" timestamptz DEFAULT now(),
  UNIQUE ("user_id", "empresa_id")
);

INSERT INTO "empresas" ("id", "nome", "slug", "ativo")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'HOSPITAL TERESA DE LISIEUX',
  'hospital-teresa-de-lisieux',
  true
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "usuario_empresas" ("user_id", "empresa_id", "papel")
SELECT "id", '00000000-0000-4000-8000-000000000001', 'admin'
FROM "users"
ON CONFLICT ("user_id", "empresa_id") DO NOTHING;

ALTER TABLE "setores" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "setores" SET "empresa_id" = '00000000-0000-4000-8000-000000000001' WHERE "empresa_id" IS NULL;
ALTER TABLE "setores" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "funcionarios" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "funcionarios" SET "empresa_id" = '00000000-0000-4000-8000-000000000001' WHERE "empresa_id" IS NULL;
ALTER TABLE "funcionarios" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "competencias" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "competencias" SET "empresa_id" = '00000000-0000-4000-8000-000000000001' WHERE "empresa_id" IS NULL;
ALTER TABLE "competencias" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "escala_inicios" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "escala_inicios" ei
SET "empresa_id" = c."empresa_id"
FROM "competencias" c
WHERE ei."competencia_id" = c."id" AND ei."empresa_id" IS NULL;
ALTER TABLE "escala_inicios" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "escala_trocas" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "escala_trocas" et
SET "empresa_id" = c."empresa_id"
FROM "competencias" c
WHERE et."competencia_id" = c."id" AND et."empresa_id" IS NULL;
ALTER TABLE "escala_trocas" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "escala_ocorrencias" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "escala_ocorrencias" eo
SET "empresa_id" = c."empresa_id"
FROM "competencias" c
WHERE eo."competencia_id" = c."id" AND eo."empresa_id" IS NULL;
ALTER TABLE "escala_ocorrencias" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "status_especiais" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "status_especiais" se
SET "empresa_id" = COALESCE(
  (SELECT c."empresa_id" FROM "competencias" c WHERE c."id" = se."competencia_id"),
  f."empresa_id"
)
FROM "funcionarios" f
WHERE se."funcionario_id" = f."id" AND se."empresa_id" IS NULL;
ALTER TABLE "status_especiais" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "banco_horas" ADD COLUMN IF NOT EXISTS "empresa_id" uuid REFERENCES "empresas"("id");
UPDATE "banco_horas" bh
SET "empresa_id" = c."empresa_id"
FROM "competencias" c
WHERE bh."competencia_id" = c."id" AND bh."empresa_id" IS NULL;
ALTER TABLE "banco_horas" ALTER COLUMN "empresa_id" SET NOT NULL;

ALTER TABLE "setores" DROP CONSTRAINT IF EXISTS "setores_nome_key";
CREATE UNIQUE INDEX IF NOT EXISTS "setores_empresa_nome_unique" ON "setores" ("empresa_id", "nome");

ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "funcionarios_matricula_key";
CREATE UNIQUE INDEX IF NOT EXISTS "funcionarios_empresa_matricula_unique" ON "funcionarios" ("empresa_id", "matricula");

CREATE INDEX IF NOT EXISTS "setores_empresa_id_idx" ON "setores" ("empresa_id");
CREATE INDEX IF NOT EXISTS "funcionarios_empresa_id_idx" ON "funcionarios" ("empresa_id");
CREATE INDEX IF NOT EXISTS "competencias_empresa_id_idx" ON "competencias" ("empresa_id");
CREATE INDEX IF NOT EXISTS "escala_inicios_empresa_id_idx" ON "escala_inicios" ("empresa_id");
CREATE INDEX IF NOT EXISTS "escala_trocas_empresa_id_idx" ON "escala_trocas" ("empresa_id");
CREATE INDEX IF NOT EXISTS "escala_ocorrencias_empresa_id_idx" ON "escala_ocorrencias" ("empresa_id");
CREATE INDEX IF NOT EXISTS "status_especiais_empresa_id_idx" ON "status_especiais" ("empresa_id");
CREATE INDEX IF NOT EXISTS "banco_horas_empresa_id_idx" ON "banco_horas" ("empresa_id");
CREATE INDEX IF NOT EXISTS "usuario_empresas_empresa_id_idx" ON "usuario_empresas" ("empresa_id");
