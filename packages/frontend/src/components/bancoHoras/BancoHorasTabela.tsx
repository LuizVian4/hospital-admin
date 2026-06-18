import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { BancoHorasAgregado, BancoHorasComDetalhes, StatusBancoHoras } from '@escala/shared';
import { labelStatusCargaHoraria } from '@escala/shared';
import { BancoHorasFiltrosBar } from './BancoHorasFiltrosBar';
import {
  FILTROS_BANCO_HORAS_INICIAIS,
  extrairSetores,
  filtrarEOrdenarBancoHoras,
  resumirBancoHoras,
  type FiltrosBancoHoras,
} from './bancoHorasFiltros';

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function chipSituacao(status: StatusBancoHoras, saldoHoras: number) {
  const label = labelStatusCargaHoraria(status, saldoHoras);
  if (status === 'devendo') {
    return (
      <Chip
        size="small"
        icon={<TrendingDownIcon />}
        label={label}
        color="warning"
        variant="outlined"
      />
    );
  }
  if (status === 'excedeu') {
    return (
      <Chip
        size="small"
        icon={<TrendingUpIcon />}
        label={label}
        color="info"
        variant="outlined"
      />
    );
  }
  return (
    <Chip
      size="small"
      icon={<CheckCircleIcon />}
      label="Atingiu"
      color="success"
      variant="outlined"
    />
  );
}

function corSaldo(status: StatusBancoHoras): string {
  if (status === 'devendo') return 'warning.main';
  if (status === 'excedeu') return 'info.main';
  return 'success.main';
}

function corBarra(status: StatusBancoHoras): 'warning' | 'info' | 'success' {
  if (status === 'devendo') return 'warning';
  if (status === 'excedeu') return 'info';
  return 'success';
}

interface ColunaRealizadoProps {
  trabalhadas: number;
  contratadas: number;
  status: StatusBancoHoras;
}

function ColunaRealizado({ trabalhadas, contratadas, status }: ColunaRealizadoProps) {
  const percentual = contratadas > 0 ? Math.min((trabalhadas / contratadas) * 100, 150) : 0;
  const barraPercent = Math.min(percentual, 100);

  return (
    <Box sx={{ minWidth: 120 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Realizado
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
        >
          {trabalhadas}/{contratadas}h
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={barraPercent}
        color={corBarra(status)}
        sx={{ height: 6, borderRadius: 3 }}
      />
      {percentual > 100 && (
        <Typography variant="caption" color="info.main" sx={{ mt: 0.25, display: 'block' }}>
          {Math.round(percentual)}% da meta
        </Typography>
      )}
    </Box>
  );
}

interface CelulaFuncionarioProps {
  nome: string;
  matricula: string;
  categoria: string;
  setor: string | null;
}

function CelulaFuncionario({ nome, matricula, categoria, setor }: CelulaFuncionarioProps) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {nome}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
        {matricula}
        {setor ? ` · ${setor}` : ''}
      </Typography>
      {categoria && (
        <Chip
          size="small"
          label={categoria}
          variant="outlined"
          sx={{ mt: 0.5, maxWidth: '100%', height: 22, '& .MuiChip-label': { px: 1 } }}
        />
      )}
    </Box>
  );
}

interface ResumoBancoHorasProps {
  devendo: number;
  excedeu: number;
  atingiu: number;
  total: number;
}

function ResumoBancoHoras({ devendo, excedeu, atingiu, total }: ResumoBancoHorasProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
      <Chip size="small" label={`${total} registro${total !== 1 ? 's' : ''}`} variant="outlined" />
      {devendo > 0 && (
        <Chip size="small" color="warning" variant="outlined" label={`${devendo} devendo`} />
      )}
      {excedeu > 0 && (
        <Chip size="small" color="info" variant="outlined" label={`${excedeu} excedendo`} />
      )}
      {atingiu > 0 && (
        <Chip size="small" color="success" variant="outlined" label={`${atingiu} em dia`} />
      )}
    </Stack>
  );
}

const headCellSx = { fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' as const };

function rowSx(status: StatusBancoHoras) {
  if (status === 'devendo') return { bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } };
  if (status === 'excedeu') return { bgcolor: 'info.50', '&:hover': { bgcolor: 'info.100' } };
  return undefined;
}

