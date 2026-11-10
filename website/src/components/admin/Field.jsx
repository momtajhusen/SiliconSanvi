import { cn } from '../../lib/utils';

export default function Field({ label, required, hint, error, className, children, htmlFor }) {
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-foreground/80">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
