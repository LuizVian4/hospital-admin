import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import BusinessIcon from '@mui/icons-material/Business';
import NotesIcon from '@mui/icons-material/Notes';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import { api } from '@/api/client';
import { useEscala, useUpdateObservacoes } from '@/hooks/useEscala';
import { useSetores } from '@/hooks/useFuncionarios';
import { GradeEscala } from '@/components/GradeEscala/GradeEscala';
import { GradeEscalaSkeleton } from '@/components/GradeEscala/GradeEscalaSkeleton';
import { LegendaTurnos } from '@/components/GradeEscala/LegendaTurnos';
import { LegendaFeriados } from '@/components/GradeEscala/LegendaFeriados';
import { ObservacoesCompetencia } from '@/components/GradeEscala/ObservacoesCompetencia';
import { SetorSelector } from '@/components/SetorSelector';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatDateBR(iso: string) {
  return iso.split('-').reverse().join('/');
}

export function EscalaPage() {
  const { setorId, mes, ano } = useParams<{ setorId: string; mes: string; ano: string }>();
  const navigate = useNavigate();
  const [competenciaId, setCompetenciaId] = useState<number | undefined>();
  const [exportando, setExportando] = useState(false);

  const setorIdNum = parseInt(setorId || '1', 10);
  const mesNum = parseInt(mes || '6', 10);
  const anoNum = parseInt(ano || '2026', 10);

  const { data: setores = [] } = useSetores();

  useEffect(() => {
    async function loadCompetencia() {
      const existing = await api.getCompetencia(setorIdNum, mesNum, anoNum);
      if (existing) {
        setCompetenciaId(existing.id);
        return;
      }
      const created = await api.createCompetencia(setorIdNum, mesNum, anoNum);
      setCompetenciaId(created.id);
    }
    loadCompetencia().catch(() => toast.error('Erro ao carregar competência'));
  }, [setorIdNum, mesNum, anoNum]);

  const { data: escala, isLoading } = useEscala(competenciaId);
  const updateObs = useUpdateObservacoes(competenciaId ?? 0);

  const setor = setores.find((s) => s.id === setorIdNum);
  const periodoLabel = `${MESES[mesNum - 1]} / ${anoNum}`;

  const changeMes = (delta: number) => {
    let newMes = mesNum + delta;
    let newAno = anoNum;
    if (newMes < 1) { newMes = 12; newAno--; }
    if (newMes > 12) { newMes = 1; newAno++; }
    navigate(`/setores/${setorIdNum}/escala/${newMes}/${newAno}`);
    setCompetenciaId(undefined);
  };

  const handleSaveObservacoes = (texto: string) => {
    if (!competenciaId) return;
    updateObs.mutate(texto, {
      onSuccess: () => toast.success('Observações atualizadas'),
      onError: () => toast.error('Erro ao salvar observações'),
    });
  };

  const handleExportExcel = async () => {
    if (!competenciaId) return;
    setExportando(true);
    try {
      await api.downloadEscalaExcel(competenciaId);
      toast.success('Planilha exportada');
    } catch {
      toast.error('Erro ao exportar planilha');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <CalendarMonthIcon color="primary" />
          <Typography variant="h4" component="h1">
            Escala — {setor?.nome ?? 'Setor'}
          </Typography>
          <Chip icon={<CalendarMonthIcon />} label={periodoLabel} color="primary" variant="outlined" size="small" />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 0.75, ml: 4.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {setor?.empresa && (
            <Chip icon={<BusinessIcon />} label={setor.empresa} size="small" variant="outlined" />
          )}
          {setor?.gerente && (
            <Typography variant="body2" color="text.secondary">
              Gerente: <strong>{setor.gerente}</strong>
            </Typography>
          )}
        </Stack>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <SetorSelector
            value={setorIdNum}
            onChange={(id) => navigate(`/setores/${id}/escala/${mesNum}/${anoNum}`)}
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Mês anterior">
                <IconButton size="small" onClick={() => changeMes(-1)}>
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, minWidth: 140, textAlign: 'center', px: 1, fontVariantNumeric: 'tabular-nums' }}
              >
                {periodoLabel}
              </Typography>
              <Tooltip title="Próximo mês">
                <IconButton size="small" onClick={() => changeMes(1)}>
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
            </Paper>

            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={!competenciaId || exportando || isLoading}
            >
              {exportando ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <LegendaTurnos />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <LegendaFeriados mes={mesNum} ano={anoNum} />
        </Grid>
      </Grid>

      {isLoading && <GradeEscalaSkeleton />}
      {escala && <GradeEscala data={escala} />}

      {escala && escala.statusEspeciais.length > 0 && (
        <Card>
          <CardHeader
            avatar={<BeachAccessIcon color="info" />}
            title="Status Especiais"
            subheader={`${escala.statusEspeciais.length} registro(s) ativo(s) em ${periodoLabel}`}
            sx={{ pb: 0 }}
          />
          <Divider />
          <CardContent sx={{ pt: 0, px: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, pl: 3 }}>Matrícula</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Funcionário</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {escala.statusEspeciais.map((se) => (
                    <TableRow key={se.id ?? se.funcionario.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', pl: 3 }}>
                        {se.funcionario.matricula}
                      </TableCell>
                      <TableCell>{se.funcionario.nome}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.875rem' }}>
                        {formatDateBR(se.dataInicio)} — {formatDateBR(se.dataFim)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={se.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          avatar={<NotesIcon color="action" />}
          title="Observações da competência"
          subheader="Trocas de escala e anotações manuais"
          sx={{ pb: 0 }}
        />
        <Divider />
        <CardContent>
          <ObservacoesCompetencia
            observacoes={escala?.observacoes}
            disabled={!competenciaId || isLoading}
            isSaving={updateObs.isPending}
            onSave={handleSaveObservacoes}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
