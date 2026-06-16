import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isEnfermeiro, type Funcionario } from '@escala/shared';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useSetores } from '@/hooks/useFuncionarios';

const SEM_SETOR = '__none__';

const CATEGORIAS = [
  { value: 'TÉCNICO DE ENFERMAGEM', label: 'Técnico de Enfermagem' },
  { value: 'ENFERMEIRO', label: 'Enfermeiro' },
] as const;

function normalizarCategoriaForm(categoria?: string): (typeof CATEGORIAS)[number]['value'] {
  return isEnfermeiro(categoria ?? '') ? 'ENFERMEIRO' : 'TÉCNICO DE ENFERMAGEM';
}

const schema = z.object({
  matricula: z.string().min(1, 'Obrigatório'),
  nome: z.string().min(1, 'Obrigatório'),
  coren: z.string().optional(),
  categoria: z.enum(['TÉCNICO DE ENFERMAGEM', 'ENFERMEIRO']).default('TÉCNICO DE ENFERMAGEM'),
  tipoContrato: z.string().default('EFETIVO'),
  dataAdmissao: z.string().optional(),
  cargaHoraria: z.enum(['180H', '144H']).default('180H'),
  setorId: z.number().nullable(),
});

export type FuncionarioFormData = z.infer<typeof schema>;

interface FuncionarioFormProps {
  formId?: string;
  initial?: Partial<Funcionario>;
  onSubmit: (data: FuncionarioFormData) => void;
  loading?: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      sx={{ fontWeight: 600, letterSpacing: 0.8, display: 'block' }}
    >
      {children}
    </Typography>
  );
}

export function FuncionarioForm({ formId, initial, onSubmit, loading }: FuncionarioFormProps) {
  const { data: setores = [] } = useSetores();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricula: initial?.matricula ?? '',
      nome: initial?.nome ?? '',
      coren: initial?.coren ?? '',
      categoria: normalizarCategoriaForm(initial?.categoria),
      tipoContrato: initial?.tipoContrato ?? 'EFETIVO',
      dataAdmissao: initial?.dataAdmissao ?? '',
      cargaHoraria: initial?.cargaHoraria ?? '180H',
      setorId: initial?.setorId ?? setores[0]?.id ?? null,
    },
  });

  return (
    <Box
      component="form"
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Stack spacing={3}>
        <Box>
          <SectionTitle>Identificação</SectionTitle>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Matrícula"
                fullWidth
                size="small"
                disabled={!!initial?.id || loading}
                error={!!errors.matricula}
                helperText={errors.matricula?.message}
                {...register('matricula')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="COREN"
                fullWidth
                size="small"
                placeholder="Opcional"
                disabled={loading}
                {...register('coren')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nome completo"
                fullWidth
                size="small"
                placeholder="Nome do funcionário"
                disabled={loading}
                error={!!errors.nome}
                helperText={errors.nome?.message}
                {...register('nome')}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box>
          <SectionTitle>Vínculo</SectionTitle>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="categoria-label">Categoria</InputLabel>
                    <Select {...field} labelId="categoria-label" label="Categoria">
                      {CATEGORIAS.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="tipoContrato"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="tipo-contrato-label">Tipo de contrato</InputLabel>
                    <Select {...field} labelId="tipo-contrato-label" label="Tipo de contrato">
                      <MenuItem value="EFETIVO">EFETIVO</MenuItem>
                      <MenuItem value="PROVISÓRIO">PROVISÓRIO</MenuItem>
                      <MenuItem value="Temporário">Temporário</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Data de admissão"
                type="date"
                fullWidth
                size="small"
                disabled={loading}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('dataAdmissao')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="cargaHoraria"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="carga-horaria-label">Carga horária</InputLabel>
                    <Select {...field} labelId="carga-horaria-label" label="Carga horária">
                      <MenuItem value="180H">180H</MenuItem>
                      <MenuItem value="144H">144H</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="setorId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="setor-label">Setor</InputLabel>
                    <Select
                      labelId="setor-label"
                      label="Setor"
                      value={field.value != null ? field.value.toString() : SEM_SETOR}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === SEM_SETOR ? null : Number(v));
                      }}
                    >
                      <MenuItem value={SEM_SETOR}>
                        <em>Sem setor</em>
                      </MenuItem>
                      {setores.map((s) => (
                        <MenuItem key={s.id} value={s.id.toString()}>
                          {s.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
}
