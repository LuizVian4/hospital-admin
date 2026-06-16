import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
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
import type { GradeEscalaResponse, GrupoEscala, Turno, EscalaDiaUpdate, FuncionarioComTurnos, TipoEscala } from '@escala/shared';
import { getGruposPorTipoEscala, mapFeriadosPorDia } from '@escala/shared';
import { COLUNAS_FIXAS, stickyLeft, colunaCalendarioClass } from '@/constants/turnos';
import { getDiasSemCoberturaMTSN, getDiasComPoucosTecnicosMT, getDiasComPoucosTecnicosSN, MIN_TECNICOS_POR_TURNO } from '@/lib/escalaCobertura';
import { listarFuncionarios, organizarPorGrupoEscala } from '@/lib/escalaGrupos';
import { cn } from '@/lib/utils';
import { LinhaTurno } from './LinhaTurno';
import { LinhaGrupoEscala } from './LinhaGrupoEscala';
import { LinhaSemGrupo } from './LinhaSemGrupo';
import { LinhaIndisponivel } from './LinhaIndisponivel';
import type { EscalaCellChangeOptions } from './CelulaEscala';
import { ConfirmarTrocaDialog, type CelulaTroca } from './ConfirmarTrocaDialog';
import { useAtribuirGrupoEscala, useTrocarEscalaDia, useUpdateEscalaDia } from '@/hooks/useEscala';
import { toast } from 'sonner';

interface GradeEscalaProps {
  data: GradeEscalaResponse;
  tipoEscala?: TipoEscala;
}

