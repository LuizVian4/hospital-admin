import { Marquee, MarqueeItem } from '@/components/magicui/marquee';
import { METRICS } from './data';

export function LandingMetrics() {
  return (
    <section className="border-y border-brand-dark/5 bg-white py-6" aria-label="Indicadores">
      <Marquee pauseOnHover className="[--duration:35s]">
        {METRICS.map(({ value, label }) => (
          <MarqueeItem key={label} className="gap-3 px-6 py-2.5">
            <span className="text-xl font-extrabold text-brand-dark">{value}</span>
            <span className="text-brand-dark/50">{label}</span>
          </MarqueeItem>
        ))}
      </Marquee>
    </section>
  );
}
