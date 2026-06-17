import { Quote } from 'lucide-react';
import { Marquee, MarqueeItem } from '@/components/magicui/marquee';
import { TESTIMONIALS } from './data';
import { SectionContainer } from './SectionContainer';

function TestimonialCard({
  quote,
  author,
  role,
  sector,
  initials,
}: (typeof TESTIMONIALS)[number]) {
  return (
    <figure className="flex w-[340px] shrink-0 flex-col rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-sm md:w-[380px]">
      <Quote className="mb-3 h-5 w-5 text-brand-mint" />
      <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-brand-dark/70">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 border-t border-brand-dark/5 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-dark">{author}</p>
          <p className="text-xs text-brand-dark/50">
            {role} · {sector}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function LandingTestimonials() {
  return (
    <SectionContainer
      id="depoimentos"
      title="Quem usa, recomenda"
      subtitle="Coordenadores, gestores e profissionais de RH que transformaram a gestão de escalas."
      className="overflow-hidden bg-brand-light"
    >
      <Marquee pauseOnHover className="[--duration:50s] [--gap:1.5rem]">
        {TESTIMONIALS.map((t) => (
          <MarqueeItem key={t.author} className="border-0 bg-transparent p-0">
            <TestimonialCard {...t} />
          </MarqueeItem>
        ))}
      </Marquee>
      <p className="mt-8 text-center text-xs text-brand-dark/40">
        Depoimentos ilustrativos — substituíveis por cases reais de clientes
      </p>
    </SectionContainer>
  );
}
