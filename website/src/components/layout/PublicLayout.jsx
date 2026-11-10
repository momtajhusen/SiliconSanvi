import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Mail, Phone, MapPin, Sparkles, BookOpen, Info, MessageCircle, LogIn, Home, ArrowRight, ChevronRight, ChevronDown, Clock, Cctv, Cpu, GraduationCap, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import BrandMark from '../marketing/BrandMark';
import { MarketingCta, IconWell } from '../marketing/MarketingCta';
import { CHANNEL_DOTS } from '../marketing/MktKit';
import { BrandDuo, BrandTile, BrandWordmark } from '../marketing/BrandWordmark';
import { brandTheme } from '../marketing/brandTheme';
import PageFade from '../motion/PageFade';
import { AddressText, SocialLinks } from '../marketing/CompanyLinks';
import { useDocumentBrand } from '../brandsite/hooks';
import { cn } from '../../lib/utils';
import { scrollPageToTop } from '../../lib/scrollPageToTop';
import { SITE, BUSINESSES, DIVISIONS, brandRest } from '../../constants/site';

const FOOTER_ICON_TILE = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-blue-200 ring-1 ring-white/10';

const FOOTER_LINKS = {
  Services: [
    { to: '/courses', label: 'Computer courses', icon: BookOpen },
    { to: '/admission', label: 'Online admission', icon: GraduationCap },
    { to: '/cctv', label: 'CCTV installation', icon: Cctv },
    { to: '/products', label: 'Computer parts', icon: Cpu },
  ],
  Company: [
    { to: '/about', label: 'About us', icon: Info },
    { to: '/#businesses', label: 'Our businesses', icon: Sparkles },
    { to: '/contact', label: 'Contact', icon: MessageCircle },
    { to: '/auth/login', label: 'Staff login', icon: LogIn },
  ],
};

const NAV = [
  { to: '/courses', label: 'Courses', icon: BookOpen, division: 'institute' },
  { to: '/cctv', label: 'CCTV', icon: Cctv, division: 'cctv' },
  { to: '/products', label: 'Computer Parts', icon: Cpu, division: 'products' },
  { to: '/about', label: 'About', icon: Info },
  { to: '/contact', label: 'Contact', icon: MessageCircle },
];

const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/cctv', label: 'CCTV', icon: Cctv },
  { to: '/products', label: 'Parts', icon: Cpu },
];

const DIVISION_BY_KEY = Object.fromEntries(DIVISIONS.map((division) => [division.key, division]));

function navBusiness(item) {
  return item.division ? DIVISION_BY_KEY[item.division].business : undefined;
}

function MegaPanel({ division }) {
  const info = BUSINESSES[division.business];
  const theme = brandTheme(division.business);
  return (
    <div className="mkt-mega-card">
      <Link to={info.home} className={cn('group/banner relative isolate overflow-hidden bg-gradient-to-br p-5 text-white', theme.banner)}>
        <div className="mkt-grid-bg" aria-hidden="true" />
        <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-white/60 transition duration-300 group-hover/banner:translate-x-1 group-hover/banner:text-white" aria-hidden="true" />
        <BrandTile business={division.business} size="md" className="ring-2 ring-white/30 transition-transform duration-300 group-hover/banner:scale-105" />
        <p className="brand-word mt-4 text-2xl text-white">{info.short}</p>
        <p className="brand-sub mt-1 text-[9px] tracking-[0.2em] text-white/80">{brandRest(info)}</p>
        <p className="mt-3 text-[13px] font-medium leading-5 text-white/90">{info.tagline}</p>
        <ul className="mt-4 space-y-1.5">
          {info.services.slice(0, 4).map((service) => (
            <li key={service} className="flex items-start gap-1.5 text-[12px] leading-4 text-white/85">
              <Check className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={3} />
              {service}
            </li>
          ))}
        </ul>
      </Link>
      <div className="flex flex-col p-5">
        <div className="flex items-center gap-3">
          <IconWell icon={division.icon} tone={division.tone} className="mb-0 h-11 w-11 rounded-xl ring-2" />
          <div>
            <p className="text-base font-bold text-slate-900">{division.title}</p>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wider', theme.ink)}>{division.tagline}</p>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-slate-600">{division.text}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {division.points.map((point) => (
            <span key={point} className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', theme.soft, theme.ink, theme.ring)}>
              {point}
            </span>
          ))}
        </div>
        <MarketingCta to={division.to} variant={theme.cta} className="mt-auto w-full translate-y-0 pt-2.5">
          {division.cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </MarketingCta>
      </div>
    </div>
  );
}

