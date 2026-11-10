import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { SpotlightCard } from './MktKit';

const VARIANTS = {
  solid: 'bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white shadow-lg shadow-blue-700/30 hover:from-blue-900 hover:via-blue-800 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-700/35',
  amber: 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/35',
  ghost: 'text-slate-600 hover:text-blue-700',
  glass: 'border border-white/25 bg-white/10 text-white backdrop-blur hover:border-white/50 hover:bg-white/20',
  outline: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-blue-300 hover:text-blue-700 hover:shadow-md',
  'outline-amber': 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-amber-300 hover:text-orange-700 hover:shadow-md',
};

export function MarketingCta({ to, children, variant = 'solid', className, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-[0.98]',
        (variant === 'solid' || variant === 'amber') && 'mkt-cta-solid',
        VARIANTS[variant] || VARIANTS.solid,
        className
      )}
    >
      {children}
    </Link>
  );
}

export function IconWell({ icon: Icon, tone = 'blue', className }) {
  const tones = {
    blue: 'from-blue-500 to-blue-800 shadow-blue-600/35',
    sky: 'from-sky-400 to-blue-600 shadow-sky-500/35',
    amber: 'from-amber-400 to-orange-600 shadow-orange-500/35',
    emerald: 'from-emerald-400 to-teal-600 shadow-emerald-500/35',
    rose: 'from-rose-400 to-pink-600 shadow-pink-500/35',
    violet: 'from-violet-500 to-indigo-600 shadow-violet-500/35',
    orange: 'from-orange-400 to-red-500 shadow-orange-500/35',
    slate: 'from-slate-500 to-slate-800 shadow-slate-500/35',
  };

  return (
    <div
      className={cn(
        'mkt-icon-well relative mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ring-white icon-well transition-transform duration-300 ease-premium',
        tones[tone] || tones.blue,
        className
      )}
    >
      <Icon className="relative h-7 w-7 drop-shadow-sm" strokeWidth={1.8} />
    </div>
  );
}

export function MktCard({ children, className, accent, icon: Icon }) {
  return (
    <SpotlightCard accent={accent} className={className}>
      {Icon && <Icon className="mkt-card-watermark" strokeWidth={1.2} aria-hidden="true" />}
      {children}
    </SpotlightCard>
  );
}