function useListaBancoHoras<T extends BancoHorasComDetalhes | BancoHorasAgregado>(dados: T[]) {
  const [filtros, setFiltros] = useState<FiltrosBancoHoras>(FILTROS_BANCO_HORAS_INICIAIS);

  const setores = useMemo(() => extrairSetores(dados), [dados]);

  const filtrados = useMemo(
    () => filtrarEOrdenarBancoHoras(dados, filtros),
    [dados, filtros]
  );

  const resumo = useMemo(() => resumirBancoHoras(filtrados), [filtrados]);

  const patchFiltros = (patch: Partial<FiltrosBancoHoras>) => {
    setFiltros((prev) => ({ ...prev, ...patch }));
  };

  return { filtros, patchFiltros, setores, filtrados, resumo };
}

interface TabelaBancoHorasCompetenciaProps {
  dados: BancoHorasComDetalhes[];
}

export function TabelaBancoHorasCompetencia({ dados }: TabelaBancoHorasCompetenciaProps) {
  const { filtros, patchFiltros, setores, filtrados, resumo } = useListaBancoHoras(dados);

  return (
    <Stack spacing={2}>
      <BancoHorasFiltrosBar filtros={filtros} setores={setores} onChange={patchFiltros} />
      <ResumoBancoHoras {...resumo} />

      {filtrados.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Nenhum resultado para os filtros selecionados.
        </Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 560, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
          <Table size="small" stickyHeader aria-label="Banco de horas por competência">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Funcionário</TableCell>
                <TableCell sx={{ ...headCellSx, display: { xs: 'none', sm: 'table-cell' } }}>
                  Competência
                </TableCell>
                <TableCell sx={{ ...headCellSx, minWidth: 140 }}>Realização</TableCell>
                <TableCell sx={{ ...headCellSx, width: 88 }} align="center">
                  Saldo
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: 130 }} align="center">
                  Situação
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map((row) => (
                <TableRow key={row.id} hover sx={rowSx(row.status)}>
                  <TableCell>
                    <CelulaFuncionario
                      nome={row.funcionarioNome}
                      matricula={row.funcionarioMatricula}
                      categoria={row.funcionarioCategoria}
                      setor={row.setorNome}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {MESES_CURTOS[row.competenciaMes - 1]}/{row.competenciaAno}
                      </Typography>
                      <Chip
                        size="small"
                        label={row.competenciaTipo === 'enfermeiro' ? 'Enfermeiro' : 'Técnico'}
                        variant="outlined"
                        sx={{ width: 'fit-content' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <ColunaRealizado
                      trabalhadas={row.horasTrabalhadas}
                      contratadas={row.horasContratadas}
                      status={row.status}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={`Carga contratada: ${row.cargaContratada}`}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          color: corSaldo(row.status),
                        }}
                      >
                        {row.saldoHoras > 0 ? '+' : ''}
                        {row.saldoHoras}h
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">{chipSituacao(row.status, row.saldoHoras)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

interface TabelaBancoHorasGeralProps {
  dados: BancoHorasAgregado[];
}

export function TabelaBancoHorasGeral({ dados }: TabelaBancoHorasGeralProps) {
  const { filtros, patchFiltros, setores, filtrados, resumo } = useListaBancoHoras(dados);

  return (
    <Stack spacing={2}>
      <BancoHorasFiltrosBar filtros={filtros} setores={setores} onChange={patchFiltros} />
      <ResumoBancoHoras {...resumo} />

      {filtrados.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Nenhum resultado para os filtros selecionados.
        </Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 560, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
          <Table size="small" stickyHeader aria-label="Banco de horas acumulado">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Funcionário</TableCell>
                <TableCell sx={{ ...headCellSx, width: 100 }} align="center">
                  Meses
                </TableCell>
                <TableCell sx={{ ...headCellSx, minWidth: 140 }}>Realização total</TableCell>
                <TableCell sx={{ ...headCellSx, width: 100 }} align="center">
                  Saldo
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: 130 }} align="center">
                  Situação
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map((row) => (
                <TableRow key={row.funcionarioId} hover sx={rowSx(row.status)}>
                  <TableCell>
                    <CelulaFuncionario
                      nome={row.funcionarioNome}
                      matricula={row.funcionarioMatricula}
                      categoria={row.funcionarioCategoria}
                      setor={row.setorNome}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Competências contabilizadas">
                      <Chip
                        size="small"
                        label={row.competenciasContabilizadas}
                        variant="outlined"
                        sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 36 }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <ColunaRealizado
                      trabalhadas={row.horasTrabalhadas}
                      contratadas={row.horasContratadas}
                      status={row.status}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: corSaldo(row.status),
                      }}
                    >
                      {row.saldoHoras > 0 ? '+' : ''}
                      {row.saldoHoras}h
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{chipSituacao(row.status, row.saldoHoras)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
