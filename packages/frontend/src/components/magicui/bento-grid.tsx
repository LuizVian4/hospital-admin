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
}

export function BentoCard({
  className,
  name,
  description,
  icon,
  background,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      {background && <div className="pointer-events-none absolute inset-0">{background}</div>}
      <div className="relative z-10">
        {icon && (
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/15 text-brand-dark">
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-lg font-bold tracking-tight text-brand-dark">{name}</h3>
        <p className="text-sm leading-relaxed text-brand-dark/60">{description}</p>
      </div>
    </div>
  );
}
