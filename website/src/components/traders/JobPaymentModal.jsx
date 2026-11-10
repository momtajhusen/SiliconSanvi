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


function PaymentForm({ job, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: job.balance, mode: 'cash', date: todayInput(), reference: '', note: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError('Enter the amount received');
    if (amount > job.balance + 0.01) return setError(`Balance due is only ${formatINR(job.balance)}`);
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post(`/admin/traders/jobs/${job.id}/payments`, { ...form, amount });
      toast.success('Payment recorded');
      onSaved?.(data.job);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[hsl(var(--color-muted))] p-3 text-center text-xs">
        <div><p className="text-muted-foreground">Bill</p><p className="text-sm font-bold">{formatINR(job.total)}</p></div>
        <div><p className="text-muted-foreground">Received</p><p className="text-sm font-bold text-emerald-600">{formatINR(job.paid)}</p></div>
        <div><p className="text-muted-foreground">Remaining</p><p className="text-sm font-bold text-rose-600">{formatINR(job.balance)}</p></div>
      </div>
      {error && <FormBanner tone="error" title="Could not record payment">{error}</FormBanner>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount received (₹)" required><Input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} autoFocus /></Field>
        <Field label="Mode">
          <Select value={form.mode} onChange={set('mode')}>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{paymentModeLabel(m)}</option>)}
          </Select>
        </Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} /></Field>
        <Field label="Transaction ID / cheque no."><Input value={form.reference} onChange={set('reference')} /></Field>
      </div>
      <Field label="Note"><Input value={form.note} onChange={set('note')} placeholder="e.g. Collected at site" /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>Record payment</Button>
      </div>
    </form>
  );
}

export default function JobPaymentModal({ job, onOpenChange, onSaved }) {
  return (
    <Modal open={Boolean(job)} onOpenChange={onOpenChange} title={job ? `Receive payment · ${job.billNumber}` : ''} description={job?.client?.name}>
      {job && <PaymentForm key={job.id} job={job} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
