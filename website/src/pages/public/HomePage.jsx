import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Award, Users, Cctv, Cpu, ShieldCheck, MapPinned, Star, Smile, Sparkles, LayoutGrid,
  Check, Headset, BadgeCheck, GraduationCap, Phone,
} from 'lucide-react';
import { MarketingCta, IconWell, MktCard } from '../../components/marketing/MarketingCta';
import {
  Reveal, SectionHeading, HeroBackdrop, CountUp, ChannelMarquee, CtaBand, CHANNEL_DOTS,
} from '../../components/marketing/MktKit';
import CameraWall from '../../components/marketing/CameraWall';
import { PhotoFrame, PhotoMosaic, SiteImage } from '../../components/marketing/SiteImage';
import TwoBusinesses, { BusinessBadge } from '../../components/marketing/TwoBusinesses';
import { BrandDuo } from '../../components/marketing/BrandWordmark';
import { brandTheme } from '../../components/marketing/brandTheme';
import { cn } from '../../lib/utils';
import { COURSES } from '../../constants/courses';
import { SITE, BUSINESSES, DIVISIONS, CCTV_FEATURES, PRODUCT_CATEGORIES, PRODUCT_BRANDS } from '../../constants/site';

const BRAND_KEYS = Object.keys(BUSINESSES);

const heroSlides = [
  { slot: 'home-hero-institute', business: 'institute', caption: BUSINESSES.institute.name },
  { slot: 'courses-hero', business: 'institute', caption: 'Certified computer courses' },
  { slot: 'home-hero-traders', business: 'traders', caption: BUSINESSES.traders.name },
  { slot: 'cctv-hero', business: 'traders', caption: 'CCTV installation' },
  { slot: 'products-hero', business: 'traders', caption: 'Computer parts & accessories' },
];

const heroPoints = [
  { icon: Award, label: 'Certified courses', business: 'institute' },
  { icon: Cctv, label: 'HD CCTV, mobile view', business: 'traders' },
  { icon: ShieldCheck, label: 'Genuine parts & warranty', business: 'traders' },
  { icon: MapPinned, label: 'Free site visit', business: 'traders' },
];

const stats = [
  { icon: Users, value: 5000, suffix: '+', label: 'Students trained', hint: 'Since we opened', business: 'institute' },
  { icon: Cctv, value: 1200, suffix: '+', label: 'CCTV installations', hint: 'Homes, shops & offices', business: 'traders' },
  { icon: Smile, value: 8000, suffix: '+', label: 'Happy customers', hint: 'Parts, repair & service', business: 'traders' },
  { icon: Star, value: 10, suffix: '+', label: 'Years of trust', hint: 'Serving our town', business: 'institute' },
];

const pillars = [
  {
    icon: GraduationCap,
    tone: 'blue',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-700',
    title: 'Experts in computers',
    text: 'Teachers and technicians who work with computers every day — for classes, cameras and repairs.',
  },
  {
    icon: BadgeCheck,
    tone: 'amber',
    accent: 'bg-gradient-to-r from-amber-400 to-orange-600',
    title: 'Genuine & guaranteed',
    text: 'Original branded products with a proper bill, brand warranty and honest, fair pricing.',
  },
  {
    icon: Headset,
    tone: 'sky',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-amber-400',
    title: 'Support after sale',
    text: 'We are local, so help is close. Quick service visits, AMC and doubt-clearing for students.',
  },
];

const gallery = [
  { slot: 'home-gallery-lab', title: 'Learn in a modern computer lab', chip: 'Silicon · Courses', to: '/courses' },
  { slot: 'home-gallery-cctv', title: 'CCTV installed by our technicians', chip: 'Sanvi · CCTV', to: '/cctv' },
  { slot: 'home-gallery-shop', title: 'Laptops & accessories in store', chip: 'Sanvi · Shop', to: '/products' },
  { slot: 'home-gallery-repair', title: 'Custom PC builds & repair', chip: 'Sanvi · Service', to: '/products' },
  { slot: 'home-gallery-certificate', title: 'Certificate on completion', chip: 'Silicon · Certified', to: '/admission' },
];

