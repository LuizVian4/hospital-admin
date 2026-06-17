import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingMetrics } from '@/components/landing/LandingMetrics';
import { LandingSocialProof } from '@/components/landing/LandingSocialProof';
import { LandingBenefits } from '@/components/landing/LandingBenefits';
import { LandingPersonas } from '@/components/landing/LandingPersonas';
import { LandingProblems } from '@/components/landing/LandingProblems';
import { LandingComparison } from '@/components/landing/LandingComparison';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingIntegrations } from '@/components/landing/LandingIntegrations';
import { LandingScreenshots } from '@/components/landing/LandingScreenshots';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingMidCta } from '@/components/landing/LandingMidCta';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingContact } from '@/components/landing/LandingContact';
import { LandingFooter } from '@/components/landing/LandingFooter';

const SCHEMA_JSON = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Escala360',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Sistema para gestão de escalas hospitalares, banco de horas, técnicos de enfermagem e enfermeiros.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    description: 'Solicite uma demonstração',
  },
};

export function LandingPage() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(SCHEMA_JSON);
    script.id = 'escala360-schema';
    document.head.appendChild(script);
    return () => {
      document.getElementById('escala360-schema')?.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-dark border-t-brand-mint" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingMetrics />
        <LandingSocialProof />
        <LandingBenefits />
        <LandingPersonas />
        <LandingProblems />
        <LandingComparison />
        <LandingHowItWorks />
        <LandingIntegrations />
        <LandingScreenshots />
        <LandingTestimonials />
        <LandingMidCta />
        <LandingFaq />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}
