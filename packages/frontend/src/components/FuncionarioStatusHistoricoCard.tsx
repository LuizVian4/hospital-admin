import { useState, type FormEvent } from 'react';
import type { Funcionario, StatusEspecial } from '@escala/shared';
import { STATUS_ESPECIAIS_OPCOES } from '@escala/shared';
import {
  useCreateStatusEspecial,
  useDeleteStatusEspecial,
  useStatusEspeciaisFuncionario,
} from '@/hooks/useStatusEspeciais';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DeleteIcon from '@mui/icons-material/Delete';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface FuncionarioStatusHistoricoCardProps {
  funcionario: Funcionario;
}

export function FuncionarioStatusHistoricoCard({ funcionario }: FuncionarioStatusHistoricoCardProps) {
  const [status, setStatus] = useState<StatusEspecial>('FÉRIAS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { data: statuses = [], isLoading } = useStatusEspeciaisFuncionario(funcionario.id);
  const createStatus = useCreateStatusEspecial();
  const deleteStatus = useDeleteStatusEspecial(funcionario.id);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dataInicio || !dataFim) {
      toast.error('Informe as datas de início e fim');
      return;
    }
    if (dataFim < dataInicio) {
      toast.error('A data de fim deve ser igual ou posterior à data de início');
      return;
    }

    createStatus.mutate(
      {
        funcionarioId: funcionario.id,
        status,
        dataInicio,
        dataFim,
      },
      {
        onSuccess: () => {
          toast.success('Status especial registrado');
          setDataInicio('');
          setDataFim('');
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <Card>
      <CardHeader
        avatar={<EventBusyIcon color="warning" />}
        title="Histórico de status especiais"
        subheader="Férias, licenças INSS e licenças gestacionais"
      />
      <Divider />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-tipo-label">Tipo</InputLabel>
              <Select
                labelId="status-tipo-label"
                label="Tipo"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusEspecial)}
              >
                {STATUS_ESPECIAIS_OPCOES.map((opcao) => (
                  <MenuItem key={opcao} value={opcao}>
                    {opcao}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Data de início"
                type="date"
                size="small"
                fullWidth
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                label="Data de fim"
                type="date"
                size="small"
                fullWidth
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            </Stack>

            <Button
              type="submit"
              variant="outlined"
              disabled={createStatus.isPending}
              sx={{ alignSelf: 'flex-start' }}
            >
              {createStatus.isPending ? 'Salvando...' : 'Adicionar status'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Registros
          </Typography>

          {isLoading ? (
            <Stack sx={{ py: 4, alignItems: 'center' }}>
              <CircularProgress size={28} />
            </Stack>
          ) : statuses.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Nenhum status especial cadastrado.
            </Typography>
          ) : (
            <Stack divider={<Divider />} sx={{ mt: 1 }}>
              {statuses.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={1.5}
                  sx={{ py: 1.5, alignItems: 'center' }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <StatusBadge status={item.status} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {formatDateBr(item.dataInicio)} — {formatDateBr(item.dataFim)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (!item.id) return;
                      deleteStatus.mutate(item.id, {
                        onSuccess: () => toast.success('Status removido'),
                        onError: (err) => toast.error(err.message),
                      });
                    }}
                    disabled={deleteStatus.isPending}
                    title="Remover status"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
