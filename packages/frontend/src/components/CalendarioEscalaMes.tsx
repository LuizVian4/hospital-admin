import type { FuncionarioComTurnos, StatusEspecial, Turno } from '@escala/shared';
import { formatarExibicaoComPlantaoExtra } from '@escala/shared';
import { turnoCellClass, statusEspecialCellClass } from '@/constants/turnos';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { cn } from '@/lib/utils';

const DIAS_SEMANA_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface DiaEscalaInfo {
  turno: Turno | null;
  status: StatusEspecial | null;
  isProjetado: boolean;
  label: string;
}

interface CalendarioEscalaMesProps {
  mes: number;
  ano: number;
  funcionario: FuncionarioComTurnos;
  diaHoje?: number | null;
  /** Células menores para uso em cards laterais */
  compact?: boolean;
}

function buildWeeks(mes: number, ano: number): (number | null)[][] {
  const totalDias = new Date(ano, mes, 0).getDate();
  const offset = new Date(ano, mes - 1, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDias; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function getDiaInfo(funcionario: FuncionarioComTurnos, dia: number): DiaEscalaInfo {
  const turno = funcionario.turnos[dia] ?? funcionario.turnosProjetados?.[dia] ?? null;
  const isProjetado =
    funcionario.turnos[dia] == null && funcionario.turnosProjetados?.[dia] != null;
  const status = funcionario.statusPorDia?.[dia] ?? null;
  const ocorrencia = funcionario.ocorrenciasPorDia?.[dia];

  let label: string;
  if (status) {
    label = status === 'FÉRIAS' ? 'FF' : status.slice(0, 3);
  } else if (ocorrencia?.tipo === 'PLANTAO_EXTRA') {
    label = formatarExibicaoComPlantaoExtra(turno, ocorrencia.turno);
  } else if (ocorrencia?.tipo === 'FALTA') {
    label = 'FALTA';
  } else {
    label = turno ?? '·';
  }

  return { turno, status, isProjetado, label };
}

export function CalendarioEscalaMes({
  mes,
  ano,
  funcionario,
  diaHoje = null,
  compact = false,
}: CalendarioEscalaMesProps) {
  const weeks = buildWeeks(mes, ano);
  const cellSize = compact ? 84 : 64;
  const gap = compact ? 0.25 : 0.5;
  const headerFont = compact ? '0.8rem' : '1rem';
  const dayFont = compact ? '0.9rem' : '2rem';
  const turnoFont = compact ? '0.7rem' : '1rem';

  return (
    <Box sx={{ width: 'fit-content', maxWidth: '100%', mx: compact ? 'auto' : undefined }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(7, ${cellSize}px)`,
          gap,
          mb: gap,
        }}
      >
        {DIAS_SEMANA_HEADER.map((label) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: headerFont,
              py: compact ? 0 : 0.25,
              width: cellSize,
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap }}>
        {weeks.map((week, weekIdx) => (
          <Box
            key={weekIdx}
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(7, ${cellSize}px)`,
              gap,
            }}
          >
            {week.map((dia, cellIdx) => {
              if (dia == null) {
                return (
                  <Box
                    key={`empty-${weekIdx}-${cellIdx}`}
                    sx={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: compact ? 0.75 : 1,
                      bgcolor: 'grey.50',
                    }}
                  />
                );
              }

              const isHoje = dia === diaHoje;
              const dayOfWeek = new Date(ano, mes - 1, dia).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const info = getDiaInfo(funcionario, dia);

              return (
                <Box
                  key={dia}
                  className={cn(
                    'rounded flex flex-col items-center justify-center overflow-hidden',
                    info.status
                      ? statusEspecialCellClass(info.status)
                      : turnoCellClass(info.turno),
                    info.isProjetado && 'turno-projetado'
                  )}
                  title={info.status ?? info.turno ?? undefined}
                  sx={{
                    width: cellSize,
                    height: cellSize,
                    minWidth: 0,
                    border: isHoje ? (compact ? 1.5 : 2) : 1,
                    borderColor: isHoje ? 'primary.main' : 'divider',
                    borderRadius: compact ? 0.75 : 1,
                    opacity: isWeekend && !info.turno && !info.status ? 0.85 : 1,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: dayFont,
                      fontWeight: isHoje ? 700 : 500,
                      lineHeight: 1,
                      color: isHoje ? 'primary.main' : 'inherit',
                      opacity: 0.9,
                    }}
                  >
                    {dia}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: turnoFont,
                      fontWeight: 700,
                      lineHeight: 1,
                      mt: compact ? 0.125 : 0.25,
                      textAlign: 'center',
                      px: 0.125,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {info.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
