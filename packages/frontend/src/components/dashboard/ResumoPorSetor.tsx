import { useMemo, useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Setor } from '@escala/shared';
import type { DashboardData } from '@/api/client';
import { SeletorCompetenciaSetor } from '@/components/SeletorCompetenciaSetor';
import { useCreateSetor, useUpdateSetor } from '@/hooks/useSetores';
import { toast } from 'sonner';

type ResumoSetor = DashboardData['resumoEscalaSetores'][number];

interface SetorFormState {
  nome: string;
  empresa: string;
  gerente: string;
}

function corCobertura(percent: number): 'success' | 'warning' | 'error' {
  if (percent >= 90) return 'success';
  if (percent >= 70) return 'warning';
  return 'error';
}

function BarraCobertura({
  label,
  comEscala,
  total,
  percent,
}: {
  label: string;
  comEscala: number;
  total: number;
  percent: number;
}) {
  if (total === 0) return null;

  const cor = corCobertura(percent);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.25, gap: 1 }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {comEscala}/{total} ({percent}%)
        </Typography>
      </Stack>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${percent}%`,
            borderRadius: 3,
            bgcolor: `${cor}.main`,
            transition: 'width 0.4s ease',
          }}
        />
      </Box>
    </Box>
  );
}

function ComposicaoEquipe({ row }: { row: ResumoSetor }) {
  const partes: string[] = [];
  if (row.totalTecnicos > 0) partes.push(`${row.totalTecnicos} téc.`);
  if (row.totalEnfermeiros > 0) partes.push(`${row.totalEnfermeiros} enf.`);
  if (row.totalOutros > 0) partes.push(`${row.totalOutros} outras`);

  return (
    <Stack spacing={0.25}>
      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {row.totalFuncionarios}
      </Typography>
      {partes.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {partes.join(' · ')}
        </Typography>
      )}
    </Stack>
  );
}

function LinhaGraficoCobertura({ row }: { row: ResumoSetor }) {
  const temTecnicos = row.totalTecnicos > 0;
  const temEnfermeiros = row.totalEnfermeiros > 0;

  if (!temTecnicos && !temEnfermeiros) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sem profissionais com padrão de escala
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {temTecnicos && (
        <BarraCobertura
          label="Técnicos"
          comEscala={row.tecnicosComEscala}
          total={row.totalTecnicos}
          percent={row.coberturaTecnicosPercent}
        />
      )}
      {temEnfermeiros && (
        <BarraCobertura
          label="Enfermeiros"
          comEscala={row.enfermeirosComEscala}
          total={row.totalEnfermeiros}
          percent={row.coberturaEnfermeirosPercent}
        />
      )}
    </Stack>
  );
}

function SetorResumoCard({
  row,
  setorInfo,
  onEdit,
}: {
  row: ResumoSetor;
  setorInfo?: Setor;
  onEdit: (setor: Setor) => void;
}) {
  const precisaAtencao = row.pendencias > 0;
  const coberturaGeral =
    row.totalTecnicos + row.totalEnfermeiros > 0
      ? Math.round(
          ((row.tecnicosComEscala + row.enfermeirosComEscala) /
            (row.totalTecnicos + row.totalEnfermeiros)) *
            100
        )
      : 100;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderColor: precisaAtencao ? 'warning.light' : 'divider',
        bgcolor: precisaAtencao ? 'warning.50' : 'background.paper',
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap title={row.setor}>
                {row.setor}
              </Typography>
              {setorInfo && (
                <Tooltip title="Editar setor">
                  <IconButton size="small" onClick={() => onEdit(setorInfo)} aria-label="Editar setor">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Stack spacing={0.25} sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" noWrap title={setorInfo?.empresa ?? undefined}>
                  {setorInfo?.empresa || 'Empresa não informada'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" noWrap title={setorInfo?.gerente ?? undefined}>
                  {setorInfo?.gerente ? `Gerente: ${setorInfo.gerente}` : 'Gerente não informado'}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Tooltip title="Cobertura média (técnicos + enfermeiros)">
            <Chip
              label={`${coberturaGeral}%`}
              size="small"
              color={corCobertura(coberturaGeral)}
              sx={{ fontWeight: 600, flexShrink: 0 }}
            />
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
          <Chip
            label={row.temCompetencia ? 'Competência aberta' : 'Sem competência'}
            size="small"
            color={row.temCompetencia ? 'success' : 'default'}
            variant={row.temCompetencia ? 'filled' : 'outlined'}
          />
          {precisaAtencao && (
            <Chip
              icon={<WarningAmberIcon />}
              label={`${row.pendencias} pendência${row.pendencias === 1 ? '' : 's'}`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Stack>

        <Grid container spacing={2} sx={{ flex: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
              Equipe
            </Typography>
            <ComposicaoEquipe row={row} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Cobertura de escala
            </Typography>
            <LinhaGraficoCobertura row={row} />
          </Grid>
        </Grid>

        <Box sx={{ pt: 0.5 }}>
          <SeletorCompetenciaSetor setorId={row.setorId} setorNome={row.setor} />
        </Box>
      </CardContent>
    </Card>
  );
}

interface ResumoPorSetorProps {
  resumo: DashboardData['resumoEscalaSetores'];
  setoresInfo: Setor[];
}

function emptyForm(): SetorFormState {
  return { nome: '', empresa: '', gerente: '' };
}

export function ResumoPorSetor({ resumo, setoresInfo }: ResumoPorSetorProps) {
  const updateSetor = useUpdateSetor();
  const createSetor = useCreateSetor();
  const [editing, setEditing] = useState<Setor | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SetorFormState>(emptyForm());

  const dialogOpen = editing != null || creating;
  const saving = updateSetor.isPending || createSetor.isPending;

  const setorInfoMap = useMemo(
    () => new Map(setoresInfo.map((s) => [s.id, s])),
    [setoresInfo]
  );

  const setoresVisiveis = useMemo(
    () =>
      resumo
        .filter((s) => s.totalFuncionarios > 0)
        .sort((a, b) => a.setorId - b.setorId),
    [resumo]
  );

  const totais = setoresVisiveis.reduce(
    (acc, s) => ({
      tecnicos: acc.tecnicos + s.totalTecnicos,
      tecnicosComEscala: acc.tecnicosComEscala + s.tecnicosComEscala,
      enfermeiros: acc.enfermeiros + s.totalEnfermeiros,
      enfermeirosComEscala: acc.enfermeirosComEscala + s.enfermeirosComEscala,
      semEscala: acc.semEscala + s.tecnicosSemEscala + s.enfermeirosSemEscala,
      semCompetencia: acc.semCompetencia + (s.temCompetencia ? 0 : 1),
    }),
    {
      tecnicos: 0,
      tecnicosComEscala: 0,
      enfermeiros: 0,
      enfermeirosComEscala: 0,
      semEscala: 0,
      semCompetencia: 0,
    }
  );

  const openEdit = (setor: Setor) => {
    setCreating(false);
    setEditing(setor);
    setForm({
      nome: setor.nome,
      empresa: setor.empresa ?? '',
      gerente: setor.gerente ?? '',
    });
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm());
  };

  const closeDialog = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm());
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Informe o nome do setor');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      empresa: form.empresa.trim() || undefined,
      gerente: form.gerente.trim() || undefined,
    };

    if (editing) {
      updateSetor.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Setor atualizado');
            closeDialog();
          },
          onError: (err) => toast.error(err.message),
        }
      );
      return;
    }

    createSetor.mutate(payload, {
      onSuccess: () => {
        toast.success('Setor cadastrado');
        closeDialog();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}
          >
            <Box>
              <Typography variant="h6">Resumo por setor</Typography>
              <Typography variant="body2" color="text.secondary">
                Cobertura de escala e composição da equipe
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={openCreate}
              >
                Novo setor
              </Button>
              {totais.tecnicos > 0 && (
                <Chip
                  label={`Técnicos: ${totais.tecnicosComEscala}/${totais.tecnicos}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              {totais.enfermeiros > 0 && (
                <Chip
                  label={`Enfermeiros: ${totais.enfermeirosComEscala}/${totais.enfermeiros}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {totais.semEscala > 0 && (
                <Chip
                  label={`${totais.semEscala} sem escala`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {totais.semCompetencia > 0 && (
                <Chip
                  label={`${totais.semCompetencia} sem competência`}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
            </Stack>
          </Stack>

          {setoresVisiveis.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Nenhum funcionário vinculado aos setores.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {setoresVisiveis.map((row) => (
                <Grid key={row.setorId} size={{ xs: 12, md: 6 }}>
                  <SetorResumoCard
                    row={row}
                    setorInfo={setorInfoMap.get(row.setorId)}
                    onEdit={openEdit}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'Editar setor' : 'Novo setor'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                label="Nome do setor"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Empresa"
                value={form.empresa}
                onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Gerente"
                value={form.gerente}
                onChange={(e) => setForm((f) => ({ ...f, gerente: e.target.value }))}
                fullWidth
                size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
