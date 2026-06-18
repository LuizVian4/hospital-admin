-- A migration 0019 tentou remover "setores_nome_key", mas a constraint original
-- foi criada como "setores_nome_unique" (unique global por nome).
-- Isso impedia empresas diferentes de terem setores com o mesmo nome.
ALTER TABLE "setores" DROP CONSTRAINT IF EXISTS "setores_nome_unique";
ALTER TABLE "setores" DROP CONSTRAINT IF EXISTS "setores_nome_key";

CREATE UNIQUE INDEX IF NOT EXISTS "setores_empresa_nome_unique" ON "setores" ("empresa_id", "nome");
