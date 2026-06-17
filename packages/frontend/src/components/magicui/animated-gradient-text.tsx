import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <div
      className={cn(
        'group relative mx-auto flex max-w-fit items-center justify-center rounded-full border border-brand-mint/20 bg-white/60 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      <div className="animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-brand-mint/20 via-brand-dark/10 to-brand-mint/20 bg-[length:300%_100%] [mask-composite:exclude] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] p-[1px]" />
      <span className="relative z-10 bg-gradient-to-r from-brand-dark to-brand-dark/70 bg-clip-text text-transparent">
        {children}
      </span>
    </div>
  );
}
