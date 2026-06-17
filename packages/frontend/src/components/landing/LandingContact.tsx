import { ArrowRight, Clock, Mail, Shield } from 'lucide-react';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { SectionContainer } from './SectionContainer';

const CONTACT_POINTS = [
  { icon: Clock, text: 'Resposta em até 24 horas úteis' },
  { icon: Shield, text: 'Demonstração personalizada para seu hospital' },
  { icon: Mail, text: 'contato@escala360.com.br' },
];

export function LandingContact() {
  return (
    <SectionContainer id="contato" className="relative overflow-hidden bg-brand-dark" dark>
      <DotPattern className="fill-white/[0.04] [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]" />

      <div className="relative grid items-start gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            Pronto para modernizar a gestão de escalas do seu hospital?
          </h2>
          <p className="mb-6 leading-relaxed text-white/70">
            Agende uma demonstração gratuita e veja na prática como o Escala360 elimina planilhas,
            reduz erros operacionais e dá visibilidade total à sua equipe assistencial.
          </p>

          <ul className="mb-8 grid gap-3">
            {CONTACT_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/65">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-brand-mint" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <ShimmerButton
            className="bg-brand-mint text-brand-dark shadow-brand-mint/20 hover:bg-brand-mint/90"
            onClick={() => window.open('mailto:contato@escala360.com.br?subject=Demonstração%20Escala360')}
          >
            Solicitar Demonstração
            <ArrowRight className="h-4 w-4" />
          </ShimmerButton>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8"
        >
          <h3 className="mb-1 text-lg font-bold text-white">Fale conosco</h3>
          <p className="mb-5 text-sm text-white/60">
            Preencha o formulário e nossa equipe entrará em contato para agendar uma demonstração
            personalizada.
          </p>

          <div className="grid gap-3">
            {[
              { label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
              { label: 'Hospital / Instituição', type: 'text', placeholder: 'Nome do hospital' },
              { label: 'Cargo', type: 'text', placeholder: 'Ex: Coordenador(a) de Enfermagem' },
              { label: 'E-mail corporativo', type: 'email', placeholder: 'seu@hospital.com.br' },
              { label: 'Telefone (opcional)', type: 'tel', placeholder: '(00) 00000-0000' },
            ].map(({ label, type, placeholder }) => (
              <div key={label}>
                <label className="mb-1 block text-xs font-medium text-white/70">{label}</label>
                <input
                  type={type}
                  required={type !== 'tel'}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-mint/50 focus:ring-1 focus:ring-brand-mint/30"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">
                Quantos profissionais você gerencia?
              </label>
              <select className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-mint/50 focus:ring-1 focus:ring-brand-mint/30">
                <option value="" className="text-brand-dark">Selecione</option>
                <option value="1-50" className="text-brand-dark">Até 50</option>
                <option value="51-150" className="text-brand-dark">51 a 150</option>
                <option value="151-300" className="text-brand-dark">151 a 300</option>
                <option value="300+" className="text-brand-dark">Mais de 300</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Mensagem</label>
              <textarea
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-mint/50 focus:ring-1 focus:ring-brand-mint/30"
                placeholder="Conte-nos sobre sua operação ou dúvidas..."
              />
            </div>
            <ShimmerButton
              type="button"
              className="mt-1 w-full bg-brand-mint text-brand-dark"
              onClick={() => window.open('mailto:contato@escala360.com.br?subject=Demonstração%20Escala360')}
            >
              <Mail className="h-4 w-4" />
              Enviar mensagem
            </ShimmerButton>
            <p className="text-center text-xs text-white/35">
              Ao enviar, você concorda em ser contactado pela equipe Escala360.
            </p>
          </div>
        </form>
      </div>
    </SectionContainer>
  );
}
