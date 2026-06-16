CREATE TABLE IF NOT EXISTS "escala_trocas" (
  "id" serial PRIMARY KEY NOT NULL,
  "competencia_id" integer NOT NULL REFERENCES "competencias"("id") ON DELETE CASCADE,
  "funcionario_id" integer NOT NULL REFERENCES "funcionarios"("id"),
  "dia" integer NOT NULL,
  "turno_anterior" text NOT NULL,
  "turno_novo" text NOT NULL,
  "funcionario_troca_id" integer NOT NULL REFERENCES "funcionarios"("id"),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "escala_trocas_competencia_id_idx" ON "escala_trocas" ("competencia_id");
CREATE INDEX IF NOT EXISTS "escala_trocas_funcionario_id_idx" ON "escala_trocas" ("funcionario_id");
