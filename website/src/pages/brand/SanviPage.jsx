import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Cctv, Check, ChevronLeft, ChevronRight, LayoutGrid, MessageCircle, Package, Smile, Wrench,
} from 'lucide-react';
import { MarketingCta } from '../../components/marketing/MarketingCta';
import { Reveal, SectionHeading, CountUp, CtaBand, ChannelMarquee } from '../../components/marketing/MktKit';
import CameraWall from '../../components/marketing/CameraWall';
import { SiteImage } from '../../components/marketing/SiteImage';
import ProductCatalogue from '../../components/marketing/ProductCatalogue';
import { useSlideshow } from '../../components/brandsite/hooks';
import { cn } from '../../lib/utils';
import {
  BUSINESSES, DIVISIONS, brandRest, PRODUCT_CATEGORIES, PRODUCT_SERVICES, PRODUCT_BRANDS, PRODUCT_PROMISES, CCTV_PACKAGES, CCTV_BRANDS,
} from '../../constants/site';

const info = BUSINESSES.traders;
const cctv = DIVISIONS.find((item) => item.key === 'cctv');
const products = DIVISIONS.find((item) => item.key === 'products');
const FEATURED = PRODUCT_CATEGORIES.slice(0, 4);
const SLIDE_MS = 6000;

const productDots = PRODUCT_BRANDS.map((name, index) => ({ name, dot: ['bg-amber-500', 'bg-orange-500', 'bg-amber-300', 'bg-orange-300'][index % 4] }));
const cctvDots = CCTV_BRANDS.map((name, index) => ({ name, dot: ['bg-amber-400', 'bg-orange-500', 'bg-stone-400'][index % 3] }));

const stats = [
  { icon: Cctv, value: 1200, suffix: '+', label: 'CCTV installations', hint: 'Homes, shops & offices' },
  { icon: Smile, value: 8000, suffix: '+', label: 'Happy customers', hint: 'Parts, repair & service' },
];

function WhatsAppButton({ className }) {
  return (
    <a
      href={info.whatsappHref}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-500/15',
        className
      )}
    >
      <MessageCircle className="h-4 w-4 text-emerald-300" />
      WhatsApp us
    </a>
  );
}

