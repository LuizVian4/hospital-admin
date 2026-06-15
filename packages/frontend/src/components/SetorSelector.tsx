import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useSetores } from '@/hooks/useFuncionarios';

interface SetorSelectorProps {
  value?: number;
  onChange: (setorId: number) => void;
  size?: 'small' | 'medium';
}

export function SetorSelector({ value, onChange, size = 'small' }: SetorSelectorProps) {
  const { data: setores = [] } = useSetores();

  return (
    <FormControl size={size} sx={{ minWidth: 200 }}>
      <InputLabel id="setor-select-label">Setor</InputLabel>
      <Select
        labelId="setor-select-label"
        label="Setor"
        value={value?.toString() ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {setores.map((s) => (
          <MenuItem key={s.id} value={s.id.toString()}>
            {s.nome}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
