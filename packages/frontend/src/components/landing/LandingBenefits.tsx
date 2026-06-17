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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid';
import { DotPattern } from '@/components/magicui/dot-pattern';
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
};

export function LandingBenefits() {
  return (
    <SectionContainer
      id="beneficios"
      title="Tudo que sua operação precisa"
      subtitle="Do cadastro de profissionais ao fechamento mensal — funcionalidades integradas para coordenadores, gestores e RH."
      className="bg-white"
    >
      <BentoGrid>
        {FEATURES.map((feature) => {
          const { name, description, icon } = feature;
          const className = 'className' in feature ? feature.className : undefined;
          const highlight = 'highlight' in feature ? feature.highlight : false;
          const Icon = ICON_MAP[icon];
          return (
            <BentoCard
              key={name}
              name={name}
              description={description}
              icon={<Icon className="h-5 w-5" />}
              background={
                highlight ? (
                  <DotPattern className="opacity-30 [mask-image:linear-gradient(to_top,transparent,white)]" />
                ) : undefined
              }
              className={className}
            />
          );
        })}
      </BentoGrid>
    </SectionContainer>
  );
}
