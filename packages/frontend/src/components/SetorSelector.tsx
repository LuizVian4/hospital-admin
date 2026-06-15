import { useSetores } from '@/hooks/useFuncionarios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SetorSelectorProps {
  value?: number;
  onChange: (setorId: number) => void;
}

export function SetorSelector({ value, onChange }: SetorSelectorProps) {
  const { data: setores = [] } = useSetores();

  return (
    <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v, 10))}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione o setor" />
      </SelectTrigger>
      <SelectContent>
        {setores.map((s) => (
          <SelectItem key={s.id} value={s.id.toString()}>
            {s.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
