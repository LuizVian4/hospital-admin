import Chip from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactElement, ReactNode } from 'react';

export type StatusTone = 'success' | 'warning' | 'info' | 'neutral' | 'primary';

const TONE_SX: Record<StatusTone, SxProps<Theme>> = {
  success: { bgcolor: 'rgba(22, 163, 74, 0.12)', color: '#166534' },
  warning: { bgcolor: 'rgba(217, 119, 6, 0.14)', color: '#92400e' },
  info: { bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#075985' },
  primary: { bgcolor: 'rgba(26, 43, 76, 0.08)', color: '#1A2B4C' },
  neutral: { bgcolor: 'rgba(100, 116, 139, 0.14)', color: '#334155' },
};

interface StatusChipProps {
  label: ReactNode;
  tone?: StatusTone;
  icon?: ReactElement;
  size?: 'small' | 'medium';
}

export function StatusChip({ label, tone = 'neutral', icon, size = 'small' }: StatusChipProps) {
  return (
    <Chip
      size={size}
      label={label}
      icon={icon}
      sx={{
        height: size === 'small' ? 24 : 28,
        fontWeight: 600,
        border: 'none',
        ...TONE_SX[tone],
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  );
}

export function contratoTone(contrato: string): StatusTone {
  const t = contrato.toUpperCase();
  if (t.includes('EFETIVO')) return 'success';
  if (t.includes('PROVIS')) return 'info';
  if (t.includes('TEMP')) return 'warning';
  return 'neutral';
}

export function bancoHorasTone(status: 'devendo' | 'excedeu' | 'atingiu'): StatusTone {
  if (status === 'devendo') return 'warning';
  if (status === 'excedeu') return 'info';
  return 'success';
}
