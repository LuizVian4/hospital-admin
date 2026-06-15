import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Funcionario } from '@escala/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSetores } from '@/hooks/useFuncionarios';

const schema = z.object({
  matricula: z.string().min(1, 'Obrigatório'),
  nome: z.string().min(1, 'Obrigatório'),
  coren: z.string().optional(),
  categoria: z.string().default('TÉC. DE ENFERMAGEM'),
  tipoContrato: z.string().default('EFETIVO'),
  dataAdmissao: z.string().optional(),
  cargaHoraria: z.enum(['180H', '144H']).default('180H'),
  setorId: z.number(),
});

type FormData = z.infer<typeof schema>;

interface FuncionarioFormProps {
  initial?: Partial<Funcionario>;
  onSubmit: (data: FormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function FuncionarioForm({ initial, onSubmit, onCancel, loading }: FuncionarioFormProps) {
  const { data: setores = [] } = useSetores();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricula: initial?.matricula ?? '',
      nome: initial?.nome ?? '',
      coren: initial?.coren ?? '',
      categoria: initial?.categoria ?? 'TÉC. DE ENFERMAGEM',
      tipoContrato: initial?.tipoContrato ?? 'EFETIVO',
      dataAdmissao: initial?.dataAdmissao ?? '',
      cargaHoraria: initial?.cargaHoraria ?? '180H',
      setorId: initial?.setorId ?? setores[0]?.id,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Identificação
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input id="matricula" {...register('matricula')} disabled={!!initial?.id} />
            {errors.matricula && (
              <p className="text-xs text-red-500">{errors.matricula.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coren">COREN</Label>
            <Input id="coren" placeholder="Opcional" {...register('coren')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" placeholder="Nome do funcionário" {...register('nome')} />
          {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vínculo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input {...register('categoria')} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de contrato</Label>
            <Select value={watch('tipoContrato')} onValueChange={(v) => setValue('tipoContrato', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFETIVO">EFETIVO</SelectItem>
                <SelectItem value="PROVISÓRIO">PROVISÓRIO</SelectItem>
                <SelectItem value="Temporário">Temporário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataAdmissao">Data de admissão</Label>
            <Input id="dataAdmissao" type="date" {...register('dataAdmissao')} />
          </div>
          <div className="space-y-1.5">
            <Label>Carga horária</Label>
            <Select
              value={watch('cargaHoraria')}
              onValueChange={(v) => setValue('cargaHoraria', v as '180H' | '144H')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="180H">180H</SelectItem>
                <SelectItem value="144H">144H</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Setor</Label>
          <Select
            value={watch('setorId')?.toString()}
            onValueChange={(v) => setValue('setorId', parseInt(v, 10))}
          >
            <SelectTrigger>
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
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : initial?.id ? 'Salvar alterações' : 'Cadastrar funcionário'}
        </Button>
      </div>
    </form>
  );
}
