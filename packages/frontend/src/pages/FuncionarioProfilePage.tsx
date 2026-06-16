import { useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  useFuncionario,
  useUpdateFuncionario,
  useSetores,
} from '@/hooks/useFuncionarios';
import { FuncionarioForm, type FuncionarioFormData } from '@/components/FuncionarioForm';
import { FuncionarioStatusHistoricoCard } from '@/components/FuncionarioStatusHistoricoCard';
import { FuncionarioEscalaMesCard } from '@/components/FuncionarioEscalaMesCard';
import { getInitials, getCamposPendentes } from '@/utils/funcionario';
import type { Funcionario } from '@escala/shared';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import BusinessIcon from '@mui/icons-material/Business';
import { toast } from 'sonner';

function contratoChipColor(
  contrato: string
): 'success' | 'info' | 'warning' | 'default' {
  const t = contrato.toUpperCase();
  if (t.includes('EFETIVO')) return 'success';
  if (t.includes('PROVIS')) return 'info';
  if (t.includes('TEMP')) return 'warning';
  return 'default';
}

export function FuncionarioProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const funcionarioId = parseInt(id ?? '', 10);

  const { data: funcionario, isLoading, isError } = useFuncionario(
    Number.isNaN(funcionarioId) ? undefined : funcionarioId
  );
  const { data: setores = [] } = useSetores();
  const updateMutation = useUpdateFuncionario();

  const setorNome = useMemo(() => {
    if (!funcionario?.setorId) return null;
    return setores.find((s) => s.id === funcionario.setorId)?.nome ?? `Setor #${funcionario.setorId}`;
  }, [funcionario, setores]);

  const camposPendentes = useMemo(
    () => (funcionario ? getCamposPendentes(funcionario) : []),
    [funcionario]
  );

  const handleSubmit = (data: FuncionarioFormData) => {
    if (!funcionario) return;
    const payload = {
      ...data,
      tipoContrato: data.tipoContrato as Funcionario['tipoContrato'],
      setorId: data.setorId,
    };
    updateMutation.mutate(
      { id: funcionario.id, data: payload },
      {
        onSuccess: () => toast.success('Dados atualizados'),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={120} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Skeleton variant="rounded" height={420} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Skeleton variant="rounded" height={420} />
          </Grid>
        </Grid>
        <Skeleton variant="rounded" height={280} />
      </Stack>
    );
  }

  if (isError || !funcionario) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/funcionarios')}
        >
          Voltar
        </Button>
        <Alert severity="error">Funcionário não encontrado.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/funcionarios"
        startIcon={<ArrowBackIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Voltar para funcionários
      </Button>

      <Card>
        <CardContent sx={{ py: 2.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: '1.25rem',
                fontWeight: 700,
                bgcolor: !funcionario.ativo
                  ? 'grey.300'
                  : !funcionario.coren
                    ? 'warning.light'
                    : 'primary.light',
                color: !funcionario.ativo
                  ? 'grey.700'
                  : !funcionario.coren
                    ? 'warning.dark'
                    : 'primary.dark',
              }}
            >
              {getInitials(funcionario.nome)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                {funcionario.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mt: 0.25 }}>
                Matrícula {funcionario.matricula}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.75 }}>
                <Chip label={funcionario.categoria} size="small" variant="outlined" />
                <Chip
                  label={funcionario.tipoContrato}
                  size="small"
                  color={contratoChipColor(funcionario.tipoContrato)}
                  variant="outlined"
                />
                <Chip
                  label={funcionario.ativo ? 'Ativo' : 'Inativo'}
                  size="small"
                  color={funcionario.ativo ? 'success' : 'default'}
                  variant={funcionario.ativo ? 'filled' : 'outlined'}
                />
                <Chip label={funcionario.cargaHoraria} size="small" variant="outlined" />
                {setorNome && (
                  <Chip
                    icon={<BusinessIcon sx={{ fontSize: '14px !important' }} />}
                    label={setorNome}
                    size="small"
                    variant="outlined"
                  />
                )}
                {!funcionario.ativo && (
                  <Chip
                    icon={<PersonOffIcon sx={{ fontSize: '14px !important' }} />}
                    label="Inativo"
                    size="small"
                    color="default"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {camposPendentes.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Cadastro incompleto
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2.5 }}>
            {camposPendentes.map((c) => (
              <li key={c.campo}>{c.mensagem}</li>
            ))}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title="Dados cadastrais"
              subheader="Edite as informações do funcionário"
            />
            <Divider />
            <CardContent sx={{ flex: 1 }}>
              <FuncionarioForm
                key={funcionario.id}
                formId="funcionario-profile-form"
                initial={funcionario}
                onSubmit={handleSubmit}
                loading={updateMutation.isPending}
              />
            </CardContent>
            <Divider />
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                form="funcionario-profile-form"
                variant="contained"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <FuncionarioEscalaMesCard funcionario={funcionario} />
        </Grid>
      </Grid>

      <FuncionarioStatusHistoricoCard funcionario={funcionario} />
    </Stack>
  );
}
