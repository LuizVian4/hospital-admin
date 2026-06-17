import { Building2, Stethoscope, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERSONAS } from './data';
import { SectionContainer } from './SectionContainer';

const ICON_MAP: Record<(typeof PERSONAS)[number]['icon'], LucideIcon> = {
  stethoscope: Stethoscope,
  building: Building2,
  users: Users,
};

export function LandingPersonas() {
  return (
    <SectionContainer
      id="para-quem"
      title="Feito para quem vive a operação"
      subtitle="Cada perfil encontra no Escala360 a ferramenta certa para eliminar retrabalho e ganhar controle."
      className="bg-brand-light"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {PERSONAS.map(({ role, pain, gain, icon }) => {
          const Icon = ICON_MAP[icon];
          return (
            <div
              key={role}
              className="flex flex-col rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-4 text-lg font-bold text-brand-dark">{role}</h3>

              <div className="mb-4 flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-400/80">
                  Desafio
                </p>
                <p className="text-sm leading-relaxed text-brand-dark/60">{pain}</p>
              </div>

              <div className="rounded-xl bg-brand-mint/10 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/50">
                  Com o Escala360
                </p>
                <p className="text-sm leading-relaxed text-brand-dark">{gain}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
