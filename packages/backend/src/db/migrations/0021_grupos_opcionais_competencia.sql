ALTER TABLE "competencias" ADD COLUMN "grupos_opcionais_ativos" jsonb NOT NULL DEFAULT '[]'::jsonb;
