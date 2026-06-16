import { useMemo } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { FERIADO_TIPO_LABEL, getFeriadosNoMes } from '@escala/shared';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface LegendaFeriadosProps {
  mes: number;
  ano: number;
}

export function LegendaFeriados({ mes, ano }: LegendaFeriadosProps) {
  const feriados = useMemo(() => getFeriadosNoMes(mes, ano), [mes, ano]);

  return (
    <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CalendarMonthIcon fontSize="small" color="action" />
          <Typography variant="subtitle2">
            Calendário — Salvador/BA
            {feriados.length > 0 && (
              <Chip label={feriados.length} size="small" sx={{ ml: 1, height: 20 }} />
            )}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="Fim de semana e feriado"
              size="small"
              variant="outlined"
              sx={{
                bgcolor: 'white',
                borderColor: 'grey.400',
                borderStyle: 'dashed',
                color: 'grey.700',
              }}
            />
            <Chip
              label="Hoje"
              size="small"
              variant="outlined"
              color="primary"
            />
            <Chip
              label="Sem cobertura MT/SN"
              size="small"
              variant="outlined"
              sx={{ bgcolor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}
            />
          </Stack>

          {feriados.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Feriado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Tipo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feriados.map((f) => (
                    <TableRow key={`${f.dia}-${f.nome}`} hover>
                      <TableCell sx={{ fontWeight: 500, color: 'error.dark', whiteSpace: 'nowrap' }}>
                        {String(f.dia).padStart(2, '0')}/{String(f.mes).padStart(2, '0')}
                      </TableCell>
                      <TableCell>{f.nome}</TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          {FERIADO_TIPO_LABEL[f.tipo]}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhum feriado em {MESES[mes - 1]} / {ano}.
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Feriados nacionais, estaduais da Bahia e municipais de Salvador são calculados
            automaticamente, incluindo datas móveis (Carnaval, Sexta-feira Santa e Corpus Christi).
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
