import { cn } from '@/lib/utils';

const SIZE = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl md:text-3xl',
  '3xl': 'text-4xl md:text-5xl',
  inherit: '',
} as const;

type BrandNameSize = keyof typeof SIZE;
type BrandNameVariant = 'default' | 'light';

interface BrandNameProps {
  size?: BrandNameSize;
  variant?: BrandNameVariant;
  className?: string;
}

function brandSizeFromLogo(logoSize: number): BrandNameSize {
  if (logoSize >= 60) return 'xl';
  if (logoSize >= 56) return 'lg';
  if (logoSize >= 48) return 'md';
  return 'sm';
}

export function BrandName({ size = 'md', variant = 'default', className }: BrandNameProps) {
  const escalaColor = variant === 'light' ? 'text-white' : 'text-brand-dark';

  return (
    <span
      className={cn(
        'font-brand font-extrabold leading-none tracking-tight',
        size !== 'inherit' && SIZE[size],
        className,
      )}
      aria-label="Escala360"
    >
      <span className={escalaColor}>Escala</span>
      <span className="text-brand-mint">360</span>
    </span>
  );
}

export { brandSizeFromLogo };
