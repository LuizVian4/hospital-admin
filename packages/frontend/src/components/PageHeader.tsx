import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import type { ReactNode } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { StatusChip } from '@/components/StatusChip';

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
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between' }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1.4, letterSpacing: '0.08em' }}
        >
          {empresa?.nome ?? 'Empresa'}
        </Typography>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
        >
          {heading}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
            {description}
          </Typography>
        )}
        {(periodoLabel || gerente) && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            {periodoLabel && (
              <StatusChip
                tone="primary"
                icon={<CalendarMonthIcon />}
                label={periodoLabel}
              />
            )}
            {gerente && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <PersonIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  Gerente: <strong>{gerente}</strong>
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      {actions && <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>{actions}</Box>}
    </Stack>
  );
}
