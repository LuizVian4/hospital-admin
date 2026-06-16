-- Extensão para busca textual com ILIKE '%termo%'
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funcionarios_setor_id_idx"
	ON "funcionarios" ("setor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funcionarios_ativo_idx"
	ON "funcionarios" ("ativo")
	WHERE "ativo" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funcionarios_setor_ativo_idx"
	ON "funcionarios" ("setor_id", "ativo")
	WHERE "ativo" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "competencias_setor_mes_ano_tipo_idx"
	ON "competencias" ("setor_id", "mes", "ano", "tipo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_especiais_funcionario_id_idx"
	ON "status_especiais" ("funcionario_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funcionarios_nome_trgm_idx"
	ON "funcionarios" USING gin ("nome" gin_trgm_ops);
