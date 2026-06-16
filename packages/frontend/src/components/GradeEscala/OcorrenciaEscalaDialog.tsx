import { useEffect, useMemo, useState } from 'react';
import type { EscalaOcorrencia, FuncionarioComTurnos, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import {
  funcionarioElegivelCobrirTurno,
  funcionarioPossuiTurnoNoDia,
  getTurnoPlantaoExtraSugerido,
  getTurnosPlantaoExtraPermitidos,
  isTurnoMtOuSn,
  validarTurnoPlantaoExtra,
} from '@escala/shared';
import { useRemoverOcorrenciaEscala, useSalvarOcorrenciaEscala } from '@/hooks/useEscala';
import type { TipoEscala } from '@escala/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, CalendarPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SEM_VINCULO = '__none__';
function normalizarTurnoFalta(turno: Turno | null | undefined): string {
  if (turno === 'MT' || turno === 'SN') return turno;
  return '';
}

export interface OcorrenciaEscalaDialogState {
  funcionarioId: number;
  funcionarioNome: string;
  dia: number;
  turnoPadrao: Turno | null;
  tipo: TipoOcorrenciaEscala;
  ocorrenciaExistente?: EscalaOcorrencia | null;
}

interface OcorrenciaEscalaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competenciaId: number;
  tipoEscala: TipoEscala;
  state: OcorrenciaEscalaDialogState | null;
  funcionariosComTurnos: FuncionarioComTurnos[];
}

