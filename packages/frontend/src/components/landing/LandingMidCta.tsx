import { ArrowRight } from 'lucide-react';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { ShimmerButton } from '@/components/magicui/shimmer-button';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingMidCta() {
  return (
    <section className="relative overflow-hidden bg-brand-dark py-16 md:py-20">
      <DotPattern className="fill-white/[0.04] [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Pare de gerenciar escalas em planilhas.
          <br />
          <span className="text-brand-mint">Comece hoje.</span>
        </h2>
        <p className="mb-8 text-base leading-relaxed text-white/65">
          Junte-se a hospitais e clínicas que já centralizaram plantões, banco de horas e cobertura
          assistencial em uma única plataforma.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ShimmerButton
            className="bg-brand-mint text-brand-dark shadow-brand-mint/20"
            onClick={() => scrollToSection('contato')}
          >
            Agendar demonstração
            <ArrowRight className="h-4 w-4" />
          </ShimmerButton>
          <ShimmerButton
            to="/cadastro"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Criar conta grátis
          </ShimmerButton>
        </div>
      </div>
    </section>
  );
}
