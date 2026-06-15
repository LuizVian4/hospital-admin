import { Fragment, useMemo, useState } from 'react';
import {
  useFuncionarios,
  useCreateFuncionario,
  useUpdateFuncionario,
  useSetores,
} from '@/hooks/useFuncionarios';
import { FuncionarioForm } from '@/components/FuncionarioForm';
import { ContratoBadge } from '@/components/ContratoBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Funcionario } from '@escala/shared';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarOff,
  ChevronDown,
  ChevronRight,
  Filter,
  Pencil,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { StatusEspecialDialog } from '@/components/StatusEspecialDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-full hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

function FuncionarioTableRow({
  f,
  onEdit,
  onStatus,
}: {
  f: Funcionario;
  onEdit: (f: Funcionario) => void;
  onStatus: (f: Funcionario) => void;
}) {
  return (
    <tr className="group hover:bg-slate-50/80 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold',
              !f.coren
                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-200'
                : 'bg-primary/10 text-primary'
            )}
          >
            {getInitials(f.nome)}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-1.5">
              {f.nome}
              {!f.coren && (
                <span title="COREN não cadastrado">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{f.categoria}</p>
            <p className="text-xs text-muted-foreground md:hidden font-mono mt-0.5">
              {f.matricula}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <Badge variant="outline" className="font-mono font-normal">
          {f.matricula}
        </Badge>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {f.coren ? (
          <span className="font-mono text-xs">{f.coren}</span>
        ) : (
          <Badge variant="warning">Pendente</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <ContratoBadge contrato={f.tipoContrato} />
      </td>
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        <Badge variant="muted">{f.cargaHoraria}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="opacity-60 group-hover:opacity-100"
            onClick={() => onStatus(f)}
            title="Status especiais"
          >
            <CalendarOff className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-60 group-hover:opacity-100"
            onClick={() => onEdit(f)}
            title="Editar funcionário"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function FuncionariosPage() {
  const [filters, setFilters] = useState<Record<string, string>>({ ativo: 'true' });
  const [searchNome, setSearchNome] = useState('');
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [statusFuncionario, setStatusFuncionario] = useState<Funcionario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [gruposAbertos, setGruposAbertos] = useState<Set<number>>(() => new Set());

  const { data: funcionarios = [], isLoading } = useFuncionarios(filters);
  const { data: setores = [] } = useSetores();
  const createMutation = useCreateFuncionario();
  const updateMutation = useUpdateFuncionario();

  const setorMap = useMemo(
    () => new Map(setores.map((s) => [s.id, s.nome])),
    [setores]
  );

  const funcionariosPorSetor = useMemo(() => {
    const groups = new Map<number, Funcionario[]>();
    for (const f of funcionarios) {
      if (!groups.has(f.setorId)) groups.set(f.setorId, []);
      groups.get(f.setorId)!.push(f);
    }
    for (const lista of groups.values()) {
      lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    }
    return groups;
  }, [funcionarios]);

  const setoresComFuncionarios = useMemo(() => {
    const idsComFuncionarios = new Set(funcionarios.map((f) => f.setorId));
    const ordenados = setores
      .filter((s) => idsComFuncionarios.has(s.id))
      .map((s) => ({
        id: s.id,
        nome: s.nome,
        funcionarios: funcionariosPorSetor.get(s.id) ?? [],
      }));

    for (const id of idsComFuncionarios) {
      if (!setores.some((s) => s.id === id)) {
        ordenados.push({
          id,
          nome: setorMap.get(id) ?? `Setor #${id}`,
          funcionarios: funcionariosPorSetor.get(id) ?? [],
        });
      }
    }

    return ordenados;
  }, [funcionarios, setores, funcionariosPorSetor, setorMap]);

  const stats = useMemo(() => {
    const semCoren = funcionarios.filter((f) => !f.coren).length;
    const efetivos = funcionarios.filter((f) => f.tipoContrato === 'EFETIVO').length;
    const outros = funcionarios.length - efetivos;
    return { total: funcionarios.length, semCoren, efetivos, outros };
  }, [funcionarios]);

  const hasActiveFilters = Boolean(filters.nome || filters.setor || filters.contrato);

  const clearFilters = () => {
    setSearchNome('');
    setFilters({ ativo: 'true' });
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (f: Funcionario) => {
    setEditing(f);
    setShowForm(true);
  };

  const toggleGrupo = (setorId: number) => {
    setGruposAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(setorId)) next.delete(setorId);
      else next.add(setorId);
      return next;
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = (data: {
    matricula: string;
    nome: string;
    coren?: string;
    categoria: string;
    tipoContrato: string;
    dataAdmissao?: string;
    cargaHoraria: '180H' | '144H';
    setorId: number;
  }) => {
    const payload = { ...data, tipoContrato: data.tipoContrato as Funcionario['tipoContrato'] };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Funcionário atualizado');
            closeForm();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Funcionário cadastrado');
          closeForm();
        },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-8">
            Cadastro e gestão de técnicos de enfermagem
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo funcionário
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Efetivos</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-700">{stats.efetivos}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Outros vínculos</p>
                <p className="text-2xl font-bold tabular-nums">{stats.outros}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(stats.semCoren > 0 && 'border-amber-200 bg-amber-50/50')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Sem COREN</p>
                <p className="text-2xl font-bold tabular-nums text-amber-700">{stats.semCoren}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
          <CardDescription>Refine a lista por nome, setor ou tipo de contrato</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchNome}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchNome(value);
                  setFilters((f) => {
                    const next = { ...f };
                    if (value) next.nome = value;
                    else delete next.nome;
                    return next;
                  });
                }}
              />
            </div>

            <Select
              value={filters.setor ?? '__all__'}
              onValueChange={(v) =>
                setFilters((f) => {
                  const next = { ...f };
                  if (v === '__all__') delete next.setor;
                  else next.setor = v;
                  return next;
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os setores</SelectItem>
                {setores.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.contrato ?? '__all__'}
              onValueChange={(v) =>
                setFilters((f) => {
                  const next = { ...f };
                  if (v === '__all__') delete next.contrato;
                  else next.contrato = v;
                  return next;
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os contratos</SelectItem>
                <SelectItem value="EFETIVO">EFETIVO</SelectItem>
                <SelectItem value="PROVISÓRIO">PROVISÓRIO</SelectItem>
                <SelectItem value="Temporário">Temporário</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              Equipe por setor
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({funcionarios.length} {funcionarios.length === 1 ? 'pessoa' : 'pessoas'}
                  {setoresComFuncionarios.length > 1 &&
                    ` · ${setoresComFuncionarios.length} setores`}
                  )
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>

        {isLoading ? (
          <TableSkeleton />
        ) : funcionarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Nenhum funcionário encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {hasActiveFilters
                ? 'Tente ajustar os filtros ou limpar a busca.'
                : 'Comece cadastrando o primeiro funcionário da equipe.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar funcionário
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3 min-w-[240px]">Funcionário</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Matrícula</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">COREN</th>
                  <th className="text-left font-medium px-4 py-3">Contrato</th>
                  <th className="text-center font-medium px-4 py-3 hidden sm:table-cell">CH</th>
                  <th className="text-right font-medium px-4 py-3 w-16">Ações</th>
                </tr>
              </thead>
              <tbody>
                {setoresComFuncionarios.map((grupo, idx) => {
                  const aberto = gruposAbertos.has(grupo.id);
                  return (
                    <Fragment key={grupo.id}>
                      <tr
                        className={cn(
                          'bg-indigo-50/70 border-y border-indigo-100 cursor-pointer hover:bg-indigo-100/60 transition-colors',
                          idx > 0 && 'border-t-2'
                        )}
                        onClick={() => toggleGrupo(grupo.id)}
                      >
                        <td colSpan={6} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {aberto ? (
                              <ChevronDown className="h-4 w-4 text-indigo-600 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-indigo-600 shrink-0" />
                            )}
                            <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-indigo-900">{grupo.nome}</span>
                            <Badge variant="info" className="font-normal">
                              {grupo.funcionarios.length}{' '}
                              {grupo.funcionarios.length === 1 ? 'técnico' : 'técnicos'}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                      {aberto &&
                        grupo.funcionarios.map((f) => (
                          <FuncionarioTableRow
                            key={f.id}
                            f={f}
                            onEdit={openEdit}
                            onStatus={setStatusFuncionario}
                          />
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar funcionário' : 'Novo funcionário'}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Atualize os dados de ${editing.nome}. Matrícula: ${editing.matricula}.`
                : 'Preencha os dados para cadastrar um novo membro da equipe.'}
            </DialogDescription>
          </DialogHeader>
          <FuncionarioForm
            key={editing?.id ?? 'new'}
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <StatusEspecialDialog
        funcionario={statusFuncionario}
        open={statusFuncionario != null}
        onOpenChange={(open) => !open && setStatusFuncionario(null)}
      />
    </div>
  );
}
