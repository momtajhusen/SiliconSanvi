import { cn } from '../../lib/utils';

export default function Info({ label, value, className, children }) {
  const content = children ?? value;
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{content === undefined || content === null || content === '' ? '—' : content}</dd>
    </div>
  );
}

export function InfoGrid({ className, children }) {
  return <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3', className)}>{children}</dl>;
}
