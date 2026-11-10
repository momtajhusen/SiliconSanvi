import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Cctv, Clock, Cpu, Home, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import PageFade from '../motion/PageFade';
import { BrandTile, BrandWordmark } from '../marketing/BrandWordmark';
import { MarketingCta } from '../marketing/MarketingCta';
import { AddressText, SocialLinks } from '../marketing/CompanyLinks';
import { useDocumentBrand, useMarketingShell, useScrolled } from '../brandsite/hooks';
import { cn } from '../../lib/utils';
import { BUSINESSES, PRODUCT_CATEGORIES, PRODUCT_PROMISES, PRODUCT_SERVICES } from '../../constants/site';

const info = BUSINESSES.traders;
const sister = BUSINESSES.institute;

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/products', label: 'Computer Parts', icon: Cpu },
  { to: '/cctv', label: 'CCTV', icon: Cctv },
  { to: '/contact?type=products', label: 'Contact', icon: MessageCircle },
];

function CategoryBar() {
  return (
    <div className="sanvi-catbar border-t border-white/5">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:justify-between lg:gap-0 lg:px-4 [scrollbar-width:none] lg:[&>a]:gap-1.5 lg:[&>a]:px-2 lg:[&>a]:text-[12px]">
        {PRODUCT_CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            to={`/contact?type=products&item=${category.slug}`}
            className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-stone-300 transition hover:bg-amber-400/10 hover:text-amber-300"
          >
            <category.icon className="h-4 w-4 text-amber-400/80 transition group-hover:scale-110 group-hover:text-amber-300" />
            {category.title}
          </Link>
        ))}
        <Link to="/cctv" className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-stone-300 transition hover:bg-amber-400/10 hover:text-amber-300">
          <Cctv className="h-4 w-4 text-amber-400/80" />
          CCTV installation
        </Link>
      </div>
    </div>
  );
}

function SanviHeader() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50">
      <div className={cn('sanvi-topbar hidden overflow-hidden transition-all duration-500 ease-premium md:block', scrolled ? 'max-h-0 opacity-0' : 'max-h-10')}>
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-6 text-[12px] font-semibold text-stone-900">
          <div className="flex items-center gap-5">
            {PRODUCT_PROMISES.map((promise) => (
              <span key={promise.label} className="hidden items-center gap-1.5 first:inline-flex lg:inline-flex">
                <promise.icon className="h-3.5 w-3.5" />
                {promise.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <a href={info.phoneHref} className="inline-flex items-center gap-1.5 hover:underline"><Phone className="h-3.5 w-3.5" />{info.phone}</a>
            <a href={info.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-2.5 py-0.5 text-amber-300 hover:bg-black">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp us
            </a>
          </div>
        </div>
      </div>

      <div className={cn('sanvi-mainbar transition-shadow duration-300', scrolled && 'shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]')}>
        <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={info.home} aria-label={info.name} className="shrink-0">
            <BrandWordmark business="traders" size="md" dark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={info.name}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn('sanvi-navlink', isActive && item.to !== '/' && 'is-active')}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link to={sister.home} className="group inline-flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 ring-1 ring-white/10 transition hover:bg-white/10" title={sister.name}>
              <BrandTile business="institute" size="sm" className="h-7 w-7 rounded-full [&_svg]:h-3.5 [&_svg]:w-3.5" />
              <span className="brand-word brand-text-silicon-light text-[13px]">{sister.short}</span>
            </Link>
            <MarketingCta to="/contact?type=products" variant="amber" className="px-5 py-2.5 text-[13px]">
              Ask for price
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </MarketingCta>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-amber-300 ring-1 ring-white/10 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <CategoryBar />

        {open && (
          <div className="animate-fade-up border-t border-white/5 bg-stone-950 px-4 pb-5 pt-3 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-200 hover:bg-white/5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><item.icon className="h-4 w-4" /></span>
                {item.label}
              </Link>
            ))}
            <Link to={sister.home} className="mt-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
              <BrandWordmark business="institute" size="sm" dark />
            </Link>
            <MarketingCta to="/contact?type=products" variant="amber" className="mt-3 h-12 w-full">Ask for price</MarketingCta>
          </div>
        )}
      </div>
    </header>
  );
}

function SanviFooter() {
  return (
    <footer className="sanvi-footer relative text-stone-400">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-orange-600" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <BrandWordmark business="traders" size="lg" dark />
          <p className="mt-5 max-w-md text-sm leading-6">{info.text}</p>
          <div className="mt-5 inline-flex items-start gap-3 rounded-2xl bg-amber-400/5 p-4 ring-1 ring-amber-300/15">
            <info.billingIcon className="mt-0.5 h-4 w-4 text-amber-300" />
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">Issued in this name</span>
              <span className="block text-sm font-semibold text-white">{info.billing}</span>
            </span>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white">Categories</h3>
          <ul className="space-y-2 text-sm">
            {PRODUCT_CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link to={`/contact?type=products&item=${category.slug}`} className="transition hover:text-amber-300">{category.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white">Services</h3>
          <ul className="space-y-2 text-sm">
            {PRODUCT_SERVICES.map((service) => (
              <li key={service.title} className="flex items-center gap-2"><service.icon className="h-3.5 w-3.5 text-amber-400" />{service.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-amber-400" /><a href={info.phoneHref} className="hover:text-white">{info.phone}</a></li>
            <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-amber-400" /><a href={`mailto:${info.email}`} className="hover:text-white">{info.email}</a></li>
            <li className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-amber-400" />{info.hours}</li>
            <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-amber-400" /><AddressText info={info} /></li>
          </ul>
          <SocialLinks social={info.social} className="mt-5" itemClassName="bg-white/5 text-amber-300 ring-1 ring-white/10 hover:bg-amber-400 hover:text-stone-950" />
          <Link to={sister.home} className="mt-6 inline-flex rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10">
            <BrandWordmark business="institute" size="sm" dark />
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {info.name}. All rights reserved.
        {info.registration && <span className="mt-1 block sm:ml-2 sm:mt-0 sm:inline">{info.registration}</span>}
      </div>
    </footer>
  );
}

export default function SanviLayout() {
  useMarketingShell();
  useDocumentBrand(info.name, info.favicon);
  return (
    <div className="marketing-site sanvi-site flex min-h-dvh flex-col bg-stone-50 text-stone-900">
      <SanviHeader />
      <main className="flex-1">
        <PageFade>
          <Outlet />
        </PageFade>
      </main>
      <SanviFooter />
    </div>
  );
}
