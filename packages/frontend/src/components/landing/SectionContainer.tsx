import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export function SectionContainer({
  id,
  title,
  subtitle,
  children,
  className,
  dark = false,
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={cn(
        'px-4 py-20 md:py-28',
        dark ? 'bg-brand-dark text-white' : 'bg-brand-light',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">
        {(title || subtitle) && (
          <div className="mx-auto mb-14 max-w-2xl text-center">
            {title && (
              <h2
                className={cn(
                  'mb-4 text-3xl font-extrabold tracking-tight md:text-4xl',
                  dark ? 'text-white' : 'text-brand-dark',
                )}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={cn('text-base leading-relaxed', dark ? 'text-white/70' : 'text-brand-dark/60')}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
