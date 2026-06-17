import { Check, X } from 'lucide-react';
import { PROBLEMS } from './data';
import { SectionContainer } from './SectionContainer';

export function LandingProblems() {
  return (
    <SectionContainer
      title="Do caos das planilhas ao controle total"
      subtitle="Veja como o Escala360 transforma os maiores gargalos da gestão de escalas hospitalares."
      dark
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map(({ area, before, after }) => (
          <div
            key={area}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <h3 className="mb-4 text-base font-bold text-brand-mint">{area}</h3>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm leading-relaxed text-white/55">{before}</p>
              </div>
              <div className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-mint" />
                <p className="text-sm font-medium leading-relaxed text-white">{after}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
