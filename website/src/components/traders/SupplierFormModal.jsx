import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Modal from '../ui/Modal';
import { FormBanner } from '../ui/FormBanner';
import Field from '../admin/Field';
import { ENTITY_STATUSES } from '../../constants/institute';
import { labelize } from '../../lib/format';
import api, { apiError } from '../../lib/api';

const EMPTY = { name: '', contactPerson: '', phone: '', email: '', gstin: '', address: '', notes: '', status: 'active' };

function SupplierForm({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState(() => (supplier ? { ...EMPTY, ...supplier } : EMPTY));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Supplier name is required');
    setError('');
    setSaving(true);
    const body = Object.fromEntries(Object.keys(EMPTY).map((key) => [key, form[key] || '']));
    try {
      const { data } = supplier ? await api.patch(`/admin/traders/suppliers/${supplier.id}`, body) : await api.post('/admin/traders/suppliers', body);
      toast.success(supplier ? 'Supplier updated' : 'Supplier added');
      onSaved?.(data.supplier);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name" required className="sm:col-span-2"><Input value={form.name} onChange={set('name')} placeholder="e.g. ABC Computer Distributors" autoFocus /></Field>
        <Field label="Contact person"><Input value={form.contactPerson} onChange={set('contactPerson')} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="GSTIN"><Input value={form.gstin} onChange={set('gstin')} className="uppercase" /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Credit terms, brands they supply…" /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>{supplier ? 'Save changes' : 'Add supplier'}</Button>
      </div>
    </form>
  );
}

export default function SupplierFormModal({ open, supplier, onOpenChange, onSaved }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={supplier ? 'Edit supplier' : 'Add supplier'} className="max-w-xl">
      {open && <SupplierForm key={supplier?.id || 'new'} supplier={supplier} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