function ShelfVisual() {
  return (
    <div className="sanvi-pedestal relative isolate overflow-hidden rounded-[2rem] p-5 ring-1 ring-white/10 sm:p-7">
      <div className="grid grid-cols-4 gap-3">
        {PRODUCT_CATEGORIES.map((category, index) => (
          <Link
            key={category.slug}
            to={`/contact?type=products&item=${category.slug}`}
            className="brand-slide-in group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-white/[0.04] p-2 text-center ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-amber-400/10 hover:ring-amber-300/40"
            style={{ animationDelay: `${80 + index * 60}ms` }}
          >
            <category.icon className="h-7 w-7 text-amber-300 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.6} />
            <span className="line-clamp-2 text-[10.5px] font-semibold leading-tight text-stone-300 group-hover:text-white">{category.title}</span>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-stone-950">
        <span className="flex items-center gap-2 text-sm font-bold">
          <info.billingIcon className="h-4 w-4" />
          {info.billing}
        </span>
      </div>
    </div>
  );
}

function CategoryVisual({ category }) {
  return (
    <div className="sanvi-pedestal relative isolate flex aspect-[5/4] items-center justify-center overflow-hidden rounded-[2rem] ring-1 ring-white/10">
      <SiteImage
        slot={`category-${category.slug}`}
        eager
        className="absolute inset-0"
        imgClassName="mkt-kenburns"
        fallback={(
          <>
            <span className="sanvi-pedestal-disc absolute bottom-[12%] h-16 w-3/4 rounded-[50%]" aria-hidden="true" />
            <category.icon className="mkt-float relative h-36 w-36 text-amber-300 drop-shadow-[0_20px_40px_rgba(245,158,11,0.45)] sm:h-44 sm:w-44" strokeWidth={1.1} />
          </>
        )}
      >
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" aria-hidden="true" />
      </SiteImage>
      <div className="absolute left-5 top-5 flex flex-col gap-2">
        {category.items.map((item, index) => (
          <span key={item} className="sanvi-price-tag brand-slide-in bg-amber-400 py-1.5 pl-5 pr-3 text-[12px] font-bold text-stone-950 shadow-lg" style={{ animationDelay: `${200 + index * 90}ms` }}>
            {item}
          </span>
        ))}
      </div>
      <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-amber-200 ring-1 ring-amber-300/30 backdrop-blur">
        <info.icon className="h-3.5 w-3.5" />
        {info.name}
      </div>
    </div>
  );
}

function SanviSlideshow() {
  const slides = useMemo(
    () => [{ key: 'brand' }, ...FEATURED.map((category) => ({ key: category.slug, category })), { key: 'cctv', cctv: true }],
    []
  );
  const show = useSlideshow(slides.length, SLIDE_MS);
  const slide = slides[show.index];
  const { category } = slide;

  let copy;
  if (category) {
    copy = (
      <>
        <span className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-950">
          <category.icon className="h-3.5 w-3.5" />
          {products.tagline}
        </span>
        <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4rem]">
          <span className="brand-text-sanvi-light">{category.title}</span>
        </h1>
        <ul className="mt-7 grid max-w-md grid-cols-2 gap-2.5">
          {PRODUCT_PROMISES.map((promise) => (
            <li key={promise.label} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] font-semibold text-stone-200 ring-1 ring-white/10">
              <promise.icon className="h-4 w-4 shrink-0 text-amber-400" />
              {promise.label}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MarketingCta to={`/contact?type=products&item=${category.slug}`} variant="amber" className="px-8 py-3.5">
            Enquire
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </MarketingCta>
          <WhatsAppButton />
        </div>
      </>
    );
  } else if (slide.cctv) {
    copy = (
      <>
        <span className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-950">
          <cctv.icon className="h-3.5 w-3.5" />
          {cctv.tagline}
        </span>
        <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4rem]">
          <span className="brand-text-sanvi-light">{cctv.title}</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">{cctv.text}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {cctv.points.map((point) => (
            <span key={point} className="rounded-full bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-amber-200 ring-1 ring-amber-300/25">{point}</span>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MarketingCta to="/contact?type=cctv" variant="amber" className="px-8 py-3.5">
            Book free site visit
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </MarketingCta>
          <MarketingCta to="/cctv" variant="glass" className="px-8 py-3.5">{cctv.cta}</MarketingCta>
        </div>
      </>
    );
  } else {
    copy = (
      <>
        <span className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-950">
          <info.icon className="h-3.5 w-3.5" />
          {info.kind}
        </span>
        <h1 className="mt-5 leading-[0.95] tracking-tight">
          <span className="brand-word brand-text-sanvi-light block text-6xl sm:text-7xl lg:text-[5.6rem]">{info.short}</span>
          <span className="mt-2 block text-2xl font-bold text-white sm:text-3xl">{brandRest(info)}</span>
        </h1>
        <p className="mt-5 text-xl font-semibold text-amber-300">{info.tagline}</p>
        <p className="mt-3 max-w-xl text-base leading-7 text-stone-300">{info.text}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MarketingCta to="/contact?type=products" variant="amber" className="px-8 py-3.5">
            Ask for price
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </MarketingCta>
          <WhatsAppButton />
        </div>
      </>
    );
  }

  return (
    <section className="sanvi-hero relative isolate overflow-hidden lg:flex lg:min-h-[calc(100dvh-157px)] lg:flex-col" aria-roledescription="carousel" {...show.regionProps}>
      <div className="sanvi-stripes" aria-hidden="true" />
      <div className="mx-auto grid min-h-[560px] w-full max-w-6xl items-center lg:flex-1 gap-12 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:pt-14">
        <div key={slide.key} className="min-w-0 animate-fade-up">{copy}</div>
        <div key={`visual-${slide.key}`} className="brand-slide-in min-w-0">
          {category ? <CategoryVisual category={category} /> : slide.cctv ? <CameraWall /> : <ShelfVisual />}
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={show.prev} aria-label="Previous" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-amber-300 ring-1 ring-white/10 transition hover:bg-amber-400 hover:text-stone-950 sm:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]" role="tablist">
            {slides.map((item, index) => {
              const selected = index === show.index;
              const Icon = item.category ? item.category.icon : item.cctv ? cctv.icon : info.icon;
              const label = item.category ? item.category.title : item.cctv ? cctv.title : info.short;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => show.go(index)}
                  className={cn(
                    'relative flex min-w-[9rem] flex-1 items-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-left transition duration-300',
                    selected ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 shadow-lg shadow-orange-500/25' : 'bg-white/5 text-stone-300 ring-1 ring-white/10 hover:bg-white/10'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-stone-950' : 'text-amber-400')} />
                  <span className="truncate text-[12.5px] font-bold">{label}</span>
                  {selected && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/15">
                      <span key={show.index} {...show.progressProps()} className="mkt-slide-progress block h-full bg-stone-950/70" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={show.next} aria-label="Next" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-amber-300 ring-1 ring-white/10 transition hover:bg-amber-400 hover:text-stone-950 sm:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PromiseBar() {
  return (
    <section className="relative z-10 px-4 pt-10 sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-6">
        {PRODUCT_PROMISES.map((promise) => (
          <div key={promise.label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-stone-200">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-orange-700">
              <promise.icon className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-bold leading-tight text-stone-800">{promise.label}</span>
          </div>
        ))}
        {stats.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-stone-950 px-4 py-4 text-white">
            <item.icon className="h-6 w-6 shrink-0 text-amber-400" />
            <span>
              <CountUp value={item.value} suffix={item.suffix} className="brand-text-sanvi-light block text-xl font-extrabold leading-none" />
              <span className="mt-1 block text-[11px] font-semibold text-stone-400">{item.label}</span>
            </span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

function CategoryShop() {
  return (
    <section className="bg-stone-50 py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          brand="traders"
          eyebrow="Categories"
          icon={LayoutGrid}
          title="Everything your computer"
          highlight="needs, in one shop"
          text="Can't find something? Ask us — we can arrange most parts within a day or two."
        />
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {PRODUCT_CATEGORIES.map((category, index) => (
            <Reveal key={category.slug} delay={(index % 4) * 70}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 transition duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(194,65,12,0.45)] hover:ring-amber-300">
                <div className="sanvi-shelf relative flex aspect-[4/3] items-center justify-center overflow-hidden">
                  <SiteImage
                    slot={`category-${category.slug}`}
                    className="absolute inset-0"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={(
                      <>
                        <span className="absolute bottom-4 h-5 w-2/3 rounded-[50%] bg-amber-500/20 blur-md transition duration-500 group-hover:w-3/4 group-hover:bg-amber-500/35" aria-hidden="true" />
                        <category.icon className="relative h-16 w-16 text-stone-800 transition duration-500 group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:text-orange-600 sm:h-20 sm:w-20" strokeWidth={1.3} />
                      </>
                    )}
                  />
                  <span className="sanvi-price-tag absolute right-0 top-3 bg-stone-950 py-1 pl-4 pr-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {info.short}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="text-[15px] font-bold text-stone-900 sm:text-base">{category.title}</h3>
                  <ul className="mt-2 space-y-1">
                    {category.items.map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-[12.5px] text-stone-600">
                        <Check className="h-3 w-3 shrink-0 text-orange-600" strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <MarketingCta to={`/contact?type=products&item=${category.slug}`} variant="amber" className="w-full py-2.5 text-[13px]">
                      Enquire
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </MarketingCta>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-10">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Brands we deal in</p>
          <ChannelMarquee items={productDots} />
        </div>
      </div>
    </section>
  );
}

function CctvPackages() {
  return (
    <section className="sanvi-dark-section relative isolate overflow-hidden py-12 sm:py-14">
      <div className="sanvi-stripes" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          dark
          brand="traders"
          eyebrow="Packages"
          icon={Package}
          title="Simple packages,"
          highlight="complete installation"
          text="Every package includes cameras, recorder, hard disk, wiring, installation and mobile app setup. Ask for today's price."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CCTV_PACKAGES.map((pack, index) => (
            <Reveal key={pack.slug} delay={index * 80}>
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-3xl p-6 transition duration-300 hover:-translate-y-1.5',
                  pack.popular
                    ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-stone-950 shadow-[0_40px_70px_-30px_rgba(245,158,11,0.7)]'
                    : 'bg-white/[0.04] text-white ring-1 ring-white/10 hover:ring-amber-300/40'
                )}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 shadow-md">
                    Most popular
                  </span>
                )}
                <p className={cn('text-xs font-bold uppercase tracking-wider', pack.popular ? 'text-stone-900/70' : 'text-amber-300')}>{pack.title}</p>
                <p className="mt-1 text-3xl font-extrabold">{pack.cameras}</p>
                <p className={cn('mt-1 text-sm', pack.popular ? 'text-stone-900/75' : 'text-stone-400')}>{pack.ideal}</p>
                <ul className={cn('mt-5 space-y-2 border-t pt-5', pack.popular ? 'border-stone-950/15' : 'border-white/10')}>
                  {pack.features.map((feature) => (
                    <li key={feature} className={cn('flex items-start gap-2 text-sm', pack.popular ? 'text-stone-900' : 'text-stone-300')}>
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', pack.popular ? 'text-stone-950' : 'text-amber-400')} strokeWidth={3} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  {pack.popular ? (
                    <Link to={`/contact?type=cctv&package=${pack.slug}`} className="flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-amber-300 transition hover:bg-black">
                      Get quote
                    </Link>
                  ) : (
                    <MarketingCta to={`/contact?type=cctv&package=${pack.slug}`} variant="amber" className="w-full">Get quote</MarketingCta>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">Brands we install</p>
          <ChannelMarquee items={cctvDots} dark />
        </div>
      </div>
    </section>
  );
}

function ServiceDesk() {
  return (
    <section className="bg-white py-12 sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          align="left"
          className="mb-0"
          brand="traders"
          eyebrow="Services"
          icon={Wrench}
          title="Build, upgrade"
          highlight="and repair"
          text="Our technicians help you get the most out of your computer."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PRODUCT_SERVICES.map((service, index) => (
            <Reveal key={service.title} delay={index * 80} className="group relative overflow-hidden rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:ring-amber-300">
              <span className="absolute right-4 top-3 text-4xl font-black text-stone-200 transition group-hover:text-amber-200">0{index + 1}</span>
              <span className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-950 text-amber-400 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <service.icon className="h-5 w-5" />
              </span>
              <span className="relative block font-bold text-stone-900">{service.title}</span>
              <span className="relative mt-1 block text-sm leading-6 text-stone-600">{service.text}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SanviPage() {
  return (
    <div>
      <SanviSlideshow />
      <PromiseBar />
      <ProductCatalogue className="pb-4" />
      <CategoryShop />
      <CctvPackages />
      <ServiceDesk />
      <CtaBand
        brand="traders"
        eyebrow="Best price"
        title="Tell us what you need,"
        highlight="we'll share the best price."
        text="Send your requirement or a photo of the part on WhatsApp — we reply quickly with price and availability."
      >
        <MarketingCta to="/contact?type=products" variant="amber" className="px-7 py-3.5">
          Ask for price
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </MarketingCta>
        <WhatsAppButton />
      </CtaBand>
    </div>
  );
}
