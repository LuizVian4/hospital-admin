import { STEPS } from './data';
import { SectionContainer } from './SectionContainer';

export function LandingHowItWorks() {
  return (
    <SectionContainer
      id="como-funciona"
      title="Como funciona"
      subtitle="Três passos para sair das planilhas e ter controle total da operação assistencial."
      className="bg-brand-light"
    >
      <div className="relative grid gap-8 md:grid-cols-3">
        {/* Connector line (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-brand-dark/10 md:block" />

        {STEPS.map(({ step, title, description, detail }) => (
          <div key={step} className="group relative text-center">
            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-brand-mint/20 transition-transform group-hover:scale-110" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-dark text-lg font-extrabold text-white shadow-lg shadow-brand-dark/20">
                {step}
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-brand-dark">{title}</h3>
            <p className="mb-3 text-sm leading-relaxed text-brand-dark/60">{description}</p>
            <span className="inline-block rounded-full bg-brand-mint/15 px-3 py-1 text-xs font-semibold text-brand-dark">
              {detail}
            </span>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
