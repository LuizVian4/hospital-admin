import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <Stack
      spacing={compact ? 1.5 : 2}
      sx={{ alignItems: 'center', textAlign: 'center', py: compact ? 3 : 6, px: 3 }}
    >
      <Box sx={{ position: 'relative', width: 64, height: 52 }}>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 8,
            top: 6,
            width: 40,
            height: 40,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            transform: 'rotate(-10deg)',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: 8,
            top: 6,
            width: 40,
            height: 40,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            transform: 'rotate(10deg)',
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            mx: 'auto',
            width: 40,
            height: 40,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 1px 2px rgba(26, 43, 76, 0.06)',
          }}
        >
          {icon}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 380 }}>
        <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>

      {action}
    </Stack>
  );
}
