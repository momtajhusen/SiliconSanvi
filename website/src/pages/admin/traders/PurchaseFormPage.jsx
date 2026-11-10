import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import Field from '../../../components/admin/Field';
import ProofUpload from '../../../components/admin/ProofUpload';
import { ProductThumb, TradersPageHeader } from '../../../components/traders/TradersKit';
import SupplierFormModal from '../../../components/traders/SupplierFormModal';
import ProductFormModal from '../../../components/traders/ProductFormModal';
import { GST_RATES } from '../../../constants/traders';
import { PAYMENT_MODES, paymentModeLabel } from '../../../constants/institute';
import { cn } from '../../../lib/utils';
import { formatINR, toInputDate, todayInput } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function lineFor(product, quantity = 1) {
  return { key: `${product.id}-${Date.now()}`, productId: product.id, quantity, unitCost: product.costPrice || '' };
}

function fromPurchase(purchase, initialProduct) {
  if (!purchase) {
    return {
      supplierId: '', supplierInvoice: '', purchaseDate: todayInput(),
      items: initialProduct ? [lineFor(initialProduct)] : [],
      freight: '', taxAmount: '', discount: '', attachment: '', notes: '',
      payment: { amount: '', mode: 'bank_transfer' },
    };
  }
  return {
    supplierId: purchase.supplierId?.id || '', supplierInvoice: purchase.supplierInvoice || '', purchaseDate: toInputDate(purchase.purchaseDate),
    items: purchase.items.map((item, index) => ({ key: `${index}`, productId: item.productId, quantity: item.quantity, unitCost: item.unitCost })),
    freight: purchase.freight || '', taxAmount: purchase.taxAmount || '', discount: purchase.discount || '',
    attachment: purchase.attachment || '', notes: purchase.notes || '',
    payment: { amount: '', mode: 'bank_transfer' },
  };
}

function SummaryRow({ label, value, strong, tone }) {
  return (
    <div className={cn('flex justify-between gap-3 py-1 text-sm', strong && 'border-t border-[hsl(var(--color-border-premium))] pt-2 text-base font-bold')}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span className={cn('font-semibold', tone)}>{value}</span>
    </div>
  );
}