function DesktopNav({ isActive }) {
  const [openKey, setOpenKey] = useState(null);
  const timer = useRef(null);
  const location = useLocation();

  useEffect(() => setOpenKey(null), [location.pathname, location.hash]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && setOpenKey(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const open = (key) => {
    clearTimeout(timer.current);
    setOpenKey(key);
  };
  const close = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenKey(null), 140);
  };

  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        const business = navBusiness(item);
        const division = item.division && DIVISION_BY_KEY[item.division];
        const isOpen = openKey === item.to;
        return (
          <div
            key={item.to}
            className="relative"
            onMouseEnter={division ? () => open(item.to) : undefined}
            onMouseLeave={division ? close : undefined}
            onFocus={division ? () => open(item.to) : undefined}
            onBlur={division ? (event) => !event.currentTarget.contains(event.relatedTarget) && close() : undefined}
          >
            <Link
              to={item.to}
              data-brand={business}
              aria-current={active ? 'page' : undefined}
              aria-haspopup={division ? 'true' : undefined}
              aria-expanded={division ? isOpen : undefined}
              className={cn('mkt-navlink group', active && 'is-active', isOpen && 'is-open')}
            >
              {business ? <span className="mkt-navdot" aria-hidden="true" /> : <Icon className="hidden h-3.5 w-3.5 2xl:block" />}
              {item.label}
              {division && <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-300', isOpen && 'rotate-180')} />}
            </Link>
            {division && (
              <div className={cn('mkt-mega', isOpen && 'is-open')}>
                <MegaPanel division={division} />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function TopBar({ hidden }) {
  return (
    <div className={cn('mkt-topbar hidden lg:block', hidden && 'is-hidden')}>
      <div className="mx-auto flex h-10 max-w-6xl items-center justify-between px-6 text-[12px] font-medium">
        <div className="flex items-center gap-5">
          <a href={SITE.phoneHref} className="mkt-topbar-link"><Phone className="h-3.5 w-3.5 text-blue-300" />{SITE.phone}</a>
          <a href={`mailto:${SITE.email}`} className="mkt-topbar-link"><Mail className="h-3.5 w-3.5 text-blue-300" />{SITE.email}</a>
          <span className="mkt-topbar-link"><Clock className="h-3.5 w-3.5 text-blue-300" />{SITE.hours}</span>
        </div>
        <div className="flex items-center gap-1">
          {Object.values(BUSINESSES).map((info, index) => (
            <span key={info.key} className="flex items-center gap-1">
              {index > 0 && <span className="mx-2 h-4 w-px bg-white/15" aria-hidden="true" />}
              <Link to={info.home} className="group flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-white/5">
                <BrandTile business={info.key} size="sm" className="h-5 w-5 rounded-md [&_svg]:h-3 [&_svg]:w-3" />
                <span className={cn('font-semibold', brandTheme(info.key).inkLight, 'group-hover:text-white')}>{info.name}</span>
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mkt-footer relative pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
      <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sky-400 via-blue-600 via-50% to-orange-500" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:pt-16">
        <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-10 lg:flex-row lg:justify-between">
          <BrandDuo dark size="lg" className="hidden lg:inline-flex" />
          <BrandDuo dark size="sm" className="lg:hidden" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <MarketingCta to="/contact" className="px-6 py-3">
              Enquire now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MarketingCta>
            <a
              href={SITE.phoneHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {SITE.phone}
            </a>
          </div>
        </div>

        <div className="hidden gap-10 py-12 lg:grid lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <ul className="space-y-4 text-sm leading-6 text-slate-400">
            <li>
              <Link to={BUSINESSES.institute.home} className="group flex gap-3">
                <BrandTile business="institute" size="sm" />
                <span>
                  <span className="block font-semibold text-white group-hover:text-sky-300">{BUSINESSES.institute.name}</span>
                  Computer courses, admissions and certificates.
                </span>
              </Link>
            </li>
            <li>
              <Link to={BUSINESSES.traders.home} className="group flex gap-3">
                <BrandTile business="traders" size="sm" />
                <span>
                  <span className="block font-semibold text-white group-hover:text-amber-300">{BUSINESSES.traders.name}</span>
                  Computers, parts & accessories, CCTV installation and service.
                </span>
              </Link>
            </li>
          </ul>
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">{heading}</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="group inline-flex items-center gap-2.5 py-0.5 transition-colors hover:text-white">
                      <link.icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-amber-300" strokeWidth={2} />
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Contact</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2.5"><span className={FOOTER_ICON_TILE}><Mail className="h-3.5 w-3.5" /></span><a href={`mailto:${SITE.email}`} className="hover:text-white">{SITE.email}</a></li>
              <li className="flex items-center gap-2.5"><span className={FOOTER_ICON_TILE}><Phone className="h-3.5 w-3.5" /></span><a href={SITE.phoneHref} className="hover:text-white">{SITE.phone}</a></li>
              <li className="flex items-center gap-2.5"><span className={FOOTER_ICON_TILE}><Clock className="h-3.5 w-3.5" /></span>{SITE.hours}</li>
              <li className="flex items-center gap-2.5"><span className={FOOTER_ICON_TILE}><MapPin className="h-3.5 w-3.5" /></span><AddressText info={SITE} /></li>
            </ul>
            <SocialLinks social={SITE.social} className="mt-5" itemClassName="bg-white/5 text-blue-200 ring-1 ring-white/10 hover:bg-white hover:text-slate-900" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {BUSINESSES.institute.name} &amp; {BUSINESSES.traders.name}. All rights reserved.
      </div>
    </footer>
  );
}

function DrawerLink({ item, index, active }) {
  const Icon = item.icon;
  const business = navBusiness(item);
  const theme = business ? brandTheme(business) : null;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      style={{ '--rise-delay': `${60 + index * 45}ms` }}
      className={cn(
        'mkt-rise group relative mb-1 flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
        active ? cn(theme?.soft || 'bg-slate-100', 'text-slate-900') : 'text-slate-700 hover:bg-slate-50'
      )}
    >
      {business ? (
        <BrandTile business={business} size="sm" className="h-10 w-10 rounded-xl" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
      )}
      {item.label}
      <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

function MobileDrawer({ onClose, isActive }) {
  const groups = [
    { key: 'institute', items: NAV.filter((item) => navBusiness(item) === 'institute') },
    { key: 'traders', items: NAV.filter((item) => navBusiness(item) === 'traders') },
  ];
  const rest = NAV.filter((item) => !item.division);
  let index = 0;
  return (
    <div className="lg:hidden">
      <button type="button" className="mkt-drawer-scrim hidden sm:block" aria-label="Close menu" onClick={onClose} />
      <aside className="mkt-drawer overflow-y-auto" role="dialog" aria-modal="true" aria-label="Site menu">
        <div className="mkt-hero relative isolate shrink-0 overflow-hidden px-5 pb-6 pt-5 text-white">
          <div className="mkt-hero-mesh" aria-hidden="true" />
          <div className="mkt-grid-bg" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <BrandMark dark tagline />
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition duration-300 hover:rotate-90 hover:bg-white/25"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-6 text-xl font-bold leading-tight">
            Courses, CCTV & computer parts — <span className="mkt-gradient-text-light">two trusted names, one roof.</span>
          </p>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            {Object.values(BUSINESSES).map((info) => (
              <Link key={info.key} to={info.home} className="group flex items-center justify-between gap-2 rounded-xl transition hover:bg-white/5">
                <BrandWordmark business={info.key} size="sm" dark />
                <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {CHANNEL_DOTS.slice(0, 7).map((item) => (
              <span key={item.name} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-blue-50 ring-1 ring-white/15">
                <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />
                {item.name}
              </span>
            ))}
          </div>
        </div>

        <nav className="shrink-0 space-y-4 px-3 py-4" aria-label="Site">
          {groups.map((group) => (
            <div key={group.key}>
              <Link to={BUSINESSES[group.key].home} className={cn('brand-sub mb-1.5 flex items-center gap-2 px-3 text-[10px] tracking-[0.18em] hover:underline', brandTheme(group.key).ink)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', brandTheme(group.key).dot)} />
                {BUSINESSES[group.key].name}
                <ArrowRight className="h-3 w-3" />
              </Link>
              {group.items.map((item) => (
                <DrawerLink key={item.to} item={item} index={index++} active={isActive(item)} />
              ))}
            </div>
          ))}
          <div className="border-t border-slate-100 pt-3">
            {rest.map((item) => (
              <DrawerLink key={item.to} item={item} index={index++} active={isActive(item)} />
            ))}
          </div>
        </nav>

        <div className="mt-auto shrink-0 space-y-3 border-t border-slate-100 px-4 py-4">
          <Link
            to="/auth/login"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
          <MarketingCta to="/admission" className="h-12 w-full">
            Apply for admission
          </MarketingCta>
          <MarketingCta to="/contact" variant="amber" className="h-12 w-full">
            Enquire now
          </MarketingCta>
        </div>
      </aside>
    </div>
  );
}

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useDocumentBrand(SITE.name, SITE.favicon);

  useEffect(() => {
    const root = document.getElementById('root');
    const onScroll = (event) => {
      const target = event?.target;
      if (target && target !== document && target !== root) return;
      setScrolled(Math.max(window.scrollY, root?.scrollTop || 0) > 12);
    };
    onScroll();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('marketing', 'force-light');
    return () => {
      root.classList.remove('marketing', 'force-light');
      const stored = localStorage.getItem('silicon-theme');
      if (stored === 'dark') root.classList.add('dark');
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      scrollPageToTop();
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const onKey = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const isActive = (item) => location.pathname === item.to;

  return (
    <div className="marketing-site flex min-h-dvh flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-50">
        <TopBar hidden={scrolled} />
        <div className={cn('mkt-mainbar relative', scrolled && 'is-scrolled')}>
          <div className="mkt-appbar mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 xl:gap-3">
            <BrandMark tagline />

            <DesktopNav isActive={isActive} />

            <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap lg:flex">
              <div className="mr-1 hidden items-center gap-0.5 rounded-full bg-slate-100/80 p-1 ring-1 ring-slate-200/70 xl:flex">
                {Object.values(BUSINESSES).map((info) => (
                  <Link
                    key={info.key}
                    to={info.home}
                    title={info.name}
                    className="group flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 transition duration-300 hover:bg-white hover:shadow-md"
                  >
                    <BrandTile business={info.key} size="sm" className="h-6 w-6 rounded-full transition-transform duration-300 group-hover:scale-110 [&_svg]:h-3 [&_svg]:w-3" />
                    <span className={cn('brand-word text-[13px]', brandTheme(info.key).text)}>{info.short}</span>
                  </Link>
                ))}
              </div>
              <Link
                to="/auth/login"
                className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogIn className="hidden h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 2xl:block" />
                Login
              </Link>
              <MarketingCta to="/contact" className="px-4 py-2 text-[13px]">
                Enquire now
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </MarketingCta>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-amber-50 text-slate-800 ring-1 ring-slate-200 transition duration-300 hover:shadow-md active:scale-95 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <span className="mkt-mainbar-glow" aria-hidden="true" />
        </div>
      </header>

      {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} isActive={isActive} />}

      <main className="flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        <PageFade>
          <Outlet />
        </PageFade>
      </main>

      <SiteFooter />

      <nav className="mkt-bottom-nav lg:hidden" aria-label="App navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.to === '/' ? location.pathname === '/' : location.pathname === tab.to;
          return (
            <Link key={tab.to} to={tab.to} className={active ? 'is-active' : undefined}>
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>
    </div>
  );
}
