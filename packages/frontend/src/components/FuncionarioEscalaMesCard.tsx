import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { Funcionario, FuncionarioComTurnos, GradeEscalaResponse } from '@escala/shared';
import { isEnfermeiro } from '@escala/shared';
import { useCompetencia } from '@/hooks/useCompetencia';
import { useEscala } from '@/hooks/useEscala';
import { CalendarioEscalaMes } from '@/components/CalendarioEscalaMes';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function findFuncionarioNaGrade(
  grade: GradeEscalaResponse,
  funcionarioId: number
): FuncionarioComTurnos | null {
  for (const grupo of grade.grupos) {
    const found = grupo.funcionarios.find((f) => f.id === funcionarioId);
    if (found) return found;
  }
  return null;
}

interface FuncionarioEscalaMesCardProps {
  funcionario: Funcionario;
}

export function FuncionarioEscalaMesCard({ funcionario }: FuncionarioEscalaMesCardProps) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const tipoEscala = isEnfermeiro(funcionario.categoria) ? 'enfermeiro' : 'tecnico';
  const escalaPath = tipoEscala === 'enfermeiro' ? 'escala-enfermeiros' : 'escala';

  const { data: competencia, isLoading: competenciaLoading } = useCompetencia(
    funcionario.setorId ?? undefined,
    mes,
    ano,
    tipoEscala
  );
  const competenciaId = competencia?.id;

  const { data: escala, isLoading: escalaLoading } = useEscala(competenciaId, tipoEscala);

  const funcionarioNaGrade = useMemo(
    () => (escala ? findFuncionarioNaGrade(escala, funcionario.id) : null),
    [escala, funcionario.id]
  );

  const hoje = new Date();
  const diaHoje = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes ? hoje.getDate() : null;

  const changeMes = (delta: number) => {
    let newMes = mes + delta;
    let newAno = ano;
    if (newMes < 1) {
      newMes = 12;
      newAno--;
    }
    if (newMes > 12) {
      newMes = 1;
      newAno++;
    }
    setMes(newMes);
    setAno(newAno);
  };

  const periodoLabel = `${MESES[mes - 1]} / ${ano}`;
  const linkEscalaSetor =
    funcionario.setorId != null
      ? `/setores/${funcionario.setorId}/${escalaPath}/${mes}/${ano}`
      : null;

  const isLoading = competenciaLoading || (competenciaId != null && escalaLoading);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<CalendarMonthIcon color="primary" fontSize="small" />}
        title="Escala do mês"
        subheader={periodoLabel}
        sx={{ py: 1.5, '& .MuiCardHeader-subheader': { fontSize: '0.8rem' } }}
        action={
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton size="small" onClick={() => changeMes(-1)} aria-label="Mês anterior">
              <ChevronLeftIcon />
            </IconButton>
            <IconButton size="small" onClick={() => changeMes(1)} aria-label="Próximo mês">
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        }
      />
      <Divider />
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {funcionario.setorId == null ? (
          <Alert severity="warning">
            Atribua um setor ao funcionário para visualizar a escala mensal.
          </Alert>
        ) : isLoading ? (
          <Stack sx={{ py: 3, alignItems: 'center' }}>
            <CircularProgress size={24} />
          </Stack>
        ) : !competenciaId ? (
          <Alert severity="info">
            Não há competência cadastrada para este setor em {periodoLabel}.
          </Alert>
        ) : !funcionarioNaGrade ? (
          <Alert severity="info">
            Funcionário não encontrado na escala de {periodoLabel}.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CalendarioEscalaMes
              mes={mes}
              ano={ano}
              funcionario={funcionarioNaGrade}
              diaHoje={diaHoje}
              compact
            />
          </Box>
        )}

        {linkEscalaSetor && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              component={RouterLink}
              to={linkEscalaSetor}
              size="small"
              endIcon={<OpenInNewIcon fontSize="small" />}
              sx={{ mt: 1.5, fontSize: '0.75rem' }}
            >
              Abrir escala completa do setor
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
