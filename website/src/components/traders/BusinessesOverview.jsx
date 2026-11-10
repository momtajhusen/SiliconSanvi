import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BrandTile } from '../marketing/BrandWordmark';
import { BUSINESSES } from '../../constants/site';
import useUIStore from '../../stores/uiStore';
import { useApi } from '../../hooks/useApi';
import { formatINR } from '../../lib/format';
import { cn } from '../../lib/utils';

const TONE = {
  institute: { card: 'from-blue-600/10 via-indigo-500/5 to-transparent border-blue-500/25', bar: 'from-blue-600 to-indigo-600', link: 'text-blue-700 dark:text-blue-300' },
  traders: { card: 'from-amber-500/15 via-orange-500/5 to-transparent border-amber-500/30', bar: 'from-amber-400 to-orange-600', link: 'text-amber-700 dark:text-amber-300' },
};

function Metric({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('truncate text-base font-bold sm:text-lg', tone)}>{value}</p>
    </div>
  );
}

function BusinessCard({ business, to, metrics, links }) {
  const info = BUSINESSES[business];
  const setBusiness = useUIStore((state) => state.setBusiness);
  const tone = TONE[business];
  return (
    <div className={cn('premium-card relative overflow-hidden border bg-gradient-to-br p-4', tone.card)}>
      <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', tone.bar)} />
      <div className="flex items-center gap-3">
        <BrandTile business={business} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{info.name}</p>
          <p className="text-xs text-muted-foreground">{info.kind}</p>
        </div>
        <Link to={to} onClick={() => setBusiness(business)} className={cn('inline-flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline', tone.link)}>
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => <Metric key={m.label} {...m} />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {links.map((l) => (
          <Link key={l.to} to={l.to} onClick={() => setBusiness(business)} className="rounded-full border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Side-by-side snapshot of both businesses for the shared dashboard. */
export default function BusinessesOverview({ instituteKpis }) {
  const { data } = useApi('/admin/traders/overview');
  const k = instituteKpis;
  const t = data?.kpis;
  const show = (obj, value, fmt = (v) => v) => (obj ? fmt(value) : '—');

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <BusinessCard
        business="institute"
        to="/students"
        metrics={[
          { label: 'Active students', value: show(k, k?.activeStudents) },
          { label: 'Fees this month', value: show(k, k?.feesThisMonth, formatINR) },
          { label: 'Fees pending', value: show(k, k?.pendingDues, formatINR), tone: k?.pendingDues > 0 ? 'text-rose-600' : '' },
          { label: 'New inquiries', value: show(k, k?.newInquiries) },
        ]}
        links={[
          { to: '/students/new', label: 'New admission' },
          { to: '/finance/payments', label: 'Collect fee' },
          { to: '/admissions/inquiries', label: 'Inquiries' },
        ]}
      />
      <BusinessCard
        business="traders"
        to="/traders/overview"
        metrics={[
          { label: 'Billed this month', value: show(t, t?.monthBilled, formatINR) },
          { label: 'Collected', value: show(t, t?.monthCollected, formatINR) },
          { label: 'Money due', value: show(t, t?.outstanding, formatINR), tone: t?.outstanding > 0 ? 'text-rose-600' : '' },
          { label: 'Low stock', value: show(t, t?.lowStock), tone: t?.lowStock > 0 ? 'text-amber-600' : '' },
        ]}
        links={[
          { to: '/traders/jobs/new', label: 'New bill' },
          { to: '/traders/products', label: 'Products' },
          { to: '/traders/stock', label: 'Stock' },
          { to: '/traders/reports', label: 'Reports' },
        ]}
      />
    </div>
  );
}
