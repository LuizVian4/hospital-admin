import { INTEGRATIONS } from './data';

export function LandingIntegrations() {
  return (
    <section className="border-y border-brand-dark/5 bg-white py-10" aria-label="Compatibilidade">
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-6 text-center text-sm font-medium text-brand-dark/50">
          Compatível com o fluxo de trabalho que você já conhece
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {INTEGRATIONS.map(({ label, description }) => (
            <div
              key={label}
              className="rounded-xl border border-brand-dark/8 bg-brand-light px-3 py-4 text-center transition-colors hover:border-brand-mint/30 hover:bg-brand-mint/5"
            >
              <p className="text-sm font-semibold text-brand-dark">{label}</p>
              <p className="mt-0.5 text-xs text-brand-dark/45">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
