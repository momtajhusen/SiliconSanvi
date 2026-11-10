import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { FormBanner } from '../ui/FormBanner';
import Field from './Field';
import ProofUpload from './ProofUpload';
import { PAYMENT_FOR, PAYMENT_MODES, PAYMENT_STATUSES, paymentModeLabel } from '../../constants/institute';
import { formatINR, labelize, toInputDate } from '../../lib/format';
import api, { apiError } from '../../lib/api';

function EditForm({ payment, onClose, onSaved }) {
  const originalDate = toInputDate(payment.paymentDate);
  const [form, setForm] = useState({
    amount: String(payment.amount ?? ''),
    lateFee: payment.lateFee ? String(payment.lateFee) : '',
    paymentMode: payment.paymentMode,
    paymentFor: payment.paymentFor,
    paymentDate: originalDate,
    transactionId: payment.transactionId || '',
    receivedFrom: payment.receivedFrom || '',
    remarks: payment.remarks || '',
    status: payment.status,
    proofUrl: payment.proofUrl || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const linked = Boolean(payment.feeStructureId);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError('Amount must be more than 0');
    if (Number(form.lateFee) < 0) return setError('Late fee cannot be negative');
    setError('');
    setSaving(true);
    const body = {
      amount,
      lateFee: Number(form.lateFee) || 0,
      paymentMode: form.paymentMode,
      transactionId: form.transactionId,
      receivedFrom: form.receivedFrom,
      remarks: form.remarks,
      status: form.status,
      proofUrl: form.proofUrl,
    };
    if (!linked) body.paymentFor = form.paymentFor;
    if (form.paymentDate && form.paymentDate !== originalDate) body.paymentDate = form.paymentDate;
    try {
      const { data } = await api.patch(`/admin/payments/${payment.id}`, body);
      toast.success('Payment updated');
      onSaved?.(data.payment);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
        {form.status !== payment.status && payment.status === 'success' && (
          <FormBanner tone="warning" title="Balance will change">
            Only successful payments count towards the fee. Marking this {form.status} adds {formatINR(payment.amount)} back to the balance.
          </FormBanner>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount (₹)" required><Input type="number" min="0" inputMode="decimal" value={form.amount} onChange={set('amount')} /></Field>
          <Field label="Late fee (₹)"><Input type="number" min="0" inputMode="decimal" value={form.lateFee} onChange={set('lateFee')} placeholder="0" /></Field>
          <Field label="Payment date"><Input type="date" value={form.paymentDate} onChange={set('paymentDate')} /></Field>
          <Field label="Mode">
            <Select value={form.paymentMode} onChange={set('paymentMode')}>
              {PAYMENT_MODES.map((mode) => <option key={mode} value={mode}>{paymentModeLabel(mode)}</option>)}
            </Select>
          </Field>
          {!linked && (
            <Field label="Payment for">
              <Select value={form.paymentFor} onChange={set('paymentFor')}>
                {PAYMENT_FOR.map((key) => <option key={key} value={key}>{labelize(key)}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </Field>
          <Field label="Transaction / cheque no."><Input value={form.transactionId} onChange={set('transactionId')} /></Field>
          <Field label="Received from"><Input value={form.receivedFrom} onChange={set('receivedFrom')} /></Field>
        </div>
        <Field label="Payment proof" hint="eSewa / Khalti / Fonepay screenshot, cheque photo or bank voucher (JPG, PNG, PDF)">
          <ProofUpload value={form.proofUrl} onChange={(proofUrl) => setForm((prev) => ({ ...prev, proofUrl }))} disabled={saving} />
        </Field>
        <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={set('remarks')} className="min-h-0" /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} loading={saving}>Save changes</Button>
      </div>
    </>
  );
}

export default function EditPaymentModal({ payment, onOpenChange, onSaved }) {
  return (
    <Modal
      open={Boolean(payment)}
      onOpenChange={onOpenChange}
      title="Edit payment"
      description={payment ? `${payment.receiptNumber} · ${payment.studentId?.name || ''}` : undefined}
      className="max-w-2xl"
    >
      {payment && <EditForm key={payment.id} payment={payment} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
