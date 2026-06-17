import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Mail,
  Pencil,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileField, ProfileSection } from '@/components/profile/ProfileField';
import { useAuth } from '@/contexts/AuthContext';
import { useChangePassword, useDeleteAccount, useUpdateProfile } from '@/hooks/useProfile';
import { getInitials } from '@/utils/funcionario';
import { cn } from '@/lib/utils';

function formatToday() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const deleteAccount = useDeleteAccount();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmText, setConfirmText] = useState('');

  function reset() {
    setSenha('');
    setConfirmText('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync({ senha });
      toast.success('Conta excluída');
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir conta');
    }
  }

  if (!open) return null;

  const canDelete = senha.length > 0 && confirmText === 'EXCLUIR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-dark/40 hover:bg-brand-light hover:text-brand-dark"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-lg font-bold text-brand-dark">Excluir conta</h2>
        <p className="mb-5 text-sm text-brand-dark/60">
          Esta ação é permanente. Todos os dados da sua conta serão removidos.
        </p>

        <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Você perderá o acesso ao Escala360 imediatamente após a exclusão.</span>
        </div>

        <div className="grid gap-4">
          <ProfileField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Confirme sua senha"
          />
          <ProfileField
            label='Digite "EXCLUIR" para confirmar'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-dark/70 hover:bg-brand-light"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleteAccount.isPending}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Excluir conta
          </button>
        </div>
      </div>
    </div>
  );
}

export function PerfilPage() {
  const { user, setUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
    }
  }, [user]);

  const profileDirty =
    user && (nome.trim() !== user.nome || email.trim().toLowerCase() !== user.email);
  const passwordMismatch = confirmacao.length > 0 && senhaNova !== confirmacao;
  const firstName = user?.nome.split(' ')[0] ?? '';

  function handleCancelEdit() {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
    }
    setEditing(false);
  }

  async function handleSaveProfile() {
    if (!user) return;

    const payload: { nome?: string; email?: string } = {};
    const trimmedNome = nome.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedNome !== user.nome) payload.nome = trimmedNome;
    if (trimmedEmail !== user.email) payload.email = trimmedEmail;

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    try {
      const updated = await updateProfile.mutateAsync(payload);
      setUser(updated);
      setEditing(false);
      toast.success('Perfil atualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    }
  }

  async function handleChangePassword() {
    if (senhaNova !== confirmacao) {
      toast.error('As senhas não coincidem');
      return;
    }
    try {
      await changePassword.mutateAsync({ senhaAtual, senhaNova });
      toast.success('Senha alterada com sucesso');
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmacao('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha');
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Cabeçalho da página */}
      <header className="mb-6">
        <p className="text-sm capitalize text-brand-dark/50">{formatToday()}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
          Olá, {firstName}
        </h1>
        <p className="mt-1 text-sm text-brand-dark/55">
          Gerencie seus dados pessoais e configurações de acesso
        </p>
      </header>

      {/* Card principal */}
      <div className="overflow-hidden rounded-2xl border border-brand-dark/8 bg-white shadow-sm">
        {/* Banner gradiente */}
        <div className="h-28 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-brand-mint/50 sm:h-32" />

        {/* Cabeçalho do perfil */}
        <div className="flex flex-col gap-4 px-6 pb-2 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-dark text-2xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
              {getInitials(user.nome)}
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="truncate text-xl font-bold text-brand-dark sm:text-2xl">{user.nome}</h2>
              <p className="truncate text-sm text-brand-dark/55">{user.email}</p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 pb-1 sm:pb-2">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark/90"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-brand-dark/15 px-4 py-2.5 text-sm font-medium text-brand-dark/70 transition-colors hover:bg-brand-light"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!profileDirty || !nome.trim() || !email.trim() || updateProfile.isPending}
                  className="rounded-xl bg-brand-mint px-5 py-2.5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-mint/90 disabled:opacity-50"
                >
                  Salvar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dados pessoais — grid 2 colunas */}
        <ProfileSection title="Informações pessoais" description="Seu nome e dados de identificação">
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              label="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={!editing}
              placeholder="Seu nome"
            />
            <ProfileField
              label="Apelido / nome de exibição"
              value={firstName}
              disabled
              placeholder="Gerado automaticamente"
              hint="Exibido nas saudações do sistema"
            />
          </div>
        </ProfileSection>

        {/* E-mail */}
        <ProfileSection title="Meu e-mail" description="Endereço usado para acessar o sistema">
          <div className="grid gap-5">
            <ProfileField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!editing}
              placeholder="seu@hospital.com.br"
            />

            <div className="flex items-center gap-3 rounded-xl bg-brand-light px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-mint/20">
                <Mail className="h-5 w-5 text-brand-dark" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-dark">{user.email}</p>
                <p className="text-xs text-brand-dark/45">E-mail principal da conta</p>
              </div>
              <span
                className={cn(
                  'ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                  user.ativo ? 'bg-brand-mint/20 text-brand-dark' : 'bg-red-100 text-red-700',
                )}
              >
                {user.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </ProfileSection>

        {/* Senha */}
        <ProfileSection
          title="Segurança"
          description="Altere sua senha de acesso regularmente"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              label="Senha atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <div className="hidden sm:block" />
            <ProfileField
              label="Nova senha"
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="••••••••"
              hint="Mínimo de 8 caracteres"
              autoComplete="new-password"
            />
            <ProfileField
              label="Confirmar nova senha"
              type="password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {passwordMismatch && (
            <p className="mt-3 text-sm text-red-600">As senhas não coincidem</p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
              <Shield className="h-5 w-5 text-brand-dark/60" />
            </div>
            <p className="flex-1 text-sm text-brand-dark/55">
              Após alterar a senha, sua sessão será renovada automaticamente.
            </p>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={
                !senhaAtual ||
                senhaNova.length < 8 ||
                confirmacao.length < 8 ||
                passwordMismatch ||
                changePassword.isPending
              }
              className="shrink-0 rounded-xl bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark/90 disabled:opacity-50"
            >
              Atualizar senha
            </button>
          </div>
        </ProfileSection>

        {/* Zona de perigo */}
        <ProfileSection
          title="Zona de perigo"
          description="Ações irreversíveis relacionadas à sua conta"
          className="bg-red-50/40"
        >
          <div className="flex flex-col gap-4 rounded-xl border border-red-200/80 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-dark">Excluir minha conta</p>
                <p className="mt-0.5 text-sm text-brand-dark/55">
                  Remove permanentemente sua conta e encerra o acesso ao sistema.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="shrink-0 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Excluir conta
            </button>
          </div>
        </ProfileSection>
      </div>

      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}

/** @deprecated Use PerfilPage */
export const UsuariosPage = PerfilPage;
