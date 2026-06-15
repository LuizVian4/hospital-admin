import { useState, type FormEvent } from 'react';
import type { Setor } from '@escala/shared';
import { useCreateSetor, useUpdateSetor } from '@/hooks/useSetores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SetoresEditorProps {
  setores: Setor[];
}

interface SetorFormState {
  nome: string;
  empresa: string;
  gerente: string;
}

function emptyForm(): SetorFormState {
  return { nome: '', empresa: '', gerente: '' };
}

function fromSetor(setor: Setor): SetorFormState {
  return {
    nome: setor.nome,
    empresa: setor.empresa ?? '',
    gerente: setor.gerente ?? '',
  };
}

export function SetoresEditor({ setores }: SetoresEditorProps) {
  const [editing, setEditing] = useState<Setor | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SetorFormState>(emptyForm());

  const updateSetor = useUpdateSetor();
  const createSetor = useCreateSetor();
  const loading = updateSetor.isPending || createSetor.isPending;

  const openEdit = (setor: Setor) => {
    setEditing(setor);
    setForm(fromSetor(setor));
  };

  const openCreate = () => {
    setCreating(true);
    setForm(emptyForm());
  };

  const closeDialog = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm());
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Informe o nome do setor');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      empresa: form.empresa.trim() || undefined,
      gerente: form.gerente.trim() || undefined,
    };

    if (editing) {
      updateSetor.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Setor atualizado');
            closeDialog();
          },
          onError: (err) => toast.error(err.message),
        }
      );
      return;
    }

    createSetor.mutate(payload, {
      onSuccess: () => {
        toast.success('Setor cadastrado');
        closeDialog();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const dialogOpen = editing != null || creating;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Setores
              </CardTitle>
              <CardDescription className="mt-1">
                Edite nome, empresa e gerente de cada setor
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo setor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border">
            {setores.map((setor) => (
              <div
                key={setor.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium">{setor.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {setor.empresa || 'Empresa não informada'}
                    {setor.gerente && (
                      <span className="before:content-['·'] before:mx-1.5">
                        Gerente: {setor.gerente}
                      </span>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(setor)}>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Editar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar setor' : 'Novo setor'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do setor.'
                : 'Cadastre um novo setor hospitalar.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="setor-nome">Nome do setor</Label>
              <Input
                id="setor-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: UTI ADULTO"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setor-empresa">Empresa</Label>
              <Input
                id="setor-empresa"
                value={form.empresa}
                onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
                placeholder="Ex.: Hospital Teresa de Lisieux"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setor-gerente">Gerente</Label>
              <Input
                id="setor-gerente"
                value={form.gerente}
                onChange={(e) => setForm((f) => ({ ...f, gerente: e.target.value }))}
                placeholder="Nome do gerente"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
