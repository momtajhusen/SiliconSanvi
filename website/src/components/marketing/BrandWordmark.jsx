import { BUSINESSES, brandRest } from '../../constants/site';
import { cn } from '../../lib/utils';
import { mediaUrl } from '../../lib/api';
import { brandTheme } from './brandTheme';

const SIZES = {
  sm: { tile: 'h-8 w-8 rounded-[10px]', icon: 'h-4 w-4', name: 'text-[15px]', sub: 'text-[8px] tracking-[0.16em]', gap: 'gap-2' },
  md: { tile: 'h-11 w-11 rounded-[13px]', icon: 'h-5 w-5', name: 'text-[1.35rem]', sub: 'text-[9px] tracking-[0.2em]', gap: 'gap-3' },
  lg: { tile: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7', name: 'text-[1.6rem] sm:text-[2rem]', sub: 'text-[9.5px] sm:text-[11px] tracking-[0.22em]', gap: 'gap-3.5' },
};

function splitName(info) {
  return { word: info.short, rest: brandRest(info) };
}

export function BrandTile({ business, size = 'md', className }) {
  const info = BUSINESSES[business];
  const s = SIZES[size];
  if (info.logo) {
    return (
      <span className={cn('relative inline-flex shrink-0 overflow-hidden bg-white shadow-md ring-1 ring-black/5', s.tile, className)} aria-hidden="true">
        <img src={mediaUrl(info.logo)} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={cn('brand-tile', brandTheme(business).tile, s.tile, className)} aria-hidden="true">
      <info.icon className={cn('relative', s.icon)} strokeWidth={2} />
    </span>
  );
}

export function BrandWordmark({ business, size = 'md', dark = false, showTile = true, className }) {
  const info = BUSINESSES[business];
  const theme = brandTheme(business);
  const s = SIZES[size];
  const { word, rest } = splitName(info);
  return (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      {showTile && <BrandTile business={business} size={size} />}
      <span className="flex flex-col leading-none">
        <span className={cn('brand-word', s.name, dark ? theme.textLight : theme.text)}>{word}</span>
        <span className={cn('brand-sub mt-1.5', s.sub, dark ? 'text-white/75' : 'text-slate-500')}>{rest}</span>
      </span>
    </span>
  );
}

export function BrandDuo({ dark = false, size = 'md', active, onSelect, className }) {
  const item = (business) => {
    const dimmed = active && active !== business;
    const mark = (
      <BrandWordmark
        business={business}
        size={size}
        dark={dark}
        className={cn('transition duration-500 ease-premium', dimmed && 'opacity-70 saturate-[0.8]')}
      />
    );
    if (!onSelect) return mark;
    return (
      <button
        type="button"
        onClick={() => onSelect(business)}
        aria-pressed={active === business}
        className="rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {mark}
      </button>
    );
  };

  return (
    <div className={cn('brand-plate', dark ? 'brand-plate-dark' : 'brand-plate-light', className)}>
      {item('institute')}
      <span className="brand-amp" aria-hidden="true">&amp;</span>
      {item('traders')}
    </div>
  );
}
