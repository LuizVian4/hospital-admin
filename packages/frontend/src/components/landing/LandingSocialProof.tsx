import { Building2 } from 'lucide-react';
import { Marquee, MarqueeItem } from '@/components/magicui/marquee';
import { SOCIAL_PROOF_ITEMS } from './data';

export function LandingSocialProof() {
  return (
    <section className="bg-brand-light py-10" aria-label="Setores atendidos">
      <div className="mx-auto mb-6 max-w-6xl px-4 text-center">
        <p className="text-sm font-medium text-brand-dark/50">
          Projetado para operações assistenciais de todos os portes
        </p>
      </div>
      <Marquee pauseOnHover reverse className="[--duration:45s]">
        {SOCIAL_PROOF_ITEMS.map((sector) => (
          <MarqueeItem key={sector} className="gap-2 bg-brand-light">
            <Building2 className="h-4 w-4 text-brand-mint" />
            {sector}
          </MarqueeItem>
        ))}
      </Marquee>
    </section>
  );
}
