import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LogoBrand } from '@/components/LogoBrand';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { NAV_LINKS } from './data';
import { cn } from '@/lib/utils';

function scrollToSection(href: string) {
  document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-brand-dark/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-[4.5rem]">
          <RouterLink to="/" className="text-inherit no-underline">
            <LogoBrand size={48} />
          </RouterLink>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                type="button"
                onClick={() => scrollToSection(href)}
                className="cursor-pointer border-0 bg-transparent text-sm font-medium text-brand-dark/60 transition-colors hover:text-brand-dark"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ShimmerButton to="/cadastro" variant="outline" className="h-9 px-4 text-sm">
              Criar conta
            </ShimmerButton>
            <ShimmerButton to="/login" className="h-9 px-4 text-sm">
              Entrar
            </ShimmerButton>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-brand-dark md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[60] md:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            'absolute right-0 top-0 flex h-full w-72 flex-col bg-white p-6 shadow-2xl transition-transform',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <button
            type="button"
            className="mb-6 self-end rounded-lg p-1 text-brand-dark"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                type="button"
                onClick={() => {
                  scrollToSection(href);
                  setDrawerOpen(false);
                }}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-dark/70 hover:bg-brand-light hover:text-brand-dark"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <ShimmerButton to="/cadastro" variant="outline" className="w-full" onClick={() => setDrawerOpen(false)}>
              Criar conta
            </ShimmerButton>
            <ShimmerButton to="/login" className="w-full" onClick={() => setDrawerOpen(false)}>
              Entrar
            </ShimmerButton>
          </div>
        </div>
      </div>
    </>
  );
}
