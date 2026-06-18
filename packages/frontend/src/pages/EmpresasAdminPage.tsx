import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { EmpresaComPapel, PapelEmpresa, UsuarioEmpresa } from '@escala/shared';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  useCreateEmpresa,
  useEmpresaDetalhes,
  useEmpresasVinculadas,
  useRemoverVinculoUsuarioEmpresa,
  useUpdateEmpresa,
  useUpdateVinculoUsuarioEmpresa,
  useUsuariosCandidatosEmpresa,
  useUsuariosEmpresa,
  useVincularUsuarioEmpresa,
} from '@/hooks/useEmpresaAdmin';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function AdicionarMembroDialog({
  open,
  onClose,
  empresaId,
}: {
  open: boolean;
  onClose: () => void;
  empresaId: string;
}) {
  const { data: candidatos = [], isLoading } = useUsuariosCandidatosEmpresa(empresaId, open);
  const vincular = useVincularUsuarioEmpresa(empresaId);
  const [userId, setUserId] = useState<number | ''>('');
  const [papel, setPapel] = useState<PapelEmpresa>('membro');

  useEffect(() => {
    if (!open) {
      setUserId('');
      setPapel('membro');
    }
  }, [open]);

  async function handleSubmit() {
    if (userId === '') return;
    try {
      await vincular.mutateAsync({ userId, papel });
      toast.success('Usuário vinculado à empresa');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao vincular usuário');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Vincular usuário</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <FormControl fullWidth disabled={isLoading || candidatos.length === 0}>
            <InputLabel id="candidato-label">Usuário</InputLabel>
            <Select
              labelId="candidato-label"
              label="Usuário"
              value={userId}
              onChange={(e) => setUserId(Number(e.target.value))}
            >
              {candidatos.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nome} — {c.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {candidatos.length === 0 && !isLoading && (
            <Alert severity="info">Todos os usuários ativos já estão vinculados a esta empresa.</Alert>
          )}

          <FormControl fullWidth>
            <InputLabel id="papel-label">Papel</InputLabel>
            <Select
              labelId="papel-label"
              label="Papel"
              value={papel}
              onChange={(e) => setPapel(e.target.value as PapelEmpresa)}
            >
              <MenuItem value="membro">Membro</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={userId === '' || vincular.isPending}
        >
          Vincular
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function NovaEmpresaDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createEmpresa = useCreateEmpresa();
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (!open) {
      setNome('');
      setSlug('');
      setSlugManual(false);
    }
  }, [open]);

  function handleNomeChange(value: string) {
    setNome(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value.toLowerCase().replace(/\s+/g, '-'));
  }

  async function handleSubmit() {
    if (!nome.trim() || !slug.trim()) return;
    try {
      await createEmpresa.mutateAsync({ nome: nome.trim(), slug: slug.trim() });
      toast.success('Empresa criada com sucesso');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar empresa');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nova empresa</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="Nome da empresa"
            value={nome}
            onChange={(e) => handleNomeChange(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Slug (identificador único)"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            fullWidth
            helperText="Preenchido automaticamente a partir do nome (minúsculas e espaços viram hífens). Você pode editar manualmente."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!nome.trim() || !slug.trim() || createEmpresa.isPending}
        >
          Criar empresa
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MembroRow({
  membro,
  currentUserId,
  empresaId,
  readOnly = false,
}: {
  membro: UsuarioEmpresa;
  currentUserId: number;
  empresaId: string;
  readOnly?: boolean;
}) {
  const updateVinculo = useUpdateVinculoUsuarioEmpresa(empresaId);
  const remover = useRemoverVinculoUsuarioEmpresa(empresaId);
  const isSelf = membro.userId === currentUserId;

  async function handlePapelChange(papel: PapelEmpresa) {
    try {
      await updateVinculo.mutateAsync({ userId: membro.userId, papel });
      toast.success('Papel atualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar papel');
    }
  }

  async function handleRemove() {
    try {
      await remover.mutateAsync(membro.userId);
      toast.success('Vínculo removido');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover vínculo');
    }
  }

  return (
    <TableRow hover>
      <TableCell>
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {membro.nome}
            {isSelf && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (você)
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {membro.email}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          label={membro.ativo ? 'Ativo' : 'Inativo'}
          color={membro.ativo ? 'success' : 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        {readOnly ? (
          <Chip
            size="small"
            label={membro.papel === 'admin' ? 'Administrador' : 'Membro'}
            color={membro.papel === 'admin' ? 'primary' : 'default'}
            variant="outlined"
          />
        ) : (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={membro.papel}
              onChange={(e) => handlePapelChange(e.target.value as PapelEmpresa)}
              disabled={updateVinculo.isPending}
            >
              <MenuItem value="membro">Membro</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        )}
      </TableCell>
      {!readOnly && (
        <TableCell align="right">
          <Tooltip title={isSelf ? 'Peça a outro administrador para remover seu acesso' : 'Remover vínculo'}>
            <span>
              <IconButton
                color="error"
                size="small"
                onClick={handleRemove}
                disabled={isSelf || remover.isPending}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
}

export function EmpresasAdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId, selectEmpresa, refreshEmpresas } = useEmpresa();
  const { data: empresasVinculadas = [], isLoading: loadingVinculadas } = useEmpresasVinculadas();
  const [gestaoEmpresaId, setGestaoEmpresaId] = useState<string | null>(null);
  const { data: detalhes, isLoading, error } = useEmpresaDetalhes(gestaoEmpresaId);
  const isAdmin = detalhes?.papelAtual === 'admin';
  const { data: membros = [], isLoading: loadingMembros } = useUsuariosEmpresa(gestaoEmpresaId);
  const updateEmpresa = useUpdateEmpresa(gestaoEmpresaId);

  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [addMembroOpen, setAddMembroOpen] = useState(false);
  const [novaEmpresaOpen, setNovaEmpresaOpen] = useState(false);

  useEffect(() => {
    if (gestaoEmpresaId) return;
    if (empresaId) {
      setGestaoEmpresaId(empresaId);
    } else if (empresasVinculadas.length > 0) {
      setGestaoEmpresaId(empresasVinculadas[0].id);
    }
  }, [empresaId, empresasVinculadas, gestaoEmpresaId]);

  useEffect(() => {
    if (detalhes) {
      setNome(detalhes.nome);
      setAtivo(detalhes.ativo);
    }
  }, [detalhes]);

  const dadosAlterados = useMemo(() => {
    if (!detalhes) return false;
    return nome.trim() !== detalhes.nome || ativo !== detalhes.ativo;
  }, [detalhes, nome, ativo]);

  async function handleSelectEmpresa(item: EmpresaComPapel) {
    setGestaoEmpresaId(item.id);
    if (item.ativo && item.id !== empresaId) {
      selectEmpresa(item.id);
      queryClient.invalidateQueries({ queryKey: ['empresa-admin'] });
    }
  }

  async function handleGerenciarEmpresa(id: string) {
    setGestaoEmpresaId(id);
  }

  async function handleSaveEmpresa() {
    if (!detalhes) return;
    try {
      await updateEmpresa.mutateAsync({
        nome: nome.trim() !== detalhes.nome ? nome.trim() : undefined,
        ativo: ativo !== detalhes.ativo ? ativo : undefined,
      });
      await refreshEmpresas();
      toast.success('Empresa atualizada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar empresa');
    }
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 720 }}>
        {error instanceof Error ? error.message : 'Erro ao carregar dados da empresa'}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <PageHeader
        heading="Empresas"
        description="Empresas vinculadas ao seu usuário e gestão do ambiente ativo"
        actions={
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddBusinessIcon />}
            onClick={() => setNovaEmpresaOpen(true)}
          >
            Nova empresa
          </Button>
        }
      />

      <Stack spacing={3} sx={{ mt: 3 }}>
        <Card>
          <CardHeader
            title="Suas empresas"
            subheader="Selecione uma empresa para gerenciar. Empresas ativas podem ser definidas como ambiente de trabalho."
          />
          <Divider />
          <CardContent>
            {loadingVinculadas ? (
              <Stack spacing={1.5}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} height={72} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            ) : empresasVinculadas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Você ainda não possui empresas vinculadas. Crie uma nova empresa para começar.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {empresasVinculadas.map((item) => {
                  const isAmbienteAtivo = item.ativo && item.id === empresaId;
                  const isGestao = item.id === gestaoEmpresaId;
                  return (
                    <Stack
                      key={item.id}
                      direction="row"
                      spacing={1.5}
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isGestao ? 'primary.main' : 'divider',
                        bgcolor: isGestao ? 'primary.50' : 'background.paper',
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                            {item.nome}
                          </Typography>
                          {isAmbienteAtivo && (
                            <Chip
                              size="small"
                              icon={<CheckCircleIcon />}
                              label="Ambiente ativo"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {!item.ativo && (
                            <Chip size="small" label="Inativa" color="default" variant="outlined" />
                          )}
                          <Chip
                            size="small"
                            label={item.papel === 'admin' ? 'Administrador' : 'Membro'}
                            color={item.papel === 'admin' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {!isGestao && (
                          <Button size="small" variant="outlined" onClick={() => handleGerenciarEmpresa(item.id)}>
                            Gerenciar
                          </Button>
                        )}
                        {item.ativo && !isAmbienteAtivo && (
                          <Button size="small" variant="contained" onClick={() => handleSelectEmpresa(item)}>
                            Usar como ambiente
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        {!isAdmin && detalhes && (
          <Alert severity="info">
            Você é <strong>membro</strong> desta empresa. As configurações e vínculos abaixo são somente leitura.
          </Alert>
        )}

        <Card>
          <CardHeader
            avatar={<BusinessIcon color="primary" />}
            title={isLoading ? <Skeleton width={200} /> : detalhes?.nome ?? 'Empresa selecionada'}
            subheader={
              isLoading ? (
                <Skeleton width={120} />
              ) : (
                `Slug: ${detalhes?.slug ?? '—'} · ${detalhes?.totalUsuarios ?? 0} usuário(s)`
              )
            }
          />
          <Divider />
          <CardContent>
            {isLoading ? (
              <Stack spacing={2}>
                <Skeleton height={56} />
                <Skeleton height={40} width={200} />
              </Stack>
            ) : !detalhes ? (
              <Typography variant="body2" color="text.secondary">
                Selecione uma empresa acima para ver os detalhes.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                <TextField
                  label="Nome da empresa"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  fullWidth
                  slotProps={{ input: { readOnly: !isAdmin } }}
                  disabled={!isAdmin}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      disabled={!isAdmin}
                    />
                  }
                  label="Empresa ativa"
                />
                {!ativo && isAdmin && (
                  <Alert severity="warning">
                    Empresas inativas permanecem visíveis nesta tela para reativação futura, mas não
                    aparecem no seletor de ambiente da barra lateral.
                  </Alert>
                )}
                {isAdmin && (
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveEmpresa}
                      disabled={!dadosAlterados || !nome.trim() || updateEmpresa.isPending}
                    >
                      Salvar alterações
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            avatar={<AdminPanelSettingsIcon color="primary" />}
            title="Usuários vinculados"
            subheader={
              isAdmin
                ? 'Membros com acesso aos dados desta empresa'
                : 'Visualização dos membros com acesso a esta empresa'
            }
            action={
              isAdmin ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddMembroOpen(true)}
                  disabled={isLoading || !detalhes}
                >
                  Vincular usuário
                </Button>
              ) : undefined
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Papel</TableCell>
                    {isAdmin && <TableCell align="right">Ações</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingMembros &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={isAdmin ? 4 : 3}>
                          <Skeleton height={32} />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loadingMembros && membros.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                          Nenhum usuário vinculado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingMembros &&
                    membros.map((membro) => (
                      <MembroRow
                        key={membro.vinculoId}
                        membro={membro}
                        currentUserId={user?.id ?? 0}
                        empresaId={gestaoEmpresaId!}
                        readOnly={!isAdmin}
                      />
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {isAdmin && (
          <Alert severity="info" icon={<AdminPanelSettingsIcon />}>
            Como <strong>administrador</strong>, você pode alterar configurações e gerenciar vínculos.
            Cada empresa precisa manter pelo menos um administrador.
          </Alert>
        )}
      </Stack>

      {isAdmin && gestaoEmpresaId && (
        <AdicionarMembroDialog
          open={addMembroOpen}
          onClose={() => setAddMembroOpen(false)}
          empresaId={gestaoEmpresaId}
        />
      )}
      <NovaEmpresaDialog
        open={novaEmpresaOpen}
        onClose={() => setNovaEmpresaOpen(false)}
        onCreated={async () => {
          await refreshEmpresas();
          queryClient.invalidateQueries({ queryKey: ['empresa-admin'] });
        }}
      />
    </Box>
  );
}
