import { useMemo, useState } from 'react';
import {
  useFuncionarios,
  useCreateFuncionario,
  useUpdateFuncionario,
  useSetores,
} from '@/hooks/useFuncionarios';
import { FuncionarioForm, type FuncionarioFormData } from '@/components/FuncionarioForm';
import { StatusEspecialDialog } from '@/components/StatusEspecialDialog';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import type { Funcionario } from '@escala/shared';
import { isEnfermeiro, isTecnicoEnfermagem } from '@escala/shared';
import { toast } from 'sonner';

function isFuncionarioAgrupamentoEspecial(f: Funcionario): boolean {
  return !f.ativo || f.setorId == null;
}

function motivoAgrupamentoEspecial(f: Funcionario): string {
  if (!f.ativo && f.setorId == null) return 'Inativo · Sem setor';
  if (!f.ativo) return 'Inativo';
  return 'Sem setor';
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function chaveCategoriaResumo(categoria: string): string {
  if (isTecnicoEnfermagem(categoria)) return '__tecnico__';
  if (isEnfermeiro(categoria)) return '__enfermeiro__';
  return categoria?.trim() || '__sem_categoria__';
}

function formatarContagemCategoria(chave: string, count: number): string {
  if (chave === '__tecnico__') {
    return `${count} ${count === 1 ? 'técnico' : 'técnicos'}`;
  }
  if (chave === '__enfermeiro__') {
    return `${count} ${count === 1 ? 'enfermeiro' : 'enfermeiros'}`;
  }
  if (chave === '__sem_categoria__') {
    return `${count} sem categoria`;
  }
  return `${count} ${chave}`;
}

function contarPorCategoria(funcionarios: Funcionario[]): Array<{ chave: string; count: number }> {
  const map = new Map<string, number>();
  for (const f of funcionarios) {
    const chave = chaveCategoriaResumo(f.categoria ?? '');
    map.set(chave, (map.get(chave) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([chave, count]) => ({ chave, count }))
    .sort((a, b) => b.count - a.count);
}

function ResumoCategoriasChips({
  funcionarios,
  color = 'primary',
}: {
  funcionarios: Funcionario[];
  color?: 'primary' | 'default';
}) {
  const contagens = contarPorCategoria(funcionarios);
  if (contagens.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {contagens.map(({ chave, count }) => (
        <Chip
          key={chave}
          label={formatarContagemCategoria(chave, count)}
          size="small"
          color={color}
          variant="outlined"
        />
      ))}
    </Stack>
  );
}

function contratoChipColor(
  contrato: string
): 'success' | 'info' | 'warning' | 'default' {
  const t = contrato.toUpperCase();
  if (t.includes('EFETIVO')) return 'success';
  if (t.includes('PROVIS')) return 'info';
  if (t.includes('TEMP')) return 'warning';
  return 'default';
}

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
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {title}
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 700, mt: 0.25 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 1.5,
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

function TableSkeleton() {
  return (
    <Stack spacing={0} divider={<Divider />}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Stack key={i} direction="row" spacing={2} sx={{ px: 3, py: 2, alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" />
            <Skeleton width="25%" />
          </Box>
          <Skeleton width={80} height={28} sx={{ borderRadius: 4 }} />
        </Stack>
      ))}
    </Stack>
  );
}

function FuncionarioTableRow({
  f,
  onEdit,
  onStatus,
  onToggleAtivo,
}: {
  f: Funcionario;
  onEdit: (f: Funcionario) => void;
  onStatus: (f: Funcionario) => void;
  onToggleAtivo: (f: Funcionario) => void;
}) {
  const foraDoSetorAtivo = isFuncionarioAgrupamentoEspecial(f);

  return (
    <TableRow hover sx={foraDoSetorAtivo ? { opacity: 0.85, bgcolor: 'grey.50' } : undefined}>
      <TableCell>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              fontSize: '0.8rem',
              fontWeight: 700,
              bgcolor: !f.ativo
                ? 'grey.300'
                : !f.coren
                  ? 'warning.light'
                  : 'primary.light',
              color: !f.ativo
                ? 'grey.700'
                : !f.coren
                  ? 'warning.dark'
                  : 'primary.dark',
            }}
          >
            {getInitials(f.nome)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {f.nome}
              </Typography>
              {!f.coren && f.ativo && (
                <Tooltip title="COREN não cadastrado">
                  <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                </Tooltip>
              )}
              {foraDoSetorAtivo && (
                <Chip
                  label={motivoAgrupamentoEspecial(f)}
                  size="small"
                  color={!f.ativo ? 'default' : 'warning'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {f.categoria}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { md: 'none' }, fontFamily: 'monospace' }}
            >
              {f.matricula}
            </Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
        <Chip label={f.matricula} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
        {f.coren ? (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {f.coren}
          </Typography>
        ) : (
          <Chip label="Pendente" size="small" color="warning" variant="outlined" />
        )}
      </TableCell>
      <TableCell>
        <Chip label={f.tipoContrato} size="small" color={contratoChipColor(f.tipoContrato)} variant="outlined" />
      </TableCell>
      <TableCell>
        <Chip
          label={f.ativo ? 'Ativo' : 'Inativo'}
          size="small"
          color={f.ativo ? 'success' : 'default'}
          variant={f.ativo ? 'filled' : 'outlined'}
        />
      </TableCell>
      <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
        <Chip label={f.cargaHoraria} size="small" variant="outlined" />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title={f.ativo ? 'Inativar funcionário' : 'Reativar funcionário'}>
            <IconButton size="small" onClick={() => onToggleAtivo(f)}>
              {f.ativo ? <PersonOffIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Status especiais">
            <IconButton size="small" onClick={() => onStatus(f)}>
              <EventBusyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar funcionário">
            <IconButton size="small" onClick={() => onEdit(f)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export function FuncionariosPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchNome, setSearchNome] = useState('');
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [statusFuncionario, setStatusFuncionario] = useState<Funcionario | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Funcionario | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: funcionarios = [], isLoading } = useFuncionarios(filters);
  const { data: setores = [] } = useSetores();
  const createMutation = useCreateFuncionario();
  const updateMutation = useUpdateFuncionario();

  const setorMap = useMemo(
    () => new Map(setores.map((s) => [s.id, s.nome])),
    [setores]
  );

  const { setoresComFuncionarios, grupoEspecial } = useMemo(() => {
    const ativosComSetor: Funcionario[] = [];
    const especiais: Funcionario[] = [];

    for (const f of funcionarios) {
      if (isFuncionarioAgrupamentoEspecial(f)) {
        especiais.push(f);
      } else {
        ativosComSetor.push(f);
      }
    }

    const groups = new Map<number, Funcionario[]>();
    for (const f of ativosComSetor) {
      if (f.setorId == null) continue;
      if (!groups.has(f.setorId)) groups.set(f.setorId, []);
      groups.get(f.setorId)!.push(f);
    }
    for (const lista of groups.values()) {
      lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    }

    especiais.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

    const idsComFuncionarios = new Set(ativosComSetor.map((f) => f.setorId).filter((id): id is number => id != null));
    const ordenados = setores
      .filter((s) => idsComFuncionarios.has(s.id))
      .map((s) => ({
        id: s.id,
        nome: s.nome,
        funcionarios: groups.get(s.id) ?? [],
      }));

    for (const id of idsComFuncionarios) {
      if (!setores.some((s) => s.id === id)) {
        ordenados.push({
          id,
          nome: setorMap.get(id) ?? `Setor #${id}`,
          funcionarios: groups.get(id) ?? [],
        });
      }
    }

    return { setoresComFuncionarios: ordenados, grupoEspecial: especiais };
  }, [funcionarios, setores, setorMap]);

  const stats = useMemo(() => {
    const ativos = funcionarios.filter((f) => f.ativo);
    const inativos = funcionarios.filter((f) => !f.ativo);
    const semSetor = funcionarios.filter((f) => f.setorId == null);
    const semCoren = funcionarios.filter((f) => !f.coren).length;
    const provisorios = funcionarios.filter((f) =>
      f.tipoContrato.toUpperCase().includes('PROVIS')
    ).length;
    const carga180 = funcionarios.filter((f) => f.cargaHoraria === '180H').length;
    const carga144 = funcionarios.filter((f) => f.cargaHoraria === '144H').length;
    const setoresAtivos = setoresComFuncionarios.length;

    const categoriaMap = new Map<string, number>();
    for (const f of funcionarios) {
      const cat = f.categoria?.trim() || 'Sem categoria';
      categoriaMap.set(cat, (categoriaMap.get(cat) ?? 0) + 1);
    }
    const porCategoria = [...categoriaMap.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    return {
      total: funcionarios.length,
      ativos: ativos.length,
      inativos: inativos.length,
      semSetor: semSetor.length,
      semCoren,
      provisorios,
      carga180,
      carga144,
      setoresAtivos,
      porCategoria,
      corenPercent:
        funcionarios.length > 0
          ? Math.round(((funcionarios.length - semCoren) / funcionarios.length) * 100)
          : 100,
    };
  }, [funcionarios, setoresComFuncionarios.length]);

  const hasActiveFilters = Boolean(filters.nome || filters.setor || filters.contrato || filters.ativo);

  const clearFilters = () => {
    setSearchNome('');
    setFilters({});
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (f: Funcionario) => {
    setEditing(f);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = (data: FuncionarioFormData) => {
    const payload = {
      ...data,
      tipoContrato: data.tipoContrato as Funcionario['tipoContrato'],
      setorId: data.setorId,
      ...(editing ? {} : { ativo: true }),
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Funcionário atualizado');
            closeForm();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Funcionário cadastrado');
          closeForm();
        },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  const handleToggleAtivo = (f: Funcionario) => {
    if (f.ativo) {
      setConfirmToggle(f);
      return;
    }
    updateMutation.mutate(
      { id: f.id, data: { ativo: true } },
      {
        onSuccess: () => toast.success(`${f.nome} reativado`),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const confirmInativar = () => {
    if (!confirmToggle) return;
    updateMutation.mutate(
      { id: confirmToggle.id, data: { ativo: false } },
      {
        onSuccess: () => {
          toast.success(`${confirmToggle.nome} inativado`);
          setConfirmToggle(null);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const renderTabelaFuncionarios = (lista: Funcionario[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Funcionário</TableCell>
            <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
              Matrícula
            </TableCell>
            <TableCell sx={{ fontWeight: 600, display: { xs: 'none', lg: 'table-cell' } }}>
              COREN
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Contrato</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }} align="center">
              CH
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Ações
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lista.map((f) => (
            <FuncionarioTableRow
              key={f.id}
              f={f}
              onEdit={openEdit}
              onStatus={setStatusFuncionario}
              onToggleAtivo={handleToggleAtivo}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <PeopleIcon color="primary" />
            <Typography variant="h4" component="h1">
              Funcionários
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, ml: 4.5 }}>
            Cadastro e gestão de técnicos de enfermagem
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreate}>
          Novo funcionário
        </Button>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard title="Total" value={stats.total} icon={<PeopleIcon fontSize="small" />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            title="Ativos"
            value={stats.ativos}
            icon={<CheckCircleIcon fontSize="small" />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            title="Provisórios"
            value={stats.provisorios}
            icon={<WorkIcon fontSize="small" />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            title="Inativos"
            value={stats.inativos}
            subtitle={`${stats.semSetor} sem setor`}
            icon={<PersonOffIcon fontSize="small" />}
            color={stats.inativos > 0 ? 'error' : 'success'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            title="Sem COREN"
            value={stats.semCoren}
            subtitle={`${stats.corenPercent}% com COREN`}
            icon={<WarningAmberIcon fontSize="small" />}
            color={stats.semCoren > 0 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            title="Setores"
            value={stats.setoresAtivos}
            subtitle={`${stats.carga180}×180H · ${stats.carga144}×144H`}
            icon={<BusinessIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      {stats.semCoren > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          {stats.semCoren} funcionário(s) sem COREN cadastrado. Complete o registro para conformidade
          profissional.
        </Alert>
      )}

      {stats.porCategoria.length > 0 && (
        <Card>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" gutterBottom>
              Distribuição por categoria
            </Typography>
            <Stack spacing={1}>
              {stats.porCategoria.slice(0, 5).map((item) => (
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
                    value={stats.total > 0 ? (item.total / stats.total) * 100 : 0}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          avatar={<FilterListIcon color="action" />}
          title="Filtros"
          subheader="Refine a lista por nome, setor ou tipo de contrato"
          sx={{ pb: 0 }}
        />
        <Divider />
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Buscar por nome..."
              value={searchNome}
              onChange={(e) => {
                const value = e.target.value;
                setSearchNome(value);
                setFilters((f) => {
                  const next = { ...f };
                  if (value) next.nome = value;
                  else delete next.nome;
                  return next;
                });
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="filtro-setor-label">Setor</InputLabel>
              <Select
                labelId="filtro-setor-label"
                label="Setor"
                value={filters.setor ?? '__all__'}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters((f) => {
                    const next = { ...f };
                    if (v === '__all__') delete next.setor;
                    else next.setor = v;
                    return next;
                  });
                }}
              >
                <MenuItem value="__all__">Todos os setores</MenuItem>
                {setores.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="filtro-contrato-label">Contrato</InputLabel>
              <Select
                labelId="filtro-contrato-label"
                label="Contrato"
                value={filters.contrato ?? '__all__'}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters((f) => {
                    const next = { ...f };
                    if (v === '__all__') delete next.contrato;
                    else next.contrato = v;
                    return next;
                  });
                }}
              >
                <MenuItem value="__all__">Todos os contratos</MenuItem>
                <MenuItem value="EFETIVO">EFETIVO</MenuItem>
                <MenuItem value="PROVISÓRIO">PROVISÓRIO</MenuItem>
                <MenuItem value="Temporário">Temporário</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="filtro-situacao-label">Situação</InputLabel>
              <Select
                labelId="filtro-situacao-label"
                label="Situação"
                value={filters.ativo ?? '__all__'}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters((f) => {
                    const next = { ...f };
                    if (v === '__all__') delete next.ativo;
                    else next.ativo = v;
                    return next;
                  });
                }}
              >
                <MenuItem value="__all__">Todos</MenuItem>
                <MenuItem value="true">Ativos</MenuItem>
                <MenuItem value="false">Inativos</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                variant="text"
                size="small"
                startIcon={<CloseIcon />}
                onClick={clearFilters}
                sx={{ color: 'text.secondary' }}
              >
                Limpar
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h6">Equipe por setor</Typography>
              {!isLoading && (
                <Chip
                  label={`${funcionarios.length} ${funcionarios.length === 1 ? 'pessoa' : 'pessoas'}${
                    setoresComFuncionarios.length > 0
                      ? ` · ${setoresComFuncionarios.length} setores`
                      : ''
                  }${grupoEspecial.length > 0 ? ` · ${grupoEspecial.length} inativados/sem setor` : ''}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          }
          sx={{ pb: 0 }}
        />
        <Divider />

        {isLoading ? (
          <TableSkeleton />
        ) : setoresComFuncionarios.length === 0 && grupoEspecial.length === 0 ? (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 8, px: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'grey.100' }}>
              <PeopleIcon color="action" sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6">Nenhum funcionário encontrado</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
                {hasActiveFilters
                  ? 'Tente ajustar os filtros ou limpar a busca.'
                  : 'Comece cadastrando o primeiro funcionário da equipe.'}
              </Typography>
            </Box>
            {hasActiveFilters ? (
              <Button variant="outlined" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreate}>
                Cadastrar funcionário
              </Button>
            )}
          </Stack>
        ) : (
          <Box>
            {setoresComFuncionarios.map((grupo) => (
              <Accordion key={grupo.id} disableGutters elevation={0}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: 'primary.50',
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'primary.100' },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}
                  >
                    <BusinessIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" color="primary.dark">
                      {grupo.nome}
                    </Typography>
                    <ResumoCategoriasChips funcionarios={grupo.funcionarios} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {renderTabelaFuncionarios(grupo.funcionarios)}
                </AccordionDetails>
              </Accordion>
            ))}

            {grupoEspecial.length > 0 && (
              <Accordion disableGutters elevation={0}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.200' },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}
                  >
                    <PersonOffIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Inativados / Sem setor
                    </Typography>
                    <ResumoCategoriasChips funcionarios={grupoEspecial} color="default" />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {renderTabelaFuncionarios(grupoEspecial)}
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </Card>

      <Dialog open={confirmToggle != null} onClose={() => setConfirmToggle(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Inativar funcionário</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deseja inativar <strong>{confirmToggle?.nome}</strong>? O funcionário será movido para o
            agrupamento &quot;Inativados / Sem setor&quot; e não aparecerá nas escalas ativas.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmToggle(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmInativar}
            disabled={updateMutation.isPending}
          >
            Inativar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showForm}
        onClose={closeForm}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editing ? 'Editar funcionário' : 'Novo funcionário'}
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2.5 }}>
            {editing
              ? `Atualize os dados de ${editing.nome}. Matrícula: ${editing.matricula}.`
              : 'Preencha os dados para cadastrar um novo membro da equipe.'}
          </DialogContentText>
          <FuncionarioForm
            key={editing?.id ?? 'new'}
            formId="funcionario-form"
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeForm} disabled={createMutation.isPending || updateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="funcionario-form"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Salvando...'
              : editing
                ? 'Salvar alterações'
                : 'Cadastrar funcionário'}
          </Button>
        </DialogActions>
      </Dialog>

      <StatusEspecialDialog
        funcionario={statusFuncionario}
        open={statusFuncionario != null}
        onOpenChange={(open) => !open && setStatusFuncionario(null)}
      />
    </Stack>
  );
}
