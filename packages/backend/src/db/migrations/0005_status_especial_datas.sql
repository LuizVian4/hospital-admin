ALTER TABLE "status_especiais" ADD COLUMN IF NOT EXISTS "data_inicio" date;
ALTER TABLE "status_especiais" ADD COLUMN IF NOT EXISTS "data_fim" date;
ALTER TABLE "status_especiais" ALTER COLUMN "competencia_id" DROP NOT NULL;

UPDATE "status_especiais" se
SET
  "data_inicio" = make_date(c.ano, c.mes, 1),
  "data_fim" = (make_date(c.ano, c.mes, 1) + interval '1 month' - interval '1 day')::date
FROM "competencias" c
WHERE se.competencia_id = c.id
  AND (se.data_inicio IS NULL OR se.data_fim IS NULL);

ALTER TABLE "status_especiais" DROP CONSTRAINT IF EXISTS "status_especiais_competencia_id_funcionario_id_unique";
