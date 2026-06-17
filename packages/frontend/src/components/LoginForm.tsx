import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthButton, AuthError, AuthField } from '@/components/auth/AuthField';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error && <AuthError message={error} />}

      <AuthField
        label="E-mail"
        type="email"
        autoComplete="username"
        placeholder="seu@hospital.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-brand-dark">
            Senha
          </label>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2.5 text-sm text-brand-dark shadow-sm placeholder:text-brand-dark/40 outline-none transition-colors focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20"
        />
      </div>

      <AuthButton loading={submitting} loadingText="Entrando...">
        Entrar
      </AuthButton>
    </form>
  );
}
