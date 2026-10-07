import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeTelefone } from '@escala/shared';
import { AuthButton, AuthError, AuthField } from '@/components/auth/AuthField';
import { useAuth } from '@/contexts/AuthContext';
import { appRoutes } from '@/lib/routes';

interface RegisterFormProps {
  redirectTo?: string;
}

export function RegisterForm({ redirectTo = appRoutes.dashboard }: RegisterFormProps) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!normalizeTelefone(telefone)) {
      setError('Informe um telefone válido com DDD');
      return;
    }

    setSubmitting(true);

    try {
      await register(nome.trim(), empresaNome.trim(), email.trim(), telefone.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar conta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error && <AuthError message={error} />}

      <AuthField
        label="Nome completo"
        autoComplete="name"
        placeholder="Seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />

      <AuthField
        label="Nome da empresa"
        autoComplete="organization"
        placeholder="Ex.: Hospital Santa Luzia"
        value={empresaNome}
        onChange={(e) => setEmpresaNome(e.target.value)}
        required
      />

      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@hospital.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <AuthField
        label="Telefone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="(71) 99999-9999"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        required
        hint="DDD + número"
      />

      <AuthField
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        hint="Mínimo de 8 caracteres"
      />

      <AuthField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <AuthButton loading={submitting} loadingText="Criando conta...">
        Criar conta
      </AuthButton>
    </form>
  );
}
