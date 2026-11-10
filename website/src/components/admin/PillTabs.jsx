import { cn } from '../../lib/utils';

/** Horizontal pill tabs; `tabs` = [{ value, label, count? }]. */
export default function PillTabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto pb-1', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-white/20' : 'bg-[hsl(var(--color-muted))]')}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
