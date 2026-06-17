import { cn } from '@/lib/utils';

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  repeat = 2,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:2rem] [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
      {...props}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex shrink-0 justify-around [gap:var(--gap)]',
            vertical ? 'animate-marquee-vertical flex-col' : 'animate-marquee flex-row',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

interface MarqueeItemProps {
  children: React.ReactNode;
  className?: string;
}

export function MarqueeItem({ children, className }: MarqueeItemProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border border-brand-dark/10 bg-white px-5 py-2 text-sm font-medium text-brand-dark/70',
        className,
      )}
    >
      {children}
    </div>
  );
}
