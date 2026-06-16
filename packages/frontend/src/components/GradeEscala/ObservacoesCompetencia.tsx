import { useEffect, useMemo, useState } from 'react';
import {
  appendObservacaoLista,
  isObservacaoTroca,
  parseObservacoesLista,
  serializarObservacoesLista,
} from '@escala/shared';
import { ArrowLeftRight, FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ObservacoesCompetenciaProps {
  observacoes?: string;
  disabled?: boolean;
  isSaving?: boolean;
  onSave: (observacoes: string) => void;
}

export function ObservacoesCompetencia({
  observacoes,
  disabled = false,
  isSaving = false,
  onSave,
}: ObservacoesCompetenciaProps) {
  const [novaObservacao, setNovaObservacao] = useState('');

  const itens = useMemo(() => parseObservacoesLista(observacoes), [observacoes]);

  useEffect(() => {
    setNovaObservacao('');
  }, [observacoes]);

  const handleAdicionar = () => {
    const texto = novaObservacao.trim();
    if (!texto) return;
    onSave(appendObservacaoLista(observacoes, texto));
    setNovaObservacao('');
  };

  const handleRemover = (index: number) => {
    const atualizados = [...itens];
    atualizados.splice(index, 1);
    onSave(serializarObservacoesLista(atualizados));
  };

  return (
    <div className="space-y-3">
      {itens.length > 0 ? (
        <ul className="divide-y rounded-md border max-h-64 overflow-y-auto">
          {itens.map((item, index) => {
            const troca = isObservacaoTroca(item);
            return (
              <li
                key={`${index}-${item.slice(0, 24)}`}
                className={cn(
                  'flex items-start gap-2.5 px-3 py-2.5 text-sm',
                  troca ? 'bg-violet-50/40' : 'bg-background'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    troca ? 'bg-violet-100 text-violet-700' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {troca ? (
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                </span>
                <p className="flex-1 min-w-0 leading-relaxed break-words">{item}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={disabled || isSaving}
                  onClick={() => handleRemover(index)}
                  title="Remover observação"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center">
          Nenhuma observação manual registrada.
        </p>
      )}

      <div className="flex gap-2">
        <Input
          value={novaObservacao}
          onChange={(e) => setNovaObservacao(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdicionar();
            }
          }}
          placeholder="Adicionar observação manual..."
          disabled={disabled || isSaving}
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0"
          disabled={disabled || isSaving || !novaObservacao.trim()}
          onClick={handleAdicionar}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Trocas de escala ficam registradas na planilha (destaque violeta). Use este campo apenas para anotações manuais.
      </p>
    </div>
  );
}
