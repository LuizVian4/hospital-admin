import { Navigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { LogoBrand } from '@/components/LogoBrand';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { DashboardMockup } from '@/components/landing/ProductMockups';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const PANEL_FEATURES = [
  'Escalas centralizadas com grade interativa',
  'Banco de horas calculado automaticamente',
  'Dashboard com cobertura em tempo real',
  'Importação de planilhas XLSX e ODS',
] as const;

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const isLogin = mode === 'login';
  const linkState = location.state;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-dark border-t-brand-mint" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Painel esquerdo — branding (estilo Untitled UI split) */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-brand-dark lg:flex lg:flex-col">
        <DotPattern className="fill-white/[0.06] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <RouterLink to="/" className="inline-flex text-white no-underline">
            <LogoBrand size={56} textColor="text-white" subtitleColor="text-white/60" />
          </RouterLink>

          <div className="my-10 max-w-lg">
            <blockquote className="mb-8">
              <p className="text-2xl font-semibold leading-snug tracking-tight text-white xl:text-3xl">
                &ldquo;Antes passávamos dois dias fechando a escala do mês. Agora montamos em horas.&rdquo;
              </p>
              <footer className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mint/20 text-sm font-bold text-brand-mint">
                  LM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Lara Miranda</p>
                  <p className="text-sm text-white/55">Coordenadora de Enfermagem · Hapvida</p>
                </div>
              </footer>
            </blockquote>

            <ul className="grid gap-3">
              {PANEL_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-white/75">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-mint/20">
                    <Check className="h-3 w-3 text-brand-mint" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/20">
            <div className="overflow-hidden rounded-xl opacity-90">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </aside>

      {/* Painel direito — formulário */}
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-8">
          <RouterLink
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-dark/60 transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </RouterLink>

          <RouterLink to="/" className="lg:hidden">
            <LogoBrand size={44} showText={false} />
          </RouterLink>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="mb-8 lg:hidden">
              <LogoBrand size={52} subtitle={isLogin ? 'Acesso ao sistema' : 'Crie sua conta'} />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h1>
              <p className="mt-2 text-sm text-brand-dark/60">
                {isLogin
                  ? 'Entre com suas credenciais para acessar o sistema.'
                  : 'Comece a gerenciar escalas hospitalares em minutos.'}
              </p>
            </div>

            {/* Tabs Entrar / Criar conta */}
            <div className="mb-8 flex rounded-xl border border-brand-dark/10 bg-brand-light p-1">
              {(
                [
                  { id: 'login' as const, label: 'Entrar' },
                  { id: 'register' as const, label: 'Criar conta' },
                ] as const
              ).map(({ id, label }) => (
                <RouterLink
                  key={id}
                  to={id === 'login' ? '/login' : '/cadastro'}
                  state={linkState}
                  replace
                  className={cn(
                    'flex-1 rounded-lg py-2.5 text-center text-sm font-semibold no-underline transition-all',
                    mode === id
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-brand-dark/50 hover:text-brand-dark',
                  )}
                >
                  {label}
                </RouterLink>
              ))}
            </div>

            {isLogin ? <LoginForm redirectTo={from} /> : <RegisterForm redirectTo={from} />}

            <p className="mt-8 text-center text-sm text-brand-dark/50">
              {isLogin ? (
                <>
                  Não tem uma conta?{' '}
                  <RouterLink
                    to="/cadastro"
                    state={linkState}
                    className="font-semibold text-brand-dark hover:text-brand-mint"
                  >
                    Criar conta
                  </RouterLink>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <RouterLink
                    to="/login"
                    state={linkState}
                    className="font-semibold text-brand-dark hover:text-brand-mint"
                  >
                    Entrar
                  </RouterLink>
                </>
              )}
            </p>
          </div>
        </div>

        <footer className="px-6 py-4 text-center text-xs text-brand-dark/40 sm:px-8">
          © {new Date().getFullYear()} Escala360. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
