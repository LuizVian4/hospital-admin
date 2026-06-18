import { Link as RouterLink } from 'react-router-dom';
import { LogoBrand } from '@/components/LogoBrand';
import { BrandName } from '@/components/BrandName';
import { NAV_LINKS } from './data';

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-dark/5 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <LogoBrand
              size={52}
              subtitle="Gestão de escalas hospitalares"
              subtitleColor="text-brand-dark/50"
            />
            <p className="mt-4 text-sm leading-relaxed text-brand-dark/50">
              Plataforma completa para gestão de plantões, banco de horas e cobertura assistencial
              em hospitais e clínicas.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-dark">Navegação</p>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-brand-dark/60 transition-colors hover:text-brand-dark"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-dark">Acesso</p>
            <nav className="flex flex-col gap-2">
              <RouterLink
                to="/login"
                className="text-sm text-brand-dark/60 transition-colors hover:text-brand-dark"
              >
                Entrar
              </RouterLink>
              <RouterLink
                to="/cadastro"
                className="text-sm text-brand-dark/60 transition-colors hover:text-brand-dark"
              >
                Criar conta
              </RouterLink>
              <a
                href="mailto:contato@escala360.com.br"
                className="text-sm text-brand-dark/60 transition-colors hover:text-brand-dark"
              >
                contato@escala360.com.br
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-brand-dark/5 pt-6 md:flex-row md:items-center">
          <p className="text-xs text-brand-dark/40">
            © {year} <BrandName size="sm" className="inline align-baseline" />. Todos os direitos reservados.
          </p>
          <p className="text-xs text-brand-dark/40">
            Sistema de escala hospitalar · Banco de horas · Cobertura assistencial
          </p>
        </div>
      </div>
    </footer>
  );
}
