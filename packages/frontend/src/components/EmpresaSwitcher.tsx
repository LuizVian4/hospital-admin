import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import BusinessIcon from '@mui/icons-material/Business';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import CheckIcon from '@mui/icons-material/Check';
import type { PapelEmpresa } from '@escala/shared';
import { useEmpresa } from '@/contexts/EmpresaContext';

function papelLabel(papel: PapelEmpresa) {
  return papel === 'admin' ? 'Administrador' : 'Membro';
}

interface EmpresaSwitcherProps {
  collapsed: boolean;
}

export function EmpresaSwitcher({ collapsed }: EmpresaSwitcherProps) {
  const { empresas, empresa, empresaId, selectEmpresa } = useEmpresa();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const empresasAtivas = empresas.filter((item) => item.ativo);
  const canSwitch = empresasAtivas.length > 1;

  if (!empresa) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!canSwitch) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (id: string) => {
    handleClose();
    if (id === empresaId) return;
    selectEmpresa(id);
    queryClient.clear();
    navigate('/dashboard');
  };

  const switcherButton = (
    <Box
      component="button"
      type="button"
      onClick={handleOpen}
      aria-haspopup={canSwitch ? 'listbox' : undefined}
      aria-expanded={canSwitch ? open : undefined}
      aria-label={canSwitch ? `Empresa ativa: ${empresa.nome}. Clique para trocar.` : `Empresa ativa: ${empresa.nome}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        p: collapsed ? 1 : 1.5,
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.2)',
        bgcolor: 'rgba(255,255,255,0.1)',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        cursor: canSwitch ? 'pointer' : 'default',
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': canSwitch
          ? {
              bgcolor: 'rgba(255,255,255,0.16)',
              borderColor: 'rgba(255,255,255,0.32)',
            }
          : undefined,
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'secondary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: collapsed ? 32 : 40,
          height: collapsed ? 32 : 40,
          borderRadius: 1.5,
          bgcolor: 'secondary.main',
          color: 'primary.main',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <BusinessIcon sx={{ fontSize: collapsed ? 18 : 22 }} />
      </Box>

      {!collapsed && (
        <>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.2,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              Empresa ativa
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: 'common.white', lineHeight: 1.3 }}
              noWrap
            >
              {empresa.nome}
            </Typography>
            <Chip
              label={papelLabel(empresa.papel)}
              size="small"
              sx={{
                mt: 0.75,
                height: 20,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: empresa.papel === 'admin' ? 'secondary.main' : 'rgba(255,255,255,0.14)',
                color: empresa.papel === 'admin' ? 'primary.main' : 'common.white',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
          {canSwitch && (
            <UnfoldMoreIcon sx={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
          )}
        </>
      )}
    </Box>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip title={`${empresa.nome}${canSwitch ? ' — clique para trocar' : ''}`} placement="right" arrow>
          {switcherButton}
        </Tooltip>
      ) : (
        switcherButton
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 280,
              maxWidth: 'min(320px, calc(100vw - 2rem))',
              mt: -1,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
            Trocar empresa
          </Typography>
        </Box>
        {empresasAtivas.map((item) => {
          const selected = item.id === empresaId;
          return (
            <MenuItem
              key={item.id}
              selected={selected}
              onClick={() => handleSelect(item.id)}
              sx={{ py: 1.25, alignItems: 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                {selected ? <CheckIcon fontSize="small" color="primary" /> : <Box sx={{ width: 20 }} />}
              </ListItemIcon>
              <ListItemText
                primary={item.nome}
                secondary={papelLabel(item.papel)}
                slotProps={{
                  primary: { sx: { fontWeight: selected ? 700 : 500 }, noWrap: true },
                  secondary: { variant: 'caption' },
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
