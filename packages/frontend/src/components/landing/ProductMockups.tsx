import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { brandColors } from '@/theme/brand';

const TURNO_COLORS: Record<string, string> = {
  MT: '#dbeafe',
  M: '#dcfce7',
  T: '#fef9c3',
  SN: '#f3e8ff',
  F: '#f1f5f9',
};

function MockChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 24px 48px rgba(15,23,42,0.12)',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: 'grey.100',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {['#ef4444', '#f59e0b', '#22c55e'].map((color) => (
            <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

export function DashboardMockup() {
  const stats = [
    { label: 'Profissionais', value: '192', color: brandColors.darkBlue },
    { label: 'Cobertura', value: '94%', color: '#16a34a' },
    { label: 'Afastados', value: '8', color: '#d97706' },
    { label: 'Déficit', value: '2', color: '#dc2626' },
  ];

  return (
    <MockChrome title="Escala360 — Dashboard">
      <Box sx={{ display: 'flex', minHeight: 280 }}>
        <Box sx={{ width: 48, bgcolor: 'primary.main', flexShrink: 0 }} />
        <Box sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
            {stats.map((s) => (
              <Box key={s.label} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {s.label}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: s.color }}>{s.value}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 1.5 }}>
            <Box sx={{ borderRadius: 1.5, border: '1px solid #e2e8f0', p: 1.5, height: 120 }}>
              <Typography variant="caption" color="text.secondary">
                Cobertura por setor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, mt: 2, height: 60 }}>
                {[72, 88, 94, 81, 96].map((h, i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      height: `${h}%`,
                      bgcolor: 'primary.main',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.7 + i * 0.05,
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ borderRadius: 1.5, border: '1px solid #e2e8f0', p: 1.5, height: 120 }}>
              <Typography variant="caption" color="text.secondary">
                Banco de horas
              </Typography>
              <Box
                component="svg"
                viewBox="0 0 120 50"
                sx={{ width: '100%', mt: 1.5, display: 'block' }}
              >
                <polyline
                  fill="none"
                  stroke={brandColors.mint}
                  strokeWidth="2"
                  points="0,40 20,32 40,36 60,20 80,24 100,12 120,16"
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </MockChrome>
  );
}

export function EscalaMockup() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const rows = [
    ['MT', 'M', 'T', 'SN', 'F', 'MT', 'M'],
    ['M', 'T', 'MT', 'M', 'T', 'F', 'SN'],
    ['T', 'SN', 'M', 'MT', 'M', 'T', 'F'],
    ['MT', 'M', 'F', 'T', 'SN', 'M', 'MT'],
  ];

  return (
    <MockChrome title="Escala360 — Escala de Enfermagem">
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(7, 1fr)',
            gap: 0.5,
            fontSize: '0.65rem',
          }}
        >
          <Box />
          {days.map((d) => (
            <Box key={d} sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', py: 0.5 }}>
              {d}
            </Box>
          ))}
          {rows.map((row, ri) => (
            <Box key={ri} sx={{ display: 'contents' }}>
              <Box sx={{ py: 0.75, pr: 1, color: 'text.secondary', fontSize: '0.6rem' }}>
                Prof. {ri + 1}
              </Box>
              {row.map((turno, ci) => (
                <Box
                  key={ci}
                  sx={{
                    py: 0.75,
                    textAlign: 'center',
                    borderRadius: 0.75,
                    bgcolor: TURNO_COLORS[turno] ?? '#f8fafc',
                    fontWeight: 600,
                    fontSize: '0.6rem',
                    color: '#334155',
                  }}
                >
                  {turno}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </MockChrome>
  );
}

export function BancoHorasMockup() {
  const rows = [
    { nome: 'Ana Silva', saldo: '+12h', status: 'positivo' },
    { nome: 'Carlos Mendes', saldo: '-4h', status: 'negativo' },
    { nome: 'Juliana Costa', saldo: '+8h', status: 'positivo' },
    { nome: 'Roberto Lima', saldo: '0h', status: 'neutro' },
  ];

  return (
    <MockChrome title="Escala360 — Banco de Horas">
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 1,
            px: 1,
            py: 0.75,
            bgcolor: 'grey.50',
            borderRadius: 1,
            mb: 0.75,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Profissional
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Saldo
          </Typography>
        </Box>
        {rows.map((row) => (
          <Box
            key={row.nome}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 1,
              px: 1,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {row.nome}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: row.status === 'positivo' ? 'success.main' : row.status === 'negativo' ? 'error.main' : 'text.secondary',
              }}
            >
              {row.saldo}
            </Typography>
          </Box>
        ))}
      </Box>
    </MockChrome>
  );
}

export function ProductMockup({ type }: { type: 'dashboard' | 'escala' | 'bancoHoras' }) {
  if (type === 'dashboard') return <DashboardMockup />;
  if (type === 'escala') return <EscalaMockup />;
  return <BancoHorasMockup />;
}
