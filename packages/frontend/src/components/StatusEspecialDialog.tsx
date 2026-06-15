import { useState, type FormEvent } from 'react';
import type { Funcionario, StatusEspecial } from '@escala/shared';
import { STATUS_ESPECIAIS_OPCOES } from '@escala/shared';
import {
  useCreateStatusEspecial,
  useDeleteStatusEspecial,
  useStatusEspeciaisFuncionario,
} from '@/hooks/useStatusEspeciais';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CalendarOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface StatusEspecialDialogProps {
  funcionario: Funcionario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function StatusEspecialDialog({ funcionario, open, onOpenChange }: StatusEspecialDialogProps) {
  const [status, setStatus] = useState<StatusEspecial>('FÉRIAS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { data: statuses = [], isLoading } = useStatusEspeciaisFuncionario(
    funcionario?.id,
    open
  );
  const createStatus = useCreateStatusEspecial();
  const deleteStatus = useDeleteStatusEspecial(funcionario?.id ?? 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!funcionario) return;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-amber-600" />
            Status especiais
          </DialogTitle>
          <DialogDescription>
            {funcionario
              ? `${funcionario.nome} · Matrícula ${funcionario.matricula}`
              : 'Registre férias ou licenças com período definido.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusEspecial)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ESPECIAIS_OPCOES.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status-inicio">Data de início</Label>
              <Input
                id="status-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-fim">Data de fim</Label>
              <Input
                id="status-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createStatus.isPending}>
            {createStatus.isPending ? 'Salvando...' : 'Adicionar status'}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Registros
          </p>
          {isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
              Nenhum status especial cadastrado.
            </p>
          ) : (
            <div className="divide-y rounded-lg border max-h-52 overflow-y-auto">
              {statuses.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <StatusBadge status={item.status} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateBr(item.dataInicio)} — {formatDateBr(item.dataFim)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
