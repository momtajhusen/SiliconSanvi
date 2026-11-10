import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MessageCircle, Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { PageHero, Reveal } from '../../components/marketing/MktKit';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import api, { apiError } from '../../lib/api';
import { COURSES } from '../../constants/courses';
import { SITE, BUSINESSES, ENQUIRY_TYPES, CCTV_PACKAGES, PRODUCT_CATEGORIES, PROPERTY_TYPES, businessForEnquiry } from '../../constants/site';
import { BrandTile } from '../../components/marketing/BrandWordmark';
import { SocialLinks } from '../../components/marketing/CompanyLinks';
import { brandTheme } from '../../components/marketing/brandTheme';
import { cn } from '../../lib/utils';
import { PhotoFrame, useSiteImage } from '../../components/marketing/SiteImage';

const heroSlides = [
  { slot: 'contact-office', caption: 'Visit us' },
  { slot: 'home-gallery-lab', caption: 'Courses & admission' },
  { slot: 'home-gallery-shop', caption: 'Computer parts & accessories' },
  { slot: 'service-cctv', caption: 'CCTV — free site visit' },
];

function contactItems(info) {
  return [
    { icon: Phone, label: 'Call / WhatsApp', value: info.phone, href: info.phoneHref, tone: 'from-blue-500 to-blue-700' },
    { icon: Mail, label: 'Email', value: info.email, href: `mailto:${info.email}`, tone: 'from-blue-600 to-blue-800' },
    { icon: MapPin, label: 'Address', value: info.address, href: info.mapUrl || undefined, external: true, tone: 'from-amber-400 to-orange-500' },
    { icon: Clock, label: 'Timings', value: info.hours, tone: 'from-violet-500 to-purple-500' },
  ];
}

const PLACEHOLDERS = {
  course: 'Any question about fees, timing or the course?',
  cctv: 'Your area / address and anything we should know about the site',
  products: 'Which product, brand or model? Your budget?',
};

const FIELD = 'mkt-field h-12 rounded-xl bg-slate-50';

function initialForm(params) {
  const type = ENQUIRY_TYPES.some((item) => item.value === params.get('type'))
    ? params.get('type')
    : 'course';
  return {
    name: '',
    phone: '',
    type,
    course: params.get('course') || '',
    batch: 'Morning',
    property: '',
    package: params.get('package') || '',
    item: params.get('item') || '',
    message: '',
  };
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const [params] = useSearchParams();
  return <ContactView key={params.toString()} params={params} />;
}

