import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Package, Search, ShieldCheck, ShoppingBag, Star } from 'lucide-react';
import { Reveal, SectionHeading } from './MktKit';
import { MarketingCta } from './MarketingCta';
import { BUSINESSES } from '../../constants/site';
import { PRODUCT_CATEGORIES, categoryLabel } from '../../constants/traders';
import { formatINR, whatsappLink } from '../../lib/format';
import api, { mediaUrl } from '../../lib/api';
import { cn } from '../../lib/utils';

const AVAILABILITY = {
  in: { label: 'In stock', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  few: { label: 'Only a few left', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  out: { label: 'Out of stock', className: 'bg-stone-100 text-stone-500 ring-stone-200' },
};

function ProductCard({ product }) {
  const info = BUSINESSES.traders;
  const stock = AVAILABILITY[product.availability] || AVAILABILITY.in;
  const off = product.mrp && product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const message = `Hi ${info.short}, I'm interested in ${product.name}${product.model ? ` (${product.model})` : ''}. Please share price and availability.`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(194,65,12,0.45)] hover:ring-amber-300">
      <div className="sanvi-shelf relative flex aspect-square items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={mediaUrl(product.image)} alt={product.name} loading="lazy" className="relative h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105" />
        ) : (
          <Package className="relative h-16 w-16 text-stone-700 transition duration-500 group-hover:scale-110 group-hover:text-orange-600" strokeWidth={1.3} />
        )}
        {product.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-stone-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Star className="h-3 w-3 fill-amber-300" />Top pick
          </span>
        )}
        {off > 0 && <span className="sanvi-price-tag absolute right-0 top-3 bg-orange-600 py-1 pl-4 pr-2.5 text-[11px] font-bold text-white">{off}% off</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">{[product.brand, categoryLabel(product.category)].filter(Boolean).join(' · ')}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-stone-900">{product.name}</h3>
        {product.model && <p className="text-xs text-stone-500">Model {product.model}</p>}
        {product.description && <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-stone-600">{product.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', stock.className)}>{stock.label}</span>
          {product.warranty && <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2 py-0.5 text-[11px] text-stone-600 ring-1 ring-stone-200"><ShieldCheck className="h-3 w-3" />{product.warranty}</span>}
        </div>
        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-baseline gap-2">
            {product.price !== null ? (
              <>
                <span className="text-xl font-extrabold text-stone-900">{formatINR(product.price)}</span>
                {product.mrp && <span className="text-sm text-stone-400 line-through">{formatINR(product.mrp)}</span>}
                <span className="text-[11px] text-stone-500">/ {product.unit}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-stone-700">Ask for best price</span>
            )}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <MarketingCta to={`/contact?type=products&item=${product.category}`} variant="amber" className="py-2.5 text-[13px]">
              Enquire
            </MarketingCta>
            <a
              href={whatsappLink(info.whatsapp || info.phone, message)}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp about ${product.name}`}
              className="flex h-full items-center justify-center rounded-full bg-emerald-500 px-3.5 text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Live catalogue from the admin “Products” module; hidden until at least one product is listed. */
export default function ProductCatalogue({ className }) {
  const [items, setItems] = useState(null);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/public/products').then(({ data }) => alive && setItems(data.items)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => {
    const present = new Set((items || []).map((p) => p.category));
    return PRODUCT_CATEGORIES.filter((c) => present.has(c.value));
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter((p) => (category === 'all' || p.category === category)
      && (!q || [p.name, p.brand, p.model, p.description].filter(Boolean).some((v) => v.toLowerCase().includes(q))));
  }, [items, category, query]);

  if (!items?.length) return null;

  return (
    <section id="catalogue" className={cn('scroll-mt-24 bg-white py-12 sm:py-14', className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          brand="traders"
          eyebrow="Shop the catalogue"
          icon={ShoppingBag}
          title="Parts & products"
          highlight="ready in our shop"
          text="Live stock from our store with genuine brands and a proper bill. Tap WhatsApp to ask about any item."
        />
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[{ value: 'all', label: `All (${items.length})` }, ...categories].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition',
                  category === c.value ? 'bg-stone-950 text-amber-300 ring-stone-950' : 'bg-white text-stone-600 ring-stone-200 hover:ring-amber-300'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="h-10 w-full rounded-full border border-stone-200 bg-white pl-9 pr-4 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
            />
          </label>
        </div>
        {shown.length ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {shown.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 70}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-stone-50 p-8 text-center text-sm text-stone-500">No products match. Try another category or ask us on WhatsApp.</p>
        )}
      </div>
    </section>
  );
}
