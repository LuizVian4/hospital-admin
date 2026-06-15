import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { TURNOS_LEGEND } from '@/constants/turnos';

const TURNO_CHIP_COLORS: Record<string, { bgcolor: string; color: string; borderColor: string }> = {
  MT: { bgcolor: '#dbeafe', color: '#1e3a8a', borderColor: '#93c5fd' },
  SN: { bgcolor: '#f3e8ff', color: '#581c87', borderColor: '#d8b4fe' },
  F: { bgcolor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' },
  FF: { bgcolor: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' },
  '/': { bgcolor: '#ffffff', color: '#334155', borderColor: '#cbd5e1' },
  INSS: { bgcolor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' },
  LG: { bgcolor: '#fce7f3', color: '#9d174d', borderColor: '#f9a8d4' },
};

export function LegendaTurnos() {
  return (
    <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <InfoOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2">Legenda de turnos</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {TURNOS_LEGEND.map(({ sigla, desc }) => {
              const colors = TURNO_CHIP_COLORS[sigla] ?? {
                bgcolor: 'grey.100',
                color: 'text.primary',
                borderColor: 'grey.300',
              };
              return (
                <Chip
                  key={sigla}
                  label={
                    <Box component="span">
                      <Box component="span" sx={{ fontWeight: 700, mr: 0.75 }}>
                        {sigla}
                      </Box>
                      {desc}
                    </Box>
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    bgcolor: colors.bgcolor,
                    color: colors.color,
                    borderColor: colors.borderColor,
                    '& .MuiChip-label': { px: 1.25 },
                  }}
                />
              );
            })}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Arraste o nome do enfermeiro para um dos{' '}
            <strong>grupos de escala</strong> na planilha, ou selecione o grupo na seção
            &quot;Sem atribuição&quot;. Funcionários com grupo podem usar{' '}
            <strong>Troca</strong> em qualquer dia para permutar o turno com outro enfermeiro.
            Turnos com troca realizada aparecem com destaque violeta — passe o mouse para ver a
            observação.
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
