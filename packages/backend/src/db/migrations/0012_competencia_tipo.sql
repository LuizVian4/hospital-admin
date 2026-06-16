ALTER TABLE competencias ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'tecnico';
--> statement-breakpoint
ALTER TABLE competencias DROP CONSTRAINT IF EXISTS competencias_mes_ano_setor_id_unique;
--> statement-breakpoint
INSERT INTO competencias (mes, ano, setor_id, observacoes, tipo, created_at)
SELECT c.mes, c.ano, c.setor_id, NULL, 'enfermeiro', c.created_at
FROM competencias c
WHERE c.tipo = 'tecnico'
  AND NOT EXISTS (
    SELECT 1 FROM competencias c2
    WHERE c2.mes = c.mes
      AND c2.ano = c.ano
      AND c2.setor_id = c.setor_id
      AND c2.tipo = 'enfermeiro'
  );
--> statement-breakpoint
UPDATE escala_inicios ei
SET competencia_id = mapped.novo_id
FROM (
  SELECT ei2.id AS inicio_id, c_enf.id AS novo_id
  FROM escala_inicios ei2
  INNER JOIN competencias c_tec ON ei2.competencia_id = c_tec.id AND c_tec.tipo = 'tecnico'
  INNER JOIN competencias c_enf
    ON c_enf.mes = c_tec.mes
   AND c_enf.ano = c_tec.ano
   AND c_enf.setor_id = c_tec.setor_id
   AND c_enf.tipo = 'enfermeiro'
  INNER JOIN funcionarios f ON f.id = ei2.funcionario_id
  WHERE upper(trim(f.categoria)) = 'ENFERMEIRO'
) mapped
WHERE ei.id = mapped.inicio_id;
--> statement-breakpoint
UPDATE escala_trocas et
SET competencia_id = mapped.novo_id
FROM (
  SELECT et2.id AS troca_id, c_enf.id AS novo_id
  FROM escala_trocas et2
  INNER JOIN competencias c_tec ON et2.competencia_id = c_tec.id AND c_tec.tipo = 'tecnico'
  INNER JOIN competencias c_enf
    ON c_enf.mes = c_tec.mes
   AND c_enf.ano = c_tec.ano
   AND c_enf.setor_id = c_tec.setor_id
   AND c_enf.tipo = 'enfermeiro'
  INNER JOIN funcionarios f ON f.id = et2.funcionario_id
  WHERE upper(trim(f.categoria)) = 'ENFERMEIRO'
) mapped
WHERE et.id = mapped.troca_id;
--> statement-breakpoint
UPDATE status_especiais se
SET competencia_id = mapped.novo_id
FROM (
  SELECT se2.id AS status_id, c_enf.id AS novo_id
  FROM status_especiais se2
  INNER JOIN competencias c_tec ON se2.competencia_id = c_tec.id AND c_tec.tipo = 'tecnico'
  INNER JOIN competencias c_enf
    ON c_enf.mes = c_tec.mes
   AND c_enf.ano = c_tec.ano
   AND c_enf.setor_id = c_tec.setor_id
   AND c_enf.tipo = 'enfermeiro'
  INNER JOIN funcionarios f ON f.id = se2.funcionario_id
  WHERE upper(trim(f.categoria)) = 'ENFERMEIRO'
) mapped
WHERE se.id = mapped.status_id;
--> statement-breakpoint
ALTER TABLE competencias DROP CONSTRAINT IF EXISTS competencias_mes_ano_setor_id_tipo_unique;
--> statement-breakpoint
ALTER TABLE competencias ADD CONSTRAINT competencias_mes_ano_setor_id_tipo_unique UNIQUE (mes, ano, setor_id, tipo);
