import { cn } from '../../lib/utils';

/** Compact icon buttons for table rows (dropdowns get clipped by the scrolling table wrapper). */
export default function RowActions({ actions }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {actions.filter(Boolean).map(({ icon: Icon, label, onClick, tone }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--color-muted))] hover:text-foreground',
            tone === 'danger' && 'hover:bg-rose-500/10 hover:text-rose-600'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
