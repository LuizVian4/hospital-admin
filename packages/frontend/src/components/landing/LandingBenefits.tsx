import {
  CalendarDays,
  BarChart3,
  Clock,
  Eye,
  FileSpreadsheet,
  Gavel,
  Layers,
  RefreshCw,
  Users,
  Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { cn } from '@/lib/utils';
import { FEATURES } from './data';
import { SectionContainer } from './SectionContainer';

const ICON_MAP: Record<(typeof FEATURES)[number]['icon'], LucideIcon> = {
  calendar: CalendarDays,
  clock: Clock,
  eye: Eye,
  file: FileSpreadsheet,
  gavel: Gavel,
  users: Users,
  chart: BarChart3,
  swap: RefreshCw,
  layers: Layers,
  export: Download,
};

const ICON_CLASS = 'bg-[#00E5A3] text-brand-dark';

export function LandingBenefits() {
  return (
    <SectionContainer
      id="beneficios"
      title="Tudo que sua operação precisa"
      subtitle="Do cadastro de profissionais ao fechamento mensal — funcionalidades integradas para coordenadores, gestores e RH."
      className="bg-white"
    >
      <BentoGrid>
        {FEATURES.map((feature, index) => {
          const { name, description, icon } = feature;
          const className = 'className' in feature ? feature.className : undefined;
          const highlight = 'highlight' in feature ? feature.highlight : false;
          const isDark = index % 2 === 0;
          const Icon = ICON_MAP[icon];
          return (
            <BentoCard
              key={name}
              name={name}
              description={description}
              icon={<Icon className="h-5 w-5" />}
              className={cn(
                className,
                isDark
                  ? 'border-[#1A2B4C]/40 bg-[#1A2B4C]'
                  : 'border-brand-dark/10 bg-[#F4F6F9]',
              )}
              iconClassName={ICON_CLASS}
              titleClassName={isDark ? 'text-white' : undefined}
              descriptionClassName={isDark ? 'text-white/65' : undefined}
              background={
                highlight ? (
                  <DotPattern className="fill-white/[0.07] opacity-40 [mask-image:linear-gradient(to_top,transparent,white)]" />
                ) : undefined
              }
            />
          );
        })}
      </BentoGrid>
    </SectionContainer>
  );
}
