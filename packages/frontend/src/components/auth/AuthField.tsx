import { cn } from '@/lib/utils';

const inputClassName =
  'w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2.5 text-sm text-brand-dark shadow-sm placeholder:text-brand-dark/40 outline-none transition-colors focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 disabled:cursor-not-allowed disabled:opacity-50';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function AuthField({ label, hint, id, className, ...props }: AuthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      <input id={fieldId} className={cn(inputClassName, className)} {...props} />
      {hint && <p className="mt-1.5 text-xs text-brand-dark/50">{hint}</p>}
    </div>
  );
}

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export function AuthButton({
  children,
  loading,
  loadingText,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        'w-full rounded-lg bg-brand-dark py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mint disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </div>
  );
}
