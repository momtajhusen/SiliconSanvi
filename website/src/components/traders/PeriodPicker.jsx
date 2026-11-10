import Input from '../ui/Input';
import Select from '../ui/Select';
import PillTabs from '../admin/PillTabs';
import { formatDate, toInputDate } from '../../lib/format';

const PRESETS = [
  { value: 'month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'quarter', label: 'Last 3 months' },
  { value: 'year', label: 'This financial year' },
  { value: 'all', label: 'All time' },
];

/** Indian financial year (April–March) that a date falls in, by its starting calendar year. */
const fyStart = (d) => (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1);

export function presetRange(key) {
  const now = new Date();
  switch (key) {
    case 'month': return { from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: '' };
    case 'last_month': return { from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case 'quarter': return { from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: '' };
    case 'year': return { from: toInputDate(new Date(fyStart(now), 3, 1)), to: '' };
    default: return { from: '', to: '' };
  }
}

function yearRange(key) {
  const [kind, y] = key.split(':');
  const year = Number(y);
  return kind === 'fy'
    ? { from: toInputDate(new Date(year, 3, 1)), to: toInputDate(new Date(year + 1, 2, 31)) }
    : { from: toInputDate(new Date(year, 0, 1)), to: toInputDate(new Date(year, 11, 31)) };
}

function yearOptions() {
  const now = new Date();
  const out = [];
  for (let y = fyStart(now); y >= fyStart(now) - 4; y -= 1) out.push({ value: `fy:${y}`, label: `FY ${y}–${String(y + 1).slice(-2)}` });
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y -= 1) out.push({ value: `cy:${y}`, label: `Year ${y} (Jan–Dec)` });
  return out;
}

export function rangeLabel({ from, to }) {
  return from || to ? `${from ? formatDate(from) : 'Start'} – ${to ? formatDate(to) : 'Today'}` : 'All time';
}

/** Date-range filter: quick presets, a financial / calendar year, or any custom from–to. */
export function PeriodPicker({ value, onChange, className }) {
  const same = (r) => r.from === value.from && r.to === value.to;
  const preset = PRESETS.find((p) => same(presetRange(p.value)))?.value;
  const years = yearOptions();
  const year = years.find((y) => same(yearRange(y.value)))?.value || '';
  return (
    <div className={className}>
      <PillTabs tabs={PRESETS} value={preset} onChange={(key) => onChange(presetRange(key))} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Select value={year} onChange={(e) => e.target.value && onChange(yearRange(e.target.value))} className="w-auto" aria-label="Year">
          <option value="">Pick a year…</option>
          {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
        </Select>
        <Input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} aria-label="From date" className="w-auto" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} aria-label="To date" className="w-auto" />
        <span className="text-xs text-muted-foreground">{rangeLabel(value)}</span>
      </div>
    </div>
  );
}
