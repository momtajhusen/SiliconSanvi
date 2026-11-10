import { Info, Target, Heart, Rocket, Users, Award, Cctv, Smile, ArrowRight, LayoutGrid } from 'lucide-react';
import { MarketingCta, IconWell, MktCard } from '../../components/marketing/MarketingCta';
import { PageHero, Reveal, SectionHeading, CtaBand } from '../../components/marketing/MktKit';
import TwoBusinesses, { BusinessBadge } from '../../components/marketing/TwoBusinesses';
import { SITE, BUSINESSES, DIVISIONS } from '../../constants/site';
import { brandTheme } from '../../components/marketing/brandTheme';
import { cn } from '../../lib/utils';
import { PhotoFrame, SiteImage, useSiteImage } from '../../components/marketing/SiteImage';

const values = [
  { icon: Target, tone: 'sky', accent: 'bg-gradient-to-r from-blue-500 to-blue-700', title: 'Our mission', text: 'Make computer education, security and technology affordable and reliable for every family and business in our town.' },
  { icon: Heart, tone: 'rose', accent: 'bg-gradient-to-r from-rose-400 to-pink-500', title: 'How we work', text: 'Honest advice, genuine products and neat work — whether we are teaching a class, fitting a camera or building a PC.' },
  { icon: Rocket, tone: 'amber', accent: 'bg-gradient-to-r from-amber-400 to-orange-400', title: 'Always there', text: 'We are local and stay with you after the sale — doubt-clearing for students and quick service for customers.' },
];

const heroSlides = [
  { slot: 'about-team', caption: 'Our team' },
  { slot: 'home-gallery-lab', caption: 'Our computer lab' },
  { slot: 'home-gallery-shop', caption: 'Our computer shop' },
  { slot: 'home-gallery-cctv', caption: 'CCTV installation' },
  { slot: 'home-gallery-repair', caption: 'PC builds & repair' },
  { slot: 'home-gallery-certificate', caption: 'Certified students' },
];

const highlights = [
  { icon: Users, value: '5,000+', label: 'Students trained' },
  { icon: Cctv, value: '1,200+', label: 'CCTV installations' },
  { icon: Smile, value: '8,000+', label: 'Happy customers' },
  { icon: Award, value: '10+ years', label: 'Of trust' },
];

export default function AboutPage() {
  const heroPhoto = useSiteImage('about-team');
  return (
    <div>
      <PageHero
        compact
        brand="both"
        eyebrow={`About ${SITE.shortName}`}
        icon={Info}
        title="Learning, security and"
        highlight="technology — under one roof."
        text={`${BUSINESSES.institute.name} trains students in practical computer skills. ${BUSINESSES.traders.name} sells computers, parts and accessories and installs CCTV. Two businesses run by one local team that thousands of students, homes and shops rely on.`}
        aside={heroPhoto ? <PhotoFrame slides={heroSlides} badge="10+ years of trust" badgeIcon={Award} /> : undefined}
      />

      <section className="bg-white pt-12 sm:pt-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4">
          {highlights.map((item, index) => (
            <Reveal key={item.label} delay={index * 80} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)]">
              <span className={cn('brand-tile h-12 w-12 rounded-xl', index % 2 ? 'brand-tile-sanvi' : 'brand-tile-silicon')}>
                <item.icon className="relative h-5 w-5" />
              </span>
              <span>
                <span className="block text-xl font-bold text-slate-900 sm:text-2xl">{item.value}</span>
                <span className="block text-sm text-slate-500">{item.label}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      <TwoBusinesses />

      <section className="relative bg-slate-50 py-12 sm:py-14">
        <div className="mkt-section-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="What we do" icon={LayoutGrid} title="Three services," highlight="two names, one team" />
          <div className="mb-20 grid gap-6 md:grid-cols-3">
            {DIVISIONS.map((division, index) => (
              <Reveal key={division.key} delay={index * 100}>
                <MktCard accent={division.accent} icon={division.icon} className={cn('flex flex-col p-7', brandTheme(division.business).hover)}>
                  <SiteImage
                    slot={`service-${division.key}`}
                    className="-mx-7 -mt-7 mb-5 aspect-[16/9]"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={<IconWell icon={division.icon} tone={division.tone} />}
                  />
                  <BusinessBadge business={division.business} className="mb-3 self-start" />
                  <h3 className="text-lg font-bold text-slate-900">{division.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{division.text}</p>
                  <div className="mt-auto pt-5">
                    <MarketingCta to={division.to} variant="ghost" className={cn('px-0', division.business === 'traders' && 'hover:text-orange-700')}>
                      {division.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </MarketingCta>
                  </div>
                </MktCard>
              </Reveal>
            ))}
          </div>

          <SectionHeading eyebrow="Who we are" title="What drives" highlight={SITE.shortName} />
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <MktCard accent={item.accent} icon={item.icon} className="p-7">
                  <IconWell icon={item.icon} tone={item.tone} />
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </MktCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand brand="both" eyebrow="Visit us" title="Come see our lab and store." highlight="Advice is always free.">
        <MarketingCta to="/contact" className="px-7 py-3.5">Send enquiry</MarketingCta>
      </CtaBand>
    </div>
  );
}
