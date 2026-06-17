import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ShimmerButtonVariant = 'primary' | 'outline';

const baseClassName =
  'relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full px-6 text-sm font-semibold no-underline transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

function variantClassName(variant: ShimmerButtonVariant) {
  return variant === 'primary'
    ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/20'
    : 'border border-brand-dark/15 bg-white text-brand-dark hover:bg-brand-light';
}

interface ShimmerButtonContentProps {
  variant: ShimmerButtonVariant;
  children: React.ReactNode;
}

function ShimmerButtonContent({ variant, children }: ShimmerButtonContentProps) {
  return (
    <>
      {variant === 'primary' && (
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );
}

interface ShimmerButtonBaseProps {
  variant?: ShimmerButtonVariant;
  className?: string;
  children: React.ReactNode;
}

interface ShimmerButtonAsLinkProps extends ShimmerButtonBaseProps {
  to: string;
  href?: never;
  onClick?: LinkProps['onClick'];
}

interface ShimmerButtonAsAnchorProps extends ShimmerButtonBaseProps {
  href: string;
  to?: never;
  onClick?: React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
}

interface ShimmerButtonAsButtonProps
  extends ShimmerButtonBaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  to?: never;
  href?: never;
}

type ShimmerButtonProps = ShimmerButtonAsLinkProps | ShimmerButtonAsAnchorProps | ShimmerButtonAsButtonProps;

export function ShimmerButton(props: ShimmerButtonProps) {
  const { children, className, variant = 'primary' } = props;
  const classes = cn(baseClassName, variantClassName(variant), className);

  if ('to' in props && props.to) {
    const { to, onClick } = props;
    return (
      <Link to={to} onClick={onClick} className={classes}>
        <ShimmerButtonContent variant={variant}>{children}</ShimmerButtonContent>
      </Link>
    );
  }

  if ('href' in props && props.href) {
    const { href, onClick } = props;
    return (
      <a href={href} onClick={onClick} className={classes} target="_blank" rel="noopener noreferrer">
        <ShimmerButtonContent variant={variant}>{children}</ShimmerButtonContent>
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = props as ShimmerButtonAsButtonProps;

  return (
    <button type={type} className={classes} {...buttonProps}>
      <ShimmerButtonContent variant={variant}>{children}</ShimmerButtonContent>
    </button>
  );
}
