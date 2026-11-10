import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { FormBanner } from '../ui/FormBanner';
import Field from '../admin/Field';
import { PAYMENT_MODES, paymentModeLabel } from '../../constants/institute';
import { formatINR, todayInput } from '../../lib/format';
import api, { apiError } from '../../lib/api';


function PaymentForm({ purchase, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: purchase.balance, mode: 'bank_transfer', date: todayInput(), reference: '', note: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError('Enter the amount paid');
    if (amount > purchase.balance + 0.01) return setError(`Only ${formatINR(purchase.balance)} is owed on this purchase`);
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post(`/admin/traders/purchases/${purchase.id}/payments`, { ...form, amount });
      toast.success('Supplier payment recorded');
      onSaved?.(data.purchase);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[hsl(var(--color-muted))] p-3 text-center text-xs">
        <div><p className="text-muted-foreground">Purchase</p><p className="text-sm font-bold">{formatINR(purchase.total)}</p></div>
        <div><p className="text-muted-foreground">Paid</p><p className="text-sm font-bold text-emerald-600">{formatINR(purchase.paid)}</p></div>
        <div><p className="text-muted-foreground">Owed</p><p className="text-sm font-bold text-rose-600">{formatINR(purchase.balance)}</p></div>
      </div>
      {error && <FormBanner tone="error" title="Could not record payment">{error}</FormBanner>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount paid (₹)" required><Input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} autoFocus /></Field>
        <Field label="Mode">
          <Select value={form.mode} onChange={set('mode')}>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{paymentModeLabel(m)}</option>)}
          </Select>
        </Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} /></Field>
        <Field label="Transaction ID / cheque no."><Input value={form.reference} onChange={set('reference')} /></Field>
      </div>
      <Field label="Note"><Input value={form.note} onChange={set('note')} /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>Record payment</Button>
      </div>
    </form>
  );
}

export default function SupplierPaymentModal({ purchase, onOpenChange, onSaved }) {
  return (
    <Modal open={Boolean(purchase)} onOpenChange={onOpenChange} title={purchase ? `Pay supplier · ${purchase.purchaseNumber}` : ''} description={purchase?.supplierId?.name}>
      {purchase && <PaymentForm key={purchase.id} purchase={purchase} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