function ContactView({ params }) {
  const [form, setForm] = useState(() => initialForm(params));
  const [sending, setSending] = useState(false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const handledBy = businessForEnquiry(form.type);
  const heroPhoto = useSiteImage('contact-office');

  const onSubmit = async (event) => {
    event.preventDefault();
    const required = { course: form.course, cctv: form.property, products: form.item }[form.type];
    if (!form.name.trim() || !/^[0-9+\s-]{10,15}$/.test(form.phone.trim()) || !required) {
      toast.error('Please fill in your name, a valid phone number and the highlighted details');
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/public/inquiries', {
        enquiryType: form.type,
        name: form.name,
        phone: form.phone,
        course: form.type === 'course' ? form.course : undefined,
        batch: form.type === 'course' ? form.batch : undefined,
        property: form.type === 'cctv' ? form.property : undefined,
        package: form.type === 'cctv' ? form.package : undefined,
        item: form.type === 'products' ? form.item : undefined,
        message: form.message,
      });
      toast.success(`Thank you! Our team will call you soon. (Ref ${data.inquiryNumber})`);
      setForm({ ...initialForm(new URLSearchParams()), type: form.type });
    } catch (error) {
      toast.error(apiError(error, 'Could not send your enquiry. Please call us instead.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHero
        compact
        brand="both"
        eyebrow={`Contact ${SITE.shortName}`}
        icon={MessageCircle}
        title="Let's talk —"
        highlight="we're here to help."
        text={`Course admissions are handled by ${BUSINESSES.institute.name}. CCTV installation and computer parts are handled by ${BUSINESSES.traders.name}. Send an enquiry and the right team will call you back the same day.`}
        aside={heroPhoto ? <PhotoFrame slides={heroSlides} badge="Reply the same day" badgeIcon={Phone} /> : undefined}
      />

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {contactItems(handledBy).map((item, index) => {
              const content = (
                <>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
                    <span className="block font-semibold text-slate-900">{item.value}</span>
                  </span>
                </>
              );
              return (
                <Reveal key={item.label} delay={index * 80}>
                  {item.href ? (
                    <a href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:border-blue-200">
                      {content}
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)]">{content}</div>
                  )}
                </Reveal>
              );
            })}
            <SocialLinks social={handledBy.social} itemClassName="h-11 w-11 bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-900 hover:text-white" />
          </div>

          <Reveal>
            <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_28px_70px_-40px_rgba(11,31,75,0.45)] sm:p-8">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Enquiry for</p>
                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Enquiry for">
                  {ENQUIRY_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      role="radio"
                      aria-checked={form.type === item.value}
                      onClick={() => setForm((current) => ({ ...current, type: item.value }))}
                      className={cn(
                        'rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300',
                        form.type === item.value
                          ? item.business === 'traders'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                            : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-md shadow-blue-700/25'
                          : item.business === 'traders'
                            ? 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:text-orange-700 hover:ring-amber-200'
                            : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:text-blue-700 hover:ring-blue-200'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className={cn('mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-600 ring-1', brandTheme(handledBy.key).soft, brandTheme(handledBy.key).ring)}>
                  <BrandTile business={handledBy.key} size="sm" className="h-6 w-6 rounded-lg [&_svg]:h-3.5 [&_svg]:w-3.5" />
                  Handled by <span className={cn('font-bold', brandTheme(handledBy.key).text)}>{handledBy.name}</span>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name">
                  <Input value={form.name} onChange={update('name')} placeholder="Full name" className={FIELD} />
                </Field>
                <Field label="Phone / WhatsApp">
                  <Input type="tel" value={form.phone} onChange={update('phone')} placeholder="98765 43210" className={FIELD} />
                </Field>

                {form.type === 'course' && (
                  <>
                    <Field label="Course">
                      <Select value={form.course} onChange={update('course')} className={FIELD}>
                        <option value="">Select a course</option>
                        {COURSES.map((course) => (
                          <option key={course.slug} value={course.slug}>{course.title}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Preferred batch">
                      <Select value={form.batch} onChange={update('batch')} className={FIELD}>
                        <option>Morning</option>
                        <option>Afternoon</option>
                        <option>Evening</option>
                      </Select>
                    </Field>
                  </>
                )}

                {form.type === 'cctv' && (
                  <>
                    <Field label="Where do you need CCTV?">
                      <Select value={form.property} onChange={update('property')} className={FIELD}>
                        <option value="">Select place</option>
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Package">
                      <Select value={form.package} onChange={update('package')} className={FIELD}>
                        <option value="">Not sure — suggest me</option>
                        {CCTV_PACKAGES.map((pack) => (
                          <option key={pack.slug} value={pack.slug}>{pack.title} · {pack.cameras}</option>
                        ))}
                      </Select>
                    </Field>
                  </>
                )}

                {form.type === 'products' && (
                  <div className="sm:col-span-2">
                    <Field label="Product category">
                      <Select value={form.item} onChange={update('item')} className={FIELD}>
                        <option value="">Select a category</option>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category.slug} value={category.slug}>{category.title}</option>
                        ))}
                        <option value="repair">Repair / upgrade</option>
                      </Select>
                    </Field>
                  </div>
                )}
              </div>

              <Field label="Message (optional)">
                <Textarea rows={4} value={form.message} onChange={update('message')} placeholder={PLACEHOLDERS[form.type]} className="mkt-field rounded-xl bg-slate-50" />
              </Field>
              <Button type="submit" loading={sending} className={cn('mkt-cta-solid group h-12 w-full gap-2 rounded-full bg-gradient-to-r text-sm font-semibold shadow-lg', handledBy.key === 'traders' ? 'from-amber-500 to-orange-600 shadow-orange-500/25 hover:from-amber-600 hover:to-orange-700' : 'from-blue-800 to-blue-600 shadow-blue-700/25 hover:from-blue-900 hover:to-blue-700')}>
                {sending ? 'Sending…' : 'Send enquiry'}
                <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </form>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
