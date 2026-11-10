import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PackagePlus, Plus, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import Field from '../../../components/admin/Field';
import { ProductThumb, TradersPageHeader } from '../../../components/traders/TradersKit';
import PartnerFormModal from '../../../components/traders/PartnerFormModal';
import { GST_RATES, JOB_STATUSES } from '../../../constants/traders';
import { PAYMENT_MODES, paymentModeLabel } from '../../../constants/institute';
import { cn } from '../../../lib/utils';
import { formatINR, toInputDate, todayInput } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function fromJob(job, partnerId = '') {
  if (!job) {
    return {
      jobDate: todayInput(), status: 'installed', partnerId,
      items: [], labourCharge: '', discount: '', taxRate: 0, notes: '',
      payment: { amount: '', mode: 'cash' },
    };
  }
  return {
    jobDate: toInputDate(job.jobDate), status: job.status, partnerId: job.partnerId?.id || '',
    items: job.items.map((item, index) => ({ ...item, key: `${index}`, productId: item.productId || '' })),
    labourCharge: job.labourCharge || '', discount: job.discount || '', taxRate: job.taxRate || 0,
    notes: job.notes || '',
    payment: { amount: '', mode: 'cash' },
  };
}

function totals(form, paidSoFar) {
  const itemsTotal = round2(form.items.reduce((t, i) => t + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0));
  const itemsCost = round2(form.items.reduce((t, i) => t + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0));
  const taxable = Math.max(0, round2(itemsTotal + (Number(form.labourCharge) || 0) - (Number(form.discount) || 0)));
  const tax = round2((taxable * (Number(form.taxRate) || 0)) / 100);
  const total = form.status === 'cancelled' ? 0 : round2(taxable + tax);
  const received = round2(paidSoFar + (Number(form.payment.amount) || 0));
  const profit = form.status === 'cancelled' ? 0 : round2(taxable - itemsCost);
  return { itemsTotal, itemsCost, taxable, tax, total, received, balance: Math.max(0, round2(total - received)), profit };
}

function SummaryRow({ label, value, strong, tone }) {
  return (
    <div className={cn('flex justify-between gap-3 py-1 text-sm', strong && 'border-t border-[hsl(var(--color-border-premium))] pt-2 text-base font-bold')}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span className={cn('font-semibold', tone)}>{value}</span>
    </div>
  );
}

