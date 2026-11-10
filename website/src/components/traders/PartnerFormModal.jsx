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

const EMPTY = { name: '', phone: '', email: '', address: '', gstin: '', notes: '', status: 'active' };

function PartnerForm({ partner, onClose, onSaved }) {
  const [form, setForm] = useState(() => (partner ? { ...EMPTY, ...partner } : EMPTY));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return setError('Name and phone are required');
    setError('');
    setSaving(true);
    const body = Object.fromEntries(Object.keys(EMPTY).map((key) => [key, form[key] || '']));
    try {
      const { data } = partner ? await api.patch(`/admin/traders/partners/${partner.id}`, body) : await api.post('/admin/traders/partners', body);
      toast.success(partner ? 'Partner updated' : 'Partner added');
      onSaved?.(data.partner);
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
        <Field label="Name" required className="sm:col-span-2"><Input value={form.name} onChange={set('name')} /></Field>
        <Field label="Phone" required><Input value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Installation site / billing address" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} placeholder="e.g. Godaita-7, Sarlahi" /></Field>
        <Field label="GSTIN"><Input value={form.gstin} onChange={set('gstin')} className="uppercase" /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="e.g. Shop owner, 4 cameras at front and back" /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>{partner ? 'Save changes' : 'Add partner'}</Button>
      </div>
    </form>
  );
}

export default function PartnerFormModal({ open, partner, onOpenChange, onSaved }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={partner ? 'Edit partner' : 'Add partner'} description="The client at whose site parts are installed. Their bills, payments and installed items are kept here." className="max-w-xl">
      {open && <PartnerForm key={partner?.id || 'new'} partner={partner} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