export function OcorrenciaEscalaDialog({
  open,
  onOpenChange,
  competenciaId,
  tipoEscala,
  state,
  funcionariosComTurnos,
}: OcorrenciaEscalaDialogProps) {
  const [turno, setTurno] = useState<string>('');
  const [funcionarioVinculoId, setFuncionarioVinculoId] = useState<string>(SEM_VINCULO);
  const [observacao, setObservacao] = useState('');

  const salvar = useSalvarOcorrenciaEscala(competenciaId, tipoEscala);
  const remover = useRemoverOcorrenciaEscala(
    competenciaId,
    tipoEscala,
    state ? { funcionarioId: state.funcionarioId, dia: state.dia } : undefined
  );

  const isFalta = state?.tipo === 'FALTA';
  const turnosPermitidos = useMemo(() => {
    if (!state) return [];
    if (isFalta) {
      return isTurnoMtOuSn(state.turnoPadrao) ? [state.turnoPadrao!] : [];
    }
    return getTurnosPlantaoExtraPermitidos(state.turnoPadrao);
  }, [state, isFalta]);

  useEffect(() => {
    if (!state) return;
    const existente = state.ocorrenciaExistente;

    if (state.tipo === 'FALTA') {
      setTurno(normalizarTurnoFalta(existente?.turno ?? state.turnoPadrao));
    } else {
      const sugerido = getTurnoPlantaoExtraSugerido(state.turnoPadrao);
      const turnoSalvo = existente?.turno;
      const permitidos = getTurnosPlantaoExtraPermitidos(state.turnoPadrao);
      if (turnoSalvo && permitidos.includes(turnoSalvo)) {
        setTurno(turnoSalvo);
      } else if (sugerido) {
        setTurno(sugerido);
      } else {
        setTurno('');
      }
    }

    setFuncionarioVinculoId(
      existente?.funcionarioVinculoId != null
        ? String(existente.funcionarioVinculoId)
        : SEM_VINCULO
    );
    setObservacao(existente?.observacao ?? '');
  }, [state]);

  const vinculoOptions = useMemo(() => {
    if (!state) return [];
    const base = funcionariosComTurnos.filter((f) => f.id !== state.funcionarioId);

    if (!turno || (turno !== 'MT' && turno !== 'SN')) {
      return [];
    }

    if (isFalta) {
      return base.filter((f) =>
        funcionarioElegivelCobrirTurno(f, state.dia, turno as Turno)
      );
    }

    return base.filter((f) => {
      if (f.statusPorDia?.[state.dia]) return false;
      return funcionarioPossuiTurnoNoDia(f, state.dia, turno as Turno);
    });
  }, [funcionariosComTurnos, state, isFalta, turno]);

  useEffect(() => {
    if (!state) return;
    if (!turno) {
      setFuncionarioVinculoId(SEM_VINCULO);
      return;
    }
    if (
      funcionarioVinculoId !== SEM_VINCULO &&
      !vinculoOptions.some((f) => String(f.id) === funcionarioVinculoId)
    ) {
      setFuncionarioVinculoId(SEM_VINCULO);
    }
  }, [state, turno, vinculoOptions, funcionarioVinculoId]);

  if (!state) return null;

  const titulo = isFalta ? 'Registrar falta' : 'Vincular plantão extra';
  const Icon = isFalta ? AlertTriangle : CalendarPlus;

  const hintPlantaoExtra =
    state.turnoPadrao === 'MT'
      ? 'Turno MT na escala — extra permitido: SN'
      : state.turnoPadrao === 'SN'
        ? 'Turno SN na escala — extra permitido: MT'
        : state.turnoPadrao === 'F' || state.turnoPadrao === '/'
          ? 'Folga/plantão no dia — selecione MT ou SN do extra'
          : 'Selecione MT ou SN do plantão extra';

  const handleSalvar = () => {
    if (isFalta) {
      if (!turno || (turno !== 'MT' && turno !== 'SN')) {
        toast.error('Selecione o turno (MT ou SN)');
        return;
      }
    } else {
      const erro = validarTurnoPlantaoExtra(state.turnoPadrao, turno as Turno);
      if (erro) {
        toast.error(erro);
        return;
      }
    }

    salvar.mutate(
      {
        competenciaId,
        funcionarioId: state.funcionarioId,
        dia: state.dia,
        tipo: state.tipo,
        turno: turno as Turno,
        turnoBase: state.turnoPadrao,
        funcionarioVinculoId:
          funcionarioVinculoId === SEM_VINCULO ? null : Number(funcionarioVinculoId),
        observacao: observacao.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(
            isFalta
              ? funcionarioVinculoId !== SEM_VINCULO
                ? 'Falta registrada e plantão extra vinculado'
                : 'Falta registrada'
              : funcionarioVinculoId !== SEM_VINCULO
                ? 'Plantão extra registrado e falta vinculada'
                : 'Plantão extra registrado'
          );
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleRemover = () => {
    const id = state.ocorrenciaExistente?.id;
    if (!id) return;
    const comVinculo = state.ocorrenciaExistente?.funcionarioVinculoId != null;
    remover.mutate(id, {
      onSuccess: () => {
        toast.success(
          state.tipo === 'FALTA'
            ? comVinculo
              ? 'Falta e plantão extra vinculado removidos'
              : 'Falta removida'
            : comVinculo
              ? 'Plantão extra e falta vinculada removidos'
              : 'Plantão extra removido'
        );
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const vinculoHint = isFalta
    ? !turno || (turno !== 'MT' && turno !== 'SN')
      ? 'Selecione o turno da falta para listar quem pode cobrir.'
      : vinculoOptions.length === 0
        ? `Nenhum funcionário elegível para cobrir o turno ${turno}.`
        : 'Ao selecionar, o funcionário receberá plantão extra neste turno com vínculo de cobertura.'
    : !turno || (turno !== 'MT' && turno !== 'SN')
      ? 'Selecione o turno extra para listar quem está escalado neste turno no dia.'
      : vinculoOptions.length === 0
        ? `Nenhum funcionário com turno ${turno} neste dia.`
        : 'Ao selecionar, o funcionário receberá falta neste turno com vínculo de cobertura.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${isFalta ? 'text-red-600' : 'text-emerald-600'}`} />
            {titulo}
          </DialogTitle>
          <DialogDescription>
            {state.funcionarioNome} · Dia {state.dia}
            {state.turnoPadrao ? ` · Escala: ${state.turnoPadrao}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{isFalta ? 'Turno' : 'Turno extra'}</Label>
            {!isFalta && (
              <p className="text-xs text-muted-foreground">{hintPlantaoExtra}</p>
            )}
            <Select
              value={turno || undefined}
              onValueChange={setTurno}
              disabled={turnosPermitidos.length === 1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                {turnosPermitidos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              {isFalta ? 'Quem cobriu o turno (opcional)' : 'Funcionário com falta no turno (opcional)'}
            </Label>
            <p className="text-xs text-muted-foreground">{vinculoHint}</p>
            <Select
              value={funcionarioVinculoId}
              onValueChange={setFuncionarioVinculoId}
              disabled={!turno || vinculoOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_VINCULO}>Nenhum vínculo</SelectItem>
                {vinculoOptions.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ocorrencia-obs">Observação (opcional)</Label>
            <Input
              id="ocorrencia-obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes adicionais..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {state.ocorrenciaExistente?.id && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemover}
              disabled={remover.isPending || salvar.isPending}
            >
              Remover
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={remover.isPending || salvar.isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSalvar} disabled={remover.isPending || salvar.isPending}>
            {salvar.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
