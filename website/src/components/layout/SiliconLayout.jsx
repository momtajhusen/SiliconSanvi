import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, GraduationCap, Home, Info, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import PageFade from '../motion/PageFade';
import { BrandTile, BrandWordmark } from '../marketing/BrandWordmark';
import { MarketingCta } from '../marketing/MarketingCta';
import { AddressText, SocialLinks } from '../marketing/CompanyLinks';
import { useDocumentBrand, useMarketingShell, useScrolled } from '../brandsite/hooks';
import { cn } from '../../lib/utils';
import { BUSINESSES } from '../../constants/site';
import { COURSES } from '../../constants/courses';

const info = BUSINESSES.institute;
const sister = BUSINESSES.traders;

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/silicon#courses', label: 'Courses', icon: BookOpen },
  { to: '/admission', label: 'Online admission', icon: GraduationCap },
  { to: '/about', label: 'About', icon: Info },
  { to: '/contact?type=course', label: 'Contact', icon: MessageCircle },
];

function SiliconHeader() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50">
      <div className={cn('silicon-topbar hidden overflow-hidden transition-all duration-500 ease-premium md:block', scrolled ? 'max-h-0 opacity-0' : 'max-h-10')}>
        <div className="mx-auto flex h-10 max-w-6xl items-center justify-between px-6 text-[12px] font-semibold text-stone-900">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-2.5 py-0.5 font-semibold text-amber-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Admissions open
            </span>
            <a href={info.phoneHref} className="inline-flex items-center gap-1.5 hover:underline"><Phone className="h-3.5 w-3.5" />{info.phone}</a>
            <a href={`mailto:${info.email}`} className="hidden items-center gap-1.5 hover:underline lg:inline-flex"><Mail className="h-3.5 w-3.5" />{info.email}</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{info.hours}</span>
            <Link to={sister.home} className="group inline-flex items-center gap-2 rounded-full bg-stone-900 py-0.5 pl-0.5 pr-3 transition hover:bg-black">
              <BrandTile business="traders" size="sm" className="h-5 w-5 rounded-full [&_svg]:h-3 [&_svg]:w-3" />
              <span className="font-semibold text-amber-300 group-hover:text-amber-200">{sister.name}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className={cn('sanvi-mainbar transition-shadow duration-300', scrolled && 'shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]')}>
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={info.home} aria-label={info.name} className="shrink-0">
            <BrandWordmark business="institute" size="md" dark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={info.name}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn('silicon-navlink', isActive && item.to !== '/' && !item.to.includes('#') && 'is-active')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a href={info.phoneHref} aria-label={info.phone} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-amber-300 ring-1 ring-white/10 transition hover:bg-white/10">
              <Phone className="h-4 w-4" />
            </a>
            <MarketingCta to="/admission" variant="amber" className="px-5 py-2.5 text-[13px]">
              Apply for admission
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
        <span className="block h-[3px] bg-gradient-to-r from-amber-300 via-amber-500 to-orange-600" aria-hidden="true" />

        {open && (
          <div className="animate-fade-up border-t border-white/5 bg-stone-950 px-4 pb-5 pt-3 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-200 hover:bg-white/5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><item.icon className="h-4 w-4" /></span>
                {item.label}
              </Link>
            ))}
            <Link to={sister.home} className="mt-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
              <BrandWordmark business="traders" size="sm" dark />
            </Link>
            <MarketingCta to="/admission" variant="amber" className="mt-3 h-12 w-full">Apply for admission</MarketingCta>
          </div>
        )}
      </div>
    </header>
  );
}

function SiliconFooter() {
  return (
    <footer className="silicon-footer relative text-stone-400">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-orange-600" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandWordmark business="institute" size="lg" dark />
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
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white">Courses</h3>
          <ul className="space-y-2 text-sm">
            {COURSES.map((course) => (
              <li key={course.slug}>
                <Link to={`/admission?course=${course.slug}`} className="inline-flex items-center gap-2 transition hover:translate-x-0.5 hover:text-amber-300">
                  <course.icon className="h-3.5 w-3.5 text-amber-400" />
                  {course.title}
                </Link>
              </li>
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
            <BrandWordmark business="traders" size="sm" dark />
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

export default function SiliconLayout() {
  useMarketingShell();
  useDocumentBrand(info.name, info.favicon);
  return (
    <div className="marketing-site silicon-site flex min-h-dvh flex-col bg-white text-slate-900">
      <SiliconHeader />
      <main className="flex-1">
        <PageFade>
          <Outlet />
        </PageFade>
      </main>
      <SiliconFooter />
    </div>
  );
}
