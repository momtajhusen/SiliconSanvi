import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { FormBanner } from '../ui/FormBanner';
import Field from '../admin/Field';
import PillTabs from '../admin/PillTabs';
import { ProductThumb } from './TradersKit';
import { todayInput } from '../../lib/format';
import api, { apiError } from '../../lib/api';

const TYPES = [
  { value: 'purchase', label: 'Quick stock in' },
  { value: 'add', label: 'Correction +' },
  { value: 'remove', label: 'Correction −' },
];

function StockForm({ product, onClose, onSaved }) {
  const [type, setType] = useState('purchase');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState(product.costPrice || '');
  const [note, setNote] = useState('');
  const [day, setDay] = useState(todayInput());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const qty = Number(quantity) || 0;
  const after = type === 'remove' ? product.stock - qty : product.stock + qty;

  const submit = async (event) => {
    event.preventDefault();
    if (qty <= 0) return setError('Enter a quantity');
    if (type === 'remove' && qty > product.stock) return setError(`Only ${product.stock} ${product.unit} in stock`);
    if (type !== 'purchase' && !note.trim()) return setError('Add a short reason for the correction');
    setError('');
    setSaving(true);
    try {
      const body = type === 'purchase'
        ? { type: 'purchase', quantity: qty, unitCost: unitCost === '' ? undefined : Number(unitCost), note, date: day }
        : { type: 'adjustment', quantity: type === 'remove' ? -qty : qty, note, date: day };
      const { data } = await api.post(`/admin/traders/products/${product.id}/stock`, body);
      toast.success(`Stock updated — ${data.product.stock} ${product.unit} now`);
      onSaved?.(data.product);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--color-muted))] p-3">
        <ProductThumb product={product} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.sku} · in stock <b className="text-foreground">{product.stock} {product.unit}</b></p>
        </div>
      </div>
      {error && <FormBanner tone="error" title="Could not update stock">{error}</FormBanner>}
      <PillTabs tabs={TYPES} value={type} onChange={setType} />
      {type === 'purchase' && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          Bought from a supplier with a bill? <Link to={`/traders/purchases/new?product=${product.id}`} onClick={onClose} className="font-semibold underline">Record a purchase bill</Link> instead, so the supplier, rate and dues are kept too.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Quantity (${product.unit})`} required><Input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus /></Field>
        <Field label="Date"><Input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
        {type === 'purchase' && (
          <Field label="Purchase cost per unit (₹)" hint="Averaged into the product's cost price"><Input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></Field>
        )}
        <Field label={type === 'purchase' ? 'Supplier / invoice (optional)' : 'Reason'} required={type !== 'purchase'} className={type === 'purchase' ? '' : 'sm:col-span-2'}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'purchase' ? 'e.g. Bill 1234, ABC Distributors' : 'e.g. Damaged piece, stock count'} />
        </Field>
      </div>
      {qty > 0 && <p className="text-xs text-muted-foreground">Stock after this: <b className="text-foreground">{after} {product.unit}</b></p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>Update stock</Button>
      </div>
    </form>
  );
}

export default function StockModal({ product, onOpenChange, onSaved }) {
  return (
    <Modal open={Boolean(product)} onOpenChange={onOpenChange} title="Update stock">
      {product && <StockForm key={product.id} product={product} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
