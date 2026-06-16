import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import { api } from '@/api/client';
import { isEnfermeiro } from '@escala/shared';
import { ResumoPorSetor } from '@/components/dashboard/ResumoPorSetor';
import { GraficoBancoHoras } from '@/components/dashboard/GraficoBancoHoras';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'warning' | 'success' | 'error' | 'info';
}

function StatCard({ title, value, subtitle, icon, color = 'primary' }: StatCardProps) {
  const palette = {
    primary: { bg: 'primary.50', icon: 'primary.main' },
    warning: { bg: 'warning.50', icon: 'warning.main' },
    success: { bg: 'success.50', icon: 'success.main' },
    error: { bg: 'error.50', icon: 'error.main' },
    info: { bg: 'info.50', icon: 'info.main' },
  }[color];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: palette.bg,
              color: palette.icon,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="text" width={280} height={40} />
      <Skeleton variant="text" width={400} height={24} />
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Skeleton variant="rounded" height={110} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={200} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Skeleton variant="rounded" height={320} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Skeleton variant="rounded" height={320} />
        </Grid>
      </Grid>
    </Stack>
  );
}

function contratoColor(tipo: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' {
  const t = tipo.toUpperCase();
  if (t.includes('EFETIVO')) return 'primary';
  if (t.includes('PROVIS')) return 'warning';
  if (t.includes('TEMP')) return 'secondary';
  return 'default';
}

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const mes = data.mes;
  const ano = data.ano;
  const periodoLabel = `${MESES[mes - 1]}/${ano}`;
  const totalSetores = data.setores.length;

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="h4" component="h1">
            Dashboard Administrativo
          </Typography>
          <Chip
            icon={<CalendarMonthIcon />}
            label={periodoLabel}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Hospital Teresa de Lisieux — Gestão de Escala
        </Typography>
      </Box>


      {data.setoresSemCompetencia.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
            {data.setoresSemCompetencia.length} competência(s) pendente(s) em {periodoLabel}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {data.setoresSemCompetencia.map((s) => {
              const pathSegment = s.tipo === 'enfermeiro' ? 'escala-enfermeiros' : 'escala';
              return (
                <Chip
                  key={`${s.setorId}-${s.tipo}`}
                  label={`${s.setor} (${s.tipo === 'enfermeiro' ? 'enfermeiros' : 'técnicos'})`}
                  size="small"
                  component={RouterLink}
                  to={`/setores/${s.setorId}/${pathSegment}/${mes}/${ano}`}
                  clickable
                  variant="outlined"
                />
              );
            })}
          </Stack>
        </Alert>
      )}

      {data.funcionariosSemSetor > 0 && (
        <Alert severity="info" icon={<PersonOffIcon />}>
          {data.funcionariosSemSetor} funcionário(s) ativo(s) sem setor vinculado.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Por categoria
              </Typography>
              <Stack spacing={1}>
                {data.funcionariosPorCategoria.slice(0, 6).map((item) => (
                  <Box key={item.categoria}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '75%' }}>
                        {item.categoria}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.total}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(item.total / data.totalFuncionarios) * 100}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Por tipo de contrato
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {data.funcionariosPorContrato.map((item) => (
                  <Chip
                    key={item.tipo}
                    label={`${item.tipo}: ${item.total}`}
                    color={contratoColor(item.tipo)}
                    variant="outlined"
                  />
                ))}
              </Stack>

              {data.statusEspeciaisNoMes.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Status especiais em {periodoLabel}
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {data.statusEspeciaisNoMes.map((item) => (
                      <Chip
                        key={item.status}
                        label={`${item.status}: ${item.total}`}
                        size="small"
                        icon={<BeachAccessIcon />}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cobertura de escala
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Profissionais com início de escala ou status especial cobrindo o mês
          </Typography>

          <Stack spacing={2.5}>
            <Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="subtitle2">Técnicos de enfermagem</Typography>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
                  {data.coberturaEscalaPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={data.coberturaEscalaPercent}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                {data.comEscalaDefinida} de {data.totalTecnicos} técnicos
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="subtitle2">Enfermeiros</Typography>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
                  {data.coberturaEscalaEnfermeirosPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={data.coberturaEscalaEnfermeirosPercent}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                {data.comEscalaDefinidaEnfermeiros} de {data.totalEnfermeiros} enfermeiros
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <ResumoPorSetor resumo={data.resumoEscalaSetores} setoresInfo={data.setores} />

      <GraficoBancoHoras items={data.bancoHorasPendentes} mes={mes} ano={ano} />

      {data.semEscalaDefinida.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Funcionários sem escala
              <Chip
                label={data.semEscalaDefinida.length}
                size="small"
                color="warning"
                sx={{ ml: 1 }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Funcionários com padrão de escala que ainda não têm início configurado em{' '}
              {periodoLabel}.
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Matrícula</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Setor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.semEscalaDefinida.map((f) => {
                    const setor = data.setores.find((s) => s.id === f.setorId);
                    const escalaPath = isEnfermeiro(f.categoria ?? '')
                      ? 'escala-enfermeiros'
                      : 'escala';
                    return (
                      <TableRow key={f.id} hover>
                        <TableCell>{f.matricula}</TableCell>
                        <TableCell>{f.nome}</TableCell>
                        <TableCell>{f.categoria}</TableCell>
                        <TableCell>
                          {setor ? (
                            <Link
                              component={RouterLink}
                              to={`/setores/${setor.id}/${escalaPath}/${mes}/${ano}`}
                              underline="hover"
                            >
                              {setor.nome}
                            </Link>
                          ) : (
                            <Typography variant="body2" color="warning.main">
                              Sem setor
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
