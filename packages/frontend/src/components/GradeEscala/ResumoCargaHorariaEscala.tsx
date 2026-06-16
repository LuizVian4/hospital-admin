import { useMemo } from 'react';
import type { GradeEscalaResponse } from '@escala/shared';
import { labelStatusCargaHoraria, montarResumoCargaHoraria } from '@escala/shared';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface ResumoCargaHorariaEscalaProps {
  escala: GradeEscalaResponse;
}

function formatTurnos(turnos: number): string {
  if (Number.isInteger(turnos) || Math.abs(turnos - Math.round(turnos)) < 0.01) {
    return String(Math.round(turnos));
  }
  return turnos.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function chipStatus(status: 'atingiu' | 'devendo' | 'excedeu', saldoHoras: number) {
  const label = labelStatusCargaHoraria(status, saldoHoras);
  if (status === 'devendo') {
    return <Chip size="small" label={label} color="warning" variant="outlined" />;
  }
  if (status === 'excedeu') {
    return <Chip size="small" label={label} color="info" variant="outlined" />;
  }
  return <Chip size="small" label={label} color="success" variant="outlined" />;
}

export function ResumoCargaHorariaEscala({ escala }: ResumoCargaHorariaEscalaProps) {
  const resumos = useMemo(() => montarResumoCargaHoraria(escala), [escala]);

  const pendentes = useMemo(
    () => resumos.filter((r) => r.status === 'devendo' || r.status === 'excedeu'),
    [resumos]
  );

  const totais = useMemo(() => {
    const devendo = resumos.filter((r) => r.status === 'devendo').length;
    const excedeu = resumos.filter((r) => r.status === 'excedeu').length;
    return { devendo, excedeu };
  }, [resumos]);

  const resumoTexto =
    totais.devendo > 0 && totais.excedeu > 0
      ? `${totais.devendo} devendo · ${totais.excedeu} excederam`
      : totais.devendo > 0
        ? `${totais.devendo} devendo`
        : totais.excedeu > 0
          ? `${totais.excedeu} excederam`
          : null;

  return (
    <Card>
      <CardHeader
        avatar={<AccessTimeIcon color="action" />}
        title="Carga horária da competência"
        subheader="Mês inteiro em status especial atinge a carga · período parcial conta 12h/dia no status · faltas não contam · extras somam"
        sx={{ pb: 0 }}
      />
      <Divider />
      <CardContent sx={{ pt: 2 }}>
        {resumoTexto && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {resumoTexto}
          </Typography>
        )}

        {resumos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum funcionário na escala desta competência.
          </Typography>
        ) : pendentes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum funcionário devendo ou excedendo a carga horária.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Resumo de carga horária">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Funcionário</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 80 }} align="center">
                    Carga
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }} align="center">
                    Turnos
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 100 }} align="center">
                    Horas
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }} align="center">
                    Saldo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 130 }} align="center">
                    Situação
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendentes.map((item) => (
                  <TableRow key={item.funcionarioId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.matricula}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.cargaContratada}</TableCell>
                    <TableCell align="center" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatTurnos(item.turnosTrabalhados)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {item.horasTrabalhadas}h
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color:
                          item.saldoHoras < 0
                            ? 'warning.main'
                            : item.saldoHoras > 0
                              ? 'info.main'
                              : 'success.main',
                      }}
                    >
                      {item.saldoHoras > 0 ? '+' : ''}
                      {item.saldoHoras}h
                    </TableCell>
                    <TableCell align="center">
                      {chipStatus(item.status, item.saldoHoras)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