function PurchaseForm({ purchase, products, suppliers, onProductsChange, onSuppliersChange, initialProductId }) {
  const navigate = useNavigate();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [form, setForm] = useState(() => fromPurchase(purchase, productMap.get(initialProductId)));
  const [picked, setPicked] = useState('');
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const itemsTotal = round2(form.items.reduce((t, i) => t + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0));
  const total = Math.max(0, round2(itemsTotal + (Number(form.freight) || 0) + (Number(form.taxAmount) || 0) - (Number(form.discount) || 0)));
  const paid = round2((purchase?.paid || 0) + (Number(form.payment.amount) || 0));
  const units = round2(form.items.reduce((t, i) => t + (Number(i.quantity) || 0), 0));

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const setPayment = (key) => (event) => setForm((prev) => ({ ...prev, payment: { ...prev.payment, [key]: event.target.value } }));
  const setItem = (key, field) => (event) => setForm((prev) => ({ ...prev, items: prev.items.map((i) => (i.key === key ? { ...i, [field]: event.target.value } : i)) }));
  const removeItem = (key) => setForm((prev) => ({ ...prev, items: prev.items.filter((i) => i.key !== key) }));
  const addProduct = (product) => {
    if (!product) return;
    setForm((prev) => (prev.items.some((i) => i.productId === product.id)
      ? { ...prev, items: prev.items.map((i) => (i.productId === product.id ? { ...i, quantity: Number(i.quantity || 0) + 1 } : i)) }
      : { ...prev, items: [...prev.items, lineFor(product)] }));
    setPicked('');
  };
  const applyGst = (rate) => setForm((prev) => ({ ...prev, taxAmount: rate ? round2((itemsTotal * Number(rate)) / 100) : '' }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.supplierId) return setError('Choose the supplier');
    if (!form.items.length) return setError('Add the products you received');
    if (form.items.some((i) => !(Number(i.quantity) > 0))) return setError('Every line needs a quantity');
    if (paid > total + 0.01) return setError('Payment is more than the purchase bill');
    setError('');
    setSaving(true);
    const body = {
      supplierId: form.supplierId, supplierInvoice: form.supplierInvoice, purchaseDate: form.purchaseDate,
      items: form.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitCost: Number(i.unitCost) || 0 })),
      freight: Number(form.freight) || 0, taxAmount: Number(form.taxAmount) || 0, discount: Number(form.discount) || 0,
      attachment: form.attachment, notes: form.notes,
    };
    if (!purchase && Number(form.payment.amount) > 0) body.payment = { amount: Number(form.payment.amount), mode: form.payment.mode, date: form.purchaseDate };
    try {
      const { data } = purchase ? await api.patch(`/admin/traders/purchases/${purchase.id}`, body) : await api.post('/admin/traders/purchases', body);
      toast.success(purchase ? 'Purchase updated' : `${data.purchase.purchaseNumber} saved — stock updated`);
      navigate(`/traders/purchases/${data.purchase.id}`);
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  const activeSuppliers = suppliers.filter((s) => s.status === 'active' || s.id === form.supplierId);
  const pickable = products.filter((p) => p.status === 'active');

  return (
    <>
      <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Supplier bill</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Field label="Supplier" required className="sm:col-span-2">
                <div className="flex gap-2">
                  <Select value={form.supplierId} onChange={set('supplierId')} className="flex-1">
                    <option value="">Choose supplier…</option>
                    {activeSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.supplierCode}</option>)}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setAddingSupplier(true)} aria-label="Add supplier"><Plus className="h-4 w-4" /></Button>
                </div>
              </Field>
              <Field label="Purchase date"><Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} /></Field>
              <Field label="Supplier's invoice no."><Input value={form.supplierInvoice} onChange={set('supplierInvoice')} placeholder="As printed on their bill" /></Field>
              <Field label="Bill copy (photo / PDF)" className="sm:col-span-2"><ProofUpload value={form.attachment} onChange={(attachment) => setForm((prev) => ({ ...prev, attachment }))} folder="purchases" disabled={saving} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Goods received</CardTitle>
              <CardDescription>Stock goes up when you save. The buying rate is averaged into each product's cost price, which is used for profit on sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={picked} onChange={(e) => addProduct(productMap.get(e.target.value))} className="sm:flex-1" aria-label="Add a product">
                  <option value="">+ Add a product…</option>
                  {pickable.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.stock} {p.unit} in stock — cost {formatINR(p.costPrice)}</option>)}
                </Select>
                <Button type="button" variant="outline" onClick={() => setAddingProduct(true)}><Plus className="h-4 w-4" />New product</Button>
              </div>
              {form.items.length === 0 && (
                <p className="rounded-xl border border-dashed border-[hsl(var(--color-border-premium))] p-5 text-center text-sm text-muted-foreground">
                  <PackagePlus className="mx-auto mb-1 h-5 w-5" />Add each product on the supplier's bill with the quantity and buying rate.
                </p>
              )}
              {form.items.map((item) => {
                const product = productMap.get(item.productId);
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.unitCost) || 0;
                const margin = product ? product.sellingPrice - rate : 0;
                return (
                  <div key={item.key} className="rounded-xl border border-[hsl(var(--color-border-premium))] p-3">
                    <div className="flex items-start gap-3">
                      <ProductThumb product={product} />
                      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,2fr)_6rem_8rem]">
                        <div className="col-span-2 min-w-0 sm:col-span-1">
                          <p className="line-clamp-1 text-sm font-semibold">{product?.name || 'Removed product'}</p>
                          <p className="text-xs text-muted-foreground">{product?.sku} · now {product?.stock ?? 0} {product?.unit} · avg cost {formatINR(product?.costPrice || 0)}</p>
                        </div>
                        <Field label={`Qty (${product?.unit || 'pcs'})`}><Input type="number" min="0" step="any" value={item.quantity} onChange={setItem(item.key, 'quantity')} /></Field>
                        <Field label="Buying rate (₹)"><Input type="number" min="0" step="0.01" value={item.unitCost} onChange={setItem(item.key, 'unitCost')} /></Field>
                      </div>
                      <button type="button" onClick={() => removeItem(item.key)} className="mt-1 rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600" aria-label="Remove line">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-right text-xs text-muted-foreground">
                      Line {formatINR(qty * rate)}
                      {product && <> · sells at {formatINR(product.sellingPrice)} · margin <b className={margin < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatINR(margin)}</b>/{product.unit}</>}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Charges & notes</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Field label="Freight / transport (₹)"><Input type="number" min="0" value={form.freight} onChange={set('freight')} /></Field>
              <Field label="GST on bill (₹)" hint={
                <span className="flex flex-wrap gap-1">
                  {GST_RATES.filter(Boolean).map((r) => <button key={r} type="button" onClick={() => applyGst(r)} className="font-semibold text-amber-700 hover:underline dark:text-amber-300">{r}%</button>)}
                </span>
              }>
                <Input type="number" min="0" step="0.01" value={form.taxAmount} onChange={set('taxAmount')} />
              </Field>
              <Field label="Discount (₹)"><Input type="number" min="0" value={form.discount} onChange={set('discount')} /></Field>
              <Field label="Notes" className="sm:col-span-3"><Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="e.g. 30 days credit, warranty card received" /></Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:sticky lg:top-3 lg:self-start">
          <Card className="border-amber-500/30">
            <CardHeader className="pb-1"><CardTitle className="text-base">Purchase summary</CardTitle></CardHeader>
            <CardContent>
              <SummaryRow label={`Goods · ${units} units`} value={formatINR(itemsTotal)} />
              {Number(form.freight) > 0 && <SummaryRow label="Freight" value={formatINR(form.freight)} />}
              {Number(form.taxAmount) > 0 && <SummaryRow label="GST" value={formatINR(form.taxAmount)} />}
              {Number(form.discount) > 0 && <SummaryRow label="Discount" value={`− ${formatINR(form.discount)}`} />}
              <SummaryRow label="Bill total" value={formatINR(total)} strong />
              {!purchase ? (
                <div className="mt-3 space-y-2 rounded-xl bg-[hsl(var(--color-muted))] p-3">
                  <p className="text-xs font-semibold">Paid to supplier now</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min="0" placeholder="₹ 0" value={form.payment.amount} onChange={setPayment('amount')} aria-label="Amount paid" />
                    <Select value={form.payment.mode} onChange={setPayment('mode')} aria-label="Payment mode">
                      {PAYMENT_MODES.map((m) => <option key={m} value={m}>{paymentModeLabel(m)}</option>)}
                    </Select>
                  </div>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, payment: { ...prev.payment, amount: total } }))} className="text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-300">Paid in full</button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Supplier payments are added from the purchase page.</p>
              )}
              <SummaryRow label="Paid" value={formatINR(paid)} tone="text-emerald-600" />
              <SummaryRow label="Still owed" value={formatINR(Math.max(0, total - paid))} tone={total - paid > 0 ? 'text-rose-600' : ''} />
              <p className="mt-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">+{units} units go into stock</p>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(purchase ? `/traders/purchases/${purchase.id}` : '/traders/purchases')} disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>{purchase ? 'Save purchase' : 'Save & add stock'}</Button>
          </div>
        </div>
      </form>

      <SupplierFormModal
        open={addingSupplier}
        onOpenChange={() => setAddingSupplier(false)}
        onSaved={(supplier) => { onSuppliersChange(); setForm((prev) => ({ ...prev, supplierId: supplier.id })); }}
      />
      <ProductFormModal
        open={addingProduct}
        onOpenChange={() => setAddingProduct(false)}
        onSaved={(product) => { onProductsChange(); setForm((prev) => ({ ...prev, items: [...prev.items, lineFor(product)] })); }}
      />
    </>
  );
}

export default function TradersPurchaseFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const existing = useApi(id ? `/admin/traders/purchases/${id}` : null);
  const products = useApi('/admin/traders/products');
  const suppliers = useApi('/admin/traders/suppliers');
  const error = existing.error || products.error || suppliers.error;
  const ready = products.data && suppliers.data && (!id || existing.data);

  return (
    <div className="space-y-3">
      <TradersPageHeader
        back={id ? { to: `/traders/purchases/${id}`, label: 'Purchase' } : { to: '/traders/purchases', label: 'Purchases' }}
        title={id ? `Edit purchase ${existing.data?.purchase.purchaseNumber || ''}` : 'Record a purchase'}
        description="Enter the supplier's bill exactly as received. Stock, average cost and supplier dues update automatically."
      />
      {error && <FormBanner tone="error" title="Could not load">{error}</FormBanner>}
      {!ready && !error && <Skeleton className="h-[28rem] w-full" />}
      {ready && (
        <PurchaseForm
          purchase={existing.data?.purchase}
          products={products.data.items}
          suppliers={suppliers.data.items}
          onProductsChange={products.reload}
          onSuppliersChange={suppliers.reload}
          initialProductId={params.get('product')}
        />
      )}
    </div>
  );
}
