import { Package } from 'lucide-react';
import PageHeader from '../admin/PageHeader';
import StatusBadge from '../admin/StatusBadge';
import { BrandTile } from '../marketing/BrandWordmark';
import { BUSINESSES } from '../../constants/site';
import { STOCK_STATES } from '../../constants/traders';
import { mediaUrl } from '../../lib/api';
import { cn } from '../../lib/utils';

/** Small brand chip so every page shows which business it belongs to. */
export function BusinessChip({ business = 'traders', className }) {
  const info = BUSINESSES[business];
  const tone = business === 'traders'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
    : 'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold', tone, className)}>
      <BrandTile business={business} size="sm" className="!h-5 !w-5 !rounded-full [&_svg]:!h-3 [&_svg]:!w-3" />
      {info.short} · {info.kind}
    </span>
  );
}

export function TradersPageHeader(props) {
  return (
    <div className="space-y-1.5">
      <BusinessChip />
      <PageHeader {...props} />
    </div>
  );
}

export function ProductThumb({ product, className }) {
  if (product?.image) {
    return <img src={mediaUrl(product.image)} alt="" className={cn('h-10 w-10 shrink-0 rounded-lg bg-white object-contain ring-1 ring-black/5', className)} />;
  }
  return (
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-700 dark:text-amber-300', className)}>
      <Package className="h-4 w-4" />
    </span>
  );
}

export function StockBadge({ state }) {
  const cfg = STOCK_STATES[state] || STOCK_STATES.ok;
  return <StatusBadge status={state} label={cfg.label} tone={cfg.tone} />;
}

/** Profit/loss coloured amount. */
export function ProfitText({ value, format, className }) {
  return (
    <span className={cn('font-semibold', value < 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400', className)}>
      {format(value)}
    </span>
  );
}