const brandDots = PRODUCT_BRANDS.map((name, index) => ({
  name,
  dot: ['bg-blue-500', 'bg-amber-500', 'bg-sky-400', 'bg-orange-500'][index % 4],
}));

function HeroPhotos({ active, onSelect }) {
  return (
    <PhotoFrame slides={heroSlides} brand={active} business={active} onBusinessChange={onSelect}>
      <div className="mkt-float absolute -left-5 top-[48%] hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 text-slate-900 shadow-xl backdrop-blur sm:flex">
        <span className="brand-tile brand-tile-silicon h-9 w-9 rounded-xl"><Users className="relative h-4 w-4" /></span>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">Students trained</p>
          <p className="text-sm font-bold">5,000+</p>
        </div>
      </div>
      <div className="mkt-float mkt-float-delay absolute -right-2 top-10 hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 text-slate-900 shadow-xl backdrop-blur sm:flex">
        <span className="brand-tile brand-tile-sanvi h-9 w-9 rounded-xl"><Cctv className="relative h-4 w-4" /></span>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">CCTV installed</p>
          <p className="text-sm font-bold">1,200+ sites</p>
        </div>
      </div>
    </PhotoFrame>
  );
}

function HomeHero() {
  const [active, setActive] = useState('institute');
  return (
    <section className="mkt-hero relative isolate overflow-hidden lg:flex lg:min-h-[calc(100dvh-112px)] lg:flex-col">
      <HeroBackdrop />
      <div className="mkt-hero-beams" aria-hidden="true" />
      {BRAND_KEYS.map((key) => (
        <div key={key} className={cn('mkt-hero-tint', `mkt-hero-tint-${key}`, active === key ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
      ))}
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-16 sm:pt-14 lg:flex-1 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:py-10">
        <div className="min-w-0">
          <div className="mkt-rise">
            <BrandDuo dark active={active} onSelect={setActive} />
          </div>
          <h1 className="mkt-rise mt-7 text-[2.6rem] font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[3.4rem] xl:text-[3.6rem]" style={{ '--rise-delay': '80ms' }}>
            Your complete
            <br />
            <span className="mkt-gradient-text-light">computer partner.</span>
          </h1>
          <p className="mkt-rise mt-6 max-w-xl text-base leading-7 text-blue-50/85 sm:text-lg lg:mt-5" style={{ '--rise-delay': '160ms' }}>
            Learn job-ready computer courses at <b className="brand-text-silicon-light font-extrabold">{BUSINESSES.institute.name}</b>. Buy genuine computers, parts and accessories, and get HD CCTV installed by <b className="brand-text-sanvi-light font-extrabold">{BUSINESSES.traders.name}</b> — two trusted names, one roof.
          </p>
          <ul className="mkt-rise mt-6 grid max-w-md grid-cols-2 gap-x-4 gap-y-2.5 lg:mt-5" style={{ '--rise-delay': '220ms' }}>
            {heroPoints.map((point) => (
              <li key={point.label} className="group flex items-center gap-2 text-sm font-medium text-blue-50">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/15 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
                    point.business === 'institute' ? 'bg-blue-400/20 text-blue-200' : 'bg-amber-400/15 text-amber-200'
                  )}
                >
                  <point.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                {point.label}
              </li>
            ))}
          </ul>
          <div className="mkt-rise mt-8 flex flex-col gap-3 sm:flex-row lg:mt-7" style={{ '--rise-delay': '280ms' }}>
            <MarketingCta to="/contact" variant={active === 'traders' ? 'amber' : 'solid'} className="px-7 py-3.5">
              Send enquiry
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MarketingCta>
            <MarketingCta to="/#businesses" variant="glass" className="px-7 py-3.5">
              <LayoutGrid className="h-4 w-4" />
              Our businesses
            </MarketingCta>
          </div>
        </div>
        <div className="mkt-rise min-w-0" style={{ '--rise-delay': '200ms' }}>
          <HeroPhotos active={active} onSelect={setActive} />
        </div>
      </div>
      <div className="relative border-t border-white/10 pb-6 pt-5">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/70">What we offer</p>
        <ChannelMarquee items={CHANNEL_DOTS} dark />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      <HomeHero />

      <section className="px-4 pt-12 sm:px-6 sm:pt-14">
        <Reveal className="mkt-hero relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-10 shadow-[0_40px_90px_-50px_rgba(11,31,75,0.7)] sm:px-10">
          <div className="mkt-hero-mesh" aria-hidden="true" />
          <div className="mkt-grid-bg" aria-hidden="true" />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-600 via-50% to-orange-500" aria-hidden="true" />
          <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="group rounded-2xl py-3 text-center transition duration-300 hover:bg-white/[0.04] lg:rounded-none lg:border-r lg:border-white/10 lg:last:border-r-0">
                <span
                  className={cn(
                    'mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110',
                    item.business === 'institute' ? 'bg-blue-400/15 text-blue-200 ring-blue-300/25' : 'bg-amber-400/15 text-amber-200 ring-amber-300/25'
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <CountUp
                  value={item.value}
                  suffix={item.suffix}
                  className={cn('block text-3xl font-extrabold tracking-tight sm:text-[2.6rem]', item.business === 'institute' ? 'brand-text-silicon-light' : 'brand-text-sanvi-light')}
                />
                <p className="mt-2 text-sm font-semibold text-blue-50">{item.label}</p>
                <p className="mt-1 text-[11px] leading-4 text-blue-100/70">{item.hint}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <PhotoMosaic tiles={gallery} className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-14" />

      <TwoBusinesses id="businesses" />

      <section id="services" className="relative scroll-mt-24 bg-slate-50 py-12 sm:py-14">
        <div className="mkt-section-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Our services"
            icon={LayoutGrid}
            title="Three services,"
            highlight="two trusted names"
            text={`Learn with ${BUSINESSES.institute.name}. Secure your place or upgrade your computer with ${BUSINESSES.traders.name}.`}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {DIVISIONS.map((division, index) => {
              const theme = brandTheme(division.business);
              return (
                <Reveal key={division.key} delay={index * 100}>
                  <MktCard accent={division.accent} icon={division.icon} className={cn('flex flex-col p-7', theme.hover)}>
                    <SiteImage
                      slot={`service-${division.key}`}
                      className="-mx-7 -mt-7 mb-5 aspect-[16/9]"
                      imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                      fallback={<IconWell icon={division.icon} tone={division.tone} />}
                    />
                    <BusinessBadge business={division.business} className="mb-3 self-start" />
                    <p className={cn('text-xs font-semibold uppercase tracking-wider', theme.ink)}>{division.tagline}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{division.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{division.text}</p>
                    <ul className="mt-4 space-y-1.5">
                      {division.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm text-slate-700">
                          <Check className={cn('h-4 w-4 shrink-0', theme.check)} strokeWidth={3} />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <MarketingCta to={division.to} variant={division.business === 'traders' ? 'outline-amber' : 'outline'} className="w-full">
                        {division.cta}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </MarketingCta>
                    </div>
                  </MktCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mkt-ambient mkt-ambient-institute relative isolate bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            brand="institute"
            eyebrow="Courses"
            icon={BookOpen}
            title="Popular courses,"
            highlight="admissions open"
            text="Practical classes in a modern lab with a certificate on completion."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COURSES.slice(0, 4).map((course, index) => (
              <Reveal key={course.slug} delay={index * 70}>
                <MktCard accent={course.accent} icon={course.icon} className="hover:border-blue-200">
                  <SiteImage
                    slot={`course-${course.slug}`}
                    className="mb-4 aspect-[16/10] rounded-2xl ring-1 ring-slate-200/70"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={<IconWell icon={course.icon} tone={course.tone} />}
                  />
                  <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700">{course.duration} · {course.level}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{course.text}</p>
                </MktCard>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <MarketingCta to="/courses" variant="outline" className="px-6">
              View all {COURSES.length} courses
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MarketingCta>
          </div>
        </div>
      </section>

      <section className="mkt-hero relative isolate overflow-hidden py-12 sm:py-14">
        <HeroBackdrop />
        <div className="mkt-hero-tint mkt-hero-tint-traders" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              dark
              brand="traders"
              align="left"
              className="mb-8"
              eyebrow="CCTV installation"
              icon={Cctv}
              title="Watch your home and shop"
              highlight="from anywhere."
              text="We install HD and night-vision CCTV cameras and set up live view on your phone — with a free site visit and service after installation."
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {CCTV_FEATURES.slice(0, 4).map((feature, index) => (
                <Reveal as="li" key={feature.title} delay={index * 70} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-amber-300/30">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/25">
                    <feature.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{feature.title}</span>
                    <span className="block text-[13px] leading-5 text-blue-100/70">{feature.text}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MarketingCta to="/contact?type=cctv" variant="amber" className="px-7 py-3.5">
                Book free site visit
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </MarketingCta>
              <MarketingCta to="/cctv" variant="glass" className="px-7 py-3.5">View packages</MarketingCta>
            </div>
          </div>
          <Reveal>
            <CameraWall />
          </Reveal>
        </div>
      </section>

      <section className="mkt-ambient mkt-ambient-traders relative isolate bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            brand="traders"
            eyebrow="Computer parts"
            icon={Cpu}
            title="Everything for your"
            highlight="computer, in one shop"
            text={`Genuine branded products with a proper ${BUSINESSES.traders.name} bill and brand warranty — plus custom PC builds, upgrades and repair.`}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PRODUCT_CATEGORIES.map((category, index) => (
              <Reveal key={category.slug} delay={(index % 4) * 60}>
                <Link
                  to={`/contact?type=products&item=${category.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_48px_-28px_rgba(194,65,12,0.45)] sm:p-5"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-amber-400 to-orange-600 transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
                  <SiteImage
                    slot={`category-${category.slug}`}
                    className="-mx-4 -mt-4 mb-3 aspect-[4/3] sm:-mx-5 sm:-mt-5"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={(
                      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-orange-500/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                        <category.icon className="h-5 w-5" />
                      </span>
                    )}
                  />
                  <span className="text-sm font-bold text-slate-900 sm:text-base">{category.title}</span>
                  <span className="mt-1 text-[12px] leading-5 text-slate-500">{category.items.join(' · ')}</span>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-10">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Brands we deal in</p>
            <ChannelMarquee items={brandDots} />
          </div>
          <div className="mt-10 text-center">
            <MarketingCta to="/products" variant="outline-amber" className="px-6">
              See all products & services
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MarketingCta>
          </div>
        </div>
      </section>

      <section id="why" className="relative scroll-mt-24 bg-slate-50 py-12 sm:py-14">
        <div className="mkt-section-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={`Why ${SITE.shortName}`}
            icon={Sparkles}
            title="Local experts you"
            highlight="can trust"
            text={`Students come back to ${BUSINESSES.institute.name}, and families and businesses come back to ${BUSINESSES.traders.name}, because we do the job right.`}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <MktCard accent={item.accent} icon={item.icon} className="p-7">
                  <span className="mkt-outline-num absolute right-6 top-5 text-6xl font-black transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105">
                    0{index + 1}
                  </span>
                  <IconWell icon={item.icon} tone={item.tone} />
                  <h3 className="relative text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </MktCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        brand="both"
        eyebrow="We are here to help"
        title="Need a course, a camera"
        highlight="or a computer?"
        text={`Visit us, call us or send an enquiry — the right team from ${BUSINESSES.institute.short} or ${BUSINESSES.traders.short} will get back to you the same day.`}
      >
        <MarketingCta to="/contact" className="px-7 py-3.5">
          Send enquiry
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </MarketingCta>
        <a
          href={SITE.phoneHref}
          className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20"
        >
          <Phone className="h-4 w-4" />
          Call {SITE.phone}
        </a>
      </CtaBand>
    </div>
  );
}
