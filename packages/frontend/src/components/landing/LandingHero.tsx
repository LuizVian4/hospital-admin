import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, Play } from 'lucide-react';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';
import { BrandName } from '@/components/BrandName';
import { AnimatedList } from '@/components/magicui/animated-list';
import { BorderBeam } from '@/components/magicui/border-beam';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { HERO_TRUST_ITEMS } from './data';
import { DashboardMockup } from './ProductMockups';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-12 md:pb-24 md:pt-20">
      <DotPattern className="opacity-60 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]" />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-mint/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-32 h-64 w-64 rounded-full bg-brand-dark/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedGradientText className="mb-6">
              ✨ Plataforma de gestão de escalas hospitalares
            </AnimatedGradientText>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
          >
            <span className="text-gradient">Escala, banco de horas</span>
            <br />
            <span className="text-gradient-mint">e cobertura em um só lugar.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 max-w-2xl text-base leading-relaxed text-brand-dark/60 md:text-lg"
          >
            O <BrandName size="sm" className="inline align-baseline" /> centraliza a gestão de técnicos, enfermeiros e plantões hospitalares.
            Elimine planilhas, reduza erros operacionais e tenha visibilidade total da cobertura
            assistencial — do cadastro ao fechamento mensal.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-8 w-full max-w-lg"
          >
            <AnimatedList className="text-left" delay={0.3}>
              {HERO_TRUST_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-brand-dark/70">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-mint/20">
                    <Check className="h-3 w-3 text-brand-dark" />
                  </span>
                  {item}
                </div>
              ))}
            </AnimatedList>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <ShimmerButton onClick={() => scrollToSection('contato')}>
              Solicitar Demonstração
              <ArrowRight className="h-4 w-4" />
            </ShimmerButton>
            <ShimmerButton variant="outline" onClick={() => scrollToSection('funcionalidades')}>
              <Play className="h-4 w-4" />
              Ver funcionalidades
            </ShimmerButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-5 text-sm text-brand-dark/50"
          >
            Sem cartão de crédito.{' '}
            <RouterLink to="/cadastro" className="font-semibold text-brand-dark hover:text-brand-mint">
              Crie sua conta gratuitamente
            </RouterLink>{' '}
            e explore o sistema agora.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-brand-dark/10 bg-white p-1 shadow-2xl shadow-brand-dark/10">
            <BorderBeam size={250} duration={10} colorFrom="#00E5A3" colorTo="#1A2B4C" />
            <div className="overflow-hidden rounded-xl">
              <DashboardMockup />
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-x-8 -bottom-8 h-32 bg-gradient-to-t from-white to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
