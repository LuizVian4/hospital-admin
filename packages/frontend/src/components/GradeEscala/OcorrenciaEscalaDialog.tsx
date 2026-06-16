import { useEffect, useMemo, useState } from 'react';
import type { EscalaOcorrencia, Funcionario, TipoOcorrenciaEscala, Turno } from '@escala/shared';
import {
  getTurnoPlantaoExtraSugerido,
  getTurnosPlantaoExtraPermitidos,
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
const TURNOS_FALTA: Turno[] = ['MT', 'SN'];

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
  funcionariosVinculo: Funcionario[];
}

export function OcorrenciaEscalaDialog({
  open,
  onOpenChange,
  competenciaId,
  tipoEscala,
  state,
  funcionariosVinculo,
}: OcorrenciaEscalaDialogProps) {
  const [turno, setTurno] = useState<string>('');
  const [funcionarioVinculoId, setFuncionarioVinculoId] = useState<string>(SEM_VINCULO);
  const [observacao, setObservacao] = useState('');

  const salvar = useSalvarOcorrenciaEscala(competenciaId, tipoEscala);
  const remover = useRemoverOcorrenciaEscala(competenciaId, tipoEscala);

  const isFalta = state?.tipo === 'FALTA';
  const turnosPermitidos = useMemo(() => {
    if (!state) return [];
    if (isFalta) return TURNOS_FALTA;
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
          toast.success(isFalta ? 'Falta registrada' : 'Plantão extra registrado');
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleRemover = () => {
    const id = state.ocorrenciaExistente?.id;
    if (!id) return;
    remover.mutate(id, {
      onSuccess: () => {
        toast.success('Ocorrência removida');
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const vinculoOptions = funcionariosVinculo.filter((f) => f.id !== state.funcionarioId);

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
              disabled={!isFalta && turnosPermitidos.length === 1}
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
              {isFalta ? 'Quem cobriu o turno (opcional)' : 'Vincular à falta de (opcional)'}
            </Label>
            <Select value={funcionarioVinculoId} onValueChange={setFuncionarioVinculoId}>
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