export function GradeEscala({ data, tipoEscala = 'tecnico' }: GradeEscalaProps) {
  const gruposEscala = useMemo(() => getGruposPorTipoEscala(tipoEscala), [tipoEscala]);
  const { competencia, dias, diasSemana, grupos } = data;
  const updateMutation = useUpdateEscalaDia(competencia.id);
  const atribuirGrupo = useAtribuirGrupoEscala(competencia.id);
  const trocarEscala = useTrocarEscalaDia(competencia.id, tipoEscala);
  const pendingRef = useRef<Map<string, EscalaDiaUpdate>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [dragOverGrupo, setDragOverGrupo] = useState<number | null>(null);
  const [trocaOrigem, setTrocaOrigem] = useState<CelulaTroca | null>(null);
  const [trocaConfirmacao, setTrocaConfirmacao] = useState<{
    origem: CelulaTroca;
    destino: CelulaTroca;
  } | null>(null);

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

  const flushUpdates = useCallback(() => {
    const items = [...pendingRef.current.values()];
    if (items.length === 0) return;
    pendingRef.current.clear();
    updateMutation.mutate(items);
  }, [updateMutation]);

  const handleCellChange = useCallback(
    (
      funcionarioId: number,
      dia: number,
      turno: Turno | null,
      options?: EscalaCellChangeOptions
    ) => {
      pendingRef.current.set(`${funcionarioId}:${dia}`, {
        funcionarioId,
        dia,
        turno,
        ...options,
      });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flushUpdates, 500);
    },
    [flushUpdates]
  );

  const handleAtribuirGrupo = useCallback(
    (funcionarioId: number, indicePadrao: number) => {
      const grupo = gruposEscala.find((g) => g.indicePadrao === indicePadrao);
      if (!grupo) return;

      atribuirGrupo.mutate(
        { funcionarioId, indicePadrao, turnoInicio: grupo.turnoInicio },
        {
          onSuccess: () => toast.success(`${grupo.label} atribuído — escala gerada a partir do dia 1`),
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

  const renderLinhas = (
    lista: FuncionarioComTurnos[],
    arrastavel: boolean,
    comGrupo = false
  ) =>
    lista.map((func) => {
      const currentIndex = rowIndex++;
      return (
        <LinhaTurno
          key={func.id}
          competenciaId={competencia.id}
          funcionario={func}
          dias={dias}
          diasSemana={diasSemana}
          hoje={hoje}
          feriadosPorDia={feriadosPorDia}
          rowIndex={currentIndex}
          arrastavel={arrastavel}
          comGrupo={comGrupo}
          trocaOrigem={trocaOrigem}
          modoSelecaoTroca={modoSelecaoTroca}
          onIniciarTroca={comGrupo ? handleIniciarTroca : undefined}
          onSelecionarDestinoTroca={comGrupo ? handleSelecionarDestinoTroca : undefined}
          onCellChange={handleCellChange}
        />
      );
    });

  let rowIndex = 0;

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
          {(updateMutation.isPending || atribuirGrupo.isPending || trocarEscala.isPending) && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <SyncIcon fontSize="small" color="primary" sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
              <Typography variant="caption" color="primary.main">Salvando...</Typography>
            </Stack>
          )}
          {!updateMutation.isPending && updateMutation.isSuccess && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CheckCircleIcon fontSize="small" color="success" />
              <Typography variant="caption" color="success.main">Salvo</Typography>
            </Stack>
          )}
          {updateMutation.isError && (
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

      <div className="overflow-auto max-h-[calc(100vh-320px)]">
        <table className="border-collapse text-sm w-max min-w-full">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-100">
              {COLUNAS_FIXAS.map((col, i) => (
                <th
                  key={col.key}
                  className={cn(
                    'border-b border-r px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sticky z-30 bg-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]',
                    col.key === 'nome' && 'text-left'
                  )}
                  style={{ left: stickyLeft(i), minWidth: col.width, width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {dias.map((dia) => {
                const isHoje = dia === hoje;
                const idx = dias.indexOf(dia);
                const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
                const feriadoNome = feriadosPorDia[dia] ?? null;
                const semCobertura = diasComProblemaCobertura.has(dia);
                return (
                  <th
                    key={dia}
                    className={cn(
                      'border-b px-1 py-2 text-xs min-w-[40px] text-center font-semibold',
                      semCobertura
                        ? 'dia-sem-cobertura-header'
                        : cn(
                            'bg-slate-100 text-slate-700',
                            colunaCalendarioClass({ isWeekend, feriadoNome, isHoje, parte: 'header' })
                          )
                    )}
                    title={
                      semCobertura
                        ? 'Cobertura insuficiente neste dia'
                        : feriadoNome ?? (isHoje ? 'Dia atual' : undefined)
                    }
                  >
                    {isHoje && !semCobertura ? (
                      <span className="flex flex-col items-center gap-0.5 leading-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">Hoje</span>
                        <span className="text-sm tabular-nums">{dia}</span>
                      </span>
                    ) : (
                      dia
                    )}
                  </th>
                );
              })}
            </tr>
            <tr className="bg-slate-50">
              <th
                colSpan={COLUNAS_FIXAS.length}
                className="border-b border-r px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 sticky left-0 z-30 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] text-left"
              >
                Escala
              </th>
              {diasSemana.map((ds, idx) => {
                const dia = dias[idx];
                const isHoje = dia === hoje;
                const isWeekend = ds === 'SAB' || ds === 'DOM';
                const feriadoNome = feriadosPorDia[dia] ?? null;
                const semCobertura = diasComProblemaCobertura.has(dia);
                return (
                  <th
                    key={idx}
                    className={cn(
                      'border-b px-1 py-1 text-[10px] font-medium min-w-[40px] text-center',
                      semCobertura
                        ? 'dia-sem-cobertura-header'
                        : cn(
                            'bg-slate-50 text-slate-400',
                            colunaCalendarioClass({ isWeekend, feriadoNome, isHoje, parte: 'dow' })
                          )
                    )}
                    title={
                      semCobertura
                        ? 'Cobertura insuficiente neste dia'
                        : feriadoNome ?? undefined
                    }
                  >
                    {ds}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {gruposEscala.map((grupo, gi) => {
              const membros = porGrupo.get(grupo.indicePadrao) ?? [];
              return (
                <Fragment key={grupo.id}>
                  {gi > 0 && (
                    <tr>
                      <td
                        colSpan={COLUNAS_FIXAS.length + dias.length}
                        className="h-1 bg-slate-200/60 border-y"
                      />
                    </tr>
                  )}
                  <LinhaGrupoEscala
                    grupo={grupo}
                    dias={dias}
                    diasSemana={diasSemana}
                    hoje={hoje}
                    feriadosPorDia={feriadosPorDia}
                    isDragOver={dragOverGrupo === grupo.indicePadrao}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverGrupo(grupo.indicePadrao);
                    }}
                    onDragLeave={() => setDragOverGrupo(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const funcionarioId = Number(e.dataTransfer.getData('funcionarioId'));
                      if (funcionarioId) handleAtribuirGrupo(funcionarioId, grupo.indicePadrao);
                    }}
                  />
                  {renderLinhas(membros, true, true)}
                </Fragment>
              );
            })}

            {indisponivel.length > 0 && (
              <>
                <tr>
                  <td colSpan={COLUNAS_FIXAS.length + dias.length} className="h-2 bg-slate-100/80 border-y" />
                </tr>
                <tr className="bg-sky-50/60">
                  <td
                    colSpan={COLUNAS_FIXAS.length}
                    className="border-b border-r px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-900 sticky left-0 z-10 bg-sky-50/60"
                  >
                    Indisponível para assumir turno
                  </td>
                  {dias.map((dia, idx) => {
                    const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
                    return (
                      <td
                        key={dia}
                        className={cn(
                          'border-b bg-sky-50/40',
                          colunaCalendarioClass({
                            isWeekend,
                            feriadoNome: feriadosPorDia[dia],
                            isHoje: dia === hoje,
                          })
                        )}
                      />
                    );
                  })}
                </tr>
                {indisponivel.map((func) => {
                  const currentIndex = rowIndex++;
                  return (
                    <LinhaIndisponivel
                      key={func.id}
                      funcionario={func}
                      dias={dias}
                      diasSemana={diasSemana}
                      hoje={hoje}
                      feriadosPorDia={feriadosPorDia}
                      rowIndex={currentIndex}
                    />
                  );
                })}
              </>
            )}

            {semAtribuicao.length > 0 && (
              <>
                <tr>
                  <td colSpan={COLUNAS_FIXAS.length + dias.length} className="h-2 bg-slate-100/80 border-y" />
                </tr>
                <tr className="bg-amber-50/60">
                  <td
                    colSpan={COLUNAS_FIXAS.length}
                    className="border-b border-r px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 sticky left-0 z-10 bg-amber-50/60"
                  >
                    Sem atribuição — selecione um grupo ou arraste para cima
                  </td>
                  {dias.map((dia, idx) => {
                    const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
                    return (
                      <td
                        key={dia}
                        className={cn(
                          'border-b bg-amber-50/40',
                          colunaCalendarioClass({
                            isWeekend,
                            feriadoNome: feriadosPorDia[dia],
                            isHoje: dia === hoje,
                          })
                        )}
                      />
                    );
                  })}
                </tr>
                {semAtribuicao.map((func) => {
                  const currentIndex = rowIndex++;
                  return (
                    <LinhaSemGrupo
                      key={func.id}
                      funcionario={func}
                      dias={dias}
                      diasSemana={diasSemana}
                      hoje={hoje}
                      feriadosPorDia={feriadosPorDia}
                      rowIndex={currentIndex}
                      gruposEscala={gruposEscala}
                      onAtribuirGrupo={handleAtribuirGrupo}
                    />
                  );
                })}
              </>
            )}

            {semPadrao.length > 0 && (
              <>
                <tr>
                  <td colSpan={COLUNAS_FIXAS.length + dias.length} className="h-2 bg-slate-100/80 border-y" />
                </tr>
                <tr className="bg-slate-100/70">
                  <td
                    colSpan={COLUNAS_FIXAS.length}
                    className="border-b border-r px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sticky left-0 z-10 bg-slate-100/70"
                  >
                    Outras categorias
                  </td>
                  {dias.map((dia, idx) => {
                    const isWeekend = diasSemana[idx] === 'SAB' || diasSemana[idx] === 'DOM';
                    return (
                      <td
                        key={dia}
                        className={cn(
                          'border-b bg-slate-100/50',
                          colunaCalendarioClass({
                            isWeekend,
                            feriadoNome: feriadosPorDia[dia],
                            isHoje: dia === hoje,
                          })
                        )}
                      />
                    );
                  })}
                </tr>
                {renderLinhas(semPadrao, false, false)}
              </>
            )}
          </tbody>
        </table>
      </div>

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
    </Paper>
  );
}
