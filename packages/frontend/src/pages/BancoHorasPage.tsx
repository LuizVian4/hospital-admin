import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { api } from '@/api/client';
import {
  TabelaBancoHorasCompetencia,
  TabelaBancoHorasGeral,
} from '@/components/bancoHoras/BancoHorasTabela';

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

type ModoVisualizacao = 'competencia' | 'geral';

export function BancoHorasPage() {
  const now = new Date();
  const [modo, setModo] = useState<ModoVisualizacao>('competencia');
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const anos = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const { data: dadosCompetencia = [], isLoading: loadingCompetencia } = useQuery({
    queryKey: ['banco-horas', 'competencia', mes, ano],
    queryFn: () => api.getBancoHoras(mes, ano),
    enabled: modo === 'competencia',
  });

  const { data: dadosGeral = [], isLoading: loadingGeral } = useQuery({
    queryKey: ['banco-horas', 'geral'],
    queryFn: () => api.getBancoHorasGeral(),
    enabled: modo === 'geral',
  });

  const isLoading = modo === 'competencia' ? loadingCompetencia : loadingGeral;
  const isEmpty = modo === 'competencia' ? dadosCompetencia.length === 0 : dadosGeral.length === 0;

  const periodoLabel =
    modo === 'competencia'
      ? `${MESES.find((m) => m.value === mes)?.label}/${ano}`
      : 'todas as competências';

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Banco de horas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Acompanhe saldos de carga horária por competência ou acumulado geral.
        </Typography>
      </Box>

      <Card>
        <CardHeader
          avatar={<AccessTimeIcon color="primary" />}
          title="Saldo de carga horária"
          subheader={
            modo === 'competencia'
              ? `Competência ${periodoLabel} · atualizado com a escala`
              : 'Soma de todas as competências por funcionário'
          }
          sx={{ pb: 0 }}
        />
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, mb: 2 }}
          >
            <Tabs
              value={modo}
              onChange={(_, value: ModoVisualizacao) => setModo(value)}
              sx={{ flex: 1 }}
            >
              <Tab value="competencia" label="Por competência" />
              <Tab value="geral" label="Geral" />
            </Tabs>

            {modo === 'competencia' && (
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Mês</InputLabel>
                  <Select value={mes} label="Mês" onChange={(e) => setMes(Number(e.target.value))}>
                    {MESES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 96 }}>
                  <InputLabel>Ano</InputLabel>
                  <Select value={ano} label="Ano" onChange={(e) => setAno(Number(e.target.value))}>
                    {anos.map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>

          {isLoading ? (
            <Skeleton variant="rounded" height={360} />
          ) : isEmpty ? (
            <Alert severity="info" variant="outlined">
              {modo === 'competencia'
                ? `Nenhum registro em ${periodoLabel}.`
                : 'Nenhum registro acumulado nas competências cadastradas.'}
            </Alert>
          ) : modo === 'competencia' ? (
            <TabelaBancoHorasCompetencia key={`${mes}-${ano}`} dados={dadosCompetencia} />
          ) : (
            <TabelaBancoHorasGeral key="geral" dados={dadosGeral} />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
