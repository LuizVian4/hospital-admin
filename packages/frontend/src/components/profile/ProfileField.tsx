import { cn } from '@/lib/utils';

const fieldClassName =
  'w-full rounded-xl border-0 bg-brand-light px-4 py-3 text-sm text-brand-dark placeholder:text-brand-dark/40 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-mint/30 disabled:cursor-not-allowed disabled:opacity-60';

interface ProfileFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function ProfileField({ label, hint, id, className, ...props }: ProfileFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-brand-dark">
        {label}
      </label>
      <input id={fieldId} className={cn(fieldClassName, className)} {...props} />
      {hint && <p className="mt-1.5 text-xs text-brand-dark/45">{hint}</p>}
    </div>
  );
}

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ProfileSection({ title, description, children, className }: ProfileSectionProps) {
  return (
    <section className={cn('border-t border-brand-dark/5 px-6 py-7 sm:px-8', className)}>
      <div className="mb-5">
        <h3 className="text-base font-bold text-brand-dark">{title}</h3>
        {description && <p className="mt-1 text-sm text-brand-dark/55">{description}</p>}
      </div>
      {children}
    </section>
  );
}
