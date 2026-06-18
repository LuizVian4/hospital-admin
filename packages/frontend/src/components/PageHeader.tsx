import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import type { ReactNode } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';

interface PageHeaderProps {
  heading: string;
  description?: string;
  periodoLabel?: string;
  gerente?: string | null;
  actions?: ReactNode;
}

export function PageHeader({
  heading,
  description,
  periodoLabel,
  gerente,
  actions,
}: PageHeaderProps) {
  const { empresa } = useEmpresa();

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: 'primary.main',
        color: 'common.white',
        boxShadow: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-start' } }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            bgcolor: 'secondary.main',
            color: 'primary.main',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <BusinessIcon />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Empresa
          </Typography>
          <Typography variant="h6" component="p" sx={{ fontWeight: 700, lineHeight: 1.25 }} noWrap>
            {empresa?.nome ?? 'Empresa'}
          </Typography>

          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              mt: 1.5,
              fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.125rem' },
            }}
          >
            {heading}
          </Typography>

          {(description || periodoLabel || gerente) && (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ mt: 1.25, flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
            >
              {description && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {description}
                </Typography>
              )}
              {periodoLabel && (
                <Chip
                  icon={<CalendarMonthIcon sx={{ color: 'rgba(255,255,255,0.9) !important' }} />}
                  label={periodoLabel}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: 'common.white',
                    borderColor: 'rgba(255,255,255,0.35)',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' },
                  }}
                />
              )}
              {gerente && (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <PersonIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }} noWrap>
                    Gerente: <strong>{gerente}</strong>
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Box>

        {actions && (
          <Box sx={{ flexShrink: 0, pt: { xs: 0, sm: 0.5 }, width: { xs: '100%', sm: 'auto' } }}>
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
