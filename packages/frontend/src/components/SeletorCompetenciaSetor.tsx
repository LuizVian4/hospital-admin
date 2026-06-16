import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { TipoEscala } from '@escala/shared';
import { api } from '@/api/client';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CONFIG: Record<TipoEscala, { label: string; pathSegment: string }> = {
  tecnico: { label: 'Técnicos', pathSegment: 'escala' },
  enfermeiro: { label: 'Enfermeiros', pathSegment: 'escala-enfermeiros' },
};

interface SeletorCompetenciaSetorProps {
  setorId: number;
  setorNome: string;
  tipoEscala: TipoEscala;
}

export function SeletorCompetenciaSetor({ setorId, setorNome, tipoEscala }: SeletorCompetenciaSetorProps) {
  const config = CONFIG[tipoEscala];
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data: competencias = [], isLoading } = useQuery({
    queryKey: ['competencias-setor', setorId, tipoEscala],
    queryFn: () => api.listCompetenciasSetor(setorId, tipoEscala),
    enabled: open,
  });

  const competenciasOrdenadas = [...competencias].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (mes: number, ano: number) => {
    handleClose();
    navigate(`/setores/${setorId}/${config.pathSegment}/${mes}/${ano}`);
  };

  return (
    <>
      <Tooltip title={`Escolher competência de ${config.label.toLowerCase()} e abrir a escala`}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={handleOpen}
          aria-label={`Mostrar escalas de ${config.label.toLowerCase()} — ${setorNome}`}
          sx={{ textTransform: 'none' }}
        >
          {config.label}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200, maxHeight: 320 } } }}
      >
        <MenuItem disabled sx={{ opacity: 1, py: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {setorNome} — {config.label}
          </Typography>
        </MenuItem>
        <Divider />

        {isLoading && (
          <MenuItem disabled sx={{ justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </MenuItem>
        )}

        {!isLoading && competenciasOrdenadas.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nenhuma competência cadastrada
            </Typography>
          </MenuItem>
        )}

        {!isLoading &&
          competenciasOrdenadas.map((comp) => (
            <MenuItem key={comp.id} onClick={() => handleSelect(comp.mes, comp.ano)}>
              {MESES[comp.mes - 1]} / {comp.ano}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}

interface SeletoresCompetenciaSetorProps {
  setorId: number;
  setorNome: string;
  mostrarTecnicos: boolean;
  mostrarEnfermeiros: boolean;
}

export function SeletoresCompetenciaSetor({
  setorId,
  setorNome,
  mostrarTecnicos,
  mostrarEnfermeiros,
}: SeletoresCompetenciaSetorProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
      {mostrarTecnicos && (
        <SeletorCompetenciaSetor setorId={setorId} setorNome={setorNome} tipoEscala="tecnico" />
      )}
      {mostrarEnfermeiros && (
        <SeletorCompetenciaSetor setorId={setorId} setorNome={setorNome} tipoEscala="enfermeiro" />
      )}
    </Stack>
  );
}
