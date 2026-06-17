import { Check } from 'lucide-react';
import { BorderBeam } from '@/components/magicui/border-beam';
import { SCREENSHOTS } from './data';
import { ProductMockup } from './ProductMockups';
import { SectionContainer } from './SectionContainer';

export function LandingScreenshots() {
  return (
    <SectionContainer
      id="funcionalidades"
      title="Conheça o sistema por dentro"
      subtitle="Cada módulo foi pensado para resolver um problema real do dia a dia hospitalar — do plantão à folha de pagamento."
      className="bg-white"
    >
      <div className="grid gap-20 md:gap-28">
        {SCREENSHOTS.map(({ id, title, heading, description, bullets, mock }, index) => {
          const reversed = index % 2 === 1;

          return (
            <div key={id} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={reversed ? 'md:order-2' : ''}>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-mint">
                  {heading}
                </p>
                <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-brand-dark md:text-3xl">
                  {title}
                </h3>
                <p className="mb-6 leading-relaxed text-brand-dark/60">{description}</p>
                <ul className="grid gap-2.5">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-sm text-brand-dark/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-mint/20">
                        <Check className="h-3 w-3 text-brand-dark" />
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`relative ${reversed ? 'md:order-1' : ''}`}>
                <div className="relative overflow-hidden rounded-2xl border border-brand-dark/10 bg-white p-1 shadow-xl shadow-brand-dark/5">
                  <BorderBeam size={200} duration={14} delay={index * 2} />
                  <div className="overflow-hidden rounded-xl">
                    <ProductMockup type={mock} />
                  </div>
                </div>
                {/* Placeholder note for real screenshots */}
                <p className="mt-3 text-center text-xs text-brand-dark/30">
                  Prévia ilustrativa — substituível por captura real do sistema
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