function JobForm({ job, products, partners: loadedPartners, initialPartner }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => fromJob(job, initialPartner));
  const [partners, setPartners] = useState(loadedPartners);
  const [addingPartner, setAddingPartner] = useState(false);
  const [picked, setPicked] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const held = useMemo(() => {
    const map = new Map();
    if (job && job.status !== 'cancelled') for (const i of job.items) if (i.productId) map.set(i.productId, (map.get(i.productId) || 0) + i.quantity);
    return map;
  }, [job]);
  const t = totals(form, job?.paid || 0);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const setPayment = (key) => (event) => setForm((prev) => ({ ...prev, payment: { ...prev.payment, [key]: event.target.value } }));
  const setItem = (key, field) => (event) => setForm((prev) => ({
    ...prev,
    items: prev.items.map((i) => (i.key === key ? { ...i, [field]: event.target.value } : i)),
  }));
  const removeItem = (key) => setForm((prev) => ({ ...prev, items: prev.items.filter((i) => i.key !== key) }));

  const addProduct = (id) => {
    const p = productMap.get(id);
    if (!p) return;
    setForm((prev) => {
      const existing = prev.items.find((i) => i.productId === id);
      if (existing) return { ...prev, items: prev.items.map((i) => (i === existing ? { ...i, quantity: Number(i.quantity || 0) + 1 } : i)) };
      return { ...prev, items: [...prev.items, { key: `${Date.now()}`, productId: id, name: p.name, sku: p.sku, unit: p.unit, quantity: 1, unitPrice: p.sellingPrice, unitCost: p.costPrice }] };
    });
    setPicked('');
  };
  const addCustom = () => setForm((prev) => ({ ...prev, items: [...prev.items, { key: `${Date.now()}`, productId: '', name: '', unit: 'pcs', quantity: 1, unitPrice: '', unitCost: '' }] }));

  const available = (productId) => (productMap.get(productId)?.stock || 0) + (held.get(productId) || 0);
  const needed = (productId) => form.items.filter((i) => i.productId === productId).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const short = form.status !== 'cancelled' && form.items.some((i) => i.productId && needed(i.productId) > available(i.productId));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.partnerId) return setError('Choose the partner this bill is for');
    if (!form.items.length && !(Number(form.labourCharge) > 0)) return setError('Add at least one part or an installation charge');
    if (form.items.some((i) => !String(i.name).trim() || !(Number(i.quantity) > 0))) return setError('Every line needs a name and quantity');
    if (short) return setError('Some parts are more than what is in stock');
    if (t.received > t.total + 0.01) return setError('Payment received is more than the bill');
    setError('');
    setSaving(true);
    const body = {
      jobDate: form.jobDate, status: form.status, partnerId: form.partnerId,
      items: form.items.map((i) => ({ productId: i.productId || undefined, name: i.name, unit: i.unit, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) || 0, unitCost: Number(i.unitCost) || 0 })),
      labourCharge: Number(form.labourCharge) || 0, discount: Number(form.discount) || 0, taxRate: Number(form.taxRate) || 0,
      notes: form.notes,
    };
    if (!job && Number(form.payment.amount) > 0) body.payment = { amount: Number(form.payment.amount), mode: form.payment.mode, date: form.jobDate };
    try {
      const { data } = job ? await api.patch(`/admin/traders/jobs/${job.id}`, body) : await api.post('/admin/traders/jobs', body);
      toast.success(job ? 'Bill updated' : `Bill ${data.job.billNumber} created`);
      navigate(`/traders/jobs/${data.job.id}`);
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  const activePartners = partners.filter((p) => p.status === 'active' || p.id === form.partnerId);
  const partner = partners.find((p) => p.id === form.partnerId);
  const pickable = products.filter((p) => p.status === 'active');

  return (
    <>
      <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Partner & installation</CardTitle>
              <CardDescription>The partner is the client at whose site the items are installed. The bill, payments and items go on their record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Field label="Partner" required className="sm:col-span-2">
                <div className="flex gap-2">
                  <Select value={form.partnerId} onChange={set('partnerId')} className="flex-1">
                    <option value="">Choose a partner…</option>
                    {activePartners.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.phone} · {p.partnerCode}</option>)}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setAddingPartner(true)}><UserPlus className="h-4 w-4" />New</Button>
                </div>
              </Field>
              <Field label="Date"><Input type="date" value={form.jobDate} onChange={set('jobDate')} /></Field>
              {partner && (
                <div className="rounded-xl bg-[hsl(var(--color-muted))] p-3 text-xs text-muted-foreground sm:col-span-3">
                  <p className="font-semibold text-foreground">{partner.name}</p>
                  <p>{[partner.phone, partner.address, partner.gstin && `GSTIN ${partner.gstin}`].filter(Boolean).join(' · ')}</p>
                  <p className="mt-1">Printed on the bill. To change these details, edit the partner.</p>
                </div>
              )}
              <Field label="Job status">
                <Select value={form.status} onChange={set('status')}>
                  {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Parts installed</CardTitle>
              <CardDescription>Stock goes down when you save. Prices and cost are filled from the product and can be changed for this bill.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={picked} onChange={(e) => addProduct(e.target.value)} className="sm:flex-1" aria-label="Add a product">
                  <option value="">+ Add a product from stock…</option>
                  {pickable.map((p) => (
                    <option key={p.id} value={p.id} disabled={available(p.id) <= 0}>
                      {p.name} — {available(p.id)} {p.unit} in stock — {formatINR(p.sellingPrice)}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="outline" onClick={addCustom}><Plus className="h-4 w-4" />Custom line</Button>
              </div>
              {form.items.length === 0 && (
                <p className="rounded-xl border border-dashed border-[hsl(var(--color-border-premium))] p-5 text-center text-sm text-muted-foreground">
                  <PackagePlus className="mx-auto mb-1 h-5 w-5" />No parts yet. Service-only bills just need an installation charge.
                </p>
              )}
              {form.items.map((item) => {
                const product = item.productId ? productMap.get(item.productId) : null;
                const over = item.productId && form.status !== 'cancelled' && needed(item.productId) > available(item.productId);
                const line = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const lineProfit = line - (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
                return (
                  <div key={item.key} className={cn('rounded-xl border p-3', over ? 'border-rose-400 bg-rose-500/5' : 'border-[hsl(var(--color-border-premium))]')}>
                    <div className="flex items-start gap-3">
                      {product ? <ProductThumb product={product} /> : null}
                      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,2fr)_5rem_7rem_7rem]">
                        <Field label={product ? `${product.sku} · ${available(item.productId)} ${product.unit} available` : 'Item'} className="col-span-2 sm:col-span-1">
                          <Input value={item.name} onChange={setItem(item.key, 'name')} disabled={Boolean(product)} />
                        </Field>
                        <Field label="Qty"><Input type="number" min="0" step="any" value={item.quantity} onChange={setItem(item.key, 'quantity')} className={over ? 'border-rose-500' : undefined} /></Field>
                        <Field label="Price (₹)"><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={setItem(item.key, 'unitPrice')} /></Field>
                        <Field label="Cost (₹)"><Input type="number" min="0" step="0.01" value={item.unitCost} onChange={setItem(item.key, 'unitCost')} /></Field>
                      </div>
                      <button type="button" onClick={() => removeItem(item.key)} className="mt-6 rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600" aria-label="Remove line">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-right text-xs text-muted-foreground">
                      {over && <span className="mr-2 font-semibold text-rose-600">Not enough stock</span>}
                      Line {formatINR(line)} · margin <b className={lineProfit < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatINR(lineProfit)}</b>
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Charges</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Field label="Installation charge (₹)" hint="Billed to the partner"><Input type="number" min="0" value={form.labourCharge} onChange={set('labourCharge')} /></Field>
              <Field label="Discount (₹)"><Input type="number" min="0" value={form.discount} onChange={set('discount')} /></Field>
              <Field label="GST">
                <Select value={form.taxRate} onChange={set('taxRate')}>
                  {GST_RATES.map((r) => <option key={r} value={r}>{r ? `${r}%` : 'No GST'}</option>)}
                </Select>
              </Field>
              <Field label="Notes (printed on bill)" className="sm:col-span-3"><Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="e.g. 4 cameras installed at shop front, 1 year service warranty" /></Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:sticky lg:top-3 lg:self-start">
          <Card className="border-amber-500/30">
            <CardHeader className="pb-1"><CardTitle className="text-base">Bill summary</CardTitle></CardHeader>
            <CardContent>
              <SummaryRow label="Parts" value={formatINR(t.itemsTotal)} />
              <SummaryRow label="Installation" value={formatINR(Number(form.labourCharge) || 0)} />
              {Number(form.discount) > 0 && <SummaryRow label="Discount" value={`− ${formatINR(form.discount)}`} />}
              {t.tax > 0 && <SummaryRow label={`GST ${form.taxRate}%`} value={formatINR(t.tax)} />}
              <SummaryRow label="Bill amount" value={formatINR(t.total)} strong />
              {!job ? (
                <div className="mt-3 space-y-2 rounded-xl bg-[hsl(var(--color-muted))] p-3">
                  <p className="text-xs font-semibold">Payment received now</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min="0" placeholder="₹ 0" value={form.payment.amount} onChange={setPayment('amount')} aria-label="Amount received" />
                    <Select value={form.payment.mode} onChange={setPayment('mode')} aria-label="Payment mode">
                      {PAYMENT_MODES.map((m) => <option key={m} value={m}>{paymentModeLabel(m)}</option>)}
                    </Select>
                  </div>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, payment: { ...prev.payment, amount: t.total } }))} className="text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-300">Paid in full</button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Payments are added from the bill page.</p>
              )}
              <SummaryRow label="Received" value={formatINR(t.received)} tone="text-emerald-600" />
              <SummaryRow label="Remaining" value={formatINR(t.balance)} tone={t.balance > 0 ? 'text-rose-600' : ''} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-base">Profit from this bill</CardTitle></CardHeader>
            <CardContent>
              <SummaryRow label="Sale (excl. GST)" value={formatINR(form.status === 'cancelled' ? 0 : t.taxable)} />
              <SummaryRow label="Parts cost" value={`− ${formatINR(t.itemsCost)}`} />
              <SummaryRow label="Profit" value={formatINR(t.profit)} strong tone={t.profit < 0 ? 'text-rose-600' : 'text-emerald-600'} />
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(job ? `/traders/jobs/${job.id}` : '/traders/jobs')} disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>{job ? 'Save bill' : 'Create bill'}</Button>
          </div>
        </div>
      </form>
      <PartnerFormModal
        open={addingPartner}
        onOpenChange={setAddingPartner}
        onSaved={(saved) => {
          setPartners((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
          setForm((prev) => ({ ...prev, partnerId: saved.id }));
        }}
      />
    </>
  );
}

export default function TradersJobFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const existing = useApi(id ? `/admin/traders/jobs/${id}` : null);
  const products = useApi('/admin/traders/products');
  const partners = useApi('/admin/traders/partners');
  const error = existing.error || products.error || partners.error;
  const ready = products.data && partners.data && (!id || existing.data);

  return (
    <div className="space-y-3">
      <TradersPageHeader
        back={id ? { to: `/traders/jobs/${id}`, label: 'Bill' } : { to: '/traders/jobs', label: 'Partners & bills' }}
        title={id ? `Edit bill ${existing.data?.job.billNumber || ''}` : 'New installation bill'}
        description="Bill a partner for the items installed at their site, and record what they paid and what is still due."
      />
      {error && <FormBanner tone="error" title="Could not load">{error}</FormBanner>}
      {!ready && !error && <Skeleton className="h-[28rem] w-full" />}
      {ready && <JobForm job={existing.data?.job} products={products.data.items} partners={partners.data.items} initialPartner={params.get('partner') || ''} />}
    </div>
  );
}
