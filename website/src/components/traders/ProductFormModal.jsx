import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Modal from '../ui/Modal';
import { FormBanner } from '../ui/FormBanner';
import Field from '../admin/Field';
import ImageUpload from '../admin/ImageUpload';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../constants/traders';
import { ENTITY_STATUSES } from '../../constants/institute';
import { formatINR, labelize } from '../../lib/format';
import api, { apiError } from '../../lib/api';

const EMPTY = {
  image: '', name: '', sku: '', category: 'components', brand: '', model: '', unit: 'pcs',
  costPrice: '', sellingPrice: '', mrp: '', stock: '', reorderLevel: 2, warranty: '', description: '',
  showOnWebsite: true, showPrice: true, featured: false, status: 'active', sortOrder: 0,
};

function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[hsl(var(--color-border-premium))] p-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="mt-0.5 h-4 w-4 accent-amber-500" />
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product, mrp: product.mrp ?? '' } : EMPTY));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const setValue = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const cost = Number(form.costPrice) || 0;
  const price = Number(form.sellingPrice) || 0;
  const margin = price - cost;

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Product name is required');
    if (form.sellingPrice === '' || price < 0) return setError('Enter the selling price');
    setError('');
    setSaving(true);
    const body = {
      image: form.image || '', name: form.name, sku: form.sku, category: form.category, brand: form.brand, model: form.model,
      unit: form.unit, costPrice: cost, sellingPrice: price, mrp: form.mrp === '' ? '' : Number(form.mrp),
      reorderLevel: Number(form.reorderLevel) || 0, warranty: form.warranty, description: form.description,
      showOnWebsite: form.showOnWebsite, showPrice: form.showPrice, featured: form.featured,
      status: form.status, sortOrder: Number(form.sortOrder) || 0,
    };
    if (!product) body.stock = Number(form.stock) || 0;
    try {
      const { data } = product ? await api.patch(`/admin/traders/products/${product.id}`, body) : await api.post('/admin/traders/products', body);
      toast.success(product ? 'Product updated' : 'Product added');
      onSaved?.(data.product);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
      <Field label="Product photo" hint="Shown on the public product card. A clear photo on a white background looks best.">
        <ImageUpload value={form.image} onChange={setValue('image')} folder="products" shape="square" maxSide={1000} disabled={saving} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Product name" required className="sm:col-span-2"><Input value={form.name} onChange={set('name')} placeholder="e.g. Hikvision 2MP Dome Camera" /></Field>
        <Field label="SKU / code" hint="Leave blank to auto-generate"><Input value={form.sku} onChange={set('sku')} className="uppercase" /></Field>
        <Field label="Category">
          <Select value={form.category} onChange={set('category')}>
            {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Brand"><Input value={form.brand} onChange={set('brand')} placeholder="e.g. HP, Hikvision" /></Field>
        <Field label="Model"><Input value={form.model} onChange={set('model')} /></Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Cost price (₹)" hint="Your purchase price. Never shown publicly."><Input type="number" min="0" step="0.01" value={form.costPrice} onChange={set('costPrice')} /></Field>
        <Field label="Selling price (₹)" required><Input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} /></Field>
        <Field label="MRP (₹)" hint="Optional, shown struck-through"><Input type="number" min="0" step="0.01" value={form.mrp} onChange={set('mrp')} /></Field>
        <Field label="Unit">
          <Select value={form.unit} onChange={set('unit')}>
            {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
      </div>
      {price > 0 && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Margin per {form.unit}: <b className={margin < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatINR(margin)}</b>
          {cost > 0 && ` (${Math.round((margin / price) * 100)}% of price)`}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {!product && <Field label="Opening stock" hint="Quantity in hand now"><Input type="number" min="0" value={form.stock} onChange={set('stock')} /></Field>}
        <Field label="Low-stock alert at" hint="Warn when stock reaches this"><Input type="number" min="0" value={form.reorderLevel} onChange={set('reorderLevel')} /></Field>
        <Field label="Warranty"><Input value={form.warranty} onChange={set('warranty')} placeholder="e.g. 1 year brand warranty" /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </Select>
        </Field>
        {product && <Field label="Sort order"><Input type="number" value={form.sortOrder} onChange={set('sortOrder')} /></Field>}
      </div>
      <Field label="Description" hint="Key features, shown on the website card."><Textarea rows={3} value={form.description} onChange={set('description')} /></Field>

      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle checked={form.showOnWebsite} onChange={setValue('showOnWebsite')} label="Show on website" hint="List on the public products page" disabled={saving} />
        <Toggle checked={form.showPrice} onChange={setValue('showPrice')} label="Show price" hint="Otherwise “Ask for price”" disabled={saving} />
        <Toggle checked={form.featured} onChange={setValue('featured')} label="Featured" hint="Shown first with a badge" disabled={saving} />
      </div>
      {product && <p className="text-[11px] text-muted-foreground">Stock is changed from the Stock page so every change is recorded.</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>{product ? 'Save changes' : 'Add product'}</Button>
      </div>
    </form>
  );
}

export default function ProductFormModal({ open, product, onOpenChange, onSaved }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={product ? 'Edit product' : 'Add product'} className="max-w-3xl">
      {open && <ProductForm key={product?.id || 'new'} product={product} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
