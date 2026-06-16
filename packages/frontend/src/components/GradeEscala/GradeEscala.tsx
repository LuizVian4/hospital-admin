import { useCallback, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import type { GradeEscalaResponse, TipoEscala, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import { getGruposPorTipoEscala, mapFeriadosPorDia } from '@escala/shared';
import { getDiasSemCoberturaMTSN, getDiasComPoucosTecnicosMT, getDiasComPoucosTecnicosSN, MIN_TECNICOS_POR_TURNO } from '@/lib/escalaCobertura';
import { listarFuncionarios, organizarPorGrupoEscala } from '@/lib/escalaGrupos';
import { buildGradeEscalaRows } from '@/lib/gradeEscalaRows';
import { ConfirmarTrocaDialog, type CelulaTroca } from './ConfirmarTrocaDialog';
import {
  OcorrenciaEscalaDialog,
  type OcorrenciaEscalaDialogState,
} from './OcorrenciaEscalaDialog';
import { useAtribuirGrupoEscala, useTrocarEscalaDia } from '@/hooks/useEscala';
import { GradeEscalaTabelaVirtual } from './GradeEscalaTabelaVirtual';
import { toast } from 'sonner';

interface GradeEscalaProps {
  data: GradeEscalaResponse;
  tipoEscala?: TipoEscala;
}

export function GradeEscala({ data, tipoEscala = 'tecnico' }: GradeEscalaProps) {
  const gruposEscala = useMemo(() => getGruposPorTipoEscala(tipoEscala), [tipoEscala]);
  const { competencia, dias, diasSemana, grupos } = data;
  const atribuirGrupo = useAtribuirGrupoEscala(competencia.id);
  const trocarEscala = useTrocarEscalaDia(competencia.id, tipoEscala);
  const [dragOverGrupo, setDragOverGrupo] = useState<number | null>(null);
  const [trocaOrigem, setTrocaOrigem] = useState<CelulaTroca | null>(null);
  const [trocaConfirmacao, setTrocaConfirmacao] = useState<{
    origem: CelulaTroca;
    destino: CelulaTroca;
  } | null>(null);
  const [ocorrenciaDialog, setOcorrenciaDialog] = useState<OcorrenciaEscalaDialogState | null>(
    null
  );

  const modoSelecaoTroca = trocaOrigem != null && trocaConfirmacao == null;

  const funcionarios = useMemo(() => listarFuncionarios(grupos), [grupos]);
  const { porGrupo, semAtribuicao, indisponivel, semPadrao, comPadrao } = useMemo(
    () => organizarPorGrupoEscala(funcionarios, gruposEscala, dias.length),
    [funcionarios, gruposEscala, dias.length]
  );

  const totalFuncionarios = funcionarios.length;

  const hoje = useMemo(() => {
    const now = new Date();
    if (now.getMonth() + 1 !== competencia.mes || now.getFullYear() !== competencia.ano) {
      return null;
    }
    return now.getDate();
  }, [competencia.mes, competencia.ano]);

  const feriadosPorDia = useMemo(
    () => mapFeriadosPorDia(competencia.mes, competencia.ano),
    [competencia.mes, competencia.ano]
  );

  const diasSemCobertura = useMemo(
    () => (tipoEscala === 'tecnico' ? getDiasSemCoberturaMTSN(dias, grupos) : new Set<number>()),
    [dias, grupos, tipoEscala]
  );

  const diasComPoucosTecnicosMT = useMemo(
    () => (tipoEscala === 'tecnico' ? getDiasComPoucosTecnicosMT(dias, grupos) : new Set<number>()),
    [dias, grupos, tipoEscala]
  );

  const diasComPoucosTecnicosSN = useMemo(
    () => (tipoEscala === 'tecnico' ? getDiasComPoucosTecnicosSN(dias, grupos) : new Set<number>()),
    [dias, grupos, tipoEscala]
  );

  const diasComProblemaCobertura = useMemo(() => {
    const problemas = new Set(diasSemCobertura);
    for (const dia of diasComPoucosTecnicosMT) problemas.add(dia);
    for (const dia of diasComPoucosTecnicosSN) problemas.add(dia);
    return problemas;
  }, [diasSemCobertura, diasComPoucosTecnicosMT, diasComPoucosTecnicosSN]);

  const diasSemCoberturaLista = useMemo(
    () => [...diasSemCobertura].sort((a, b) => a - b),
    [diasSemCobertura]
  );

  const diasComPoucosTecnicosMTLista = useMemo(
    () => [...diasComPoucosTecnicosMT].sort((a, b) => a - b),
    [diasComPoucosTecnicosMT]
  );

  const diasComPoucosTecnicosSNLista = useMemo(
    () => [...diasComPoucosTecnicosSN].sort((a, b) => a - b),
    [diasComPoucosTecnicosSN]
  );

  const handleAtribuirGrupo = useCallback(
    (funcionarioId: number, indicePadrao: number) => {
      const grupo = gruposEscala.find((g) => g.indicePadrao === indicePadrao);
      if (!grupo) return;

      atribuirGrupo.mutate(
        { funcionarioId, indicePadrao, turnoInicio: grupo.turnoInicio },
        {
          onSuccess: () => toast.success(`${grupo.label} atribuído — escala gerada`),
          onError: () => toast.error('Erro ao atribuir grupo'),
        }
      );
      setDragOverGrupo(null);
    },
    [atribuirGrupo, gruposEscala]
  );

  const cancelarTroca = useCallback(() => {
    setTrocaOrigem(null);
    setTrocaConfirmacao(null);
  }, []);

  const getCelulaTroca = useCallback(
    (funcionarioId: number, dia: number): CelulaTroca | null => {
      const func = comPadrao.find((f) => f.id === funcionarioId);
      if (!func) return null;
      const turno = func.turnos[dia] ?? func.turnosProjetados?.[dia] ?? null;
      if (!turno) return null;
      return { funcionarioId, funcionarioNome: func.nome, dia, turno };
    },
    [comPadrao]
  );

  const handleIniciarTroca = useCallback(
    (funcionarioId: number, dia: number) => {
      const celula = getCelulaTroca(funcionarioId, dia);
      if (!celula) {
        toast.error('Este dia não possui turno para trocar');
        return;
      }
      setTrocaConfirmacao(null);
      setTrocaOrigem(celula);
    },
    [getCelulaTroca]
  );

  const handleSelecionarDestinoTroca = useCallback(
    (funcionarioId: number, dia: number) => {
      if (!trocaOrigem) return;

      const destino = getCelulaTroca(funcionarioId, dia);
      if (!destino) {
        toast.error('A célula de destino precisa ter um turno');
        return;
      }

      if (
        destino.funcionarioId === trocaOrigem.funcionarioId &&
        destino.dia === trocaOrigem.dia
      ) {
        return;
      }

      if (destino.funcionarioId === trocaOrigem.funcionarioId) {
        toast.error('Selecione o turno de outro funcionário');
        return;
      }

      setTrocaConfirmacao({ origem: trocaOrigem, destino });
    },
    [trocaOrigem, getCelulaTroca]
  );

  const handleConfirmTroca = useCallback(() => {
    if (!trocaConfirmacao) return;
    const { origem, destino } = trocaConfirmacao;

    trocarEscala.mutate(
      {
        funcionarioIdOrigem: origem.funcionarioId,
        diaOrigem: origem.dia,
        funcionarioIdDestino: destino.funcionarioId,
        diaDestino: destino.dia,
      },
      {
        onSuccess: () => {
          toast.success('Troca realizada com sucesso');
          cancelarTroca();
        },
        onError: (err) => toast.error(err.message || 'Erro ao realizar troca'),
      }
    );
  }, [trocaConfirmacao, trocarEscala, cancelarTroca]);

  const handleSolicitarOcorrencia = useCallback(
    (
      funcionarioId: number,
      funcionarioNome: string,
      dia: number,
      turno: Turno | null,
      tipo: TipoOcorrenciaEscala
    ) => {
      const func = funcionarios.find((f) => f.id === funcionarioId);
      setOcorrenciaDialog({
        funcionarioId,
        funcionarioNome,
        dia,
        turnoPadrao: turno,
        tipo,
        ocorrenciaExistente: func?.ocorrenciasPorDia?.[dia] ?? null,
      });
    },
    [funcionarios]
  );

  const flatRows = useMemo(
    () =>
      buildGradeEscalaRows({
        gruposEscala,
        porGrupo,
        indisponivel,
        semAtribuicao,
        semPadrao,
      }),
    [gruposEscala, porGrupo, indisponivel, semAtribuicao, semPadrao]
  );

  const handleDragOverGrupo = useCallback((indicePadrao: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGrupo(indicePadrao);
  }, []);

  const handleDragLeaveGrupo = useCallback(() => {
    setDragOverGrupo(null);
  }, []);

  const handleDropGrupo = useCallback(
    (indicePadrao: number, e: React.DragEvent) => {
      e.preventDefault();
      const funcionarioId = Number(e.dataTransfer.getData('funcionarioId'));
      if (funcionarioId) handleAtribuirGrupo(funcionarioId, indicePadrao);
    },
    [handleAtribuirGrupo]
  );

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1.25,
          bgcolor: 'grey.50',
          borderBottom: 1,
          borderColor: 'divider',
          flexWrap: 'wrap',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {totalFuncionarios}
              </Typography>{' '}
              funcionários
            </Typography>
          </Stack>
          {semAtribuicao.length > 0 && (
            <Chip
              icon={<WarningAmberIcon />}
              label={
                semAtribuicao.length === 1
                  ? '1 sem atribuição de escala'
                  : `${semAtribuicao.length} sem atribuição de escala`
              }
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {indisponivel.length > 0 && (
            <Chip
              label={
                indisponivel.length === 1
                  ? '1 indisponível para turno'
                  : `${indisponivel.length} indisponíveis para turno`
              }
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(atribuirGrupo.isPending || trocarEscala.isPending) && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <SyncIcon fontSize="small" color="primary" sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
              <Typography variant="caption" color="primary.main">Salvando...</Typography>
            </Stack>
          )}
          {!atribuirGrupo.isPending && atribuirGrupo.isSuccess && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CheckCircleIcon fontSize="small" color="success" />
              <Typography variant="caption" color="success.main">Salvo</Typography>
            </Stack>
          )}
          {atribuirGrupo.isError && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <ErrorIcon fontSize="small" color="error" />
              <Typography variant="caption" color="error.main">Erro ao salvar</Typography>
            </Stack>
          )}
        </Box>
      </Stack>

      {modoSelecaoTroca && trocaOrigem && (
        <Alert
          severity="info"
          action={
            <IconButton size="small" color="inherit" onClick={cancelarTroca}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ borderRadius: 0 }}
        >
          Selecione na planilha o turno de <strong>outro funcionário</strong> para trocar com{' '}
          <strong>{trocaOrigem.funcionarioNome}</strong> (dia {trocaOrigem.dia} · {trocaOrigem.turno})
        </Alert>
      )}

      {diasSemCoberturaLista.length > 0 && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: 0 }}>
          {diasSemCoberturaLista.length === 1 ? (
            <>
              O dia <strong>{diasSemCoberturaLista[0]}</strong> não possui ao menos 1 técnico em MT e 1 técnico em SN.
            </>
          ) : (
            <>
              Os dias <strong>{diasSemCoberturaLista.join(', ')}</strong> não possuem ao menos 1 técnico em MT e 1 técnico em SN.
            </>
          )}
        </Alert>
      )}

      {diasComPoucosTecnicosMTLista.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 0 }}>
          {diasComPoucosTecnicosMTLista.length === 1 ? (
            <>
              O setor não está totalmente coberto no turno <strong>MT</strong> (mínimo de {MIN_TECNICOS_POR_TURNO} técnicos) no dia{' '}
              <strong>{diasComPoucosTecnicosMTLista[0]}</strong>.
            </>
          ) : (
            <>
              O setor não está totalmente coberto no turno <strong>MT</strong> (mínimo de {MIN_TECNICOS_POR_TURNO} técnicos). Dias:{' '}
              <strong>{diasComPoucosTecnicosMTLista.join(', ')}</strong>.
            </>
          )}
        </Alert>
      )}

      {diasComPoucosTecnicosSNLista.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 0 }}>
          {diasComPoucosTecnicosSNLista.length === 1 ? (
            <>
              O setor não está totalmente coberto no turno <strong>SN</strong> (mínimo de {MIN_TECNICOS_POR_TURNO} técnicos) no dia{' '}
              <strong>{diasComPoucosTecnicosSNLista[0]}</strong>.
            </>
          ) : (
            <>
              O setor não está totalmente coberto no turno <strong>SN</strong> (mínimo de {MIN_TECNICOS_POR_TURNO} técnicos). Dias:{' '}
              <strong>{diasComPoucosTecnicosSNLista.join(', ')}</strong>.
            </>
          )}
        </Alert>
      )}

      <GradeEscalaTabelaVirtual
        dias={dias}
        flatRows={flatRows}
        diasSemana={diasSemana}
        hoje={hoje}
        feriadosPorDia={feriadosPorDia}
        diasComProblemaCobertura={diasComProblemaCobertura}
        competenciaId={competencia.id}
        tipoEscala={tipoEscala}
        gruposEscala={gruposEscala}
        dragOverGrupo={dragOverGrupo}
        trocaOrigem={trocaOrigem}
        modoSelecaoTroca={modoSelecaoTroca}
        onDragOverGrupo={handleDragOverGrupo}
        onDragLeaveGrupo={handleDragLeaveGrupo}
        onDropGrupo={handleDropGrupo}
        onAtribuirGrupo={handleAtribuirGrupo}
        onIniciarTroca={handleIniciarTroca}
        onSelecionarDestinoTroca={handleSelecionarDestinoTroca}
        onSolicitarOcorrencia={handleSolicitarOcorrencia}
      />

      {trocaConfirmacao && (
        <ConfirmarTrocaDialog
          open
          origem={trocaConfirmacao.origem}
          destino={trocaConfirmacao.destino}
          isPending={trocarEscala.isPending}
          onClose={() => setTrocaConfirmacao(null)}
          onConfirm={handleConfirmTroca}
        />
      )}

      <OcorrenciaEscalaDialog
        open={ocorrenciaDialog != null}
        onOpenChange={(open) => !open && setOcorrenciaDialog(null)}
        competenciaId={competencia.id}
        tipoEscala={tipoEscala}
        state={ocorrenciaDialog}
        funcionariosComTurnos={funcionarios}
      />
    </Paper>
  );
}
