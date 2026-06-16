import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { FiltrosBancoHoras } from './bancoHorasFiltros';

interface BancoHorasFiltrosBarProps {
  filtros: FiltrosBancoHoras;
  setores: string[];
  onChange: (patch: Partial<FiltrosBancoHoras>) => void;
}

export function BancoHorasFiltrosBar({ filtros, setores, onChange }: BancoHorasFiltrosBarProps) {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}
      >
        <TextField
          size="small"
          placeholder="Buscar nome, matrícula, setor ou categoria…"
          value={filtros.busca}
          onChange={(e) => onChange({ busca: e.target.value })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { xs: '100%', md: 280 }, flex: { md: 1 } }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Setor</InputLabel>
          <Select
            value={filtros.setor}
            label="Setor"
            onChange={(e) => onChange({ setor: e.target.value })}
          >
            <MenuItem value="todos">Todos os setores</MenuItem>
            {setores.map((setor) => (
              <MenuItem key={setor} value={setor}>
                {setor}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={filtros.ordenacao}
              label="Ordenar por"
              onChange={(e) =>
                onChange({ ordenacao: e.target.value as FiltrosBancoHoras['ordenacao'] })
              }
            >
              <MenuItem value="nome">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <SortByAlphaIcon fontSize="small" />
                  <span>Nome</span>
                </Stack>
              </MenuItem>
              <MenuItem value="setor">Setor</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={filtros.direcaoOrdenacao}
            onChange={(_, value: FiltrosBancoHoras['direcaoOrdenacao'] | null) => {
              if (value) onChange({ direcaoOrdenacao: value });
            }}
            aria-label="Direção da ordenação"
          >
            <ToggleButton value="asc" aria-label="Crescente">
              <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
              A→Z
            </ToggleButton>
            <ToggleButton value="desc" aria-label="Decrescente">
              <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
              Z→A
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Situação
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filtros.situacao}
          onChange={(_, value: FiltrosBancoHoras['situacao'] | null) => {
            if (value) onChange({ situacao: value });
          }}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="todos">Todos</ToggleButton>
          <ToggleButton value="devendo" color="warning">
            Devedores
          </ToggleButton>
          <ToggleButton value="excedeu" color="info">
            Excedentes
          </ToggleButton>
          <ToggleButton value="pendentes">Pendentes</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
}
