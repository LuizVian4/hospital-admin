import { useEffect, useMemo, useState } from 'react';
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
import Tooltip from '@mui/material/Tooltip';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import BusinessIcon from '@mui/icons-material/Business';
import NotesIcon from '@mui/icons-material/Notes';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { api } from '@/api/client';
import { useEscala, useUpdateObservacoes, useSimularProximoMes } from '@/hooks/useEscala';
import { useSetoresPorEscala } from '@/hooks/useFuncionarios';
import type { TipoEscala } from '@escala/shared';
import { GradeEscala } from '@/components/GradeEscala/GradeEscala';
import { GradeEscalaSkeleton } from '@/components/GradeEscala/GradeEscalaSkeleton';
import { LegendaTurnos } from '@/components/GradeEscala/LegendaTurnos';
import { LegendaFeriados } from '@/components/GradeEscala/LegendaFeriados';
import { ObservacoesCompetencia } from '@/components/GradeEscala/ObservacoesCompetencia';
import { SetorSelector } from '@/components/SetorSelector';
import { toast } from 'sonner';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ESCALA_CONFIG: Record<
  TipoEscala,
  { titulo: string; pathSegment: string; labelFuncionario: string }
> = {
  tecnico: {
    titulo: 'Escala de Técnicos',
    pathSegment: 'escala',
    labelFuncionario: 'técnico',
  },
  enfermeiro: {
    titulo: 'Escala de Enfermeiros',
    pathSegment: 'escala-enfermeiros',
    labelFuncionario: 'enfermeiro',
  },
};

interface EscalaPageProps {
  tipoEscala?: TipoEscala;
}

