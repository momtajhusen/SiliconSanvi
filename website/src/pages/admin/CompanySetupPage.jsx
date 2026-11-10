import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, ExternalLink, Globe, Lock, Mail, MapPin, MessageCircle, Phone, RotateCcw, Save } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { FormBanner } from '../../components/ui/FormBanner';
import { Skeleton } from '../../components/ui/Loader';
import PageHeader from '../../components/admin/PageHeader';
import Field, { FormSection } from '../../components/admin/Field';
import ImageUpload from '../../components/admin/ImageUpload';
import { SocialLinks } from '../../components/marketing/CompanyLinks';
import { brandTheme } from '../../components/marketing/brandTheme';
import { BUSINESSES, SOCIAL_NETWORKS, companyDefaults } from '../../constants/site';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { storeCompany } from '../../lib/company';
import { formatDateTime } from '../../lib/format';
import api, { apiError, mediaUrl } from '../../lib/api';
import { cn } from '../../lib/utils';

const IDENTITY_FIELDS = ['name', 'short', 'kind', 'tagline', 'text', 'logo', 'registration'];
const CONTACT_FIELDS = ['favicon', 'phone', 'whatsapp', 'email', 'address', 'mapUrl', 'hours'];
const FIELDS = {
  institute: [...IDENTITY_FIELDS, ...CONTACT_FIELDS],
  traders: [...IDENTITY_FIELDS, ...CONTACT_FIELDS],
  site: CONTACT_FIELDS,
};

const COMPANIES = [
  {
    key: 'institute',
    path: '/silicon',
    usedOn: ['Silicon page', 'Courses', 'Online admission', 'Fee receipts & admission forms'],
  },
  {
    key: 'traders',
    path: '/sanvi',
    usedOn: ['Sanvi page', 'CCTV', 'Computer parts', 'Contact form (CCTV & parts)'],
  },
  {
    key: 'site',
    path: '/',
    label: 'Landing page',
    hint: 'Shared contact for both brands',
    usedOn: ['Home page', 'About', 'Main header top bar', 'Main footer'],
  },
];

const PHONE = /^[0-9+\s()-]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL = /^https?:\/\/[^\s]+$/i;

function toForm(saved, key) {
  const defaults = companyDefaults(key);
  const form = {};
  for (const field of FIELDS[key]) form[field] = saved?.[field] || defaults[field] || '';
  form.social = Object.fromEntries(SOCIAL_NETWORKS.map(({ key: network }) => [network, saved?.social?.[network] || '']));
  return form;
}

