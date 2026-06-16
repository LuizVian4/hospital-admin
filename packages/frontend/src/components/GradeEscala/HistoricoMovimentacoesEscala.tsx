import { useMemo } from 'react';
import type { GradeEscalaResponse } from '@escala/shared';
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
import HistoryIcon from '@mui/icons-material/History';
import {
  montarHistoricoMovimentacoes,
  type TipoMovimentacaoEscala,
} from '@/lib/escalaHistorico';

interface HistoricoMovimentacoesEscalaProps {
  escala: GradeEscalaResponse;
}

function chipProps(tipo: TipoMovimentacaoEscala) {
  if (tipo === 'FALTA') {
    return { label: 'Falta', color: 'error' as const, variant: 'outlined' as const };
  }
  if (tipo === 'PLANTAO_EXTRA') {
    return { label: 'Plantão extra', color: 'success' as const, variant: 'outlined' as const };
  }
  return {
    label: 'Troca',
    sx: {
      borderColor: 'rgb(139, 92, 246)',
      color: 'rgb(109, 40, 217)',
      bgcolor: 'rgba(139, 92, 246, 0.08)',
    },
    variant: 'outlined' as const,
  };
}

export function HistoricoMovimentacoesEscala({ escala }: HistoricoMovimentacoesEscalaProps) {
  const movimentacoes = useMemo(() => montarHistoricoMovimentacoes(escala), [escala]);

  return (
    <Card>
      <CardHeader
        avatar={<HistoryIcon color="action" />}
        title="Histórico de movimentações"
        subheader="Faltas, plantões extras e trocas registradas na competência"
        sx={{ pb: 0 }}
      />
      <Divider />
      <CardContent sx={{ pt: 2 }}>
        {movimentacoes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma movimentação registrada nesta competência.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Histórico de movimentações da escala">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 56 }}>Dia</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 130 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>Funcionário</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimentacoes.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {item.dia}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" {...chipProps(item.tipo)} />
                    </TableCell>
                    <TableCell>{item.funcionarioNome}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.descricao}
                      </Typography>
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
