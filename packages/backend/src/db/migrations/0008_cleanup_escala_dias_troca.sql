-- Converte registros de troca em turnos manuais (antes de remover o tipo troca)
UPDATE escala_dias AS turno_row
SET turno = troca_row.turno
FROM escala_dias AS troca_row
WHERE turno_row.tipo_registro = 'turno'
  AND troca_row.tipo_registro = 'troca'
  AND turno_row.competencia_id = troca_row.competencia_id
  AND turno_row.funcionario_id = troca_row.funcionario_id
  AND turno_row.dia = troca_row.dia;

INSERT INTO escala_dias (competencia_id, funcionario_id, tipo_registro, dia, turno, ativo)
SELECT troca.competencia_id, troca.funcionario_id, 'turno', troca.dia, troca.turno, true
FROM escala_dias troca
WHERE troca.tipo_registro = 'troca'
  AND troca.dia IS NOT NULL
  AND troca.turno IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM escala_dias t
    WHERE t.tipo_registro = 'turno'
      AND t.competencia_id = troca.competencia_id
      AND t.funcionario_id = troca.funcionario_id
      AND t.dia = troca.dia
  );

DELETE FROM escala_dias WHERE tipo_registro = 'troca';

ALTER TABLE escala_dias DROP COLUMN IF EXISTS observacao;