export function EscalaPage({ tipoEscala = 'tecnico' }: EscalaPageProps) {
  const config = ESCALA_CONFIG[tipoEscala];
  const { setorId, mes, ano } = useParams<{ setorId: string; mes: string; ano: string }>();
  const navigate = useNavigate();
  const [competenciaId, setCompetenciaId] = useState<number | undefined>();
  const [temCompetenciaAnterior, setTemCompetenciaAnterior] = useState(false);
  const [temCompetenciaProxima, setTemCompetenciaProxima] = useState(false);
  const [competenciaLoading, setCompetenciaLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [exportandoMesCompleto, setExportandoMesCompleto] = useState(false);
  const [confirmSimular, setConfirmSimular] = useState(false);

  const setorIdNum = parseInt(setorId || '1', 10);
  const mesNum = parseInt(mes || '6', 10);
  const anoNum = parseInt(ano || '2026', 10);

  const mesAnterior = useMemo(() => (mesNum === 1 ? 12 : mesNum - 1), [mesNum]);
  const anoAnterior = useMemo(() => (mesNum === 1 ? anoNum - 1 : anoNum), [mesNum, anoNum]);
  const proxMesNum = useMemo(() => (mesNum === 12 ? 1 : mesNum + 1), [mesNum]);
  const proxAnoNum = useMemo(() => (mesNum === 12 ? anoNum + 1 : anoNum), [mesNum, anoNum]);

  const { data: setores = [], isLoading: setoresLoading } = useSetoresPorEscala(tipoEscala);

  useEffect(() => {
    if (setoresLoading || setores.length === 0) return;
    if (!setores.some((s) => s.id === setorIdNum)) {
      navigate(
        `/setores/${setores[0].id}/${config.pathSegment}/${mesNum}/${anoNum}`,
        { replace: true }
      );
    }
  }, [setores, setoresLoading, setorIdNum, mesNum, anoNum, navigate, config.pathSegment]);

  useEffect(() => {
    let cancelled = false;

    async function loadCompetencias() {
      setCompetenciaLoading(true);
      setCompetenciaId(undefined);

      try {
        const [atual, anterior, proxima] = await Promise.all([
          api.getCompetencia(setorIdNum, mesNum, anoNum, tipoEscala),
          api.getCompetencia(setorIdNum, mesAnterior, anoAnterior, tipoEscala),
          api.getCompetencia(setorIdNum, proxMesNum, proxAnoNum, tipoEscala),
        ]);

        if (cancelled) return;

        setCompetenciaId(atual?.id);
        setTemCompetenciaAnterior(!!anterior);
        setTemCompetenciaProxima(!!proxima);
      } catch {
        if (!cancelled) toast.error('Erro ao carregar competência');
      } finally {
        if (!cancelled) setCompetenciaLoading(false);
      }
    }

    loadCompetencias();

    return () => {
      cancelled = true;
    };
  }, [setorIdNum, mesNum, anoNum, mesAnterior, anoAnterior, proxMesNum, proxAnoNum, tipoEscala]);

  const { data: escala, isLoading } = useEscala(competenciaId, tipoEscala);
  const updateObs = useUpdateObservacoes(competenciaId ?? 0);
  const simularProximoMes = useSimularProximoMes(competenciaId, tipoEscala);

  const setor = setores.find((s) => s.id === setorIdNum);
  const periodoLabel = `${MESES[mesNum - 1]} / ${anoNum}`;
  const proximoPeriodoLabel = `${MESES[proxMesNum - 1]} / ${proxAnoNum}`;
  const podeSimularProximoMes = !!competenciaId;

  const changeMes = (delta: number) => {
    let newMes = mesNum + delta;
    let newAno = anoNum;
    if (newMes < 1) { newMes = 12; newAno--; }
    if (newMes > 12) { newMes = 1; newAno++; }
    navigate(`/setores/${setorIdNum}/${config.pathSegment}/${newMes}/${newAno}`);
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
      await api.downloadEscalaExcel(competenciaId, tipoEscala);
      toast.success('Planilha exportada');
    } catch {
      toast.error('Erro ao exportar planilha');
    } finally {
      setExportando(false);
    }
  };

  const handleExportMesCompleto = async () => {
    setExportandoMesCompleto(true);
    try {
      await api.downloadEscalaMesCompletoExcel(mesNum, anoNum, tipoEscala);
      toast.success('Planilha do mês exportada');
    } catch {
      toast.error('Erro ao exportar planilha do mês');
    } finally {
      setExportandoMesCompleto(false);
    }
  };

  const handleCriarCompetencia = async () => {
    try {
      const created = await api.createCompetencia(setorIdNum, mesNum, anoNum, tipoEscala);
      setCompetenciaId(created.id);
      toast.success(`Competência de ${periodoLabel} criada`);
    } catch {
      toast.error('Erro ao criar competência');
    }
  };

  const handleSimularProximoMes = () => {
    if (!competenciaId) return;
    simularProximoMes.mutate(undefined, {
      onSuccess: (result) => {
        setConfirmSimular(false);
        toast.success(
          `Escala de ${proximoPeriodoLabel} gerada para ${result.processados} ${config.labelFuncionario}(s)${
            result.ignorados > 0 ? ` (${result.ignorados} sem grupo ignorados)` : ''
          }`
        );
        navigate(`/setores/${setorIdNum}/${config.pathSegment}/${result.mes}/${result.ano}`);
        setCompetenciaId(result.competenciaId);
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao simular próximo mês');
      },
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <CalendarMonthIcon color="primary" />
          <Typography variant="h4" component="h1">
            {config.titulo} — {setor?.nome ?? 'Setor'}
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
            onChange={(id) =>
              navigate(`/setores/${id}/${config.pathSegment}/${mesNum}/${anoNum}`)
            }
            tipoEscala={tipoEscala}
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center' }}>
              {temCompetenciaAnterior && (
                <Tooltip title="Mês anterior">
                  <IconButton size="small" onClick={() => changeMes(-1)}>
                    <ChevronLeftIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, minWidth: 140, textAlign: 'center', px: 1, fontVariantNumeric: 'tabular-nums' }}
              >
                {periodoLabel}
              </Typography>
              {temCompetenciaProxima && (
                <Tooltip title="Próximo mês">
                  <IconButton size="small" onClick={() => changeMes(1)}>
                    <ChevronRightIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Paper>

            {podeSimularProximoMes && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<FastForwardIcon />}
                onClick={() => setConfirmSimular(true)}
                disabled={isLoading || simularProximoMes.isPending}
              >
                {simularProximoMes.isPending ? 'Simulando...' : 'Simular próximo mês'}
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={!competenciaId || exportando || exportandoMesCompleto || isLoading}
            >
              {exportando ? 'Exportando...' : 'Exportar Setor'}
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportMesCompleto}
              disabled={exportando || exportandoMesCompleto || isLoading}
            >
              {exportandoMesCompleto ? 'Exportando...' : 'Exportar mês completo'}
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

      {competenciaLoading && <GradeEscalaSkeleton />}
      {!competenciaLoading && !competenciaId && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Nenhuma competência cadastrada para {periodoLabel}.
          </Typography>
          <Button variant="contained" onClick={handleCriarCompetencia}>
            Criar competência
          </Button>
        </Paper>
      )}
      {!competenciaLoading && isLoading && competenciaId && <GradeEscalaSkeleton />}
      {escala && <GradeEscala data={escala} tipoEscala={tipoEscala} />}

      <Card>
        <CardHeader
          avatar={<NotesIcon color="action" />}
          title="Observações da competência"
          subheader="Anotações manuais da competência"
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

      <Dialog open={confirmSimular} onClose={() => !simularProximoMes.isPending && setConfirmSimular(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Simular {proximoPeriodoLabel}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="body2" sx={{ mb: 2 }}>
              Esta ação irá gerar a escala de <strong>{proximoPeriodoLabel}</strong> com base no padrão
              e grupo definidos em <strong>{periodoLabel}</strong>.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Para cada {config.labelFuncionario} com grupo atribuído, o sistema irá:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
              <Typography component="li" variant="body2">
                Definir o turno e o grupo no início do mês seguinte
              </Typography>
              <Typography component="li" variant="body2">
                Preencher todos os dias do mês com base na rotação do padrão
              </Typography>
            </Box>
            <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
              Escalas já existentes em {proximoPeriodoLabel} para esses {config.labelFuncionario}s serão substituídas.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmSimular(false)} disabled={simularProximoMes.isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSimularProximoMes}
            disabled={simularProximoMes.isPending}
            startIcon={<FastForwardIcon />}
          >
            {simularProximoMes.isPending ? 'Gerando...' : `Gerar ${proximoPeriodoLabel}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
