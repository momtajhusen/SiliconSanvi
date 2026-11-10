import { Link } from 'react-router-dom';
import { ArrowRight, Check, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BUSINESSES, brandRest } from '../../constants/site';
import { MarketingCta } from './MarketingCta';
import { Reveal, SectionHeading, SpotlightCard } from './MktKit';
import { BrandTile } from './BrandWordmark';
import { brandTheme } from './brandTheme';

export function BusinessBadge({ business, dark = false, className }) {
  const info = BUSINESSES[business];
  if (!info) return null;
  const theme = brandTheme(business);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-semibold ring-1',
        dark ? 'bg-white/10 text-blue-50 ring-white/15' : cn(theme.soft, theme.ink, theme.ring),
        className
      )}
    >
      <BrandTile business={business} size="sm" className="h-5 w-5 rounded-full [&_svg]:h-3 [&_svg]:w-3" />
      by {info.name}
    </span>
  );
}

function BusinessCard({ info, index }) {
  const theme = brandTheme(info.key);
  const rest = brandRest(info);
  return (
    <Reveal delay={index * 120} className="h-full">
      <SpotlightCard className={cn('flex flex-col p-0', theme.hover)}>
        <Link to={info.home} className={cn('group/banner relative isolate block overflow-hidden bg-gradient-to-br px-7 pb-8 pt-7 text-white sm:px-8', theme.banner)}>
          <div className="mkt-grid-bg" aria-hidden="true" />
          <span className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur transition duration-300 group-hover/banner:translate-x-1 group-hover/banner:bg-white/25" aria-hidden="true">
            <ArrowRight className="h-4 w-4" />
          </span>
          <info.icon className="absolute -bottom-6 -right-4 h-36 w-36 text-white/10 transition-transform duration-700 ease-premium group-hover:-rotate-6 group-hover:scale-110" strokeWidth={1.2} aria-hidden="true" />
          <div className="flex items-center gap-4">
            <BrandTile business={info.key} size="lg" className="ring-2 ring-white/40" />
            <div className="min-w-0">
              <h3 className="leading-none">
                <span className="brand-word block text-3xl text-white sm:text-4xl">{info.short}</span>
                <span className="brand-sub mt-1.5 block text-[10px] tracking-[0.22em] text-white/85">{rest}</span>
              </h3>
            </div>
          </div>
          <p className="relative mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/20 backdrop-blur">{info.tagline}</p>
        </Link>

        <div className="flex flex-1 flex-col p-7 sm:p-8">
          <p className="text-sm leading-6 text-slate-600">{info.text}</p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {info.services.map((service) => (
              <li key={service} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', theme.soft)}>
                  <Check className={cn('h-3 w-3', theme.check)} strokeWidth={3.2} />
                </span>
                {service}
              </li>
            ))}
          </ul>
          <div className={cn('mt-6 flex items-start gap-3 rounded-2xl p-4 ring-1', theme.soft, theme.ring)}>
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm', theme.ink)}>
              <info.billingIcon className="h-4 w-4" />
            </span>
            <span>
              <span className={cn('block text-[11px] font-bold uppercase tracking-wider', theme.ink)}>Issued in this name</span>
              <span className="block text-sm font-semibold text-slate-800">{info.billing}</span>
            </span>
          </div>
          <div className="mt-auto pt-6">
            <MarketingCta to={info.to} variant={theme.cta} className="w-full py-3">
              {info.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MarketingCta>
          </div>
        </div>
      </SpotlightCard>
    </Reveal>
  );
}

export default function TwoBusinesses({ id, className }) {
  return (
    <section id={id} className={cn('relative scroll-mt-24 overflow-hidden bg-white py-12 sm:py-14', className)}>
      <div className="mkt-section-dots absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,#000,transparent)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Our two businesses"
          icon={Building2}
          title="One family,"
          highlight="two trusted names"
          text={`We run a computer institute and a computer sales & service business from the same place. ${BUSINESSES.institute.name} teaches, and ${BUSINESSES.traders.name} sells, installs and services.`}
        />
        <div className="relative grid gap-6 lg:grid-cols-2 lg:gap-10">
          {Object.values(BUSINESSES).map((info, index) => (
            <BusinessCard key={info.key} info={info} index={index} />
          ))}
          <span className="brand-amp absolute left-1/2 top-[5.5rem] z-10 hidden h-12 w-12 -translate-x-1/2 text-lg ring-4 ring-white lg:inline-flex" aria-hidden="true">&amp;</span>
        </div>
        <Reveal className="mx-auto mt-10 flex max-w-3xl items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-sm leading-6 text-slate-700 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)]">
          <span className="hidden shrink-0 -space-x-2 sm:flex">
            <BrandTile business="institute" size="sm" className="ring-2 ring-white" />
            <BrandTile business="traders" size="sm" className="ring-2 ring-white" />
          </span>
          <p>
            Paying a course fee? Your receipt comes from <b className="brand-text-silicon font-extrabold">{BUSINESSES.institute.name}</b>.
            {' '}Buying a computer, accessory or CCTV? Your bill comes from <b className="brand-text-sanvi font-extrabold">{BUSINESSES.traders.name}</b>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
