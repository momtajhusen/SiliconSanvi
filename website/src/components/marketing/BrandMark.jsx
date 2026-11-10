import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { BUSINESSES, SITE } from '../../constants/site';
import { BrandTile } from './BrandWordmark';

export default function BrandMark({ className, markClassName, wordmarkClassName, tagline = false, dark = false }) {
  return (
    <Link to="/" className={cn('group/brand flex items-center gap-3', className)} aria-label={`${SITE.name} home`}>
      <span className={cn('relative block h-11 w-12 shrink-0', markClassName)}>
        <BrandTile business="institute" size="sm" className="absolute left-0 top-0 h-8 w-8 rounded-[10px] transition-transform duration-500 ease-premium group-hover/brand:-translate-x-0.5 group-hover/brand:-rotate-6" />
        <BrandTile business="traders" size="sm" className={cn('absolute bottom-0 right-0 h-8 w-8 rounded-[10px] ring-2 transition-transform duration-500 ease-premium group-hover/brand:translate-x-0.5 group-hover/brand:rotate-6', dark ? 'ring-[#0a1a3f]' : 'ring-white')} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('brand-word text-[17px] sm:text-[18px]', wordmarkClassName)}>
          <span className={dark ? 'brand-text-silicon-light' : 'brand-text-silicon'}>{BUSINESSES.institute.short}</span>
          <span className={cn('mx-1', dark ? 'text-white/70' : 'text-slate-400')}>&amp;</span>
          <span className={dark ? 'brand-text-sanvi-light' : 'brand-text-sanvi'}>{BUSINESSES.traders.short}</span>
        </span>
        {tagline && (
          <span className={cn('brand-sub mt-1.5 text-[9px] tracking-[0.16em]', dark ? 'text-blue-100/80' : 'text-slate-500')}>
            Computer Institute &amp; Traders
          </span>
        )}
      </span>
    </Link>
  );
}