function validate(form, key) {
  const errors = {};
  if (key !== 'site') {
    if (!form.name.trim()) errors.name = 'Required';
    if (!form.short.trim()) errors.short = 'Required';
  }
  if (form.phone.trim() && !PHONE.test(form.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (form.whatsapp.trim() && !PHONE.test(form.whatsapp.trim())) errors.whatsapp = 'Enter a valid WhatsApp number';
  if (form.email.trim() && !EMAIL.test(form.email.trim())) errors.email = 'Enter a valid email';
  if (form.mapUrl.trim() && !URL.test(form.mapUrl.trim())) errors.mapUrl = 'Must start with https://';
  for (const { key: network } of SOCIAL_NETWORKS) {
    if (form.social[network].trim() && !URL.test(form.social[network].trim())) errors[`social.${network}`] = 'Must start with https://';
  }
  return errors;
}

function companyLabel(company) {
  return company.label || BUSINESSES[company.key].name;
}

function PreviewTile({ business, logo, className }) {
  if (logo) {
    return (
      <span className={cn('inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-white shadow-md ring-1 ring-black/5', className)}>
        <img src={mediaUrl(logo)} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  const Icon = BUSINESSES[business].icon;
  return (
    <span className={cn('brand-tile h-12 w-12 rounded-[14px]', brandTheme(business).tile, className)}>
      <Icon className="relative h-6 w-6" />
    </span>
  );
}

function BrandPreview({ company, form }) {
  const isSite = company.key === 'site';
  const theme = isSite ? null : brandTheme(company.key);
  const rest = !isSite && form.name.startsWith(form.short) ? form.name.slice(form.short.length).trim() : form.name;
  const contact = [
    { icon: Phone, value: form.phone },
    { icon: MessageCircle, value: form.whatsapp && form.whatsapp !== form.phone ? `WhatsApp ${form.whatsapp}` : '' },
    { icon: Mail, value: form.email },
    { icon: Clock, value: form.hours },
    { icon: MapPin, value: form.address },
  ].filter((item) => item.value);

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
      <div
        className={cn(
          'relative isolate overflow-hidden p-5',
          isSite ? 'bg-gradient-to-br from-[#0b1f4b] via-[#1e3a8a] to-[#c2410c] text-white' : cn('bg-gradient-to-br text-white', theme.banner)
        )}
      >
        <div className="mkt-grid-bg" aria-hidden="true" />
        {isSite ? (
          <div className="flex items-center gap-2">
            <PreviewTile business="institute" logo={BUSINESSES.institute.logo} className="h-10 w-10 ring-2 ring-white/30" />
            <span className="text-lg font-bold">&amp;</span>
            <PreviewTile business="traders" logo={BUSINESSES.traders.logo} className="h-10 w-10 ring-2 ring-white/30" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <PreviewTile business={company.key} logo={form.logo} className="ring-2 ring-white/30" />
            <span className="min-w-0 leading-none">
              <span className="brand-word block truncate text-2xl text-white">{form.short || '—'}</span>
              <span className="brand-sub mt-1.5 block truncate text-[9px] tracking-[0.2em] text-white/80">{rest}</span>
            </span>
          </div>
        )}
        {!isSite && form.tagline && <p className="mt-3 text-sm font-semibold text-white/90">{form.tagline}</p>}
        {!isSite && form.kind && (
          <span className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">{form.kind}</span>
        )}
      </div>
      <div className="space-y-2.5 p-5">
        {!isSite && form.text && <p className="line-clamp-4 text-xs leading-5 text-slate-600">{form.text}</p>}
        <ul className="space-y-1.5 text-[13px] text-slate-700">
          {contact.map((item) => (
            <li key={item.value} className="flex items-start gap-2">
              <item.icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', isSite ? 'text-blue-600' : theme.ink)} />
              <span className="min-w-0 break-words">{item.value}</span>
            </li>
          ))}
        </ul>
        <SocialLinks social={form.social} className="pt-1" itemClassName="h-8 w-8 bg-slate-100 text-slate-700 ring-1 ring-slate-200" />
        {!isSite && form.registration && <p className="border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{form.registration}</p>}
        {form.favicon && (
          <p className="flex items-center gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <img src={mediaUrl(form.favicon)} alt="" className="h-4 w-4 rounded-sm object-contain" />
            Browser tab icon
          </p>
        )}
      </div>
    </div>
  );
}

function CompanyTabs({ active, onChange, isDirty }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Company">
      {COMPANIES.map((company) => {
        const selected = company.key === active;
        const isSite = company.key === 'site';
        return (
          <button
            key={company.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(company.key)}
            className={cn(
              'relative flex items-center gap-3 rounded-2xl border p-3 text-left transition',
              selected
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/15 dark:bg-blue-500/10'
                : 'border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] hover:bg-[hsl(var(--color-muted))]'
            )}
          >
            {isSite ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-orange-500 text-white">
                <Globe className="h-5 w-5" />
              </span>
            ) : (
              <PreviewTile business={company.key} logo={BUSINESSES[company.key].logo} className="h-10 w-10 rounded-xl" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{companyLabel(company)}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{company.hint || BUSINESSES[company.key].kind}</span>
            </span>
            {isDirty(company.key) && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500" title="Unsaved changes" />}
          </button>
        );
      })}
    </div>
  );
}

function CompanyForm({ companyKey, form, errors, disabled, onField, onValue, onSocial }) {
  const isSite = companyKey === 'site';
  return (
    <Card>
      <CardContent className="space-y-7 pt-5">
        {!isSite && (
          <FormSection title="Brand identity" description="Names and lines shown in headers, slideshows, footers and on printed documents.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full company name" required error={errors.name} hint="Printed on bills, receipts and the website footer.">
                <Input value={form.name} onChange={onField('name')} disabled={disabled} maxLength={80} />
              </Field>
              <Field label="Short brand name" required error={errors.short} hint="Shown big in headers. Use the first word of the full name.">
                <Input value={form.short} onChange={onField('short')} disabled={disabled} maxLength={30} />
              </Field>
              <Field label="Business type" hint='e.g. "Computer Institute"'>
                <Input value={form.kind} onChange={onField('kind')} disabled={disabled} maxLength={40} />
              </Field>
              <Field label="Tagline">
                <Input value={form.tagline} onChange={onField('tagline')} disabled={disabled} maxLength={120} />
              </Field>
              <Field label="About the company" className="sm:col-span-2" hint={`${form.text.length}/600 · shown on the brand page and business cards.`}>
                <Textarea rows={3} value={form.text} onChange={onField('text')} disabled={disabled} maxLength={600} />
              </Field>
            </div>
          </FormSection>
        )}

        <FormSection title={isSite ? 'Browser icon' : 'Logo & icon'} description={isSite ? 'Tab icon for the combined landing pages.' : 'The logo replaces the coloured brand tile everywhere on the website. Square PNG with a transparent background works best.'}>
          <div className="grid gap-4 sm:grid-cols-2">
            {!isSite && (
              <Field label="Logo">
                <ImageUpload value={form.logo} onChange={(url) => onValue('logo', url)} folder="company" shape="square" maxSide={512} disabled={disabled} />
              </Field>
            )}
            <Field label="Browser tab icon (favicon)">
              <ImageUpload value={form.favicon} onChange={(url) => onValue('favicon', url)} folder="company" shape="square" maxSide={256} disabled={disabled} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Contact information" description="Leave a field blank to fall back to the built-in default.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone}>
              <Input value={form.phone} onChange={onField('phone')} inputMode="tel" disabled={disabled} maxLength={20} />
            </Field>
            <Field label="WhatsApp number" error={errors.whatsapp} hint="Used for all “WhatsApp us” buttons.">
              <Input value={form.whatsapp} onChange={onField('whatsapp')} inputMode="tel" disabled={disabled} maxLength={20} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={onField('email')} disabled={disabled} maxLength={120} />
            </Field>
            <Field label="Opening hours">
              <Input value={form.hours} onChange={onField('hours')} disabled={disabled} maxLength={80} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={form.address} onChange={onField('address')} disabled={disabled} maxLength={240} />
            </Field>
            <Field label="Google Maps link" error={errors.mapUrl} className="sm:col-span-2" hint="Makes the address clickable.">
              <Input value={form.mapUrl} onChange={onField('mapUrl')} placeholder="https://maps.google.com/…" disabled={disabled} maxLength={500} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Social media" description="Only filled links are shown as icons in the footer.">
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map((network) => (
              <Field key={network.key} label={network.label} error={errors[`social.${network.key}`]}>
                <Input value={form.social[network.key]} onChange={onSocial(network.key)} placeholder="https://" disabled={disabled} maxLength={300} />
              </Field>
            ))}
          </div>
        </FormSection>

        {!isSite && (
          <FormSection title="Registration" description="Optional. Shown in small print at the bottom of the brand page.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Registration / GST number">
                <Input value={form.registration} onChange={onField('registration')} placeholder="e.g. GSTIN 22AAAAA0000A1Z5" disabled={disabled} maxLength={60} />
              </Field>
            </div>
          </FormSection>
        )}
      </CardContent>
    </Card>
  );
}

function CompanySetup({ initial }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';
  const [active, setActive] = useState('institute');
  const [saved, setSaved] = useState(initial.profiles || {});
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt || {});
  const [forms, setForms] = useState(() => Object.fromEntries(COMPANIES.map(({ key }) => [key, toForm(initial.profiles?.[key], key)])));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const company = COMPANIES.find((item) => item.key === active);
  const form = forms[active];
  const isDirty = (key) => JSON.stringify(forms[key]) !== JSON.stringify(toForm(saved[key], key));
  const dirty = isDirty(active);

  const setValue = (field, value) => setForms((prev) => ({ ...prev, [active]: { ...prev[active], [field]: value } }));
  const onField = (field) => (event) => setValue(field, event.target.value);
  const onSocial = (network) => (event) =>
    setForms((prev) => ({ ...prev, [active]: { ...prev[active], social: { ...prev[active].social, [network]: event.target.value } } }));

  const switchTo = (key) => {
    setActive(key);
    setErrors({});
    setFormError('');
  };

  const reset = () => {
    setForms((prev) => ({ ...prev, [active]: toForm(saved[active], active) }));
    setErrors({});
    setFormError('');
  };

  const save = async (event) => {
    event.preventDefault();
    const next = validate(form, active);
    setErrors(next);
    if (Object.keys(next).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/company/${active}`, form);
      const profiles = { ...saved, [active]: data.profile };
      setSaved(profiles);
      setUpdatedAt((prev) => ({ ...prev, [active]: data.updatedAt }));
      setForms((prev) => ({ ...prev, [active]: toForm(data.profile, active) }));
      storeCompany(profiles);
      toast.success(`${companyLabel(company)} details saved`);
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-3" noValidate>
      <PageHeader
        title="Company setup"
        description="Company details shown to customers on the public website. Courses are managed separately."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => window.open(company.path, '_blank', 'noopener')}>
            <ExternalLink className="h-3.5 w-3.5" />
            View {company.key === 'site' ? 'home page' : `${BUSINESSES[company.key].short} page`}
          </Button>
        }
      />

      {!canEdit && (
        <FormBanner tone="info" title="View only">
          <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Only admin accounts can change company details.</span>
        </FormBanner>
      )}

      <CompanyTabs active={active} onChange={switchTo} isDirty={isDirty} />

      {formError && <FormBanner tone="error" title="Could not save">{formError}</FormBanner>}

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CompanyForm
          key={active}
          companyKey={active}
          form={form}
          errors={errors}
          disabled={!canEdit || saving}
          onField={onField}
          onValue={setValue}
          onSocial={onSocial}
        />

        <div className="space-y-3 lg:sticky lg:top-20">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
            <BrandPreview company={company} form={form} />
          </div>
          <Card>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-xs font-semibold text-foreground/80">Appears on</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {company.usedOn.map((place) => (
                    <span key={place} className="rounded-full bg-[hsl(var(--color-muted))] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{place}</span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {updatedAt[active] ? `Last saved ${formatDateTime(updatedAt[active])}` : 'Using built-in defaults — not saved yet.'}
              </p>
              {canEdit && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={reset} disabled={!dirty || saving}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                  <Button type="submit" className="flex-1" loading={saving} disabled={!dirty}>
                    {!saving && <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              )}
              {dirty && <p className="text-[11px] font-medium text-amber-600">You have unsaved changes.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default function CompanySetupPage() {
  const { data, loading, error, reload } = useApi('/admin/company');

  if (error && !data) {
    return (
      <FormBanner tone="error" title="Could not load company details">
        {error}{' '}
        <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
      </FormBanner>
    );
  }
  if (loading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }
  return <CompanySetup initial={data} />;
}
