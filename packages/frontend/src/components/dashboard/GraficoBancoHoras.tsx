import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import type { BancoHorasComDetalhes } from '@escala/shared';
import { labelStatusCargaHoraria } from '@escala/shared';

interface GraficoBancoHorasProps {
  items: BancoHorasComDetalhes[];
  mes: number;
  ano: number;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function GraficoBancoHoras({ items, mes, ano }: GraficoBancoHorasProps) {
  const periodoLabel = `${MESES[mes - 1]}/${ano}`;
  const maxAbs = Math.max(...items.map((i) => Math.abs(i.saldoHoras)), 12);

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1, flexWrap: 'wrap' }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Banco de horas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Funcionários devendo ou excedendo carga em {periodoLabel}
            </Typography>
          </Box>
          <Link component={RouterLink} to="/banco-horas" underline="hover" variant="body2">
            Ver tabela completa
          </Link>
        </Stack>

        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum funcionário com saldo pendente neste período.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {items.slice(0, 12).map((item) => {
              const widthPercent = (Math.abs(item.saldoHoras) / maxAbs) * 100;
              const isDevendo = item.status === 'devendo';
              const barColor = isDevendo ? 'error.main' : 'success.main';
              const bgColor = isDevendo ? 'error.50' : 'success.50';

              return (
                <Box key={`${item.competenciaId}-${item.funcionarioId}`}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {item.funcionarioNome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.funcionarioMatricula}
                        {item.setorNome ? ` · ${item.setorNome}` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={labelStatusCargaHoraria(item.status, item.saldoHoras)}
                      color={isDevendo ? 'error' : 'success'}
                      variant="outlined"
                    />
                  </Stack>
                  <Box
                    sx={{
                      position: 'relative',
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'grey.100',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${Math.max(widthPercent, 4)}%`,
                        bgcolor: bgColor,
                        borderRadius: 5,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${Math.max(widthPercent, 4)}%`,
                        bgcolor: barColor,
                        borderRadius: 5,
                        opacity: 0.85,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                    {item.horasTrabalhadas}h trabalhadas de {item.horasContratadas}h contratadas
                  </Typography>
                </Box>
              );
            })}
            {items.length > 12 && (
              <Typography variant="caption" color="text.secondary">
                +{items.length - 12} funcionário(s) — veja todos na tabela de banco de horas.
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
