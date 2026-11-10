import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { mediaUrl } from '../../lib/api';
import { SITE_IMAGES, bundledSrc } from '../../constants/siteImages';
import useSiteImageStore from '../../stores/siteImageStore';
import { Reveal } from './MktKit';
import { useSlideshow } from '../brandsite/hooks';

/** Image for a website slot: `override` (e.g. a course photo), then the admin's image, then the bundled starter. */
export function useSiteImage(key, override) {
  const saved = useSiteImageStore((state) => state.images[key]);
  const load = useSiteImageStore((state) => state.load);
  useEffect(() => { load(); }, [load]);
  const src = override ? mediaUrl(override) : saved?.url ? mediaUrl(saved.url) : bundledSrc(key);
  return src ? { src, alt: saved?.alt || SITE_IMAGES[key]?.alt || '' } : null;
}

/** Renders the slot image, or `fallback` when the slot is empty or the file fails to load. */
export function SiteImage({ slot, override, className, imgClassName, fallback = null, eager = false, children }) {
  const image = useSiteImage(slot, override);
  const [failed, setFailed] = useState('');
  if (!image || failed === image.src) return fallback;
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={image.src}
        alt={image.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(image.src)}
        className={cn('h-full w-full object-cover', imgClassName)}
      />
      {children}
    </div>
  );
}

const HERO_SLIDE_MS = 5000;

/**
 * Crossfading, auto-advancing hero photos (`slides`: `{ slot, caption, business? }[]`); empty or broken slots are skipped.
 * With `business`/`onBusinessChange`, the slide's business is reported out and an outside business change jumps to its first slide.
 */
