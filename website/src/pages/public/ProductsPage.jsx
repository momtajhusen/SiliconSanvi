import { ArrowRight, Cpu, Check, MessageCircle, Wrench, LayoutGrid } from 'lucide-react';
import { MarketingCta, IconWell, MktCard } from '../../components/marketing/MarketingCta';
import { PageHero, Reveal, SectionHeading, CtaBand, ChannelMarquee } from '../../components/marketing/MktKit';
import ProductCatalogue from '../../components/marketing/ProductCatalogue';
import { PhotoFrame, SiteImage, useSiteImage } from '../../components/marketing/SiteImage';
import { BUSINESSES, PRODUCT_CATEGORIES, PRODUCT_SERVICES, PRODUCT_BRANDS, PRODUCT_PROMISES as promises } from '../../constants/site';

const heroSlides = [
  { slot: 'products-hero', caption: 'Genuine branded products' },
  { slot: 'category-laptops-desktops', caption: 'Laptops & desktops' },
  { slot: 'category-components', caption: 'PC components' },
  { slot: 'category-monitors', caption: 'Monitors' },
  { slot: 'category-printers', caption: 'Printers & ink' },
  { slot: 'category-accessories', caption: 'Keyboards & mice' },
  { slot: 'category-networking', caption: 'Networking' },
  { slot: 'category-power', caption: 'UPS & power' },
];

const brandDots = PRODUCT_BRANDS.map((name, index) => ({ name, dot: ['bg-amber-500', 'bg-orange-500', 'bg-blue-500', 'bg-amber-300'][index % 4] }));

function WhatsAppButton() {
  return (
    <a
      href={BUSINESSES.traders.whatsappHref}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp us
    </a>
  );
}

export default function ProductsPage() {
  const heroPhoto = useSiteImage('products-hero');
  return (
    <div>
      <PageHero
        brand="traders"
        eyebrow={`${BUSINESSES.traders.name} · Computer parts & accessories`}
        icon={Cpu}
        title="Genuine computer parts"
        highlight="at fair prices."
        text={`Laptops, desktops, custom PCs, monitors, printers, storage, networking, UPS and accessories from trusted brands — sold by ${BUSINESSES.traders.name} with a proper bill and brand warranty.`}
        aside={heroPhoto ? <PhotoFrame slides={heroSlides} brand="traders" badge="Genuine, with bill & warranty" badgeIcon={Cpu} /> : undefined}
      >
        <div className={heroPhoto ? 'flex flex-col gap-3 sm:flex-row' : 'flex flex-col justify-center gap-3 sm:flex-row'}>
          <MarketingCta to="/contact?type=products" variant="amber" className="px-7 py-3.5">
            Ask for price
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </MarketingCta>
          <WhatsAppButton />
        </div>
        <ul className={heroPhoto ? 'mt-8 grid max-w-xl grid-cols-2 gap-x-4 gap-y-2 text-left' : 'mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-x-4 gap-y-2 text-left sm:grid-cols-4'}>
          {promises.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-[13px] font-medium text-blue-50">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/25">
                <item.icon className="h-3.5 w-3.5" />
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </PageHero>

      <ProductCatalogue />

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            brand="traders"
            eyebrow="Categories"
            icon={LayoutGrid}
            title="Everything your computer"
            highlight="needs, in one shop"
            text="Can't find something? Ask us — we can arrange most parts within a day or two."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_CATEGORIES.map((category, index) => (
              <Reveal key={category.slug} delay={(index % 4) * 70}>
                <MktCard icon={category.icon} accent="bg-gradient-to-r from-amber-400 to-orange-600" className="flex flex-col hover:border-amber-200">
                  <SiteImage
                    slot={`category-${category.slug}`}
                    className="-mx-6 -mt-6 mb-5 aspect-[4/3]"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={<IconWell icon={category.icon} tone={category.tone} />}
                  />
                  <h3 className="text-lg font-bold text-slate-900">{category.title}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {category.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13px] text-slate-700">
                        <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-5">
                    <MarketingCta to={`/contact?type=products&item=${category.slug}`} variant="outline-amber" className="w-full">
                      Enquire
                    </MarketingCta>
                  </div>
                </MktCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-slate-50 py-12 sm:py-14">
        <div className="mkt-section-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Services" icon={Wrench} title="Build, upgrade" highlight="and repair" text="Our technicians help you get the most out of your computer." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_SERVICES.map((service, index) => (
              <Reveal key={service.title} delay={index * 80} className="group rounded-2xl bg-white p-5 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-amber-200">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-orange-500/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <service.icon className="h-5 w-5" />
                </span>
                <span className="block font-semibold text-slate-900">{service.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{service.text}</span>
              </Reveal>
            ))}
          </div>
          <div className="mt-10">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Brands we deal in</p>
            <ChannelMarquee items={brandDots} />
          </div>
        </div>
      </section>

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
