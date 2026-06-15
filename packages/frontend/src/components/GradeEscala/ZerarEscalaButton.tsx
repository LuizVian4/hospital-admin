import { Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useZerarEscalaFuncionario } from '@/hooks/useEscala';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ZerarEscalaButtonProps {
  competenciaId: number;
  funcionarioId: number;
  funcionarioNome: string;
  className?: string;
}

export function ZerarEscalaButton({
  competenciaId,
  funcionarioId,
  funcionarioNome,
  className,
}: ZerarEscalaButtonProps) {
  const zerar = useZerarEscalaFuncionario(competenciaId);

  const handleClick = () => {
    const confirmed = window.confirm(
      `Zerar a escala de ${funcionarioNome} neste mês?\n\nTodos os turnos serão removidos e a projeção automática será desativada.`
    );
    if (!confirmed) return;

    zerar.mutate(funcionarioId, {
      onSuccess: () => toast.success(`Escala de ${funcionarioNome} zerada`),
      onError: () => toast.error('Erro ao zerar escala'),
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-red-600 hover:bg-red-50',
        zerar.isPending && 'opacity-100',
        className
      )}
      title="Zerar escala do funcionário"
      disabled={zerar.isPending}
      onClick={handleClick}
    >
      <Eraser className="h-3.5 w-3.5" />
    </Button>
  );
}
