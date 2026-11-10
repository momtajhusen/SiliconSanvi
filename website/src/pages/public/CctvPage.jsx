import { ArrowRight, Cctv, Check, Phone, Workflow, ShieldCheck, Sparkles, Package } from 'lucide-react';
import { MarketingCta, IconWell, MktCard } from '../../components/marketing/MarketingCta';
import { PageHero, Reveal, SectionHeading, CtaBand, ChannelMarquee } from '../../components/marketing/MktKit';
import CameraWall from '../../components/marketing/CameraWall';
import { PhotoFrame, SiteImage, useSiteImage } from '../../components/marketing/SiteImage';
import { cn } from '../../lib/utils';
import { BUSINESSES, CCTV_SOLUTIONS, CCTV_FEATURES, CCTV_PACKAGES, CCTV_STEPS, CCTV_BRANDS } from '../../constants/site';

const heroSlides = [
  { slot: 'cctv-hero', caption: 'Day & night protection' },
  { slot: 'cctv-home', caption: 'Homes' },
  { slot: 'cctv-shop', caption: 'Shops & showrooms' },
  { slot: 'cctv-office', caption: 'Offices & schools' },
  { slot: 'cctv-warehouse', caption: 'Warehouses & factories' },
  { slot: 'service-cctv', caption: 'Neat, tidy installation' },
];

const brandDots = CCTV_BRANDS.map((name, index) => ({ name, dot: ['bg-blue-500', 'bg-cyan-400', 'bg-violet-400'][index % 3] }));

function CallButton({ className }) {
  return (
    <a
      href={BUSINESSES.traders.phoneHref}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20',
        className
      )}
    >
      <Phone className="h-4 w-4" />
      Call {BUSINESSES.traders.phone}
    </a>
  );
}

export default function CctvPage() {
  const heroPhoto = useSiteImage('cctv-hero');
  return (
    <div>
      <PageHero
        brand="traders"
        eyebrow={`${BUSINESSES.traders.name} · CCTV installation`}
        icon={Cctv}
        title="CCTV cameras that"
        highlight="keep you safe 24×7."
        text={`HD and night-vision CCTV for homes, shops, offices, schools and warehouses — supplied and installed by ${BUSINESSES.traders.name}. Free site visit, neat installation, live view on your phone and a proper bill.`}
        aside={heroPhoto ? <PhotoFrame slides={heroSlides} brand="traders" badge="Free site visit" badgeIcon={Cctv} /> : <CameraWall />}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <MarketingCta to="/contact?type=cctv" variant="amber" className="px-7 py-3.5">
            Book free site visit
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </MarketingCta>
          <CallButton />
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            brand="traders"
            eyebrow="Solutions"
            icon={ShieldCheck}
            title="The right setup for"
            highlight="every place"
            text="We plan the number and type of cameras after checking your site — no guesswork, no extra cost."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CCTV_SOLUTIONS.map((solution, index) => (
              <Reveal key={solution.slug} delay={index * 80}>
                <MktCard accent={solution.accent} icon={solution.icon} className="hover:border-amber-200">
                  <SiteImage
                    slot={`cctv-${solution.slug}`}
                    className="-mx-6 -mt-6 mb-5 aspect-[4/3]"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={<IconWell icon={solution.icon} tone={solution.tone} />}
                  />
                  <h3 className="text-lg font-bold text-slate-900">{solution.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{solution.text}</p>
                  <ul className="mt-4 space-y-1.5">
                    {solution.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-[13px] text-slate-700">
                        <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" strokeWidth={3} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </MktCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Features" icon={Sparkles} title="Everything a modern" highlight="CCTV system needs" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CCTV_FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={(index % 3) * 80} className="group flex items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-amber-200">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-orange-500/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <feature.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">{feature.title}</span>
                  <span className="block text-sm leading-6 text-slate-600">{feature.text}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
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
                    'relative flex h-full flex-col rounded-3xl border bg-white p-6 transition duration-300 hover:-translate-y-1',
                    pack.popular
                      ? 'border-orange-500 shadow-[0_30px_60px_-30px_rgba(234,88,12,0.55)] ring-1 ring-orange-500'
                      : 'border-slate-200/80 hover:border-amber-200 hover:shadow-[0_24px_48px_-28px_rgba(194,65,12,0.35)]'
                  )}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                      Most popular
                    </span>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">{pack.title}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{pack.cameras}</p>
                  <p className="mt-1 text-sm text-slate-500">{pack.ideal}</p>
                  <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                    {pack.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" strokeWidth={3} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <MarketingCta to={`/contact?type=cctv&package=${pack.slug}`} variant={pack.popular ? 'amber' : 'outline-amber'} className="w-full">
                      Get quote
                    </MarketingCta>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="How it works" icon={Workflow} title="From site visit to" highlight="live view in 5 steps" />
          <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CCTV_STEPS.map((step, index) => (
              <Reveal as="li" key={step.label} delay={index * 90} className="relative">
                <div className="group h-full rounded-3xl border border-slate-200/70 bg-white p-5 text-center shadow-[0_14px_34px_-20px_rgba(15,23,42,0.25)] transition duration-300 ease-premium hover:-translate-y-1.5 hover:border-amber-200 hover:shadow-[0_28px_50px_-24px_rgba(194,65,12,0.3)]">
                  <span className={cn('relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', step.tone)}>
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white ring-2 ring-white">
                      {index + 1}
                    </span>
                  </span>
                  <p className="text-sm font-bold text-slate-900">{step.label}</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">{step.hint}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <div className="mt-10">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Brands we install</p>
            <ChannelMarquee items={brandDots} />
          </div>
        </div>
      </section>

      <CtaBand
        brand="traders"
        eyebrow="Free site visit"
        title="Secure your home or business"
        highlight="this week."
        text="Tell us your place and number of cameras — our technician will visit, suggest the best setup and share a clear quote."
      >
        <MarketingCta to="/contact?type=cctv" variant="amber" className="px-7 py-3.5">
          Book free site visit
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </MarketingCta>
        <CallButton />
      </CtaBand>
    </div>
  );
}
