import logoSrc from '@/assets/logo.png';

interface LogoBrandProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  textColor?: string;
  subtitleColor?: string;
  className?: string;
}

export function LogoBrand({
  size = 56,
  showText = true,
  subtitle,
  textColor = 'text-brand-dark',
  subtitleColor = 'text-brand-dark/60',
  className = '',
}: LogoBrandProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <img
        src={logoSrc}
        alt="Escala360"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className="min-w-0 overflow-hidden">
          <p className={`truncate text-sm font-bold leading-tight ${textColor}`}>Escala360</p>
          {subtitle && (
            <p className={`truncate text-xs leading-tight ${subtitleColor}`}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
