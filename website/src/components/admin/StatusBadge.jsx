import { cn } from '../../lib/utils';
import { labelize } from '../../lib/format';

const TONES = {
  blue: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  navy: 'border-blue-800/30 bg-blue-900/10 text-blue-900 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-200',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  red: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  violet: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  slate: 'border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

const STATUS_TONE = {
  new: 'blue',
  'in-process': 'amber',
  converted: 'navy',
  closed: 'slate',
  active: 'navy',
  inactive: 'slate',
  completed: 'violet',
  dropped: 'red',
  on_hold: 'amber',
  enrolled: 'blue',
  in_progress: 'amber',
  suspended: 'red',
  pending: 'slate',
  partial: 'amber',
  paid: 'navy',
  overdue: 'red',
  due: 'slate',
  upcoming: 'blue',
  cancelled: 'red',
  success: 'navy',
  failed: 'red',
  refunded: 'violet',
  hot: 'red',
  warm: 'amber',
  cold: 'blue',
  no_fee: 'slate',
  scheduled: 'blue',
  installed: 'navy',
  unpaid: 'red',
};

const LABELS = { no_fee: 'No fee', 'in-process': 'In process', on_hold: 'On hold' };

export default function StatusBadge({ status, label, tone, className }) {
  const toneKey = tone || STATUS_TONE[status] || 'slate';
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        TONES[toneKey],
        className
      )}
    >
      {label || LABELS[status] || labelize(status)}
    </span>
  );
}
