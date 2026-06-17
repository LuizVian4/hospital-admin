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
        {/* Header */}
        <div className="grid grid-cols-3 border-b border-brand-dark/10 bg-brand-light px-4 py-3 text-sm font-semibold text-brand-dark md:px-6">
          <span>Funcionalidade</span>
          <span className="text-center text-brand-dark/50">Planilha Excel</span>
          <span className="text-center text-brand-mint">Escala360</span>
        </div>

        {COMPARISON_ROWS.map(({ feature, spreadsheet, escala360 }, i) => (
          <div
            key={feature}
            className={`grid grid-cols-3 items-center gap-2 px-4 py-4 text-sm md:px-6 ${
              i % 2 === 0 ? 'bg-white' : 'bg-brand-light/50'
            }`}
          >
            <span className="font-medium text-brand-dark">{feature}</span>
            <span className="flex items-center justify-center gap-1.5 text-center text-brand-dark/50">
              <X className="hidden h-3.5 w-3.5 shrink-0 text-red-400 sm:block" />
              {spreadsheet}
            </span>
            <span className="flex items-center justify-center gap-1.5 text-center font-medium text-brand-dark">
              <Check className="hidden h-3.5 w-3.5 shrink-0 text-brand-mint sm:block" />
              {escala360}
            </span>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
