import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQ_ITEMS } from './data';
import { SectionContainer } from './SectionContainer';

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <SectionContainer
      title="Perguntas frequentes"
      subtitle="Tudo o que você precisa saber antes de adotar o Escala360 no seu hospital."
      className="bg-white"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {FAQ_ITEMS.map(({ question, answer }, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={question}
              className="overflow-hidden rounded-xl border border-brand-dark/10 bg-white transition-shadow hover:shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-brand-dark">{question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-brand-dark/40 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-brand-dark/60">{answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
