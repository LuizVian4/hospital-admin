import { Check, X } from 'lucide-react';
import { COMPARISON_ROWS } from './data';
import { SectionContainer } from './SectionContainer';

export function LandingComparison() {
  return (
    <SectionContainer
      title="Planilha vs. Escala360"
      subtitle="Compare lado a lado o que muda quando você sai do Excel e adota uma plataforma feita para hospitais."
      className="bg-white"
    >
      <div className="overflow-hidden rounded-2xl border border-brand-dark/10 shadow-sm">
        {/* Header — desktop */}
        <div className="hidden border-b border-brand-dark/10 bg-brand-light px-4 py-3 text-sm font-semibold text-brand-dark md:grid md:grid-cols-3 md:px-6">
          <span>Funcionalidade</span>
          <span className="text-center text-brand-dark/50">Planilha Excel</span>
          <span className="text-center text-brand-mint">Escala360</span>
        </div>

        {COMPARISON_ROWS.map(({ feature, spreadsheet, escala360 }, i) => (
          <div
            key={feature}
            className={`px-4 py-4 md:px-6 ${i % 2 === 0 ? 'bg-white' : 'bg-brand-light/50'}`}
          >
            {/* Mobile: card layout */}
            <div className="space-y-3 md:hidden">
              <p className="text-sm font-semibold text-brand-dark">{feature}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-brand-dark/10 bg-white p-3">
                  <p className="mb-1 font-medium text-brand-dark/50">Planilha</p>
                  <p className="flex items-start gap-1 text-brand-dark/60">
                    <X className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                    {spreadsheet}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-mint/30 bg-brand-mint/5 p-3">
                  <p className="mb-1 font-medium text-brand-mint">Escala360</p>
                  <p className="flex items-start gap-1 font-medium text-brand-dark">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-brand-mint" />
                    {escala360}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop: table row */}
            <div className="hidden grid-cols-3 items-center gap-2 text-sm md:grid">
              <span className="font-medium text-brand-dark">{feature}</span>
              <span className="flex items-center justify-center gap-1.5 text-center text-brand-dark/50">
                <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
                {spreadsheet}
              </span>
              <span className="flex items-center justify-center gap-1.5 text-center font-medium text-brand-dark">
                <Check className="h-3.5 w-3.5 shrink-0 text-brand-mint" />
                {escala360}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