function HeroSlides({ slides, traders, business, onBusinessChange }) {
  const images = useSiteImageStore((state) => state.images);
  const load = useSiteImageStore((state) => state.load);
  useEffect(() => { load(); }, [load]);
  const [failed, setFailed] = useState(() => new Set());
  const live = slides
    .map((slide) => {
      const saved = images[slide.slot];
      const src = saved?.url ? mediaUrl(saved.url) : bundledSrc(slide.slot);
      return src && !failed.has(src) ? { ...slide, src, alt: saved?.alt || SITE_IMAGES[slide.slot]?.alt || '' } : null;
    })
    .filter(Boolean);
  const show = useSlideshow(Math.max(live.length, 1), HERO_SLIDE_MS);
  const current = live.length ? show.index % live.length : 0;
  const slideBusiness = live[current]?.business;

  useEffect(() => {
    if (slideBusiness) onBusinessChange?.(slideBusiness);
  }, [slideBusiness, onBusinessChange]);

  // Reacts to `business` only, so a slide change can't bounce back before the parent has caught up.
  const latest = useRef(null);
  latest.current = { live, current, go: show.go };
  useEffect(() => {
    const { live: items, current: index, go } = latest.current;
    if (!business || items[index]?.business === business) return;
    const target = items.findIndex((slide) => slide.business === business);
    if (target >= 0) go(target);
  }, [business]);

  if (!live.length) return null;
  const caption = live[current].caption;
  const amberBar = (live[current].business || (traders ? 'traders' : 'institute')) === 'traders';

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-900 lg:aspect-[5/4] xl:-mr-10 shadow-2xl ring-1 ring-white/30"
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos"
      {...show.regionProps}
    >
      {live.map((slide, index) => (
        <img
          key={slide.slot}
          src={slide.src}
          alt={index === current ? slide.alt : ''}
          aria-hidden={index === current ? undefined : 'true'}
          loading={index <= current + 1 ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed((previous) => new Set(previous).add(slide.src))}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out',
            index === current ? 'mkt-kenburns opacity-100' : 'opacity-0'
          )}
        />
      ))}
      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/20" aria-hidden="true" />
      {caption && (
        <span
          key={current}
          className="animate-fade-up absolute left-4 top-4 rounded-full bg-slate-950/50 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/20 backdrop-blur"
        >
          {caption}
        </span>
      )}
      {live.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1" role="tablist" aria-label="Choose photo">
          {live.map((slide, index) => {
            const selected = index === current;
            return (
              <button
                key={slide.slot}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={slide.caption || `Photo ${index + 1}`}
                onClick={() => show.go(index)}
                className="group py-2"
              >
                <span
                  className={cn(
                    'relative block h-1.5 overflow-hidden rounded-full transition-all duration-300',
                    selected ? 'w-8 bg-white/35' : 'w-1.5 bg-white/55 group-hover:bg-white'
                  )}
                >
                  {selected && (
                    <span
                      key={current}
                      {...show.progressProps()}
                      className={cn('mkt-slide-progress absolute inset-0 block rounded-full', amberBar ? 'bg-amber-300' : 'bg-white')}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Large framed hero photo slideshow for a page hero; floats a small badge over the corner. */
export function PhotoFrame({ slides, brand = 'institute', badge, badgeIcon: BadgeIcon, business, onBusinessChange, children }) {
  const traders = brand === 'traders';
  return (
    <div className="relative px-2 py-4 sm:px-4">
      <div className={cn('absolute inset-6 rounded-[2rem] blur-2xl transition-colors duration-700', traders ? 'bg-amber-400/35' : 'bg-sky-400/35')} aria-hidden="true" />
      <HeroSlides slides={slides} traders={traders} business={business} onBusinessChange={onBusinessChange} />
      {children}
      {badge && (
        <div className="mkt-float absolute -bottom-1 left-0 flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 text-slate-900 shadow-xl backdrop-blur sm:-left-3">
          {BadgeIcon && (
            <span className={cn('brand-tile h-9 w-9 rounded-xl', traders ? 'brand-tile-sanvi' : 'brand-tile-silicon')}>
              <BadgeIcon className="relative h-4 w-4" />
            </span>
          )}
          <span className="text-sm font-bold">{badge}</span>
        </div>
      )}
    </div>
  );
}

// Tile spans per photo count, so a 2-column (mobile) and 4-column (desktop) grid is always completely filled.
const MOSAIC_LAYOUTS = {
  1: ['col-span-2 row-span-2 lg:col-span-4'],
  2: ['row-span-2 lg:col-span-2', 'row-span-2 lg:col-span-2'],
  3: ['col-span-2 row-span-2', 'lg:col-span-2', 'lg:col-span-2'],
  4: ['col-span-2 row-span-2', 'col-span-2', '', ''],
  5: ['col-span-2 row-span-2', '', '', '', ''],
};

function MosaicTile({ tile, large, span, index }) {
  const image = useSiteImage(tile.slot);
  if (!image) return null;
  const traders = SITE_IMAGES[tile.slot]?.business === 'traders';
  return (
    <Reveal delay={index * 80} className={cn('h-full', span)}>
      <Link
        to={tile.to}
        className="group relative block h-full min-h-[11rem] overflow-hidden rounded-3xl bg-slate-200 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/70"
      >
        <SiteImage slot={tile.slot} className="absolute inset-0" imgClassName="transition duration-700 ease-premium group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <span className="min-w-0">
            <span className={cn('mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', traders ? 'bg-amber-400 text-stone-950' : 'bg-blue-500 text-white')}>
              {tile.chip}
            </span>
            <span className={cn('block font-bold leading-tight text-white', large ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base')}>{tile.title}</span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition duration-300 group-hover:bg-white group-hover:text-slate-900">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

/** Bento gallery that re-flows to fill the grid for 1–5 live photos. Hidden until at least one slot has a photo. */
export function PhotoMosaic({ tiles, className }) {
  const images = useSiteImageStore((state) => state.images);
  const load = useSiteImageStore((state) => state.load);
  useEffect(() => { load(); }, [load]);
  const live = tiles.filter((tile) => images[tile.slot]?.url || bundledSrc(tile.slot)).slice(0, 5);
  if (!live.length) return null;
  const spans = MOSAIC_LAYOUTS[live.length];
  return (
    <section className={className}>
      <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:gap-4 lg:grid-cols-4 lg:auto-rows-[13rem]">
        {live.map((tile, index) => (
          <MosaicTile key={tile.slot} tile={tile} span={spans[index]} large={index === 0 || live.length <= 2} index={index} />
        ))}
      </div>
    </section>
  );
}
