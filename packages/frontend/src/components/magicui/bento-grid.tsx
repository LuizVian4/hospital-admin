import { cn } from '@/lib/utils';

export function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  className?: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
  cta?: string;
  background?: React.ReactNode;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function BentoCard({
  className,
  name,
  description,
  icon,
  background,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-light p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      {background && <div className="pointer-events-none absolute inset-0">{background}</div>}
      <div className="relative z-10">
        {icon && (
          <div
            className={cn(
              'mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/15 text-brand-dark',
              iconClassName,
            )}
          >
            {icon}
          </div>
        )}
        <h3 className={cn('mb-2 text-lg font-bold tracking-tight text-brand-dark', titleClassName)}>
          {name}
        </h3>
        <p className={cn('text-sm leading-relaxed text-brand-dark/60', descriptionClassName)}>
          {description}
        </p>
      </div>
    </div>
  );
}
