-- A migration 0019 tentou remover "funcionarios_matricula_key", mas a constraint original
-- foi criada como "funcionarios_matricula_unique" (unique global por matrícula).
-- Isso impedia empresas diferentes de terem funcionários com a mesma matrícula.
ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "funcionarios_matricula_unique";
ALTER TABLE "funcionarios" DROP CONSTRAINT IF EXISTS "funcionarios_matricula_key";

CREATE UNIQUE INDEX IF NOT EXISTS "funcionarios_empresa_matricula_unique" ON "funcionarios" ("empresa_id", "matricula");
