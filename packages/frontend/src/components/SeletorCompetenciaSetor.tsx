import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { api } from '@/api/client';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface SeletorCompetenciaSetorProps {
  setorId: number;
  setorNome: string;
}

export function SeletorCompetenciaSetor({ setorId, setorNome }: SeletorCompetenciaSetorProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data: competencias = [], isLoading } = useQuery({
    queryKey: ['competencias-setor', setorId],
    queryFn: () => api.listCompetenciasSetor(setorId),
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
    navigate(`/setores/${setorId}/escala/${mes}/${ano}`);
  };

  return (
    <>
      <Tooltip title="Abrir escala do setor">
        <IconButton size="small" onClick={handleOpen} aria-label={`Abrir escala de ${setorNome}`}>
          <OpenInNewIcon fontSize="small" />
        </IconButton>
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
            {setorNome}
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
